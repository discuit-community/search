<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from "vue";
import { marked } from "marked";
import { useSettingsStore } from "@/stores/settingsStore";
import type { Post, Comment } from "@discuit-community/types";
import CommentThread from "./CommentThread.vue";

const props = defineProps<{
    publicId: string;
    open: boolean;
}>();
const emit = defineEmits(["close"]);

const settings = useSettingsStore();

const loading = ref(false);
const error = ref<string | null>(null);
const post = ref<Post | null>(null);

const modalRef = ref<HTMLElement | null>(null);

watch(
    () => props.open,
    (val) => {
        if (val) {
            fetchPost();
            nextTick(() => {
                modalRef.value?.focus();
                document.body.style.overflow = "hidden";
            });
        } else {
            document.body.style.overflow = "";
        }
    },
);

onUnmounted(() => {
    document.body.style.overflow = "";
});

async function fetchPost() {
    loading.value = true;
    error.value = null;
    post.value = null;
    try {
        const url = `${settings.discuitProxyUrl}/posts/${props.publicId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("failed to fetch post");
        post.value = await res.json();
    } catch (e) {
        if (e instanceof Error) {
            console.error("error fetching post:", e);
            error.value = e.message || "unknown error";
        } else {
            console.error("unknown error fetching post:", e);
        }
    } finally {
        loading.value = false;
    }
}

function close() {
    emit("close");
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
        close();
    }
}

function onFocusTrap(e: FocusEvent) {
    if (modalRef.value && !modalRef.value.contains(e.target as Node)) {
        modalRef.value.focus();
    }
}

function buildCommentTree(comments: Comment[]): Comment[] {
    const map = new Map<string, Comment & { replies?: Comment[] }>();
    const roots: (Comment & { replies?: Comment[] })[] = [];

    for (const comment of comments) {
        map.set(comment.id, { ...comment, replies: [] });
    }

    for (const comment of comments) {
        if (comment.parentId && map.has(comment.parentId)) {
            const parent = map.get(comment.parentId);
            if (!parent || !parent.replies) continue;
            parent.replies.push(comment);
        } else {
            roots.push(comment);
        }
    }

    return roots;
}
const commentTree = computed(() =>
    post.value?.comments ? buildCommentTree(post.value.comments) : [],
);

onMounted(() => {
    window.addEventListener("keydown", onKeydown);
    window.addEventListener("focusin", onFocusTrap);
});
onUnmounted(() => {
    window.removeEventListener("keydown", onKeydown);
    window.removeEventListener("focusin", onFocusTrap);
});
</script>

<template>
    <transition name="modal-fade">
        <div
            v-if="open"
            class="modal-backdrop"
            @click.self="close"
            aria-modal="true"
            role="dialog"
            tabindex="-1"
        >
            <div
                class="modal-content"
                ref="modalRef"
                tabindex="0"
                aria-label="Post details"
            >
                <button
                    class="close-btn"
                    @click="close"
                    aria-label="Close modal"
                >
                    ×
                </button>
                <div v-if="loading" class="loading">
                    <span class="spinner"></span>
                    loading post...
                </div>
                <div v-else-if="error" class="error">
                    <span>⚠️</span> {{ error }}
                </div>
                <div v-else-if="post">
                    <h2 class="post-title">{{ post.title }}</h2>
                    <div class="meta">
                        <span>
                            <a
                                :href="`https://discuit.org/@${post.username}`"
                                target="_blank"
                                rel="noopener"
                            >
                                @{{ post.username }}
                            </a>
                        </span>
                        <span>
                            in
                            <a
                                :href="`https://discuit.org/${post.communityName}`"
                                target="_blank"
                                rel="noopener"
                            >
                                {{ post.communityName }}
                            </a>
                        </span>
                        <span>
                            {{ new Date(post.createdAt).toLocaleString() }}
                        </span>
                        <span v-if="typeof post.upvotes === 'number'">
                            ▲ {{ post.upvotes }} / ▼ {{ post.downvotes }}
                        </span>
                        <span v-if="post.isPinned">📌 pinned</span>
                        <span v-if="post.deleted">[deleted]</span>
                    </div>
                    <div
                        v-if="post.body"
                        class="markdown"
                        v-html="marked.parse(post.body)"
                    ></div>
                    <div
                        v-if="post.images && post.images.length"
                        class="images"
                    >
                        <img
                            v-for="img in post.images"
                            :key="img.id"
                            :src="`https://discuit.org${img.url}`"
                            :alt="img.altText || ''"
                        />
                    </div>
                    <div v-if="post.type === 'link' && post.link">
                        <a :href="post.link.url" target="_blank" rel="noopener">
                            {{ post.link.url }}
                        </a>
                    </div>

                    <div v-if="commentTree.length" class="comments-section">
                        <div class="comments-header">
                            <span class="comments-count"
                                >{{ commentTree.length }}
                                {{
                                    commentTree.length === 1
                                        ? "comment"
                                        : "comments"
                                }}</span
                            >
                        </div>
                        <CommentThread
                            v-for="comment in commentTree"
                            :key="comment.id"
                            :comment="comment"
                        />
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 10000;
    backdrop-filter: blur(1rem) brightness(0.75);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    overflow-y: auto;
}

.modal-content {
    --offset: 3rem;
    margin-top: var(--offset);
    height: calc(100vh - var(--offset));
    max-width: 768px;
    width: 100vw;
    background: hsla(var(--base) / 1);
    border: 1px solid hsla(var(--blue) / 0.1);
    border-bottom: none;
    border-radius: 1.5rem 1.5rem 0 0;
    overflow-y: auto;
    padding: 1.5rem 1rem 1rem 1rem;
    position: relative;
    outline: none;
    box-shadow: 0 8px 32px hsla(var(--crust) / 0.18);
}

.close-btn {
    position: absolute;
    top: 1rem;
    right: 1.2rem;
    font-size: 2rem;
    background: none;
    border: none;
    color: hsl(var(--subtext1));
    cursor: pointer;
    transition: color 0.2s;
    z-index: 10;
    &:hover {
        color: hsl(var(--red));
    }
}

.loading {
    display: flex;
    align-items: center;
    gap: 0.7em;
    font-size: 1.1em;
    color: hsl(var(--subtext1));
    .spinner {
        width: 1.2em;
        height: 1.2em;
        border: 2px solid hsl(var(--blue) / 0.2);
        border-top: 2px solid hsl(var(--blue));
        border-radius: 50%;
        animation: spin 1s linear infinite;
        display: inline-block;
    }
}
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.error {
    color: hsl(var(--red));
    margin: 1em 0;
    font-size: 1.1em;
    display: flex;
    align-items: center;
    gap: 0.5em;
}

.post-title {
    font-size: 1.5em;
    font-weight: 700;
    margin-bottom: 0.5em;
    color: hsl(var(--text));
    word-break: break-word;
}

.meta {
    font-size: 0.95em;
    color: hsl(var(--subtext0));
    margin-bottom: 1em;
    display: flex;
    gap: 1em;
    flex-wrap: wrap;
    a {
        color: hsl(var(--blue));
        text-decoration: underline;
        &:hover {
            color: hsl(var(--mauve));
        }
    }
}

.images {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1em;
    img {
        max-width: 100%;
        border-radius: 1rem;
        margin: 0;
        background: hsl(var(--surface1) / 0.1);
        box-shadow: 0 2px 8px hsla(var(--crust) / 0.08);
    }
}

.permalink-row {
    margin-top: 1.5em;
    text-align: right;
    .permalink {
        color: hsl(var(--blue));
        text-decoration: underline;
        font-weight: 500;
        font-size: 1.05em;
        &:hover {
            color: hsl(var(--mauve));
        }
    }
}

.comments-section {
    margin-top: 2em;
    border-top: 1px solid hsla(var(--blue) / 0.1);
    padding-top: 1.5em;
}

.comments-header {
    margin-bottom: 1.5em;
    font-size: 1.1em;
    span {
        font-weight: 900;
    }
}

.modal-content {
    transform: translateY(0);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.comments-count {
    font-size: 0.95em;
    color: hsl(var(--subtext0));
    font-weight: 500;
    letter-spacing: 0.025em;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
    .modal-content {
        transform: translateY(4rem);
    }
}
</style>
