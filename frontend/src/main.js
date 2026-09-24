import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import App from './App.vue';
import router from './router';
import ConfirmModal from './components/ConfirmModal.vue';
import ToastContainer from './components/ToastContainer.vue';


const app = createApp(App);
app.use(createPinia()).use(router);
app.component('ConfirmModal', ConfirmModal);
app.component('ToastContainer', ToastContainer);
app.mount('#app');
