import {
	type Transport,
	type LogEntry,
	LogLevel,
	Logger,
} from "@sillowww/lily";
import ENV, { logger } from "./env";

class DiscordTransport implements Transport {
	private logBuffer: LogEntry[] = [];
	private timer: NodeJS.Timeout | null = null;
	private readonly batchInterval = 5000;
	private readonly maxBufferSize = 50;
	private internalLogger = logger.child("discordTransport");

	constructor(private webhookUrl: string) {}

	async log(entry: LogEntry): Promise<void> {
		if (!ENV.SERVER.LOGGING_WEBHOOK || !ENV.SERVER.MENTION_ID) return;

		this.logBuffer.push(entry);

		// Send immediately if buffer is full
		if (this.logBuffer.length >= this.maxBufferSize) {
			await this.flush();
			return;
		}

		// Schedule a batch send if not already scheduled
		if (!this.timer) {
			this.timer = setTimeout(() => {
				this.flush();
			}, this.batchInterval);
		}
	}

	private async flush(): Promise<void> {
		if (this.logBuffer.length === 0) return;

		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		const logsToSend = [...this.logBuffer];
		this.logBuffer = [];

		const hasCriticalLogs = logsToSend.some(
			(entry) =>
				entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL,
		);

		const formattedLogs = logsToSend.map((entry) => {
			const { level, message, scope } = entry;
			return [
				this.getLevelEmoji(level),
				`\`[${scope.join("/")}]\``,
				`\`${message}\``,
			].join(" ");
		});

		const parts = [formattedLogs.join("\n")];
		if (hasCriticalLogs) {
			parts.push(`<@${ENV.SERVER.MENTION_ID}>`);
		}

		const content = parts.join("\n\n");

		if (content.length > 2000)
			await this.sendInChunks(formattedLogs, hasCriticalLogs);
		else await this.sendMessage(content);
	}

	private async sendInChunks(
		formattedLogs: string[],
		hasCriticalLogs: boolean,
	): Promise<void> {
		const chunks: string[] = [];
		let currentChunk = "";

		for (const log of formattedLogs) {
			const reserveSpace = hasCriticalLogs ? 50 : 0;

			if (currentChunk.length + log.length + 1 > 2000 - reserveSpace) {
				if (currentChunk) chunks.push(currentChunk);
				currentChunk = log;
			} else {
				currentChunk = currentChunk ? `${currentChunk}\n${log}` : log;
			}
		}

		if (currentChunk) chunks.push(currentChunk);

		for (let i = 0; i < chunks.length; i++) {
			const isLastChunk = i === chunks.length - 1;
			const content =
				hasCriticalLogs && isLastChunk
					? `${chunks[i]}\n\n<@${ENV.SERVER.MENTION_ID}>`
					: chunks[i];

			await this.sendMessage(content);

			if (!isLastChunk) {
				await new Promise((resolve) => setTimeout(resolve, 100));
			}
		}
	}

	private async sendMessage(content: string): Promise<void> {
		try {
			await fetch(this.webhookUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ content }),
			});
		} catch (error) {
			this.internalLogger.error("Failed to send Discord log:", error);
		}
	}

	private getLevelEmoji(level: LogLevel): string {
		switch (level) {
			case LogLevel.TRACE:
				return "🔍";
			case LogLevel.DEBUG:
				return "🐛";
			case LogLevel.INFO:
				return "ℹ️";
			case LogLevel.WARN:
				return "⚠️";
			case LogLevel.ERROR:
				return "❌";
			case LogLevel.FATAL:
				return "💀";
			default:
				return "📝";
		}
	}

	public async destroy(): Promise<void> {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		await this.flush();
	}
}

const discordTransport = new DiscordTransport(ENV.SERVER.LOGGING_WEBHOOK);
logger.addTransport(discordTransport);

process.on("SIGINT", async () => {
	await discordTransport.destroy();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await discordTransport.destroy();
	process.exit(0);
});

export default logger;
