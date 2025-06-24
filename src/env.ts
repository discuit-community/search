import { Logger } from "@sillowww/lily";
import fs from "node:fs";

const logger = new Logger("search");
const configLogger = logger.child("config");

const RESET = "\x1b[0m";
const FG_CYAN = "\x1b[36m";
const FG_YELLOW = "\x1b[33m";
const FG_GREEN = "\x1b[32m";
const FG_MAGENTA = "\x1b[35m";

type Redactions = { usernames: string[]; communities: string[] };

const redactionsExist = fs.existsSync("redactions.json");
if (!redactionsExist) console.error("redactions.json file not found.");

const REDACTIONS = redactionsExist
	? (JSON.parse(fs.readFileSync("redactions.json", "utf-8")) as Redactions)
	: {
			usernames: [],
			communities: [],
		};

const config = {
	SEARCH: {
		PORT: process.env.SEARCH_PORT || 7700,
		ADDRESS: process.env.SEARCH_ADDR || "http://127.0.0.1",
		KEY: process.env.SEARCH_KEY || "dev",
		SKIP_SYNC:
			process.env.SEARCH_SKIP_SYNC === "1" ||
			process.env.SEARCH_SKIP_SYNC === "true",
		TIMEOUT: process.env.SEARCH_TIMEOUT
			? Number.parseInt(process.env.SEARCH_TIMEOUT)
			: 5000,
	},
	SERVER: {
		PORT: process.env.SERVER_PORT || 3001,
		LOGGING_WEBHOOK: process.env.LOGGING_WEBHOOK || null,
		MENTION_ID: process.env.MENTION_ID || null,
	},
	DISCUIT: {
		API_URL: process.env.DISCUIT_URL || "http://discuit.org/api",
		BASE_URL: process.env.DISCUIT_BASE_URL || "http://discuit.org",
	},
	REDACTIONS: {
		usernames: REDACTIONS.usernames || [],
		communities: REDACTIONS.communities || [],
	},
};

configLogger.debug(`${FG_CYAN}CONFIGURATION:${RESET}`);
for (const [key, value] of Object.entries(config)) {
	if (typeof value === "object") {
		configLogger.debug(`  ${FG_CYAN}${key}:${RESET}`);
		for (const [subKey, subValue] of Object.entries(value)) {
			configLogger.debug(
				`    ${FG_YELLOW}${subKey}${RESET}: ${FG_GREEN}${subValue}${RESET}`,
			);
		}
	} else {
		configLogger.debug(
			`${FG_MAGENTA}${key}${RESET}: ${FG_GREEN}${value}${RESET}`,
		);
	}
}
configLogger.debug("");
export default config;
export { logger };
