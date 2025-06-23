import { Meilisearch } from "meilisearch";
import ENV from "./env";

export const SEARCH_URL = `${ENV.SEARCH.ADDRESS}:${ENV.SEARCH.PORT}`;

export const searchClient = new Meilisearch({
	host: SEARCH_URL,
	apiKey: ENV.SEARCH.KEY,
	timeout: ENV.SEARCH.TIMEOUT,
});

export const postsIndex = searchClient.index("posts");
postsIndex.updateSettings({
	filterableAttributes: ["communityName", "username", "type"],
	sortableAttributes: ["createdAt", "upvotes", "downvotes", "hotness"],
	searchableAttributes: ["title", "body", "communityName", "username"],
	faceting: {
		maxValuesPerFacet: 100,
		sortFacetValuesBy: { communityName: "count" },
	},
	facetSearch: true,
});
