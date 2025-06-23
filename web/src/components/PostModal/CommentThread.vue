<script setup lang="ts">
import { ref, computed } from "vue";
import { marked } from "marked";
import type { Comment } from "@discuit-community/types";

const props = defineProps<{
	comment: Comment & { replies?: Comment[] };
	depth?: number;
	isRoot?: boolean;
}>();

type CommentWithReplies = Comment & {
	replies?: CommentWithReplies[];
};

const depth = props.depth ?? 0;
const isRoot = props.isRoot ?? depth === 0;
const avatarUrl = props.comment.author?.proPic?.url
	? `https://discuit.org${props.comment.author.proPic.url}`
	: null;

const collapsed = ref(false);
const showRawText = ref(false);

const replyCount = computed(() => {
	if (!props.comment.replies) return 0;
	const countReplies = (comments: CommentWithReplies[]): number => {
		return comments.reduce((count, comment) => {
			return count + 1 + (comment.replies ? countReplies(comment.replies) : 0);
		}, 0);
	};
	return countReplies(props.comment.replies);
});

const formattedDate = computed(() => {
	const date = new Date(props.comment.createdAt);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 1) {
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		if (diffHours < 1) {
			const diffMinutes = Math.floor(diffMs / (1000 * 60));
			return diffMinutes < 1 ? "just now" : `${diffMinutes}m ago`;
		}
		return `${diffHours}h ago`;
	}
	if (diffDays < 7) {
		return `${diffDays}d ago`;
	}
	return date.toLocaleDateString();
});

const voteScore = computed(
	() => props.comment.upvotes - props.comment.downvotes,
);
const voteScoreClass = computed(() => {
	if (voteScore.value > 0) return "positive";
	if (voteScore.value < 0) return "negative";
	return "neutral";
});

function toggleCollapse() {
	collapsed.value = !collapsed.value;
}

function toggleRawText() {
	showRawText.value = !showRawText.value;
}

function copyCommentLink() {
	const url = `https://discuit.org/${props.comment.communityName}/post/${props.comment.postPublicId}/${props.comment.id}`;
	navigator.clipboard
		.writeText(url)
		.then(() => {
			alert("comment link copied to clipboard.");
		})
		.catch((err) => {
			console.error("failed to copy comment link:", err);
			alert("failed to copy comment link.");
		});
}
</script>

