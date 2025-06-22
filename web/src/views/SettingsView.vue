<script setup lang="ts">
import PageView from "@/components/PageView.vue";
import {
    useSettingsStore,
    type Theme,
    type CommunityPrefix,
} from "@/stores/settingsStore";

const settings = useSettingsStore();

const themes: Theme[] = ["latte", "frappe", "macchiato", "mocha", "system"];
const communityPrefixes: { label: string; value: CommunityPrefix }[] = [
    { label: "d/", value: "slash" },
    { label: "+", value: "plus" },
];

function handleThemeChange(theme: Theme) {
    settings.setTheme(theme);
}

function handlePrefixChange(prefix: CommunityPrefix) {
    settings.setCommunityPrefix(prefix);
}

function handleInstanceUrlChange(e: Event) {
    const target = e.target as HTMLInputElement;
    settings.setInstanceUrl(target.value);
}

function handleDiscuitProxyUrlChange(e: Event) {
    const target = e.target as HTMLInputElement;
    settings.setDiscuitProxyUrl(target.value);
}
</script>

<template>
    <PageView>
        <template #header>
            <h1>settings</h1>
        </template>
        <div class="settings-content">
            <section>
                <h2>theme</h2>
                <p class="hint">
                    choose your catppuccin flavor or follow your system theme.
                </p>
                <div class="theme-row">
                    <button
                        v-for="theme in themes"
                        :key="theme"
                        :class="{ active: settings.theme === theme }"
                        @click="handleThemeChange(theme)"
                    >
                        {{ theme }}
                    </button>
                </div>
            </section>

            <section>
                <h2>community prefix</h2>
                <p class="hint">
                    how should communities be shown? (e.g.
                    <span class="mono">d/cats</span> or
                    <span class="mono">+cats</span>)
                </p>
                <div class="prefix-row">
                    <label
                        v-for="prefix in communityPrefixes"
                        :key="prefix.value"
                        class="prefix-label"
                    >
                        <input
                            type="radio"
                            name="communityPrefix"
                            :value="prefix.value"
                            v-model="settings.communityPrefix"
                            @change="handlePrefixChange(prefix.value)"
                        />
                        <span class="custom-radio"></span>
                        {{ prefix.label }}
                    </label>
                </div>
            </section>

            <section>
                <h2>instance url</h2>
                <p class="hint">
                    set the api endpoint for search
                    <span class="warn"
                        >(only change this if you know what you're doing)</span
                    >
                </p>
                <input
                    type="text"
                    v-model="settings.instanceUrl"
                    @input="handleInstanceUrlChange"
                    class="instance-url-input"
                    spellcheck="false"
                    autocapitalize="off"
                    autocomplete="off"
                />
            </section>

            <section>
                <h2>instance url</h2>
                <p class="hint">
                    set the discuit proxy endpoint
                    <span class="warn"
                        >(only change this if you know what you're doing)</span
                    >
                </p>
                <input
                    type="text"
                    v-model="settings.discuitProxyUrl"
                    @input="handleDiscuitProxyUrlChange"
                    class="proxy-url-input"
                    spellcheck="false"
                    autocapitalize="off"
                    autocomplete="off"
                />
            </section>
        </div>
    </PageView>
</template>

<style scoped lang="scss">
.settings-content {
    max-width: 568px;
    margin: 0 auto 0 auto;
    padding: 0.3rem;
    color: hsl(var(--subtext1));
    font-size: 1.05em;
    line-height: 1.7;
    padding-bottom: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

section {
    background: hsla(var(--mantle) / 1);
    border-radius: 2.7rem;
    padding: 1.5rem 1rem;
    box-shadow: 0 2px 8px hsla(var(--crust) / 0.04);
    border: 1px solid hsla(var(--subtext0) / 0.08);

    h2 {
        text-transform: lowercase;
        font-family: inherit;
        font-weight: 700;
        letter-spacing: 0.01em;
        margin-bottom: 0.5em;
        color: hsl(var(--mauve));
        font-size: 1.2em;
    }

    .hint {
        font-size: 0.98em;
        color: hsl(var(--subtext1));
        margin-bottom: 1rem;
        margin-top: -0.5rem;

        .warn {
            color: hsl(var(--yellow));
            font-size: 0.97em;
            font-style: italic;
            margin-top: 0.2em;
            opacity: 0.85;
            letter-spacing: 0.01em;
        }
    }

    .theme-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;

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
            text-transform: lowercase;
            transition:
                background 0.2s cubic-bezier(0.2, 0, 0, 1),
                border-color 0.2s cubic-bezier(0.2, 0, 0, 1),
                color 0.2s cubic-bezier(0.2, 0, 0, 1);

            &.active,
            &[aria-current="true"] {
                background: hsla(var(--blue) / 0.12);
                border-color: hsla(var(--blue) / 0.5);
                color: hsl(var(--blue));
            }
            &:hover {
                background: hsla(var(--surface0) / 0.9);
                border-color: hsla(var(--blue) / 0.2);
                color: hsl(var(--blue));
            }
        }
    }

    .prefix-row {
        display: flex;
        gap: 1.5rem;

        .prefix-label {
            position: relative;
            padding-left: 2rem;
            cursor: pointer;
            user-select: none;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1.1em;
            text-transform: lowercase;
        }
    }

    .mono {
        font-family: "JetBrains Mono", "Fira Mono", "Consolas", monospace;
        background: hsla(var(--surface1) / 0.7);
        border-radius: 0.3em;
        padding: 0.1em 0.4em;
        font-size: 0.98em;
        color: hsl(var(--text));
    }
}

input[type="text"] {
    width: 100%;
    padding: 0.5rem 1rem;
    border-radius: 5rem;
    border: 1px solid hsla(var(--subtext0) / 0.2);
    background: hsla(var(--surface0) / 0.5);
    color: hsl(var(--text));
    font-size: 1em;
    margin-top: 0.5rem;
    transition: border-color 0.2s cubic-bezier(0.2, 0, 0, 1);

    &:focus {
        outline: none;
        border-color: hsl(var(--blue));
    }
}

input[type="radio"] {
    opacity: 0;
    position: absolute;
    left: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1.2rem;
    height: 1.2rem;
    margin: 0;
    z-index: 2;
    cursor: pointer;
}

.custom-radio {
    position: absolute;
    left: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    height: 1.2rem;
    width: 1.2rem;
    background: hsla(var(--surface0) / 0.7);
    border: 2px solid hsla(var(--blue) / 0.4);
    border-radius: 50%;
    transition:
        border-color 0.2s,
        box-shadow 0.2s;
    z-index: 1;
    transition:
        background 0.2s cubic-bezier(0.2, 0, 0, 1),
        border-color 0.2s cubic-bezier(0.2, 0, 0, 1),
        box-shadow 0.2s cubic-bezier(0.2, 0, 0, 1);

    &:hover {
        border-color: hsl(var(--blue) / 0.6);
        background: hsl(var(--blue) / 0.8);
        box-shadow: 0 0 0.2rem hsla(var(--blue) / 0.3);
    }
}

input[type="radio"]:hover + .custom-radio {
    background: hsl(var(--blue) / 0.6);
    box-shadow: 0 0 0.2rem hsla(var(--blue) / 0.3);
}

input[type="radio"]:checked + .custom-radio {
    border-color: hsl(var(--blue));
    background: hsl(var(--blue) / 0.8);
    opacity: 1;
}
</style>
