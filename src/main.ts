import { createApp } from 'vue'
import Toast from 'vue-toastification'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from "vue-router";
import "vue-toastification/dist/index.css";
import "./style.css";
import App from "./App.vue";

// Define routes
const routes = [
    {
        path: "/",
        redirect: "/convert",
    },
    {
        path: "/convert",
        name: "Convert",
        component: () => import("./views/MainView.vue"),
    },
    {
        path: "/create",
        name: "Create",
        component: () => import("./views/MainView.vue"),
    },
];

// Create router instance
const router = createRouter({
    history: createWebHistory(),
    routes,
});

const app = createApp(App)
app.use(createPinia())
app.use(router);
app.use(Toast, {
  position: 'top-right',
  timeout: 2000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: false,
  icon: true,
  rtl: false
})
app.mount('#app')