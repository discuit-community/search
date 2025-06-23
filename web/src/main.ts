import "./assets/main.css";
import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import dynamicRadius from "./directives/dynamicRadius";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.directive("dynamic-radius", dynamicRadius);

app.mount("#app");
