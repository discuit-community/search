import type { Post } from "@discuit-community/types";
import { db } from "./db";
import { postsIndex, searchClient } from "./meilisearch";

function postsAreEqual(a: Post, b: Post): boolean {
  return (
    a.title === b.title &&
    a.body === b.body &&
    a.communityName === b.communityName &&
    a.username === b.username &&
    a.type === b.type &&
    a.createdAt === b.createdAt &&
    a.hotness === b.hotness &&
    a.upvotes === b.upvotes &&
    a.downvotes === b.downvotes &&
    a.isPinned === b.isPinned &&
    a.deleted === b.deleted &&
    a.publicId === b.publicId
  );
}

function* batch<T>(arr: T[], size: number): Generator<T[]> {
  for (let i = 0; i < arr.length; i += size) {
    yield arr.slice(i, i + size);
  }
}

export async function syncIndexWithDatabase() {
  console.log("syncing index with database...");

  const dbStart = Date.now();
  const dbPosts = db.query("select * from posts").all() as Post[];
  const dbPostsById = new Map(dbPosts.map((post) => [post.id, post]));

  const dbEnd = Date.now();
  const dbDuration = Math.round(dbEnd - dbStart);
  console.log(
    `  found ${dbPosts.length} posts in database in ${dbDuration}ms.`,
  );

  let msPosts: Post[] = [];
  let offset = 0;
  const limit = 1000;
  const msStart = Date.now();
  while (true) {
    const res = await postsIndex.getDocuments<Post>({
      limit,
      offset,
      fields: [
        "id",
        "publicId",
        "createdAt",
        "title",
        "body",
        "communityName",
        "username",
        "type",
        "hotness",
        "upvotes",
        "downvotes",
        "isPinned",
        "deleted",
      ],
    });
    msPosts = msPosts.concat(res.results);
    if (res.results.length < limit) break;
    offset += limit;
    process.stdout.clearLine(0);
    process.stdout.write(
      `\r  fetched ${msPosts.length} posts from index so far...`,
    );
  }
  process.stdout.clearLine(0);

  const msEnd = Date.now();
  const msDuration = Math.round(msEnd - msStart);
  process.stdout.write(
    `\r  found ${msPosts.length} posts in index in ${msDuration}ms.\n`,
  );

  const msPostsById = new Map(msPosts.map((post) => [post.id, post]));
  const msIds = new Set(msPosts.map((post) => post.id));
  const dbIds = new Set(dbPosts.map((post) => post.id));

  const toAdd = dbPosts.filter((post) => !msIds.has(post.id));
  const toDelete = msPosts
    .filter((post) => !dbIds.has(post.id))
    .map((post) => post.id);

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
      process.stdout.clearLine(0);
      process.stdout.write(
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

      process.stdout.clearLine(0);
      process.stdout.write(
        `\r  ${action.past} ${total} posts in ${duration}ms.\n`,
      );
    }
  }

  const batchSize = 2500;
  if (toAdd.length > 0) {
    await batchProcess(
      toAdd,
      batchSize,
      async (batchItems) => {
        const response = await postsIndex.addDocuments(batchItems);
        await searchClient.tasks.waitForTask(response.taskUid);
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
        await searchClient.tasks.waitForTask(response.taskUid);
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
        await searchClient.tasks.waitForTask(response.taskUid);
      },
      { present: "deleting", past: "deleted" },
    );
  }
  if (toAdd.length === 0 && toUpdate.length === 0 && toDelete.length === 0) {
    console.log("  index is up to date.\n");
  }
}