<template>
    <div
        class="comment-thread"
        :class="{ 'is-root': isRoot, 'is-collapsed': collapsed }"
    >
        <div class="comment-wrapper" :style="{ '--depth': Math.min(depth, 8) }">
            <div v-if="depth > 0" class="thread-line-container">
                <div class="thread-line"></div>
            </div>

            <div class="comment-main">
                <div class="comment-header">
                    <div class="comment-meta">
                        <button
                            class="collapse-btn"
                            @click="toggleCollapse"
                            :title="
                                collapsed
                                    ? `expand (${replyCount} replies)`
                                    : 'collapse'
                            "
                            :aria-label="
                                collapsed
                                    ? `expand comment thread with ${replyCount} replies`
                                    : 'collapse comment thread'
                            "
                        >
                            <span class="collapse-icon" :class="{ collapsed }">
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 12 12"
                                    fill="currentColor"
                                >
                                    <path
                                        d="M4.5 3L7.5 6L4.5 9"
                                        stroke="currentColor"
                                        stroke-width="1.5"
                                        fill="none"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    />
                                </svg>
                            </span>
                            <span
                                v-if="collapsed && replyCount > 0"
                                class="reply-count"
                            >
                                {{ replyCount }}
                            </span>
                        </button>

                        <div
                            v-if="avatarUrl && !collapsed"
                            class="avatar-container"
                        >
                            <img
                                :src="avatarUrl"
                                class="avatar"
                                :alt="`${comment.username}'s avatar`"
                                loading="lazy"
                            />
                        </div>

                        <div class="author-info">
                            <span
                                class="author"
                                :class="{ deleted: comment.userDeleted }"
                            >
                                <template v-if="!comment.userDeleted">
                                    <a
                                        :href="`https://discuit.org/@${comment.username}`"
                                        target="_blank"
                                        rel="noopener"
                                        class="author-link"
                                    >
                                        @{{ comment.username }}
                                    </a>
                                </template>
                                <template v-else>
                                    <span class="deleted-user">[deleted]</span>
                                </template>
                            </span>

                            <span
                                v-if="comment.author?.isAdmin"
                                class="badge admin"
                                >ADMIN</span
                            >
                        </div>

                        <span
                            class="date"
                            :title="
                                new Date(comment.createdAt).toLocaleString()
                            "
                        >
                            {{ formattedDate }}
                        </span>

                        <span class="vote-score" :class="voteScoreClass">
                            <span class="vote-arrows"
                                >↑{{ comment.upvotes }} ↓{{
                                    comment.downvotes
                                }}</span
                            >
                            <span class="vote-total"
                                >({{ voteScore > 0 ? "+" : ""
                                }}{{ voteScore }})</span
                            >
                        </span>

                        <span v-if="comment.deleted" class="deleted-label">
                            [deleted]
                        </span>
                    </div>

                    <div v-if="!collapsed" class="comment-actions">
                        <button
                            class="action-btn"
                            @click="toggleRawText"
                            :title="
                                showRawText ? 'show formatted' : 'show raw text'
                            "
                        >
                            {{ showRawText ? "formatted" : "raw" }}
                        </button>
                        <button
                            class="action-btn"
                            @click="copyCommentLink"
                            title="copy comment link"
                        >
                            link
                        </button>
                    </div>
                </div>

                <div v-if="!collapsed" class="comment-body">
                    <div v-if="!comment.deleted" class="body-content">
                        <div v-if="showRawText" class="raw-text">
                            <pre>{{ comment.body }}</pre>
                        </div>
                        <div
                            v-else
                            class="markdown"
                            v-html="marked.parse(comment.body)"
                        ></div>
                    </div>
                    <div v-else class="body-content deleted">
                        <em>[comment deleted]</em>
                    </div>
                </div>
            </div>
        </div>

        <div
            v-if="!collapsed && comment.replies?.length"
            class="replies-container"
        >
            <CommentThread
                v-for="reply in comment.replies"
                :key="reply.id"
                :comment="reply"
                :depth="depth + 1"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.comment-thread {
    margin-bottom: 0.2rem;
    border-radius: 0.4rem;
    padding: 0.5rem;
    &.is-root {
        border-bottom: 1px solid hsla(var(--subtext0) / 0.05);
        padding-bottom: 0.5rem;
        margin-bottom: 2rem;
    }
}

.comment-wrapper {
    display: flex;
    margin-left: calc(var(--depth, 1) * 1.1rem);
    position: relative;
}

.thread-line-container {
    display: flex;
    align-items: stretch;
    margin-right: 0.2rem;
    min-width: 1rem;

    .thread-line {
        width: 2px;
        background: hsla(var(--blue) / 0.2);
        border-radius: 1px;
        margin: 0 auto;
        transition: background 0.2s ease;

        .comment-thread:hover & {
            background: hsla(var(--blue) / 0.4);
        }
    }
}

.comment-main {
    flex: 1;
    min-width: 0;
}

.comment-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.3rem;
    gap: 0.5rem;
}

.comment-meta {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    min-width: 0;
}

.collapse-btn {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    background: none;
    border: 1px solid hsla(var(--subtext0) / 0.1);
    border-radius: 0.3rem;
    padding: 0.15rem 0.3rem;
    cursor: pointer;
    font-size: 0.8rem;
    color: hsl(var(--subtext0));
    transition: all 0.2s ease;

    &:hover {
        background: hsla(var(--blue) / 0.08);
        border-color: hsla(var(--blue) / 0.2);
        color: hsl(var(--blue));
    }

    .collapse-icon {
        display: flex;
        align-items: center;
        transition: transform 0.2s ease;

        &.collapsed {
            transform: rotate(-90deg);
        }
    }

    .reply-count {
        font-size: 0.75rem;
        background: hsla(var(--blue) / 0.15);
        color: hsl(var(--blue));
        padding: 0.1rem 0.3rem;
        border-radius: 0.8rem;
        line-height: 1;
    }
}

