import { PostModel } from "@discuit-community/client";
import { defineStore } from "pinia";

type SqlBoolean = 0 | 1;
export interface Post {
	publicId: string;
	createdAt: string;
	title: string;
	body: string;
	communityName: string;
	username: string;
	type: "image" | "link" | "text";
	hotness: number;
	upvotes: number;
	downvotes: number;
	/** 0 or 1 */
	isPinned: SqlBoolean;
	/** 0 or 1 */
	isDeleted: SqlBoolean;
}

export type SearchResult = Post & {
	_formatted: Post;
};

export const useSearchStore = defineStore("search", {
	state: () => ({
		query: "" as string,
		results: [] as SearchResult[],
		fetchingResults: false,
		page: 1,
		limit: 20,
		totalHits: 0,

		instanceUrl: "https://dsearch.wlo.moe",
	}),
	actions: {
		async search() {
			if (!this.query.trim()) {
				this.results = [];
				this.totalHits = 0;
				return;
			}
			this.fetchingResults = true;
			const offset = (this.page - 1) * this.limit;
			try {
				const res = await fetch(
					`${this.instanceUrl}/search?q=${encodeURIComponent(this.query)}&limit=${this.limit}&offset=${offset}`,
				);
				const data = await res.json();
				this.results = data.hits || [];
				this.totalHits = data.estimatedTotalHits || 0;
			} catch (e) {
				this.results = [];
				this.totalHits = 0;
			} finally {
				this.fetchingResults = false;
			}
		},
		setQuery(q: string) {
			this.query = q;
			this.page = 1;
		},
		setPage(p: number) {
			this.page = p;
		},
	},
});
