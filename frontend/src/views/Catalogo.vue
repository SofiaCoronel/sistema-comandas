<template>
  <h3>Catálogo de Productos</h3>

  <form class="row g-2 mb-4" @submit.prevent="guardar">
    <div class="col-md-3"><input v-model="form.nombre" class="form-control" placeholder="Nombre" required /></div>
    <div class="col-md-3"><input v-model="form.categoria" class="form-control" placeholder="Categoría" required /></div>
    <div class="col-md-2"><input v-model.number="form.precio" type="number" class="form-control" placeholder="Precio $" required /></div>
    <div class="col-md-3"><input v-model="form.descripcion" class="form-control" placeholder="Descripción" /></div>
    <div class="col-md-1"><button class="btn btn-primary w-100">{{ editando ? 'Editar' : 'Agregar' }}</button></div>
  </form>

  <table class="table">
    <thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th></th></tr></thead>
    <tbody>
      <tr v-for="p in productos" :key="p.id">
        <td>{{ p.nombre }}</td>
        <td>{{ p.categoria }}</td>
        <td>${{ p.precio }}</td>
        <td>
          <button class="btn btn-sm btn-warning" @click="editar(p)">Editar</button>
          <button class="btn btn-sm btn-danger" @click="eliminar(p.id)">Eliminar</button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { API_URL, useAuthStore } from '../stores/auth';

const productos = ref([]);
const auth = useAuthStore();
const editando = ref(null);
const form = ref({ nombre: '', categoria: '', precio: 0, descripcion: '' });
const headers = { Authorization: `Bearer ${auth.token}` };

onMounted(cargar);

async function cargar() {
  const { data } = await axios.get(`${API_URL}/catalogo`);
  productos.value = data;
}

async function guardar() {
  if (editando.value) {
    await axios.put(`${API_URL}/catalogo/${editando.value}`, { ...form.value, activo: true }, { headers });
  } else {
    await axios.post(`${API_URL}/catalogo`, form.value, { headers });
  }
  form.value = { nombre: '', categoria: '', precio: 0, descripcion: '' };
  editando.value = null;
  cargar();
}

function editar(p) {
  form.value = { ...p };
  editando.value = p.id;
}

async function eliminar(id) {
  if (confirm('¿Eliminar producto?')) {
    await axios.delete(`${API_URL}/catalogo/${id}`, { headers });
    cargar();
  }
}
</script>