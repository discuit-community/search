<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useSearchStore } from "@/stores/searchStore";

const props = defineProps<{
    open: boolean;
}>();
const emit = defineEmits<{
    close: [];
    applyFilters: [filters: FilterOptions];
}>();

export interface FilterOptions {
    community?: string;
    username?: string;
    postType?: "all" | "text" | "image" | "link";
    sortBy?:
        | "relevance"
        | "newest"
        | "oldest"
        | "most-upvoted"
        | "least-upvoted";
}

const searchStore = useSearchStore();
const modalRef = ref<HTMLElement | null>(null);

// Filter state - initialize with current store values
const filters = ref<FilterOptions>({
    community: "",
    username: "",
    postType: "all",
    sortBy: "relevance",
});

const postTypes = [
    { label: "all", value: "all" },
    { label: "text", value: "text" },
    { label: "image", value: "image" },
    { label: "link", value: "link" },
];

const sortOptions = [
    { label: "relevance", value: "relevance" },
    { label: "newest", value: "newest" },
    { label: "oldest", value: "oldest" },
    { label: "most upvoted", value: "most-upvoted" },
    { label: "least upvoted", value: "least-upvoted" },
];

// Initialize filters when modal opens
watch(
    () => props.open,
    (val) => {
        if (val) {
            // Load current filters from store
            filters.value = {
                community: searchStore.filters.community || "",
                username: searchStore.filters.username || "",
                postType: searchStore.filters.postType || "all",
                sortBy: searchStore.filters.sortBy || "relevance",
            };

            nextTick(() => {
                modalRef.value?.focus();
                document.body.style.overflow = "hidden";
            });
        } else {
            document.body.style.overflow = "";
        }
    },
);

function close() {
    emit("close");
}

function applyFilters() {
    const cleanFilters = { ...filters.value };
    // Remove empty string values
    if (!cleanFilters.community?.trim()) cleanFilters.community = undefined;
    if (!cleanFilters.username?.trim()) cleanFilters.username = undefined;

    emit("applyFilters", cleanFilters);
    close();
}

function clearFilters() {
    filters.value = {
        community: "",
        username: "",
        postType: "all",
        sortBy: "relevance",
    };
}

function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
        close();
    }
}

onMounted(() => {
    window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
    window.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = "";
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
        >
            <div
                class="modal-content"
                ref="modalRef"
                tabindex="0"
                aria-label="Filter options"
            >
                <div class="modal-header">
                    <h2>filters</h2>
                    <button
                        class="close-btn"
                        @click="close"
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                <div class="filter-sections">
                    <section class="filter-section">
                        <h3>community</h3>
                        <input
                            v-model="filters.community"
                            type="text"
                            placeholder="e.g. cats, programming"
                            class="filter-input"
                        />
                    </section>

                    <section class="filter-section">
                        <h3>username</h3>
                        <input
                            v-model="filters.username"
                            type="text"
                            placeholder="e.g. sillowww"
                            class="filter-input"
                        />
                    </section>

                    <section class="filter-section">
                        <h3>post type</h3>
                        <div class="option-grid">
                            <label
                                v-for="type in postTypes"
                                :key="type.value"
                                class="option-label"
                            >
                                <input
                                    type="radio"
                                    name="postType"
                                    :value="type.value"
                                    v-model="filters.postType"
                                />
                                <span class="custom-radio"></span>
                                {{ type.label }}
                            </label>
                        </div>
                    </section>

                    <section class="filter-section">
                        <h3>sort by</h3>
                        <div class="option-grid">
                            <label
                                v-for="sort in sortOptions"
                                :key="sort.value"
                                class="option-label"
                            >
                                <input
                                    type="radio"
                                    name="sortBy"
                                    :value="sort.value"
                                    v-model="filters.sortBy"
                                />
                                <span class="custom-radio"></span>
                                {{ sort.label }}
                            </label>
                        </div>
                    </section>
                </div>

                <div class="modal-actions">
                    <button class="clear-btn" @click="clearFilters">
                        clear all
                    </button>
                    <button class="apply-btn" @click="applyFilters">
                        apply filters
                    </button>
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
    align-items: center;
    justify-content: center;
    overflow-y: auto;
    padding: 1rem;
}

.modal-content {
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    background: hsla(var(--base) / 1);
    border: 1px solid hsla(var(--blue) / 0.1);
    border-radius: 1.5rem;
    overflow-y: auto;
    position: relative;
    outline: none;
    box-shadow: 0 8px 32px hsla(var(--crust) / 0.18);
    transform: translateY(0);
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.5rem 1rem 1.5rem;
    border-bottom: 1px solid hsla(var(--subtext0) / 0.1);

    h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: hsl(var(--text));
        margin: 0;
        text-transform: lowercase;
    }
}

