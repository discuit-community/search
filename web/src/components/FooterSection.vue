<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import NavigationRow from "./NavigationRow.vue";

type Theme = (typeof themes)[number] | "system";
const themes = ["latte", "frappe", "macchiato", "mocha"] as const;
const currentTheme = ref<Theme>("mocha");

const links = ref([
	{ name: "github", url: "https://github.com/discuit-community/search" },
	{ name: "privacy", url: "/privacy", isInternal: true },
	{ name: "api docs", url: "/swagger" },
]);
</script>

<template>
    <NavigationRow />
    <footer class="footer">
        <div class="footer-text">
            <h2>discuit search</h2>
            <p>
                a free and open source search api for discuit.org, built with
                meilisearch, elysia & typescript, and alpine.js.
            </p>
            <p>made with love by <a href="https://wlo.moe/">willow</a>.</p>
        </div>

        <div class="footer-links">
            <template v-for="link in links" :key="link.name">
                <a
                    v-if="!link.isInternal"
                    :href="link.url"
                    :target="link.isInternal ? '_self' : '_blank'"
                    rel="noopener noreferrer"
                >
                    {{ link.name }}
                </a>
                <router-link
                    v-else
                    :to="link.url"
                    :class="{ 'is-external': !link.isInternal }"
                >
                    {{ link.name }}
                </router-link>
            </template>
        </div>
    </footer>
</template>

<style scoped>
.footer {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    max-width: 568px;
    width: 100%;
    background: hsla(var(--mantle) / 1);
    min-height: 5rem;
    padding: 0.75rem;
    border-radius: 3rem;
    margin: 1rem auto 0 auto;

    border-radius: 3rem 3rem 0 0;
    border: 1px solid hsla(var(--subtext0) / 0.1);
    border-bottom: none;

    color: hsl(var(--subtext1));

    a {
        color: hsl(var(--blue));
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s cubic-bezier(0.2, 0, 0, 1);

        &:hover {
            color: hsl(var(--blue) / 0.8);
        }
    }
}

.footer-text {
    text-align: left;
    padding-bottom: 1rem;
    border-bottom: 1px solid hsla(var(--subtext0) / 0.1);
    h2 {
        font-size: 2.25em;
        color: hsl(var(--text));
        margin-bottom: 0;
        font-weight: 900;
    }
}

.footer-links {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;

    padding-bottom: 1rem;
    border-bottom: 1px solid hsla(var(--subtext0) / 0.1);
}

.footer-themes {
    h3 {
        font-size: 1.2em;
        color: hsl(var(--subtext1));
        font-weight: 600;
        letter-spacing: 0.02em;
    }

    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    p {
        font-size: 0.98em;
        color: hsl(var(--subtext1));
        margin-top: 0;
        a {
            color: hsl(var(--mauve));
            text-decoration: underline;
            font-weight: 500;
            transition: color 0.2s cubic-bezier(0.2, 0, 0, 1);
            &:hover {
                color: hsl(var(--blue));
            }
        }
    }

    button {
        flex: 1;
        padding: 0.25rem 1.2rem;
        border-radius: 2rem;
        border: 1px solid hsla(var(--subtext0) / 0.1);
        background: hsla(var(--mantle) / 1);
        color: hsl(var(--subtext1));
        font-size: 1em;
        cursor: pointer;
        font-family: inherit;
        transition:
            background 0.2s cubic-bezier(0.2, 0, 0, 1),
            border-color 0.2s cubic-bezier(0.2, 0, 0, 1),
            color 0.2s cubic-bezier(0.2, 0, 0, 1);

        &:hover {
            background: hsla(var(--surface0) / 0.9);
            border-color: hsla(var(--blue) / 0.2);
            color: hsl(var(--blue));
        }

        &:focus-visible {
            outline: none;
            border-color: hsla(var(--blue) / 0.5);
            background: hsla(var(--surface0) / 0.9);
            color: hsl(var(--blue));
        }

        &:active {
            background: hsla(var(--surface0) / 1);
            border-color: hsla(var(--blue) / 0.3);
            color: hsl(var(--blue));
        }

        &.active,
        &[aria-current="true"] {
            background: hsla(var(--blue) / 0.12);
            border-color: hsla(var(--blue) / 0.5);
            color: hsl(var(--blue));
        }
    }
}
</style>
