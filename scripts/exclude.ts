import { Database } from "bun:sqlite";
import { postsIndex, searchClient } from "../src/meilisearch";
import ENV from "../src/env";

const REDACTIONS = ENV.REDACTIONS;

function redactText(
  text: string,
  usernames: string[],
  communities: string[],
): string {
  if (!text) return text;
  for (const username of usernames) {
    const re = new RegExp(
      `\\b${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi",
    );
    text = text.replace(re, "[REDACTED]");
  }
  for (const community of communities) {
    const re = new RegExp(
      `\\b${community.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi",
    );
    text = text.replace(re, "[REDACTED]");
  }
  return text;
}

async function redactSqlite() {
  const db = new Database("posts.db");
  let total = 0;

  const posts = db
    .query("SELECT rowid, title, body, username, communityName FROM posts")
    .all() as {
    rowid: number;
    title: string;
    body: string;
    username: string;
    communityName: string;
  }[];

  for (const post of posts) {
    const newTitle = redactText(
      post.title,
      REDACTIONS.usernames,
      REDACTIONS.communities,
    );
    const newBody = redactText(
      post.body,
      REDACTIONS.usernames,
      REDACTIONS.communities,
    );

    let newUsername = post.username;
    if (REDACTIONS.usernames.includes(post.username)) {
      newUsername = "Ghost";
    }

    let newCommunity = post.communityName;
    if (REDACTIONS.communities.includes(post.communityName)) {
      newCommunity = "[REDACTED]";
    }

    if (
      newTitle !== post.title ||
      newBody !== post.body ||
      newUsername !== post.username ||
      newCommunity !== post.communityName
    ) {
      db.run(
        "UPDATE posts SET title = ?, body = ?, username = ?, communityName = ? WHERE rowid = ?",
        [newTitle, newBody, newUsername, newCommunity, post.rowid],
      );
      total++;
    }
  }

  console.log(`Redacted/ghosted ${total} posts in SQLite`);
}

async function redactMeilisearch() {
  let offset = 0;
  const limit = 1000;
  let totalRedacted = 0;
  while (true) {
    const res = await postsIndex.getDocuments<any>({
      limit,
      offset,
      fields: ["id", "title", "body", "username", "communityName"],
    });
    if (res.results.length === 0) break;

    const redactedDocs = res.results.map((doc: any) => {
      const redactedTitle = redactText(
        doc.title,
        REDACTIONS.usernames,
        REDACTIONS.communities,
      );
      const redactedBody = redactText(
        doc.body,
        REDACTIONS.usernames,
        REDACTIONS.communities,
      );

      let redactedUsername = doc.username;
      if (REDACTIONS.usernames.includes(doc.username)) {
        redactedUsername = "Ghost";
      }

      let redactedCommunity = doc.communityName;
      if (REDACTIONS.communities.includes(doc.communityName)) {
        redactedCommunity = "[REDACTED]";
      }

      return {
        ...doc,
        title: redactedTitle,
        body: redactedBody,
        username: redactedUsername,
        communityName: redactedCommunity,
      };
    });

    const response = await postsIndex.updateDocuments(redactedDocs);
    await searchClient.tasks.waitForTask(response.taskUid, {
      timeout: ENV.SEARCH.TIMEOUT,
    });

    totalRedacted += redactedDocs.length;
    offset += limit;
    if (res.results.length < limit) break;
  }
  console.log(`redacted and ghosted ${totalRedacted} posts in Meilisearch.`);
}

async function main() {
  await redactSqlite();
  await redactMeilisearch();
}

main();
