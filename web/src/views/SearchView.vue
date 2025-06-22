<script lang="ts" setup>
import { onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useSearchStore } from "../stores/searchStore";
import PageView from "@/components/PageView.vue";
import ResultCard from "@/components/ResultCard.vue";

const route = useRoute();
const router = useRouter();
const searchStore = useSearchStore();

onMounted(() => {
    searchStore.query = (route.query.q as string) || "";
    searchStore.page = Number(route.query.page) || 1;
    searchStore.search();
});

watch(
    () => [searchStore.query, searchStore.page],
    () => {
        router.replace({
            path: "/search",
            query: { q: searchStore.query, page: searchStore.page },
        });
        searchStore.search();
    },
);

watch(
    () => route.query,
    (newQuery) => {
        searchStore.query = (newQuery.q as string) || "";
        searchStore.page = Number(newQuery.page) || 1;
    },
);
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
</template>

<style scoped>
header {
    .header-input {
        display: flex;
        justify-content: center;
        gap: 0.1rem;

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
    }

    .header-row {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin-top: 0.5rem;

        button {
            padding: 0.25rem 0.5rem;
            border: none;
            border-radius: 5rem;
            font-size: 1.1rem;
            background: hsla(var(--mantle) / 1);
            color: hsl(var(--subtext0));
            border: 1px solid hsla(var(--subtext0) / 0.1);
            cursor: pointer;
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
