import type { Post } from "@discuit-community/types";
import { Jetstream, Topic } from "@discuit-community/jetstream";
import DiscuitClient, { PostModel } from "@discuit-community/client";

import logger from "./logger";
import { db } from "./db";
import { postsIndex, searchClient } from "./meilisearch";
import ENV from "./env";
const TIMEOUT = ENV.SEARCH.TIMEOUT;

const loggerSync = logger.child("sync");

const client = new DiscuitClient({
	apiUrl: ENV.DISCUIT.API_URL,
});

const postProperties: (keyof Post)[] = [
	"id",
	"type",
	"publicId",
	"userId",
	"username",
	"userGhostId",
	"userGroup",
	"userDeleted",
	"isPinned",
	"isPinnedSite",
	"communityId",
	"communityName",
	"communityProPic",
	"communityBannerImage",
	"title",
	"body",
	"image",
	"images",
	"link",
	"locked",
	"lockedBy",
	"lockedByGroup",
	"lockedAt",
	"upvotes",
	"downvotes",
	"hotness",
	"createdAt",
	"editedAt",
	"lastActivityAt",
	"deleted",
	"deletedAt",
	"deletedBy",
	"deletedAs",
	"deletedContent",
	"deletedContentAs",
	"noComments",
	"comments",
	"commentsNext",
];

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} bytes`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} kb`;
	if (bytes < 1024 * 1024 * 1024)
		return `${(bytes / (1024 * 1024)).toFixed(2)} mb`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} gb`;
}

function postsAreEqual(a: Post, b: Post): boolean {
	for (const prop of postProperties) {
		if (a[prop] !== b[prop]) {
			return false;
		}
	}
	return true;
}

function* batch<T>(arr: T[], size: number): Generator<T[]> {
	for (let i = 0; i < arr.length; i += size) {
		yield arr.slice(i, i + size);
	}
}

export async function syncIndexWithDatabase() {
	loggerSync.info("syncing index with database...");
	const dbStart = Date.now();
	const dbPosts = db.query("select * from posts").all() as Post[];

	const dbEnd = Date.now();
	const dbDuration = Math.round(dbEnd - dbStart);
	loggerSync.info(
		`  found ${dbPosts.length} posts in database in ${dbDuration}ms.`,
	);

	let msPosts: Post[] = [];
	let offset = 0;
	let size = 0;
	const limit = 1000;
	const msStart = Date.now();
	while (true) {
		const res = await postsIndex.getDocuments<Post>({
			limit,
			offset,
			fields: postProperties,
		});

		const batchSize = new TextEncoder().encode(
			JSON.stringify(res.results),
		).length;
		size += batchSize;
		msPosts = msPosts.concat(res.results);

		if (res.results.length < limit) break;
		offset += limit;
		logger.info(
			`  fetched ${msPosts.length} posts from index so far (~${formatSize(batchSize)})...`,
		);
	}

	const msEnd = Date.now();
	const msDuration = Math.round(msEnd - msStart);
	logger.info(
		`  found ${msPosts.length} posts in index in ${msDuration}ms (approx. ${formatSize(size)})\n`,
	);

	const msPostsById = new Map(msPosts.map((post) => [post.id, post]));
	const msIds = new Set(msPosts.map((post) => post.id));
	const dbIds = new Set(dbPosts.map((post) => post.id));

	const toAdd = dbPosts.filter((post) => !msIds.has(post.id));
	const toDelete = msPosts
		.filter((post) => !dbIds.has(post.id))
		.map((post) => post.id);

	logger.info(
		`  to add ${toAdd.length} posts, to delete ${toDelete.length} posts.`,
	);

	const toUpdate: Post[] = [];
	for (const post of dbPosts) {
		if (msIds.has(post.id)) {
			const msPost = msPostsById.get(post.id);
			if (msPost && !postsAreEqual(post, msPost)) {
				toUpdate.push(post);
			}
		}
	}

	async function batchProcess<T>(
		items: T[],
		batchSize: number,
		fn: (batch: T[], batchNum: number, totalBatches: number) => Promise<void>,
		action: { present: string; past: string } = {
			present: "processing",
			past: "processed",
		},
		concurrency = 4,
	) {
		let processed = 0;
		const startTime = Date.now();
		const total = items.length;
		const totalBatches = Math.ceil(total / batchSize);
		let batchNum = 0;

		const batches = Array.from(batch(items, batchSize));
		let idx = 0;

		async function processNext() {
			if (idx >= batches.length) return;
			const currentBatchNum = ++batchNum;
			const batchItems = batches[idx++];
			logger.info(
				`\r  ${action.present} batch ${currentBatchNum}/${totalBatches} (${processed + 1}-${processed + batchItems.length} of ${total})...`,
			);
			await fn(batchItems, currentBatchNum, totalBatches);
			processed += batchItems.length;
			await processNext();
		}

		const runners = [];
		for (let i = 0; i < Math.min(concurrency, batches.length); i++) {
			runners.push(processNext());
		}
		await Promise.all(runners);

		if (total > 0) {
			const endTime = Date.now();
			const duration = Math.round(endTime - startTime);

			logger.info(`\r  ${action.past} ${total} posts in ${duration}ms.\n`);
		}
	}

	const batchSize = 2500;
	if (toAdd.length > 0) {
		await batchProcess(
			toAdd,
			batchSize,
			async (batchItems) => {
				const response = await postsIndex.addDocuments(batchItems, {
					primaryKey: "id",
				});

				const result = await searchClient.tasks.waitForTask(response.taskUid, {
					timeout: TIMEOUT,
				});

				if (result.error)
					logger.error(`error adding documents: ${result.error.message}`);
			},
			{ present: "adding", past: "added" },
		);
	}
	if (toUpdate.length > 0) {
		await batchProcess(
			toUpdate,
			batchSize,
			async (batchItems) => {
				const response = await postsIndex.addDocuments(batchItems);
				await searchClient.tasks.waitForTask(response.taskUid, {
					timeout: TIMEOUT,
				});
			},
			{ present: "updating", past: "updated" },
		);
	}
	if (toDelete.length > 0) {
		await batchProcess(
			toDelete,
			batchSize,
			async (batchItems) => {
				const response = await postsIndex.deleteDocuments(batchItems);
				await searchClient.tasks.waitForTask(response.taskUid, {
					timeout: TIMEOUT,
				});
			},
			{ present: "deleting", past: "deleted" },
		);
	}
	if (toAdd.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
		logger.info("  index is up to date.\n");
	}
}

export function savePosts(posts: PostModel[]): PostModel[] {
	const stmt = db.prepare(
		`insert or ignore into posts (${postProperties.join(", ")}) values (${postProperties.map(() => "?").join(", ")})`,
	);
	const inserted: PostModel[] = [];
	db.transaction(() => {
		for (const p of posts) {
			const values = postProperties.map((prop) => {
				const value = p.raw[prop];
				if (value === undefined || value === null) return null;
				if (typeof value === "object") return JSON.stringify(value);
				return value;
			});
			const res = stmt.run(...values);

			if (res.changes === 1) inserted.push(p);
		}
	})();
	logger.debug(
		`  inserted ${inserted.length} posts: ${inserted
			.slice(0, 10)
			.map((p) => p.raw.publicId)
			.join(", ")}`,
	);
	return inserted;
}

async function indexPosts(posts: PostModel[]) {
	if (posts.length === 0) return;
	const docs = posts.map((p) => p.raw);
	const response = await postsIndex.addDocuments(docs);
	await searchClient.tasks.waitForTask(response.taskUid, { timeout: TIMEOUT });
	logger.info(`  indexed ${docs.length} posts in Meilisearch`);
}

export async function watchNewPosts() {
	const unprocessedPosts: PostModel[] = [];
	const BATCH_SIZE = 10;
	const BATCH_TIMEOUT = 5000;
	let batchTimeout: NodeJS.Timeout | null = null;

	const jetstream = new Jetstream({ client, retryAmount: 3 });
	jetstream.start();
	loggerSync.info("jetstream is listening");

	async function processBatch() {
		if (unprocessedPosts.length === 0) return;
		loggerSync.info(`processing batch of ${unprocessedPosts.length} posts...`);
		const batch = unprocessedPosts.splice(0, BATCH_SIZE);
		const inserted = savePosts(batch);
		await indexPosts(inserted);
		loggerSync.info(`processed batch of ${inserted.length} posts.`);
	}

	function scheduleTimeout() {
		if (batchTimeout) return;
		batchTimeout = setTimeout(async () => {
			await processBatch();
			batchTimeout = null;
			if (unprocessedPosts.length > 0) scheduleTimeout();
		}, BATCH_TIMEOUT);
	}

	jetstream.on(Topic.NEW_POST, (event) => {
		const post = event as Post;
		if (!post) return;

		unprocessedPosts.push(new PostModel(client, post));
		loggerSync.info(`new post with publicId ${post.publicId} received.`);

		if (unprocessedPosts.length >= BATCH_SIZE) {
			if (batchTimeout) {
				clearTimeout(batchTimeout);
				batchTimeout = null;
			}
			processBatch();
		} else {
			scheduleTimeout();
		}
	});
}
