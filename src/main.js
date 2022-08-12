import { createApp } from "vue";
import Toast from "vue-toastification";

import App from "./App.vue";

import "./index.css";
import "vue-toastification/dist/index.css";

createApp(App)
  .use(Toast, {})
  .mount("#app");
