<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from "vue";
import { marked } from "marked";

import type { SearchResult } from "@/stores/searchStore";
import { useSettingsStore } from "@/stores/settingsStore";
import PostModal from "@/components/PostModal/PostModal.vue";

const settingsStore = useSettingsStore();
const props = defineProps<{
	result: SearchResult;
	index: number;
}>();

const isExpanded = ref(false);
const isCollapsible = ref(false);
const bodyRef = ref<HTMLElement | null>(null);

const showModal = ref(false);
const openModal = () => {
	showModal.value = true;
};
const closeModal = () => {
	showModal.value = false;
};

onMounted(async () => {
	await nextTick();
	if (bodyRef.value) {
		const style = window.getComputedStyle(bodyRef.value);
		const lineHeight =
			Number.parseFloat(style.lineHeight) === 0
				? 20
				: Number.parseFloat(style.lineHeight);
		const totalHeight = bodyRef.value.offsetHeight;
		const maxHeight = lineHeight * 8;

		isCollapsible.value = totalHeight > maxHeight + 2;
	}
});

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
                    {{ settingsStore.communityPrefix === "plus" ? "+" : "d/"
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
            <div class="result__content-body" v-if="result.body !== ''">
                <div
                    class="markdown post-body"
                    v-html="body"
                    :class="{
                        collapsed: !isExpanded && isCollapsible,
                        oversized: isCollapsible,
                    }"
                    ref="bodyRef"
                ></div>
                <button
                    v-if="isCollapsible"
                    class="toggle-btn"
                    @click="isExpanded = !isExpanded"
                    type="button"
                >
                    {{ isExpanded ? "show less" : "show more" }}
                </button>
            </div>
        </div>

        <div class="result__footer">
            <div class="result__footer-links">
                <button
                    class="result__footer-links__action"
                    type="button"
                    @click="openModal"
                >
                    show post
                </button>
                <a
                    class="result__footer-links__permalink result__footer-links__action"
                    :href="`https://discuit.org/${result.communityName}/post/${result.publicId}`"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    view on discuit
                </a>
            </div>
        </div>
    </div>

    <teleport to="body">
        <PostModal
            :publicId="result.publicId"
            :open="showModal"
            @close="closeModal"
        />
    </teleport>
</template>

<style scoped lang="scss">
.result {
    display: flex;
    flex-direction: column;
    border: 1px solid hsla(var(--subtext0) / 0.1);
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
    padding: 0.75rem;
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
    padding: 0.75rem;
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
        border: 1px solid transparent;
        .oversized {
            border: 1px solid hsla(var(--surface0) / 0.3);
            border-radius: 1rem;
            overflow: hidden;
            padding: 0.5rem;
        }
        .collapsed {
            position: relative;
            overflow: hidden;
            max-height: 12.8em;

            &::after {
                content: "";
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 7em;
                background: linear-gradient(
                    hsla(var(--crust) / 0) 0%,
                    hsla(var(--surface0) / 0.6) 100%
                );
            }
        }
    }
}

.result__footer {
    display: flex;
    justify-content: flex-end;
    padding: 0.5rem calc(3rem - 1rem);
    font-size: 0.9rem;
    color: hsl(var(--subtext1));

    background: hsla(var(--surface0) / 0.1);
    border-top: 1px solid hsla(var(--subtext0) / 0.1);

    &-links {
        display: flex;
        flex-direction: row;
        gap: 1rem;
        .result__footer-links__action {
            font-size: inherit;
            background: hsla(var(--surface0) / 0.1);
            padding: 0.25rem 0.5rem;
            border: 1px solid hsla(var(--subtext0) / 0.1);
            border-radius: 5rem;

            color: hsl(var(--blue));
            gap: 0.5rem;
            text-decoration: none;

            transition: 0.2s cubic-bezier(0.2, 0, 0, 1);

            &:hover,
            &:focus-visible {
                color: hsl(var(--blue) / 0.8);
                border-color: hsla(var(--blue) / 0.3);
                background: hsla(var(--blue) / 0.075);
                cursor: pointer;
            }

            &:active {
                color: hsl(var(--blue) / 0.6);
                border-color: hsla(var(--blue) / 0.5);
                background: hsla(var(--blue) / 0.15);
            }
        }
    }
}

.toggle-btn {
    border: 1px solid hsla(var(--subtext0) / 0.1);
    background: transparent;
    color: hsl(var(--subtext1));
    border-radius: 5rem;
    padding: 0.25rem 1rem;
    cursor: pointer;
    transition: 0.2s cubic-bezier(0.2, 0, 0, 1);

    &:hover {
        border-color: hsla(var(--blue) / 0.3);
        background: hsla(var(--blue) / 0.075);
    }
    &:active {
        border-color: hsla(var(--blue) / 0.5);
        background: hsla(var(--blue) / 0.15);
    }
}
</style>
