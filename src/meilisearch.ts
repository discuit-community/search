import { Meilisearch } from "meilisearch";
import ENV from "./env";

export const SEARCH_URL = `${ENV.SEARCH.ADDRESS}:${ENV.SEARCH.PORT}`;

export const searchClient = new Meilisearch({
	host: SEARCH_URL,
	apiKey: ENV.SEARCH.KEY,
});

export const postsIndex = searchClient.index("posts");
postsIndex.updateSettings({
	filterableAttributes: ["communityName", "username", "type"],
	sortableAttributes: ["createdAt"],
	faceting: {
		maxValuesPerFacet: 100,
		sortFacetValuesBy: { communityName: "count" },
	},
	facetSearch: true,
});
