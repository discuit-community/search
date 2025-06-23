import { defineStore } from "pinia";
import { useSettingsStore } from "./settingsStore";

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

export interface FilterOptions {
	community?: string;
	username?: string;
	postType?: "all" | "text" | "image" | "link";
	sortBy?: "relevance" | "newest" | "oldest" | "most-upvoted" | "least-upvoted";
}

export const useSearchStore = defineStore("search", {
	state: () => ({
		query: "" as string,
		results: [] as SearchResult[],
		fetchingResults: false,
		page: 1,
		limit: 20,
		totalHits: 0,
		filters: {} as FilterOptions,
	}),
	actions: {
		async search() {
			const settingsStore = useSettingsStore();
			if (!this.query.trim()) {
				this.results = [];
				this.totalHits = 0;
				return;
			}
			this.fetchingResults = true;
			const offset = (this.page - 1) * this.limit;

			const url = new URL(`${settingsStore.instanceUrl}/search`);
			url.searchParams.set("q", this.query);
			url.searchParams.set("limit", this.limit.toString());
			url.searchParams.set("offset", offset.toString());

			if (this.filters.community) {
				url.searchParams.set("community", this.filters.community);
			}
			if (this.filters.username) {
				url.searchParams.set("username", this.filters.username);
			}
			if (this.filters.postType && this.filters.postType !== "all") {
				url.searchParams.set("type", this.filters.postType);
			}

			if (this.filters.sortBy && this.filters.sortBy !== "relevance") {
				switch (this.filters.sortBy) {
					case "newest":
						url.searchParams.set("sort", "createdAt:desc");
						break;
					case "oldest":
						url.searchParams.set("sort", "createdAt:asc");
						break;
					case "most-upvoted":
						url.searchParams.set("sort", "upvotes:desc");
						break;
					case "least-upvoted":
						url.searchParams.set("sort", "upvotes:asc");
						break;
				}
			}

			try {
				const res = await fetch(url.toString());
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
		setFilters(filters: FilterOptions) {
			this.filters = filters;
			this.page = 1;
		},
		clearFilters() {
			this.filters = {};
			this.page = 1;
		},
	},
	getters: {
		hasActiveFilters(): boolean {
			return Object.values(this.filters).some(
				(value) => value && value !== "all" && value !== "relevance",
			);
		},
	},
});
