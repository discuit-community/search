import {
	createRouter,
	createWebHistory,
	type RouteRecordRaw,
} from "vue-router";
import SearchView from "@/views/SearchView.vue";

const routes: RouteRecordRaw[] = [
	{
		path: "/",
		redirect: "/search",
	},
	{
		path: "/search",
		component: SearchView,
		meta: {
			footer: true,
		},
	},
	{
		path: "/about",
		component: () => import("@/views/AboutView.vue"),
	},
	{
		path: "/privacy",
		component: () => import("@/views/PrivacyView.vue"),
	},
	{
		path: "/settings",
		component: () => import("@/views/SettingsView.vue"),
	},
];

export default createRouter({
	history: createWebHistory(),
	routes,
});
