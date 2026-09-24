<template>
  <h3 class="section-title mb-3">Pedidos</h3>

  <div class="historial-header mb-3">
    <div class="d-flex gap-2 align-items-center flex-wrap">
      <div>
        <label class="form-label">📅 Buscar por día</label>
        <input v-model="fechaBusqueda" type="date" class="input-fecha" @change="cargar" />
      </div>

      <button v-if="fechaBusqueda" class="btn-limpiar" @click="limpiarFecha">
        ✕ Volver al día actual
      </button>

      <button class="btn-entregar-todos" @click="marcarTodosEntregados">
        ✅ Marcar todos como entregados
      </button>

      <router-link to="/estadisticas" class="btn-stats">
        📊 Estadísticas
      </router-link>
    </div>
  </div>

  <input v-model="busqueda" class="buscador mb-3" placeholder="🔍 Buscar por nombre, dirección, celular o total..." />

  <div class="btn-group mb-3">
    <button v-for="f in filtros" :key="f.valor" class="tab-btn" :class="{ active: filtroActivo === f.valor }"
      @click="filtroActivo = f.valor">
      {{ f.label }}
    </button>
  </div>

  <div v-if="comandasFiltradas.length === 0" class="text-muted">
    No hay pedidos para mostrar.
  </div>

  <div class="row g-3">
    <div v-for="c in comandasFiltradas" :key="c.id" class="col-md-4">
      <div class="card shadow-sm h-100">
        <div class="card-body d-flex flex-column">

          <!-- Header -->
          <div class="d-flex justify-content-between align-items-start mb-1">
            <h6 class="card-title mb-0">
              #{{ c.id }} — {{ c.cliente_nombre }}
            </h6>

            <span class="badge-estado" :class="{
              'badge-pendiente': c.estado === 'pendiente',
              'badge-proceso': c.estado === 'en_proceso',
              'badge-entregado': c.estado === 'entregado',
              'badge-cancelado': c.estado === 'cancelado',
            }">
              {{ c.estado }}
            </span>
          </div>

          <!-- Fecha y tiempo transcurrido -->
          <div class="fecha-row">
            <small class="text-muted">
              {{ new Date(c.creado_en).toLocaleString('es-AR') }}
            </small>

            <span class="time-ago">
              {{ timeAgo(c.creado_en) }}
            </span>
          </div>

          <p class="mb-1">
            📍 {{ c.cliente_direccion || '-' }}
          </p>

          <p class="mb-1">
            📞 {{ c.cliente_celular || '-' }}
          </p>

          <p class="fw-bold mb-3">
            Total: ${{ Number(c.total).toLocaleString('es-AR') }}
          </p>

          <!-- Botones de estado -->
          <div class="d-flex gap-1 flex-wrap mb-2">
            <button class="btn-accion btn-proceso" @click="cambiarEstado(c, 'en_proceso')">
              En proceso
            </button>

            <button class="btn-accion btn-entregado" @click="cambiarEstado(c, 'entregado')">
              Entregado
            </button>

            <button class="btn-accion btn-cancelado" @click="cambiarEstado(c, 'cancelado')">
              Cancelado
            </button>
          </div>

          <!-- Botones secundarios -->
          <div class="d-flex gap-1 mt-auto">
            <button class="btn-secundario flex-1" @click="verDetalle(c)">
              🔍 Ver detalle
            </button>

            <button class="btn-secundario flex-1" @click="reimprimir(c.id)">
              🖨️ Reimprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal detalle -->
  <div v-if="detalle" class="modal-overlay" @click.self="detalle = null">
    <div class="modal-box">

      <div class="modal-header">
        <h5>
          Detalle — Pedido #{{ detalle.comanda.id }}
        </h5>

        <button class="modal-close" @click="detalle = null">
          ✕
        </button>
      </div>

      <div class="modal-body">
        <p>
          <strong>Cliente:</strong>
          {{ detalle.comanda.cliente_nombre }}
        </p>

        <p>
          <strong>Teléfono:</strong>
          {{ detalle.comanda.cliente_celular || '-' }}
        </p>

        <p>
          <strong>Dirección:</strong>
          {{ detalle.comanda.cliente_direccion || '-' }}
        </p>

        <p>
          <strong>Fecha:</strong>
          {{ new Date(detalle.comanda.creado_en).toLocaleString('es-AR') }}
        </p>

        <p>
          <strong>Entrega:</strong>
          {{
            detalle.comanda.tipo_entrega === 'domicilio'
              ? '🛵 Envío a domicilio'
              : '🏪 Retiro en tienda'
          }}
          —
          {{
            detalle.comanda.envio_pagado
              ? '✅ Pagado'
              : detalle.comanda.tipo_entrega === 'domicilio'
                ? '💵 Pagado'
                : '💵 Pagado al retirar'
          }}
        </p>

        <hr />

        <table class="tabla-detalle">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="it in detalle.items" :key="it.id">
              <td>{{ it.nombre_producto }}</td>
              <td>{{ it.cantidad }}</td>
              <td>
                ${{ Number(it.subtotal).toLocaleString('es-AR') }}
              </td>
            </tr>
          </tbody>
        </table>

        <hr />

        <div class="detalle-totales">
          <div class="detalle-fila">
            <span>Subtotal productos</span>
            <span>
              ${{ subtotalProductos.toLocaleString('es-AR') }}
            </span>
          </div>

          <div v-if="detalle.comanda.tipo_entrega === 'domicilio'" class="detalle-fila">
            <span>Envío</span>
            <span>
              ${{
                Number(
                  detalle.comanda.costo_envio || 0
                ).toLocaleString('es-AR')
              }}
            </span>
          </div>

          <div class="detalle-fila total">
            <span>Total</span>
            <span>
              ${{ Number(detalle.comanda.total).toLocaleString('es-AR') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { API_URL, useAuthStore } from '../stores/auth';
import { useWsStore } from '../stores/ws';
import { useConfirm } from '../composables/useConfirm';
import { useToast } from '../composables/useToast';
import { useTimeAgo } from '../composables/useTimeAgo';

const { confirmar } = useConfirm();
const { success, error } = useToast();
const { timeAgo } = useTimeAgo();

const auth = useAuthStore();
const wsStore = useWsStore();
const headers = { Authorization: `Bearer ${auth.token}` };

const comandas = ref([]);
const filtroActivo = ref('todos');
const busqueda = ref('');
const detalle = ref(null);
const fechaBusqueda = ref('');
const resumen = ref({ pedidos_hoy: 0, ventas_hoy: 0, cancelados_hoy: 0 });


const filtros = [
  { label: 'Todos', valor: 'todos' },
  { label: 'Pendientes', valor: 'pendiente' },
  { label: 'En proceso', valor: 'en_proceso' },
  { label: 'Entregados', valor: 'entregado' },
  { label: 'Cancelados', valor: 'cancelado' },
];

const comandasFiltradas = computed(() => {
  let resultado = filtroActivo.value === 'todos'
    ? comandas.value
    : comandas.value.filter((c) => c.estado === filtroActivo.value);

  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase().trim();
    resultado = resultado.filter((c) =>
      c.cliente_nombre?.toLowerCase().includes(q) ||
      c.cliente_direccion?.toLowerCase().includes(q) ||
      c.cliente_celular?.includes(q) ||
      String(c.total).includes(q)
    );
  }
  return resultado;
});

const subtotalProductos = computed(() => {
  if (!detalle.value) return 0;
  return detalle.value.items.reduce((acc, it) => acc + Number(it.subtotal), 0);
});

let intervaloTiempo = null;

onMounted(() => {
  cargar();

  wsStore.on('nueva_comanda', (msg) => {
    comandas.value.unshift(msg.comanda);
  });

  wsStore.on('estado_actualizado', (msg) => {
    const idx = comandas.value.findIndex((c) => c.id === msg.comanda.id);
    if (idx !== -1) comandas.value[idx] = msg.comanda;
  });

  // Actualizar tiempo relativo cada 60 segundos
  intervaloTiempo = setInterval(() => {
    comandas.value = [...comandas.value];
  }, 60000);
});

onUnmounted(() => {
  clearInterval(intervaloTiempo);
  cargarResumen();
});

async function cargar() {
  const params = fechaBusqueda.value ? { fecha: fechaBusqueda.value } : {};
  const { data } = await axios.get(`${API_URL}/comandas`, { headers, params });
  comandas.value = data;
}

function limpiarFecha() {
  fechaBusqueda.value = '';
  cargar();
}

async function cambiarEstado(c, estado) {
  await axios.patch(`${API_URL}/comandas/${c.id}/estado`, { estado }, { headers });
  success(`Pedido #${c.id} marcado como ${estado}`);
}

async function verDetalle(c) {
  const { data } = await axios.get(`${API_URL}/comandas/${c.id}`, { headers });
  detalle.value = data;
}

async function reimprimir(id) {
  try {
    await axios.post(`${API_URL}/comandas/${id}/reimprimir`, {}, { headers });
    success('Reimprimiendo...');
  } catch {
    error('Error al reimprimir. Verificá que el Print Agent esté corriendo.');
  }
}

async function marcarTodosEntregados() {
  const ok = await confirmar({
    t: '¿Marcar todos como entregados?',
    m: 'Todos los pedidos pendientes y en proceso pasarán a estado "entregado".',
    label: '✅ Confirmar',
    tipo: 'success',
  });
  if (!ok) return;
  const pendientes = comandas.value.filter((c) => c.estado !== 'entregado' && c.estado !== 'cancelado');
  await Promise.all(
    pendientes.map((c) =>
      axios.patch(`${API_URL}/comandas/${c.id}/estado`, { estado: 'entregado' }, { headers })
    )
  );
  success('Todos los pedidos marcados como entregados');
  await cargar();
}

async function cargarResumen() {
  const { data } = await axios.get(`${API_URL}/estadisticas/resumen`, { headers });
  resumen.value = data;
}


</script>

<style scoped>
.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a2e;
}

