<template>
  <h3 class="mb-3">Nueva Comanda</h3>

  <div class="row">
    <div class="col-md-4 mb-3">
      <input v-model="cliente_nombre" class="form-control mb-2" placeholder="Nombre del cliente" />
      <input v-model="cliente_direccion" class="form-control mb-2" placeholder="Dirección" />
      <input v-model="cliente_celular" class="form-control mb-2" placeholder="Celular" />
      <textarea v-model="notas" class="form-control" placeholder="Notas (opcional)"></textarea>
    </div>

    <div class="col-md-8">
      <div v-for="cat in categorias" :key="cat" class="mb-3">
        <h6 class="text-muted">{{ cat }}</h6>
        <div class="row g-2">
          <div v-for="p in productosPorCategoria(cat)" :key="p.id" class="col-6 col-lg-4">
            <button class="btn btn-outline-secondary w-100 text-start" @click="agregarItem(p)">
              {{ p.nombre }}<br /><small>${{ p.precio }}</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <hr />

  <h5>Pedido</h5>
  <table class="table table-sm">
    <tbody>
      <tr v-for="(it, i) in items" :key="i">
        <td>
          <input type="number" v-model.number="it.cantidad" min="1" class="form-control form-control-sm" style="width:70px" />
        </td>
        <td>{{ it.nombre_producto }}</td>
        <td>${{ (it.precio_unitario * it.cantidad).toFixed(2) }}</td>
        <td><button class="btn btn-sm btn-danger" @click="items.splice(i,1)">X</button></td>
      </tr>
    </tbody>
  </table>

  <h5 class="text-end">Total: ${{ total.toFixed(2) }}</h5>

  <div v-if="mensaje" class="alert alert-success">{{ mensaje }}</div>
  <button class="btn btn-success w-100" :disabled="enviando" @click="confirmar">
    {{ enviando ? 'Enviando...' : 'Confirmar e Imprimir' }}
  </button>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { API_URL } from '../stores/auth';

const productos = ref([]);
const items = ref([]);
const cliente_nombre = ref('');
const cliente_direccion = ref('');
const cliente_celular = ref('');
const notas = ref('');
const enviando = ref(false);
const mensaje = ref('');

onMounted(async () => {
  const { data } = await axios.get(`${API_URL}/catalogo`);
  productos.value = data;
});

const categorias = computed(() => [...new Set(productos.value.map((p) => p.categoria))]);
function productosPorCategoria(cat) {
  return productos.value.filter((p) => p.categoria === cat);
}

function agregarItem(p) {
  const existente = items.value.find((it) => it.producto_id === p.id);
  if (existente) existente.cantidad++;
  else items.value.push({ producto_id: p.id, nombre_producto: p.nombre, precio_unitario: p.precio, cantidad: 1 });
}

const total = computed(() => items.value.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0));

async function confirmar() {
  if (!cliente_nombre.value || items.value.length === 0) {
    alert('Completá el nombre del cliente y al menos un producto');
    return;
  }
  enviando.value = true;
  try {
    await axios.post(`${API_URL}/comandas`, {
      cliente_nombre: cliente_nombre.value,
      cliente_direccion: cliente_direccion.value,
      cliente_celular: cliente_celular.value,
      notas: notas.value,
      items: items.value,
    });
    mensaje.value = 'Comanda enviada e impresa correctamente';
    items.value = [];
    cliente_nombre.value = '';
    cliente_direccion.value = '';
    cliente_celular.value = '';
    notas.value = '';
    setTimeout(() => (mensaje.value = ''), 3000);
  } catch (e) {
    alert('Error al enviar la comanda');
  } finally {
    enviando.value = false;
  }
}
</script>