<script setup lang="ts">
import type { SearchResult } from "@/stores/searchStore";
import { marked } from "marked";

const props = defineProps<{
    result: SearchResult;
    index: number;
}>();

const result = props.result;

const date = new Date(result.createdAt).toLocaleDateString(navigator.language, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
});

function timeAgo(date: Date) {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 },
    ];

    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
        }
    }
    return "just now";
}

const body = result.body ? marked.parse(result.body) : "";
const friendlyDate = timeAgo(new Date(result.createdAt));

type Notation = "plus" | "d-slash";
const notation: Notation = "d-slash" as Notation;
</script>

<template>
    <div class="result">
        <div class="result__meta">
            <div class="result__meta-links">
                <a
                    class="result__meta-links__username"
                    :href="`https://discuit.org/@${result.username}`"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    @{{ result.username }}
                </a>
                <a
                    class="result__meta-links__community"
                    :href="`https://discuit.org/${result.communityName}`"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {{ notation === "plus" ? "+" : "d/"
                    }}{{ result.communityName }}
                </a>
            </div>
            <span class="result__meta-date" :title="date">
                {{ friendlyDate }}
            </span>
        </div>

        <div class="result__content">
            <h3 class="result__content-title">
                {{ result.title }}
            </h3>
            <p class="result__content-body" v-if="result.body !== ''">
                <span class="markdown" v-html="body"></span>
            </p>
        </div>

        <div class="result__footer">
            <div class="result__footer-links">
                <a
                    class="result__footer-links__permalink"
                    :href="`https://discuit.org/${result.communityName}/post/${result.publicId}`"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    view on discuit
                </a>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.result {
    display: flex;
    flex-direction: column;
    border: 1px solid hsla(var(--subtext0) / 0.1);
    padding: 0.5rem;
    background: hsla(var(--surface0) / 0.1);
    border-radius: var(--item-top-radius, 0.5rem) var(--item-top-radius, 0.5rem)
        var(--item-bottom-radius, 0.5rem) var(--item-bottom-radius, 0.5rem);
    overflow: hidden;
    margin-bottom: 0.3rem;
    transition:
        background 0.2s cubic-bezier(0.2, 0, 0, 1),
        border-color 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.result__meta {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 0.5rem;
    font-size: 0.9rem;
    color: hsl(var(--subtext1));
    gap: 0.5rem;
    border-bottom: 1px solid hsla(var(--subtext0) / 0.1);

    &-links {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;

        a {
            color: hsl(var(--blue));
            text-decoration: none;
            transition: color 0.2s cubic-bezier(0.2, 0, 0, 1);

            &:hover {
                color: hsl(var(--blue) / 0.8);
                text-decoration: underline;
            }
        }
    }
    &-date {
        color: hsl(var(--subtext0));
    }
}

.result__content {
    padding: 0.5rem;
    flex-grow: 1;

    &-title {
        font-size: 1.1rem;
        margin: 0;
        color: hsl(var(--text1));
        font-weight: 900;

        a {
            color: inherit;
            font-weight: 900;
            text-decoration: underline transparent;
            transition: 0.2s cubic-bezier(0.2, 0, 0, 1);

            &:hover {
                color: hsl(var(--blue) / 0.8);
                text-decoration: underline hsl(var(--blue) / 0.8);
            }
        }
    }

    &-body {
        margin-top: 0.3rem;
        color: hsl(var(--text2));
    }
}

.result__footer {
    display: flex;
    justify-content: flex-end;
    padding: 0.5rem;
    font-size: 0.9rem;
    color: hsl(var(--subtext1));

    background: hsla(var(--surface0) / 0.1);
    border-top: 1px solid hsla(var(--subtext0) / 0.1);

    &-links {
        a {
            color: hsl(var(--blue));
            text-decoration: underline transparent;
            transition: 0.2s cubic-bezier(0.2, 0, 0, 1);

            &:hover {
                color: hsl(var(--blue) / 0.8);
                text-decoration: underline;
            }
        }
    }
}
</style>
