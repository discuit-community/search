import ENV from "../env";
const REDACTIONS = ENV.REDACTIONS;

export function redactMentions(text: string): string {
	if (!text) return text;
	for (const username of REDACTIONS.usernames) {
		const re = new RegExp(
			`\\b${username.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
			"gi",
		);
		text = text.replace(re, "[REDACTED]");
	}
	for (const community of REDACTIONS.communities) {
		const re = new RegExp(
			`\\b${community.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
			"gi",
		);
		text = text.replace(re, "[REDACTED]");
	}
	return text;
}
