<template>
  <nav class="navbar navbar-dark bg-dark px-3">
    <span class="navbar-brand">🍔 Comandas</span>
    <div class="d-flex gap-2">
      <router-link to="/" class="btn btn-sm btn-outline-light">Nueva Comanda</router-link>
      <router-link v-if="auth.token" to="/historial" class="btn btn-sm btn-outline-light">Historial</router-link>
      <router-link v-if="auth.token" to="/catalogo" class="btn btn-sm btn-outline-light">Catálogo</router-link>
      <button v-if="auth.token" class="btn btn-sm btn-outline-danger" @click="salir">Salir</button>
      <router-link v-else to="/login" class="btn btn-sm btn-outline-warning">Admin</router-link>
    </div>
  </nav>
  <div class="container py-4">
    <router-view />
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

function salir() {
  auth.logout();
  router.push('/login');
}
</script>