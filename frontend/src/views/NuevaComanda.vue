<template>
  <div class="comanda-layout">
    <!-- Columna izquierda: formulario + catálogo -->
    <div class="col-catalogo">
      <div class="card p-3 mb-3">
        <h2 class="section-title mb-3">Nuevo Pedido</h2>
        <div v-if="!cajaAbierta" class="alerta-caja">
          ⚠️ La tienda está cerrada. Abrila en <router-link to="/caja">Caja</router-link> antes de tomar pedidos.
        </div>

        <!-- Buscador de clientes frecuentes -->
        <div class="full mb-3" style="position:relative">
          <label class="form-label">🔍 Buscar cliente frecuente</label>
          <input v-model="busqueda_cliente" class="input" placeholder="Nombre o teléfono..." @input="buscarCliente"
            autocomplete="off" />
          <div v-if="clientes_sugeridos.length" class="sugerencias">
            <div v-for="c in clientes_sugeridos" :key="c.id" class="sugerencia-cliente" @click="seleccionarCliente(c)">
              <div class="cliente-nombre">{{ c.nombre }}</div>
              <div class="cliente-detalle">📞 {{ c.celular }} · {{ c.total_pedidos }} pedidos</div>
              <div class="cliente-dir">📍 {{ c.direccion || 'Sin dirección' }}</div>
            </div>
          </div>
        </div>

        <div class="form-grid">
          <input v-model="cliente_nombre" class="input" placeholder="Nombre del cliente" />
          <input v-model="cliente_celular" class="input" placeholder="Celular" />
          <input v-model="cliente_direccion" class="input full" placeholder="Dirección del cliente" />
          <textarea v-model="notas" class="input full" placeholder="Notas (opcional)" rows="2"></textarea>

          <!-- Tipo de entrega -->
          <div class="full entrega-section">
            <div class="entrega-toggle">
              <button class="entrega-btn" :class="{ active: tipo_entrega === 'domicilio' }"
                @click="tipo_entrega = 'domicilio'">
                🛵 Envío a domicilio
              </button>
              <button class="entrega-btn" :class="{ active: tipo_entrega === 'retiro' }"
                @click="tipo_entrega = 'retiro'">
                🏪 Retiro en tienda
              </button>
            </div>

            <!-- Envío a domicilio -->
            <div v-if="tipo_entrega === 'domicilio'" class="envio-detalle">
              <input v-model.number="distancia_manual" type="number" step="0.1" min="0" class="input"
                placeholder="Distancia en km (ej: 1.5)" @input="calcularEnvioPorDistancia" />
              <div v-if="calculandoEnvio" class="calculando">⏳ Calculando...</div>
              <div v-else-if="distancia_km" class="distancia-info">
                📍 {{ distancia_km }} km — Envío: <strong>${{ costo_envio.toLocaleString('es-AR') }}</strong>
              </div>
              <input v-model.number="costo_envio" type="number" class="input" placeholder="Costo de envío $ (editable)"
                min="0" />
            </div>

            <!-- Pago — siempre visible -->
            <div class="pago-toggle mt-2">
              <button class="pago-btn" :class="{ active: envio_pagado === false }" @click="envio_pagado = false">
                💵 {{ tipo_entrega === 'domicilio' ? 'Paga al recibir' : 'Paga al retirar' }}
              </button>
              <button class="pago-btn" :class="{ active: envio_pagado === true }" @click="envio_pagado = true">
                ✅ Pagado
              </button>
            </div>
          </div>

          <!-- Botón guardar cliente -->
          <div class="full">
            <button v-if="cliente_nombre && cliente_celular" class="btn-guardar-cliente" @click="guardarCliente">
              {{ cliente_guardado ? '✓ Cliente guardado' : '💾 Guardar cliente' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Catálogo -->
      <div v-for="cat in categorias" :key="cat" class="mb-4">
        <div class="cat-label">{{ cat }}</div>
        <div class="productos-grid">
          <button v-for="p in productosPorCategoria(cat)" :key="p.id" class="producto-btn" @click="agregarItem(p)">
            <span class="producto-nombre">{{ p.nombre }}</span>
            <span class="producto-precio">${{ Number(p.precio).toLocaleString('es-AR') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Columna derecha: pedido -->
    <div class="col-pedido">
      <div class="card p-3 sticky-pedido">
        <h3 class="section-title mb-3">Pedido</h3>

        <div v-if="items.length === 0" class="empty-pedido">
          Tocá un producto para agregarlo
        </div>

        <div v-else>
          <div v-for="(it, i) in items" :key="i" class="pedido-item">
            <div class="pedido-item-info">
              <span class="pedido-nombre">{{ it.nombre_producto }}</span>
              <span class="pedido-precio">${{ (it.precio_unitario * it.cantidad).toLocaleString('es-AR') }}</span>
            </div>
            <div class="pedido-item-controls">
              <button class="qty-btn" @click="it.cantidad > 1 ? it.cantidad-- : items.splice(i, 1)">−</button>
              <span class="qty-num">{{ it.cantidad }}</span>
              <button class="qty-btn" @click="it.cantidad++">+</button>
            </div>
          </div>

          <!-- Envío en el resumen -->
          <div v-if="tipo_entrega === 'domicilio' && costo_envio > 0" class="pedido-item">
            <div class="pedido-item-info">
              <span class="pedido-nombre">🛵 Envío</span>
              <span class="pedido-precio">${{ costo_envio.toLocaleString('es-AR') }}</span>
            </div>
          </div>

          <div class="total-row">
            <span>Total</span>
            <span class="total-valor">${{ total.toLocaleString('es-AR') }}</span>
          </div>
        </div>

        <div v-if="mensaje" class="msg-ok">{{ mensaje }}</div>

        <button class="btn-primary w-full mt-3" :class="{ 'btn-exito': exito }"
          :disabled="enviando || items.length === 0" @click="confirmar">
          <span v-if="exito">✓ Enviado</span>
          <span v-else-if="enviando">Enviando...</span>
          <span v-else>Confirmar e Imprimir</span>
        </button>

        <div class="agent-indicator" :class="printAgent.conectado ? 'online' : 'offline'">
          <span class="dot"></span>
          {{ printAgent.conectado ? 'Print Agent activo' : 'Print Agent no detectado' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { API_URL, useAuthStore } from '../stores/auth';
import { useToast } from '../composables/useToast';
import { usePrintAgent } from '../stores/PrintAgent';


const auth = useAuthStore();
const headers = { Authorization: `Bearer ${auth.token}` };
const { success, error } = useToast();
const printAgent = usePrintAgent();

const productos = ref([]);
const items = ref([]);
const cliente_nombre = ref('');
const cliente_celular = ref('');
const cliente_direccion = ref('');
const notas = ref('');
const enviando = ref(false);
const mensaje = ref('');
const tipo_entrega = ref('domicilio');
const envio_pagado = ref(false);
const costo_envio = ref(0);
const distancia_km = ref(null);
const distancia_manual = ref('');
const calculandoEnvio = ref(false);
const cajaAbierta = ref(false);
const exito = ref(false);

// Clientes frecuentes
const busqueda_cliente = ref('');
const clientes_sugeridos = ref([]);
const cliente_guardado = ref(false);
let debounceCliente = null;
let debounceEnvio = null;

onMounted(async () => {
  const { data } = await axios.get(`${API_URL}/catalogo`);
  productos.value = data;
});

onMounted(async () => {
  const { data: catalogo } = await axios.get(`${API_URL}/catalogo`);
  productos.value = catalogo;

  try {
    const { data: caja } = await axios.get(`${API_URL}/caja/estado`, { headers });
    cajaAbierta.value = !!caja;
  } catch {
    cajaAbierta.value = false;
  }
});

const categorias = computed(() => [...new Set(productos.value.map((p) => p.categoria))]);

function productosPorCategoria(cat) {
  return productos.value.filter((p) => p.categoria === cat);
}

function agregarItem(p) {
  const existente = items.value.find((it) => it.producto_id === p.id);
  if (existente) existente.cantidad++;
  else items.value.push({ producto_id: p.id, nombre_producto: p.nombre, precio_unitario: Number(p.precio), cantidad: 1 });
}

// Clientes frecuentes
function buscarCliente() {
  clearTimeout(debounceCliente);
  if (busqueda_cliente.value.length < 2) { clientes_sugeridos.value = []; return; }
  debounceCliente = setTimeout(async () => {
    const { data } = await axios.get(`${API_URL}/clientes/buscar`, {
      params: { q: busqueda_cliente.value },
    });
    clientes_sugeridos.value = data;
  }, 300);
}

function seleccionarCliente(c) {
  cliente_nombre.value = c.nombre;
  cliente_celular.value = c.celular;
  cliente_direccion.value = c.direccion || '';
  clientes_sugeridos.value = [];
  busqueda_cliente.value = '';
  cliente_guardado.value = false;
  distancia_manual.value = '';
  distancia_km.value = null;
  costo_envio.value = 0;
}

async function guardarCliente() {
  if (!cliente_nombre.value || !cliente_celular.value) return;
  try {
    await axios.post(`${API_URL}/clientes`, {
      nombre: cliente_nombre.value,
      celular: cliente_celular.value,
      direccion: cliente_direccion.value,
    }, { headers });
    cliente_guardado.value = true;
    setTimeout(() => (cliente_guardado.value = false), 3000);
  } catch {
    alert('Error al guardar cliente');
  }
}

// Calcular envío por distancia manual
function calcularEnvioPorDistancia() {
  clearTimeout(debounceEnvio);
  if (!distancia_manual.value || distancia_manual.value <= 0) {
    costo_envio.value = 0;
    distancia_km.value = null;
    return;
  }
  debounceEnvio = setTimeout(async () => {
    calculandoEnvio.value = true;
    try {
      const { data } = await axios.post(`${API_URL}/geo/calcular-envio`, {
        distancia_km: distancia_manual.value,
      });
      costo_envio.value = data.precio;
      distancia_km.value = data.distancia_km;
    } catch {
      costo_envio.value = 0;
    } finally {
      calculandoEnvio.value = false;
    }
  }, 400);
}

const total = computed(() => {
  const subtotal = items.value.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0);
  const envio = tipo_entrega.value === 'domicilio' ? Math.round(Number(costo_envio.value || 0)) : 0;
  return subtotal + envio;
});

async function confirmar() {
  if (!cliente_nombre.value || items.value.length === 0) {
    alert('Completá el nombre y al menos un producto');
    return;
  }

  enviando.value = true;

  try {
    await axios.post(`${API_URL}/comandas`, {
      cliente_nombre: cliente_nombre.value,
      cliente_direccion: cliente_direccion.value,
      cliente_celular: cliente_celular.value,
      notas: notas.value,
      tipo_entrega: tipo_entrega.value,
      envio_pagado: envio_pagado.value,
      costo_envio: Math.round(Number(costo_envio.value || 0)),
      items: items.value,
    });

    exito.value = true;
    setTimeout(() => (exito.value = false), 2000);

    // Incrementar pedidos del cliente
    if (cliente_celular.value) {
      axios.post(
        `${API_URL}/clientes/incrementar`,
        { celular: cliente_celular.value },
        { headers }
      ).catch(() => { });
    }

    // Mensaje de éxito
    success('✓ Comanda enviada e impresa');

    items.value = [];
    cliente_nombre.value = '';
    cliente_celular.value = '';
    cliente_direccion.value = '';
    notas.value = '';
    tipo_entrega.value = 'domicilio';
    envio_pagado.value = false;
    costo_envio.value = 0;
    distancia_manual.value = '';
    distancia_km.value = null;
    busqueda_cliente.value = '';
    clientes_sugeridos.value = [];
    cliente_guardado.value = false;

  } catch {
    // Mensaje de error
    error('Error al enviar la comanda');
  } finally {
    enviando.value = false;
  }
}
</script>

<style scoped>
.alerta-caja {
  background: #fff3cd;
  border: 1.5px solid #ffc107;
  color: #856404;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 12px;
}

.alerta-caja a {
  color: #856404;
  font-weight: 700;
}

.comanda-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a2e;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6c757d;
  display: block;
  margin-bottom: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.full {
  grid-column: 1 / -1;
}

.input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #dee2e6;
  border-radius: 7px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
  resize: none;
}

.input:focus {
  border-color: #E63946;
}

.sugerencias {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1.5px solid #dee2e6;
  border-radius: 7px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 2px;
}

.sugerencia-cliente {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f1f3f5;
  transition: background 0.1s;
}

.sugerencia-cliente:hover {
  background: #fff5f5;
}

.cliente-nombre {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a2e;
}

.cliente-detalle {
  font-size: 0.78rem;
  color: #6c757d;
  margin-top: 2px;
}

.cliente-dir {
  font-size: 0.78rem;
  color: #6c757d;
}

.cat-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
  margin-bottom: 8px;
}

.productos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.producto-btn {
  background: #fff;
  border: 1.5px solid #e9ecef;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.producto-btn:hover {
  border-color: #E63946;
  box-shadow: 0 2px 8px rgba(230, 57, 70, 0.12);
}

.producto-nombre {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.2;
}

.producto-precio {
  font-size: 0.82rem;
  color: #E63946;
  font-weight: 500;
}

.sticky-pedido {
  position: sticky;
  top: 76px;
}

.empty-pedido {
  text-align: center;
  color: #adb5bd;
  font-size: 0.875rem;
  padding: 20px 0;
}

.pedido-item {
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f5;
}

.pedido-item-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.pedido-nombre {
  font-size: 0.875rem;
  font-weight: 500;
}

.pedido-precio {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1a2e;
}

.pedido-item-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 26px;
  height: 26px;
  border: 1.5px solid #dee2e6;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.qty-btn:hover {
  border-color: #E63946;
  color: #E63946;
}

.qty-num {
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
}

.total-row {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 2px solid #1a1a2e;
  font-weight: 700;
  font-size: 1rem;
}

.total-valor {
  color: #E63946;
}

.entrega-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.entrega-toggle,
.pago-toggle {
  display: flex;
  gap: 8px;
}

.entrega-btn,
.pago-btn {
  flex: 1;
  padding: 10px;
  border: 1.5px solid #dee2e6;
  border-radius: 8px;
  background: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  color: #6c757d;
}

.entrega-btn.active,
.pago-btn.active {
  border-color: #E63946;
  background: #fff5f5;
  color: #E63946;
  font-weight: 600;
}

.envio-detalle {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.calculando {
  font-size: 0.875rem;
  color: #6c757d;
  padding: 6px 0;
}

.distancia-info {
  font-size: 0.875rem;
  color: #065f46;
  background: #d1fae5;
  padding: 7px 12px;
  border-radius: 7px;
}

.btn-guardar-cliente {
  background: #fff;
  border: 1.5px solid #1a1a2e;
  color: #1a1a2e;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-guardar-cliente:hover {
  background: #1a1a2e;
  color: #fff;
}

.msg-ok {
  background: #d1fae5;
  color: #065f46;
  border-radius: 7px;
  padding: 8px 12px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 10px;
  text-align: center;
}

.btn-exito {
  background: #10b981 !important;
  transform: scale(1.01);
  transition: all 0.3s ease;
}

.agent-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 8px;
  justify-content: center;
}

.agent-indicator.online {
  color: #10b981;
}

.agent-indicator.offline {
  color: #adb5bd;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.online .dot {
  background: #10b981;
}

.offline .dot {
  background: #adb5bd;
}

.w-full {
  width: 100%;
}

.mt-2 {
  margin-top: 8px;
}

.mt-3 {
  margin-top: 12px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .comanda-layout {
    grid-template-columns: 1fr;
  }

  .sticky-pedido {
    position: static;
  }

  .productos-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .sticky-pedido {
    position: static;
    margin-top: 16px;
  }

  .productos-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .entrega-toggle,
  .pago-toggle {
    flex-direction: column;
  }

  .entrega-btn,
  .pago-btn {
    width: 100%;
  }
}
</style>