<template>
  <h3>Historial (últimos 60 días)</h3>
  <table class="table table-striped">
    <thead>
      <tr><th>#</th><th>Cliente</th><th>Celular</th><th>Total</th><th>Estado</th><th>Fecha</th><th></th></tr>
    </thead>
    <tbody>
      <tr v-for="c in comandas" :key="c.id">
        <td>{{ c.id }}</td>
        <td>{{ c.cliente_nombre }}</td>
        <td>{{ c.cliente_celular }}</td>
        <td>${{ c.total }}</td>
        <td>{{ c.estado }}</td>
        <td>{{ new Date(c.creado_en).toLocaleString('es-AR') }}</td>
        <td><button class="btn btn-sm btn-secondary" @click="reimprimir(c.id)">Reimprimir</button></td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { API_URL, useAuthStore } from '../stores/auth';

const comandas = ref([]);
const auth = useAuthStore();

onMounted(cargar);

async function cargar() {
  const { data } = await axios.get(`${API_URL}/comandas`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  comandas.value = data;
}

async function reimprimir(id) {
  await axios.post(`${API_URL}/comandas/${id}/reimprimir`, {}, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
}
</script>