.historial-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.form-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #6c757d;
  display: block;
  margin-bottom: 4px;
}

.fecha-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.time-ago {
  font-size: 0.75rem;
  font-weight: 600;
  color: #E63946;
  background: #fff5f5;
  padding: 2px 8px;
  border-radius: 10px;
}

.input-fecha {
  padding: 8px 12px;
  border: 1.5px solid #dee2e6;
  border-radius: 7px;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  outline: none;
}

.input-fecha:focus {
  border-color: #E63946;
}

.btn-stats {
  padding: 8px 14px;
  border: 1.5px solid #7dd3fc;
  border-radius: 7px;
  background: #e0f2fe;
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  color: #0369a1;
  margin-top: 18px;
  text-decoration: none;
  transition: all 0.15s;
  display: inline-block;
}
.btn-stats:hover { background: #bae6fd; }

.btn-limpiar {
  padding: 8px 12px;
  border: 1.5px solid #dee2e6;
  border-radius: 7px;
  background: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  cursor: pointer;
  color: #6c757d;
  margin-top: 18px;
}

.btn-limpiar:hover {
  border-color: #1a1a2e;
  color: #1a1a2e;
}

.btn-entregar-todos {
  padding: 8px 14px;
  border: 1.5px solid #6ee7b7;
  border-radius: 7px;
  background: #d1fae5;
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  color: #065f46;
  margin-top: 18px;
  transition: all 0.15s;
}

.btn-entregar-todos:hover {
  background: #a7f3d0;
}

.buscador {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #dee2e6;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
}

.buscador:focus {
  border-color: #E63946;
}

.btn-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 7px 14px;
  border: 1.5px solid #dee2e6;
  border-radius: 8px;
  background: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.15s;
}

