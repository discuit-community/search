import type { Post } from "@discuit-community/types";
import { Database } from "bun:sqlite";

import { Meilisearch } from "meilisearch";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const db = new Database("posts.db");

const ENV = {
  SEARCH: {
    PORT: process.env.SEARCH_PORT || 7700,
    ADDRESS: process.env.SEARCH_ADDR || "http://127.0.0.1",
    KEY: process.env.SEARCH_KEY || "dev",
  },
  SERVER: {
    PORT: process.env.SERVER_PORT || 3000,
  },
};
const SEARCH_URL = `${ENV.SEARCH.ADDRESS}:${ENV.SEARCH.PORT}`;

const searchClient = new Meilisearch({
  host: SEARCH_URL,
  apiKey: ENV.SEARCH.KEY,
});

const postsIndex = searchClient.index("posts");
postsIndex.updateSettings({
  filterableAttributes: ["communityName", "username", "type"],
  faceting: {
    maxValuesPerFacet: 100,
    sortFacetValuesBy: { communityName: "count" },
  },
  facetSearch: true,
});

const app = new Elysia()
  .use(cors())
  .get("/health", () => ({ status: "ok" }))
  .get("/search", async ({ query, set }) => {
    const q = (query.q as string) ?? "";
    const community = (query.community as string) ?? "";
    const username = (query.username as string) ?? "";
    const type = (query.type as string) ?? "";
    const limit = Math.min(Number(query.limit) || 20, 100);
    const offset = Number(query.offset) || 0;

    if (Number.isNaN(limit) || limit < 1) {
      set.status = 400;
      return { error: "invalid limit" };
    }

    const filter = [];
    if (community) filter.push(`communityName = "${community}"`);
    if (username) filter.push(`username = "${username}"`);
    if (type) filter.push(`type = "${type}"`);

    const params = new URLSearchParams({
      q,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    if (filter.length) params.set("filter", filter.join(" AND "));

    const res = await postsIndex.search(q, {
      filter: filter.length ? filter.join(" AND ") : undefined,
      limit,
      offset,
      facets: ["communityName", "username", "type"],
      attributesToHighlight: ["title", "content"],
      highlightPreTag: "<span class='highlight'>",
      highlightPostTag: "</span>",
    });

    return res;
  });

async function main() {
  const posts = db.query("select * from posts").all() as Post[];
  const response = await postsIndex.addDocuments(posts);
  const uid = response.taskUid;

  const task = await searchClient.tasks.getTask(uid);
  if (task.status === "failed") {
    console.error("failed to index documents:", task.error);
    return;
  }

  console.log(`indexed ${posts.length} posts successfully.`);

  app.listen(3000);
  console.log(
    `search is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

main().catch((err) => {
  console.error("error starting the server:", err);
  process.exit(1);
});
