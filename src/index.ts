import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { staticPlugin } from "@elysiajs/static";
import { createGzip } from "node:zlib";

import logger from "./logger";
import ENV from "./env";
import { postsIndex } from "./meilisearch";
import { syncIndexWithDatabase, watchNewPosts } from "./sync";
import { redactMentions } from "./utils/redact";

const ARGS = {
	SKIP_SYNC: process.argv.includes("--skip-sync"),
};

class SearchFailed extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SearchFailed";
	}
}

const app = new Elysia()
	.use(cors())
	.use(
		swagger({
			documentation: {
				info: {
					title: "discuit search api",
					description: "public api for searching posts on discuit",
					version: "1.0.0",
					license: {
						name: "AGPL-3.0",
						url: "https://www.gnu.org/licenses/agpl-3.0.html",
					},
				},
				servers: [
					{
						url: `http://localhost:${ENV.SERVER.PORT}`,
						description: "local server",
					},
					{
						url: "http://dsearch.wlo.moe",
						description: "live production server hosted by wlo.moe",
					},
				],
			},
		}),
	)
	.use(staticPlugin({ prefix: "/" }))
	.onAfterHandle(async ({ set, request, response }) => {
		const acceptEncoding = request.headers.get("accept-encoding") || "";
		let contentType = "";

		if (set.headers["Content-Type"]) {
			contentType = String(set.headers["Content-Type"]);
		} else if (response instanceof Response) {
			contentType = response.headers.get("content-type") || "";
		}

		if (
			(contentType.includes("text/html") || contentType.includes("text/css")) &&
			acceptEncoding.includes("gzip")
		) {
			let body: Uint8Array | null = null;
			let headers: Record<string, string> = {};

			if (response instanceof Response) {
				body = new Uint8Array(await response.arrayBuffer());
				response.headers.forEach((value, key) => {
					headers[key] = value;
				});
			} else if (response instanceof Uint8Array) {
				body = response;
				headers = Object.fromEntries(
					Object.entries(set.headers).map(([k, v]) => [k, String(v)]),
				);
			} else if (typeof response === "string") {
				body = Buffer.from(response, "utf-8");
				headers = Object.fromEntries(
					Object.entries(set.headers).map(([k, v]) => [k, String(v)]),
				);
			} else {
				return response;
			}

			const gzipped = await new Promise<Buffer>((resolve, reject) => {
				const gzip = createGzip();
				const chunks: Buffer[] = [];
				gzip.on("data", (chunk) => chunks.push(chunk));
				gzip.on("end", () => resolve(Buffer.concat(chunks)));
				gzip.on("error", reject);
				gzip.end(body!);
			});

			headers["content-encoding"] = "gzip";
			delete headers["content-length"];

			return new Response(gzipped, {
				status: 200,
				headers,
			});
		}

		return response;
	})

	.error({
		SearchFailed,
	})
	.onError(({ set, code, error }) => {
		switch (code) {
			case "SearchFailed":
				set.status = 500;
				logger.error("search failed:", error);
				return { error: "search failed", code: 500 };
			case "NOT_FOUND":
				set.status = 404;
				return { error: "not found", code: 404 };
			default:
				set.status = 500;
				logger.error("internal server error:", error);
				return { error: "internal server error", code: 500 };
		}
	})

	.get("/health", () => ({ status: "ok" }), {
		response: {
			description: "Health check endpoint",
			body: t.Object({
				status: t.String({
					description:
						"health status of the service - this should always be ok",
					default: "ok",
				}),
			}),
		},
	})
	.get(
		"/search",
		async ({ query, set }) => {
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

			const escapeString = (str: string) => str.replace(/"/g, '\\"');
			const filter = [];

			if (community)
				filter.push(`communityName = "${escapeString(community)}"`);
			if (username) filter.push(`username = "${escapeString(username)}"`);
			if (type) filter.push(`type = "${escapeString(type)}"`);

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

				res.hits = res.hits.map((hit) => {
					const redacted = {
						...hit,
						title: redactMentions(hit.title),
						content: redactMentions(hit.content ?? hit.body ?? ""),
						body: redactMentions(hit.body ?? ""),
						username: redactMentions(hit.username ?? ""),
						communityName: redactMentions(hit.communityName ?? ""),
					};

					if (hit._formatted) {
						redacted._formatted = {};
						for (const [key, value] of Object.entries(hit._formatted)) {
							redacted._formatted[key] =
								typeof value === "string" ? redactMentions(value) : value;
						}
					}

					return redacted;
				});

				return res;
			} catch (error) {
				throw new SearchFailed(
					error instanceof Error ? error.message : "search failed",
				);
			}
		},
		{
			query: t.Object({
				q: t.Optional(
					t.String({
						description: "search query",
						example: "hello world",
					}),
				),
				community: t.Optional(
					t.String({
						description: "filter by community name",
						example: "example-community",
					}),
				),
				username: t.Optional(
					t.String({
						description: "filter by username",
						example: "example-user",
					}),
				),
				sort: t.Optional(
					t.String({
						description: "sort by field, e.g. createdAt desc",
						example: "createdAt desc",
					}),
				),
				type: t.Optional(
					t.String({
						description: "filter by post type, e.g. text, image or link",
						examples: ["text", "image", "link"],
					}),
				),
				limit: t.Optional(
					t.Integer({
						description: "number of results to return (max 100)",
						minimum: 1,
						maximum: 100,
					}),
				),
				offset: t.Optional(
					t.Integer({
						description: "number of results to skip for pagination",
						default: 0,
					}),
				),
			}),
			response: {
				500: t.Object({
					error: t.String(),
					code: t.Integer(),
				}),
			},
		},
	)
	.get(
		"/autocomplete",
		async ({ query }) => {
			const q = (query.q as string) ?? "";
			try {
				const res = await postsIndex.search(q, {
					limit: 10,
					attributesToRetrieve: ["title", "communityName"],
				});
				res.hits = res.hits.map((hit) => {
					const redacted = {
						...hit,
						title: redactMentions(hit.title),
						content: redactMentions(hit.content ?? hit.body ?? ""),
						body: redactMentions(hit.body ?? ""),
						username: redactMentions(hit.username ?? ""),
						communityName: redactMentions(hit.communityName ?? ""),
					};

					if (hit._formatted) {
						redacted._formatted = {};
						for (const [key, value] of Object.entries(hit._formatted)) {
							redacted._formatted[key] =
								typeof value === "string" ? redactMentions(value) : value;
						}
					}

					return redacted;
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
		},
		{
			query: t.Object({
				q: t.String({
					description: "autocomplete query",
					example: "hello",
				}),
			}),
			response: {
				200: t.Array(
					t.Object({
						title: t.String(),
						communityName: t.String(),
					}),
				),
				500: t.Object({
					error: t.String(),
					code: t.Integer(),
				}),
			},
		},
	);

async function main() {
	if (ENV.SEARCH.SKIP_SYNC || ARGS.SKIP_SYNC)
		logger.debug(
			`skipping index sync due to ${ENV.SEARCH.SKIP_SYNC ? "env" : "args"} setting.`,
		);
	else await syncIndexWithDatabase();

	app.listen(ENV.SERVER.PORT);
	logger.info(
		`search is running at ${app.server?.hostname}:${app.server?.port}`,
	);

	await watchNewPosts();
}

main().catch((err) => {
	logger.error("error starting the server:", err);
	process.exit(1);
});

// on error
process.on("uncaughtException", (err) => {
	logger.error("uncaught exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
	logger.error("unhandled rejection at:", promise, "reason:", reason);
});
