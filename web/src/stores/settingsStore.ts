import { defineStore } from "pinia";
import { ref, watch } from "vue";

export type CommunityPrefix = "slash" | "plus";
export type Theme = "latte" | "frappe" | "macchiato" | "mocha" | "system";

export const useSettingsStore = defineStore("settings", () => {
	// --- state ---
	const communityPrefix = ref<CommunityPrefix>(
		(localStorage.getItem("communityPrefix") as CommunityPrefix) || "slash",
	);
	const instanceUrl = ref<string>(
		localStorage.getItem("instanceUrl") || "https://dsearch.wlo.moe",
	);
	const discuitProxyUrl = ref<string>(
		localStorage.getItem("proxyUrl") || "https://dproxy.wlo.moe",
	);
	const theme = ref<Theme>((localStorage.getItem("theme") as Theme) || "mocha");

	// --- actions ---
	function setCommunityPrefix(prefix: CommunityPrefix) {
		communityPrefix.value = prefix;
		localStorage.setItem("communityPrefix", prefix);
	}

	function setInstanceUrl(url: string) {
		instanceUrl.value = url;
		localStorage.setItem("instanceUrl", url);
	}

	function setDiscuitProxyUrl(url: string) {
		discuitProxyUrl.value = url;
		localStorage.setItem("proxyUrl", url);
	}

	function setTheme(newTheme: Theme) {
		theme.value = newTheme;
		localStorage.setItem("theme", newTheme);
		document.body.className =
			newTheme === "system"
				? window.matchMedia("(prefers-color-scheme: dark)").matches
					? "theme-mocha"
					: "theme-latte"
				: `theme-${newTheme}`;
	}

	watch(communityPrefix, (val) => localStorage.setItem("communityPrefix", val));
	watch(instanceUrl, (val) => localStorage.setItem("instanceUrl", val));
	watch(theme, (val) => localStorage.setItem("theme", val));
	watch(discuitProxyUrl, (val) => localStorage.setItem("proxyUrl", val));

	return {
		communityPrefix,
		instanceUrl,
		discuitProxyUrl,
		theme,
		setCommunityPrefix,
		setInstanceUrl,
		setTheme,
		setDiscuitProxyUrl,
	};
});
