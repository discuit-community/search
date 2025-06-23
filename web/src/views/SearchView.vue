<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSearchStore } from "../stores/searchStore";
import PageView from "@/components/PageView.vue";
import ResultCard from "@/components/ResultCard.vue";
import FilterModal, { type FilterOptions } from "@/components/FilterModal.vue";

const route = useRoute();
const router = useRouter();
const searchStore = useSearchStore();

const showFilterModal = ref(false);

onMounted(() => {
    searchStore.query = (route.query.q as string) || "";
    searchStore.page = Number(route.query.page) || 1;

    const filters: FilterOptions = {};
    if (route.query.community)
        filters.community = route.query.community as string;
    if (route.query.username) filters.username = route.query.username as string;
    if (route.query.type)
        filters.postType = route.query.type as FilterOptions["postType"];
    if (route.query.sort) {
        const sortParam = route.query.sort as string;
        switch (sortParam) {
            case "createdAt:desc":
                filters.sortBy = "newest";
                break;
            case "createdAt:asc":
                filters.sortBy = "oldest";
                break;
            case "upvotes:desc":
                filters.sortBy = "most-upvoted";
                break;
            case "upvotes:asc":
                filters.sortBy = "least-upvoted";
                break;
            default:
                filters.sortBy = "relevance";
        }
    }
    searchStore.filters = filters;

    searchStore.search();
});

watch(
    () => [searchStore.query, searchStore.page, searchStore.filters],
    () => {
        const query: Record<string, string> = {
            q: searchStore.query,
            page: searchStore.page.toString(),
        };

        if (searchStore.filters.community) {
            query.community = searchStore.filters.community;
        }
        if (searchStore.filters.username) {
            query.username = searchStore.filters.username;
        }
        if (
            searchStore.filters.postType &&
            searchStore.filters.postType !== "all"
        ) {
            query.type = searchStore.filters.postType;
        }
        if (
            searchStore.filters.sortBy &&
            searchStore.filters.sortBy !== "relevance"
        ) {
            switch (searchStore.filters.sortBy) {
                case "newest":
                    query.sort = "createdAt:desc";
                    break;
                case "oldest":
                    query.sort = "createdAt:asc";
                    break;
                case "most-upvoted":
                    query.sort = "upvotes:desc";
                    break;
                case "least-upvoted":
                    query.sort = "upvotes:asc";
                    break;
            }
        }

        router.replace({
            path: "/search",
            query,
        });
        searchStore.search();
    },
    { deep: true },
);

watch(
    () => route.query,
    (newQuery) => {
        searchStore.query = (newQuery.q as string) || "";
        searchStore.page = Number(newQuery.page) || 1;

        const filters: FilterOptions = {};
        if (newQuery.community)
            filters.community = newQuery.community as string;
        if (newQuery.username) filters.username = newQuery.username as string;
        if (newQuery.type)
            filters.postType = newQuery.type as FilterOptions["postType"];
        if (newQuery.sort) {
            const sortParam = newQuery.sort as string;
            switch (sortParam) {
                case "createdAt:desc":
                    filters.sortBy = "newest";
                    break;
                case "createdAt:asc":
                    filters.sortBy = "oldest";
                    break;
                case "upvotes:desc":
                    filters.sortBy = "most-upvoted";
                    break;
                case "upvotes:asc":
                    filters.sortBy = "least-upvoted";
                    break;
                default:
                    filters.sortBy = "relevance";
            }
        }

        searchStore.filters = filters;
    },
);

function openFilterModal() {
    showFilterModal.value = true;
}

function closeFilterModal() {
    showFilterModal.value = false;
}

function applyFilters(filters: FilterOptions) {
    searchStore.setFilters(filters);
}
</script>

