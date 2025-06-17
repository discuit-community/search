export default {
	SEARCH: {
		PORT: process.env.SEARCH_PORT || 7700,
		ADDRESS: process.env.SEARCH_ADDR || "http://127.0.0.1",
		KEY: process.env.SEARCH_KEY || "dev",
		SKIP_SYNC:
			process.env.SEARCH_SKIP_SYNC === "1" ||
			process.env.SEARCH_SKIP_SYNC === "true",
	},
	SERVER: {
		PORT: process.env.SERVER_PORT || 3001,
	},
	DISCUIT: {
		API_URL: process.env.DISCUIT_URL || "http://discuit./api",
	},
};
