import type { Post } from "@discuit-community/types";
import { Database } from "bun:sqlite";

import { Meilisearch } from "meilisearch";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";

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
  sortableAttributes: ["createdAt"],
  faceting: {
    maxValuesPerFacet: 100,
    sortFacetValuesBy: { communityName: "count" },
  },
  facetSearch: true,
});

class SearchFailed extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchFailed";
  }
}

const app = new Elysia()
  .use(cors())
  .use(swagger())

  .error({
    SearchFailed,
  })
  .onError(({ set, code, error }) => {
    switch (code) {
      case "SearchFailed":
        set.status = 500;
        console.error("search failed:", error);
        return { error: "search failed", code: 500 };
      case "NOT_FOUND":
        set.status = 404;
        return { error: "not found", code: 404 };
      default:
        set.status = 500;
        console.error("internal server error:", error);
        return { error: "internal server error", code: 500 };
    }
  })

  .get("/health", () => ({ status: "ok" }))
  .get("/search", async ({ query, set }) => {
    const q = (query.q as string) ?? "";
    const community = (query.community as string) ?? "";
    const username = (query.username as string) ?? "";
    const sort = (query.sort as string) ?? "";
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

    try {
      const res = await postsIndex.search(q, {
        filter: filter.length ? filter.join(" AND ") : undefined,
        limit,
        offset,
        sort: sort ? [sort] : undefined,
        facets: ["communityName", "username", "type"],
        attributesToHighlight: ["title", "content"],
        highlightPreTag: "<span class='highlight'>",
        highlightPostTag: "</span>",
      });

      return res;
    } catch (error) {
      throw new SearchFailed(
        error instanceof Error ? error.message : "search failed",
      );
    }
  })
  .get("/autocomplete", async ({ query }) => {
    const q = (query.q as string) ?? "";
    try {
      const res = await postsIndex.search(q, {
        limit: 10,
        attributesToRetrieve: ["title", "communityName"],
      });
      return res.hits.map((hit) => ({
        title: hit.title,
        communityName: hit.communityName,
      }));
    } catch (error) {
      throw new SearchFailed(
        error instanceof Error ? error.message : "search failed",
      );
    }
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

  app.listen(3001);
  console.log(
    `search is running at ${app.server?.hostname}:${app.server?.port}`,
  );
}

main().catch((err) => {
  console.error("error starting the server:", err);
  process.exit(1);
});
