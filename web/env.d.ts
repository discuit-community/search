/// <reference types="vite/client" />

declare module "*.vue" {
	import type { DefineComponent } from "vue";
	const component: DefineComponent<{}, {}, any>;
	export default component;
}

interface HTMLElement {
	__dynamicRadiusUpdate__?: () => void;
	__dynamicRadiusObserver__?: MutationObserver;
}