.tab-btn.active {
  border-color: #E63946;
  background: #fff5f5;
  color: #E63946;
  font-weight: 600;
}

.badge-estado {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
}

.badge-pendiente {
  background: #fff3cd;
  color: #856404;
}

.badge-proceso {
  background: #cff4fc;
  color: #055160;
}

.badge-entregado {
  background: #d1fae5;
  color: #065f46;
}

.badge-cancelado {
  background: #fee2e2;
  color: #991b1b;
}

.btn-accion {
  flex: 1;
  padding: 6px 8px;
  border-radius: 6px;
  border: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-proceso {
  background: #cff4fc;
  color: #055160;
}

.btn-proceso:hover {
  background: #a5e7f8;
}

.btn-entregado {
  background: #d1fae5;
  color: #065f46;
}

.btn-entregado:hover {
  background: #a7f3d0;
}

.btn-cancelado {
  background: #fee2e2;
  color: #991b1b;
}

.btn-cancelado:hover {
  background: #fecaca;
}

.btn-secundario {
  padding: 6px 10px;
  border: 1.5px solid #dee2e6;
  border-radius: 6px;
  background: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  color: #1a1a2e;
  text-align: center;
}

.btn-secundario:hover {
  border-color: #1a1a2e;
}

.flex-1 {
  flex: 1;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-box {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  color: #6c757d;
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  margin-bottom: 6px;
  font-size: 0.9rem;
}

.tabla-detalle {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  margin: 12px 0;
}

.tabla-detalle th {
  text-align: left;
  padding: 6px 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6c757d;
  border-bottom: 2px solid #e9ecef;
}

.tabla-detalle td {
  padding: 7px 8px;
  border-bottom: 1px solid #f1f3f5;
}

.detalle-totales {
  margin-top: 8px;
}

.detalle-fila {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  font-size: 0.9rem;
}

.detalle-fila.total {
  border-top: 2px solid #1a1a2e;
  margin-top: 6px;
  padding-top: 8px;
  font-weight: 700;
  font-size: 1rem;
}

.mb-1 {
  margin-bottom: 4px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mt-auto {
  margin-top: auto;
}

.fw-bold {
  font-weight: 700;
}

.text-muted {
  color: #6c757d;
}

.gap-1 {
  gap: 6px;
}

.d-flex {
  display: flex;
}

.flex-wrap {
  flex-wrap: wrap;
}

.h-100 {
  height: 100%;
}

.flex-column {
  flex-direction: column;
}
</style>