.avatar-container {
    display: flex;
    align-items: center;

    .avatar {
        width: 1.2rem;
        height: 1.2rem;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid hsla(var(--subtext0) / 0.1);
    }
}

.author-info {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    min-width: 0;
}

.author {
    .author-link {
        font-weight: 600;
        color: hsl(var(--blue));
        text-decoration: none;
        transition: color 0.2s ease;

        &:hover {
            color: hsl(var(--mauve));
            text-decoration: underline;
        }
    }

    &.deleted .deleted-user {
        color: hsl(var(--subtext1) / 0.6);
        font-style: italic;
    }
}

.badge {
    font-size: 0.6rem;
    font-weight: 700;
    padding: 0.1rem 0.3rem;
    border-radius: 0.2rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;

    &.admin {
        background: hsl(var(--red) / 0.15);
        color: hsl(var(--red));
        border: 1px solid hsl(var(--red) / 0.3);
    }

    &.mod {
        background: hsl(var(--green) / 0.15);
        color: hsl(var(--green));
        border: 1px solid hsl(var(--green) / 0.3);
    }
}

.date {
    color: hsl(var(--subtext0));
    font-size: 0.85rem;
    white-space: nowrap;
}

.vote-score {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.8rem;

    &.positive {
        .vote-total {
            color: hsl(var(--green));
        }
    }

    &.negative {
        .vote-total {
            color: hsl(var(--red));
        }
    }

    &.neutral {
        .vote-total {
            color: hsl(var(--subtext1));
        }
    }

    .vote-arrows {
        color: hsl(var(--subtext0));
    }

    .vote-total {
        font-weight: 500;
    }
}

.deleted-label {
    color: hsl(var(--red));
    font-size: 0.8rem;
    font-style: italic;
}

.comment-actions {
    display: flex;
    gap: 0.3rem;

    .action-btn {
        background: none;
        border: 1px solid hsla(var(--subtext0) / 0.1);
        color: hsl(var(--subtext1));
        padding: 0.1rem 0.4rem;
        border-radius: 0.3rem;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            background: hsla(var(--surface1) / 0.3);
            border-color: hsla(var(--blue) / 0.2);
            color: hsl(var(--blue));
        }
    }
}

.comment-body {
    margin-top: 0.3rem;
    padding-left: 0.1rem;
}

.body-content {
    color: hsl(var(--text));
    line-height: 1.5;

    &.deleted {
        color: hsl(var(--subtext0) / 0.7);
        font-style: italic;
    }

    .raw-text pre {
        background: hsla(var(--surface0) / 0.3);
        border: 1px solid hsla(var(--subtext0) / 0.1);
        border-radius: 0.4rem;
        padding: 0.5rem;
        font-size: 0.85rem;
        color: hsl(var(--subtext1));
        white-space: pre-wrap;
        word-break: break-word;
        overflow-x: auto;
    }
}

.collapsed-summary {
    margin-top: 0.3rem;

    .summary-text {
        color: hsl(var(--subtext0));
        font-size: 0.85rem;
        font-style: italic;
    }
}

.replies-container {
    margin-top: 0.5rem;
}

@media (max-width: 568px) {
    .comment-wrapper {
        margin-left: calc(var(--depth, 0) * 1rem);
    }

    .thread-line-container {
        margin-right: 0.5rem;
        min-width: 0.8rem;
    }

    .comment-meta {
        gap: 0.3rem;

        .date,
        .vote-score {
            font-size: 0.75rem;
        }
    }

    .comment-actions {
        .action-btn {
            font-size: 0.7rem;
            padding: 0.05rem 0.3rem;
        }
    }
}
</style>
