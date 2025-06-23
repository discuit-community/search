import { Database } from "bun:sqlite";
import { DiscuitClient, type PostModel } from "@discuit-community/client";
import { savePosts } from "../src/sync";
import ENV from "../src/env";

const client = new DiscuitClient({
	apiUrl: ENV.DISCUIT.API_URL,
});
const db = new Database("posts.db");

db.run(`
  create table if not exists posts (
    id text,
    type text,
    publicId text primary key,
    userId text,
    username text,
    userGhostId text,
    userGroup text,
    userDeleted boolean,
    isPinned boolean,
    isPinnedSite boolean,
    communityId text,
    communityName text,
    communityProPic text,
    communityBannerImage text,
    title text,
    body text,
    image text,
    images text,
    link text,
    locked boolean,
    lockedBy text,
    lockedByGroup text,
    lockedAt text,
    upvotes integer,
    downvotes integer,
    hotness real,
    createdAt text,
    editedAt text,
    lastActivityAt text,
    deleted boolean,
    deletedAt text,
    deletedBy text,
    deletedAs text,
    deletedContent boolean,
    deletedContentAs text,
    noComments integer,
    comments text,
    commentsNext text
  )
`);

async function fetchAllPosts() {
	const posts: PostModel[] = [];
	// 1769555499bbc51b0f7f1417
	const startKey: string | undefined = "";
	let next: string | undefined = startKey;
	let total = 0;
	let batch = 0;
	const MAX_POSTS = 150000;

	const before = (
		db.prepare("select count(*) as count from posts").get() as { count: number }
	).count;

	while (total < MAX_POSTS) {
		batch++;
		console.log(
			`fetching batch ${batch}... (total: ${total}; next: ${next ?? "none"})`,
		);
		const url = new URL("https://discuit.org/api/posts?");
		url.searchParams.set("feed", "all");
		url.searchParams.set("sort", "hot");
		url.searchParams.set("limit", "50");

		if (next) url.searchParams.set("next", next);
		const [getPostsData, getPostsErr] = await client.getPosts({
			feed: "all",
			limit: 50,
			sort: "latest",
			next: next ?? undefined,
		});

		if (getPostsErr) {
			console.error("error fetching posts:", getPostsErr);
			break;
		}

		total += getPostsData.posts.length;
		next = getPostsData.next;

		posts.push(...getPostsData.posts);

		savePosts(getPostsData.posts);
		if (!getPostsData.posts.length) break;
	}

	savePosts(posts);

	const after = (
		db.prepare("select count(*) as count from posts").get() as { count: number }
	).count;
	console.log(`added ${after - before} new posts, total: ${after}`);
}

fetchAllPosts();
