<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";

type Theme = (typeof themes)[number] | "system";
const themes = ["latte", "frappe", "macchiato", "mocha"] as const;
const currentTheme = ref<Theme>("mocha");

const links = ref([
	{ name: "github", url: "https://github.com/discuit-community/search" },
	{ name: "privacy", url: "/privacy", isExternal: false },
	{ name: "api docs", url: "/swagger" },
]);

function applyTheme(theme: Theme) {
	const body = document.body as HTMLBodyElement;
	if (theme === "system") {
		const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

		body.className = isDark ? "theme-mocha" : "theme-latte";
	} else {
		body.className = `theme-${theme}`;
	}
}

function setTheme(theme: Theme) {
	currentTheme.value = theme;
	localStorage.setItem("theme", theme);
	applyTheme(theme);
}

let mediaQuery: MediaQueryList | null = null;
function setupSystemThemeListener() {
	if (mediaQuery) {
		mediaQuery.removeEventListener("change", handleSystemThemeChange);
	}
	if (currentTheme.value === "system") {
		mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		mediaQuery.addEventListener("change", handleSystemThemeChange);
	}
}
function handleSystemThemeChange() {
	if (currentTheme.value === "system") {
		applyTheme("system");
	}
}

onMounted(() => {
	const saved = localStorage.getItem("theme") as Theme | null;
	if (
		(saved && (themes as readonly string[]).includes(saved)) ||
		saved === "system"
	) {
		currentTheme.value = saved;
	} else {
		currentTheme.value = "mocha";
	}
	applyTheme(currentTheme.value);
	setupSystemThemeListener();
});

watch(currentTheme, (theme) => {
	applyTheme(theme);
	setupSystemThemeListener();
});

onUnmounted(() => {
	if (mediaQuery) {
		mediaQuery.removeEventListener("change", handleSystemThemeChange);
	}
});
</script>

<template>
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
                    v-if="link.isExternal"
                    :href="link.url"
                    :target="link.isExternal ? '_blank' : '_self'"
                    rel="noopener noreferrer"
                >
                    {{ link.name }}
                </a>
                <router-link
                    v-else
                    :to="link.url"
                    :class="{ 'is-external': link.isExternal }"
                >
                    {{ link.name }}
                </router-link>
            </template>
        </div>

        <div class="footer-themes">
            <h3>themes</h3>
            <p>
                using <a href="https://catppuccin.com/">catppuccin</a>! a
                soothing pastel theme for the high-spirited.
            </p>
            <div class="themes-row">
                <button
                    v-for="theme in themes"
                    :key="theme"
                    :class="{ active: currentTheme === theme }"
                    @click="setTheme(theme)"
                >
                    <span>{{ theme }}</span>
                </button>
                <button
                    :class="{ active: currentTheme === 'system' }"
                    @click="setTheme('system')"
                >
                    <span>system</span>
                </button>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer {
    max-width: 568px;
    width: 100%;
    background: hsla(var(--mantle) / 1);
    border: 1px solid hsla(var(--subtext0) / 0.1);
    border-bottom: none;
    border-radius: 3rem 3rem 0 0;
    min-height: 5rem;
    padding: 0.75rem;
    margin: 5rem auto 0 auto;

    display: flex;
    flex-direction: column;

    color: hsl(var(--subtext1));
    gap: 1rem;

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
        font-size: 2em;
        color: hsl(var(--text));
        margin-bottom: 0.5rem;
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

    .themes-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
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