.close-btn {
    font-size: 1.5rem;
    background: none;
    border: none;
    color: hsl(var(--subtext1));
    cursor: pointer;
    transition: color 0.2s;
    padding: 0.2rem;
    border-radius: 50%;

    &:hover {
        color: hsl(var(--red));
    }
}

.filter-sections {
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.filter-section {
    h3 {
        font-size: 1rem;
        font-weight: 600;
        color: hsl(var(--mauve));
        margin-bottom: 0.5rem;
        text-transform: lowercase;
    }
}

.filter-input {
    width: 100%;
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    border: 1px solid hsla(var(--subtext0) / 0.2);
    background: hsla(var(--surface0) / 0.5);
    color: hsl(var(--text));
    font-size: 0.95rem;
    transition: border-color 0.2s cubic-bezier(0.2, 0, 0, 1);

    &:focus {
        outline: none;
        border-color: hsl(var(--blue));
    }

    &::placeholder {
        color: hsl(var(--subtext0));
    }
}

.option-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.5rem;
}

.option-label {
    position: relative;
    padding-left: 1.8rem;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    font-size: 0.95rem;
    color: hsl(var(--subtext1));
    padding: 0.3rem 0.3rem 0.3rem 1.8rem;
    border-radius: 1rem;
    transition: background-color 0.2s;

    &:hover {
        background: hsla(var(--surface0) / 0.3);
    }
}

input[type="radio"] {
    opacity: 0;
    position: absolute;
    left: 0.3rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    margin: 0;
    z-index: 2;
    cursor: pointer;
}

.custom-radio {
    position: absolute;
    left: 0.3rem;
    top: 50%;
    transform: translateY(-50%);
    height: 1rem;
    width: 1rem;
    background: hsla(var(--surface0) / 0.7);
    border: 2px solid hsla(var(--blue) / 0.4);
    border-radius: 50%;
    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    z-index: 1;

    &:hover {
        border-color: hsl(var(--blue) / 0.6);
        background: hsl(var(--blue) / 0.1);
    }
}

input[type="radio"]:checked + .custom-radio {
    border-color: hsl(var(--blue));
    background: hsl(var(--blue));

    &::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 0.3rem;
        height: 0.3rem;
        background: hsl(var(--base));
        border-radius: 50%;
    }
}

.modal-actions {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem 1.5rem 1.5rem;
    border-top: 1px solid hsla(var(--subtext0) / 0.1);

    button {
        flex: 1;
        padding: 0.6rem 1rem;
        border-radius: 2rem;
        border: 1px solid hsla(var(--subtext0) / 0.2);
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    }

    .clear-btn {
        background: hsla(var(--surface0) / 0.5);
        color: hsl(var(--subtext1));

        &:hover {
            background: hsla(var(--surface1) / 0.7);
            border-color: hsla(var(--subtext0) / 0.3);
        }
    }

    .apply-btn {
        background: hsl(var(--blue));
        color: hsl(var(--base));
        border-color: hsl(var(--blue));

        &:hover {
            background: hsl(var(--blue) / 0.9);
            border-color: hsl(var(--blue) / 0.9);
        }
    }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
    .modal-content {
        transform: scale(0.95);
    }
}
</style>
