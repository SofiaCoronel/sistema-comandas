import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

import NuevaComanda from '../views/NuevaComanda.vue';
import Login from '../views/Login.vue';
import Historial from '../views/Historial.vue';
import Catalogo from '../views/Catalogo.vue';
import Configuracion from '../views/Configuracion.vue';
import Caja from '../views/Caja.vue';


const routes = [
  { path: '/', component: NuevaComanda },
  { path: '/login', component: Login },
  { path: '/historial', component: Historial, meta: { requiresAuth: true } },
  { path: '/catalogo', component: Catalogo, meta: { requiresAuth: true } },
  { path: '/configuracion', component: Configuracion, meta: { requiresAuth: true } },
  { path: '/caja', component: Caja, meta: { requiresAuth: true } },
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.token) next('/login');
  else next();
});

export default router;