<template>
    <PageView>
        <template #header>
            <header class="header">
                <div class="header-input">
                    <input
                        type="text"
                        placeholder="search..."
                        v-model="searchStore.query"
                        @input="searchStore.page = 1"
                        class="search-input"
                    />
                    <button
                        class="filter-btn"
                        @click="openFilterModal"
                        :class="{ active: searchStore.hasActiveFilters }"
                        title="Open filters"
                        aria-label="Open filter options"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <polygon
                                points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"
                            ></polygon>
                        </svg>
                        <span
                            v-if="searchStore.hasActiveFilters"
                            class="filter-indicator"
                        ></span>
                    </button>
                </div>
            </header>
        </template>

        <div
            class="results-view"
            v-dynamic-radius
            :class="{ loading: searchStore.fetchingResults }"
        >
            <div class="results-container">
                <div
                    v-if="
                        searchStore.results.length > 0 &&
                        !searchStore.fetchingResults
                    "
                    class="results-list"
                >
                    <ResultCard
                        v-for="(result, index) in searchStore.results"
                        :key="index"
                        :result="result"
                        :index="index"
                    />
                </div>
                <p v-if="searchStore.fetchingResults" class="loading">
                    loading...
                </p>
                <p
                    v-if="
                        searchStore.results.length === 0 &&
                        searchStore.query.trim() !== '' &&
                        !searchStore.fetchingResults
                    "
                    class="no-results"
                >
                    no results found for "{{ searchStore.query }}"
                </p>
                <p
                    v-if="
                        searchStore.query.trim() === '' &&
                        !searchStore.fetchingResults
                    "
                    class="no-query"
                >
                    please enter a search term.
                </p>
                <div class="results-gradient results-gradient-top"></div>
                <div class="results-gradient results-gradient-bottom"></div>
            </div>
        </div>

        <template #footer>
            <div class="pagination">
                <button
                    :disabled="searchStore.page === 1"
                    @click="searchStore.page--"
                >
                    previous
                </button>
                <span>
                    page {{ searchStore.page }} of
                    {{
                        Math.max(
                            1,
                            Math.ceil(
                                searchStore.totalHits / searchStore.limit,
                            ),
                        )
                    }}
                </span>
                <button
                    :disabled="
                        searchStore.page >=
                        Math.ceil(searchStore.totalHits / searchStore.limit)
                    "
                    @click="searchStore.page++"
                >
                    next
                </button>
            </div>
        </template>
    </PageView>
    <teleport to="body">
        <FilterModal
            :open="showFilterModal"
            @close="closeFilterModal"
            @applyFilters="applyFilters"
        />
    </teleport>
</template>

<style scoped>
header {
    .header-input {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        gap: 0.5rem;

        input {
            flex: 1;
            padding: 1rem;
            border: 1px solid hsla(var(--subtext0) / 0.1);
            background: hsla(var(--mantle) / 1);
            color: hsl(var(--subtext1));
            border-radius: 10rem;
            text-align: center;
            font-size: 1.2rem;
            transition: 0.2s cubic-bezier(0.2, 0, 0, 1);

            &:hover {
                border-color: hsla(var(--blue) / 0.2);
                background: hsla(var(--surface0) / 0.9);
            }

            &:focus-visible {
                outline: none;
                border-color: hsla(var(--blue) / 0.5);
                background: hsla(var(--surface0) / 0.9);
            }

            &:active {
                border-color: hsla(var(--blue) / 0.3);
                background: hsla(var(--surface0) / 1);
            }
        }

        .filter-btn {
            position: relative;
            aspect-ratio: 1 / 1;
            padding: 1rem;
            border-radius: 50%;
            border: 1px solid hsla(var(--subtext0) / 0.1);
            background: hsla(var(--mantle) / 1);
            color: hsl(var(--subtext1));
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: 0.2s cubic-bezier(0.2, 0, 0, 1);

            &:hover {
                border-color: hsla(var(--blue) / 0.2);
                background: hsla(var(--surface0) / 0.9);
                color: hsl(var(--blue));
            }

            &:focus-visible {
                outline: none;
                border-color: hsla(var(--blue) / 0.5);
                background: hsla(var(--surface0) / 0.9);
                color: hsl(var(--blue));
            }

            &:active {
                border-color: hsla(var(--blue) / 0.3);
                background: hsla(var(--surface0) / 1);
                transform: scale(0.95);
            }

            &.active {
                border-color: hsla(var(--blue) / 0.5);
                background: hsla(var(--blue) / 0.1);
                color: hsl(var(--blue));

                .filter-indicator {
                    position: absolute;
                    top: 0.3rem;
                    right: 0.3rem;
                    width: 0.5rem;
                    height: 0.5rem;
                    background: hsl(var(--blue));
                    border-radius: 50%;
                    border: 2px solid hsl(var(--base));
                }
            }
        }
    }
}

.results-view {
    padding: 0.3rem;
    overflow-y: auto;
    max-height: 100%;
}

.pagination {
    margin: 0 auto;
    padding: 0.5rem;
    bottom: 0.5rem;
    z-index: 1000;

    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    transition: 0.2s cubic-bezier(0.2, 0, 0, 1);

    button {
        padding: 0.2rem 0.8rem;
        border-radius: 2rem;
        border: 1px solid hsla(var(--subtext0) / 0.1);
        background: hsla(var(--mantle) / 1);
        color: hsl(var(--subtext1));
        font-size: 1rem;
        cursor: pointer;
        transition: 0.2s cubic-bezier(0.2, 0, 0, 1);

        &:hover {
            background: hsla(var(--surface0) / 0.9);
            border-color: hsla(var(--blue) / 0.2);
        }

        &:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }

        span {
            white-space: nowrap;
            color: hsl(var(--subtext1));
        }
    }
}
</style>
