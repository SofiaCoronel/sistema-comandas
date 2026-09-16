<template>
  <div>
    <h2 class="section-title mb-4">Caja</h2>

    <!-- Estado actual -->
    <div class="card p-4 mb-4">
      <div v-if="sesionActual" class="sesion-abierta">
        <div class="estado-badge abierta">🟢 Tienda abierta</div>

        <p class="text-muted mt-1" style="font-size:0.85rem">
          Desde: {{ new Date(sesionActual.abierta_en).toLocaleString('es-AR') }}
        </p>

        <div class="resumen-grid mt-3">
          <div class="resumen-card">
            <div class="resumen-valor">{{ sesionActual.total_pedidos }}</div>
            <div class="resumen-label">Pedidos</div>
          </div>

          <div class="resumen-card destacado">
            <div class="resumen-valor">
              ${{ Number(sesionActual.total_ventas).toLocaleString('es-AR') }}
            </div>
            <div class="resumen-label">Ventas (sin envío)</div>
          </div>

          <div class="resumen-card">
            <div class="resumen-valor">{{ sesionActual.total_envios }}</div>
            <div class="resumen-label">Envíos realizados</div>
          </div>

          <div class="resumen-card">
            <div class="resumen-valor">
              ${{ Number(sesionActual.monto_envios).toLocaleString('es-AR') }}
            </div>
            <div class="resumen-label">Monto envíos</div>
          </div>
        </div>

        <button class="btn-cerrar mt-4" @click="cerrarCaja">
          🔴 Cerrar tienda
        </button>
      </div>

      <div v-else class="sesion-cerrada">
        <div class="estado-badge cerrada">🔴 Tienda cerrada</div>

        <p class="text-muted mt-2" style="font-size:0.875rem">
          Abrí la tienda para empezar a registrar las ventas del día.
        </p>

        <button class="btn-abrir mt-3" @click="abrirCaja">
          🟢 Abrir tienda
        </button>
      </div>
    </div>

    <!-- Historial de cierres -->
    <h5 class="section-subtitle mb-3">Historial de cierres</h5>

    <div v-if="historial.length === 0" class="text-muted" style="font-size:0.875rem">
      No hay cierres registrados aún.
    </div>

    <div class="tabla-wrapper" v-else>
      <table class="tabla-caja">
        <thead>
          <tr>
            <th>Apertura</th>
            <th>Cierre</th>
            <th>Pedidos</th>
            <th>Ventas</th>
            <th>Envíos</th>
            <th>Monto envíos</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="s in historial" :key="s.id">
            <td>
              {{ new Date(s.abierta_en).toLocaleString('es-AR') }}
            </td>

            <td>
              {{ new Date(s.cerrada_en).toLocaleString('es-AR') }}
            </td>

            <td>
              {{ s.total_pedidos }}
            </td>

            <td class="total-col">
              ${{ Number(s.total_ventas).toLocaleString('es-AR') }}
            </td>

            <td>
              {{ s.total_envios }}
            </td>

            <td>
              ${{ Number(s.monto_envios).toLocaleString('es-AR') }}
            </td>

            <td>
              <button class="btn-pdf" @click="exportarPDF(s)">
                📄 PDF
              </button>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td colspan="2">
              <strong>Total acumulado</strong>
            </td>

            <td>
              <strong>{{ totalPedidos }}</strong>
            </td>

            <td class="total-col">
              <strong>
                ${{ totalVentas.toLocaleString('es-AR') }}
              </strong>
            </td>

            <td>
              <strong>{{ totalEnvios }}</strong>
            </td>

            <td class="total-col">
              <strong>
                ${{ totalMontoEnvios.toLocaleString('es-AR') }}
              </strong>
            </td>

            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import axios from 'axios';
import { API_URL, useAuthStore } from '../stores/auth';
import jsPDF from 'jspdf';

const auth = useAuthStore();
const headers = { Authorization: `Bearer ${auth.token}` };

const sesionActual = ref(null);
const historial = ref([]);

const totalEnvios = computed(() => historial.value.reduce((acc, s) => acc + (s.total_envios || 0), 0));
const totalMontoEnvios = computed(() => historial.value.reduce((acc, s) => acc + Number(s.monto_envios || 0), 0));

let intervalo = null;

onMounted(async () => {
  await cargar();
  // Actualizar resumen cada 30 segundos
  intervalo = setInterval(cargarResumen, 30000);
});

onUnmounted(() => clearInterval(intervalo));

async function cargar() {
  await cargarResumen();
  const { data } = await axios.get(`${API_URL}/caja/historial`, { headers });
  historial.value = data;
}

async function cargarResumen() {
  const { data } = await axios.get(`${API_URL}/caja/resumen-actual`, { headers });
  sesionActual.value = data;
}

async function abrirCaja() {
  if (!confirm('¿Abrís la tienda ahora?')) return;
  await axios.post(`${API_URL}/caja/abrir`, {}, { headers });
  await cargar();
}

async function cerrarCaja() {
  if (!confirm('¿Cerrás la tienda? Se guardará el resumen de ventas.')) return;
  await axios.post(`${API_URL}/caja/cerrar`, {}, { headers });
  await cargar();
}

function exportarPDF(sesion) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DE CAJA', 105, 20, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Apertura: ${new Date(sesion.abierta_en).toLocaleString('es-AR')}`, 20, 35);
  doc.text(`Cierre: ${new Date(sesion.cerrada_en).toLocaleString('es-AR')}`, 20, 43);

  doc.setLineWidth(0.5);
  doc.line(20, 50, 190, 50);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen', 20, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Total de pedidos:`, 20, 72);
  doc.text(`${sesion.total_pedidos}`, 190, 72, { align: 'right' });

  doc.text(`Total ventas (sin envío):`, 20, 82);
  doc.text(`$${Number(sesion.total_ventas).toLocaleString('es-AR')}`, 190, 82, { align: 'right' });

  doc.text(`Envíos realizados:`, 20, 92);
  doc.text(`${sesion.total_envios}`, 190, 92, { align: 'right' });

  doc.text(`Monto total envíos:`, 20, 102);
  doc.text(`$${Number(sesion.monto_envios).toLocaleString('es-AR')}`, 190, 102, { align: 'right' });

  doc.line(20, 110, 190, 110);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const totalGeneral = Number(sesion.total_ventas) + Number(sesion.monto_envios);
  doc.text(`Total general:`, 20, 122);
  doc.text(`$${totalGeneral.toLocaleString('es-AR')}`, 190, 122, { align: 'right' });

  const fecha = new Date(sesion.cerrada_en).toLocaleDateString('es-AR').replace(/\//g, '-');
  doc.save(`resumen-caja-${fecha}.pdf`);
}

const totalPedidos = computed(() => historial.value.reduce((acc, s) => acc + s.total_pedidos, 0));
const totalVentas = computed(() => historial.value.reduce((acc, s) => acc + Number(s.total_ventas), 0));
</script>

<style scoped>
.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a2e;
}

.section-subtitle {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a2e;
}

.estado-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.estado-badge.abierta {
  background: #d1fae5;
  color: #065f46;
}

.estado-badge.cerrada {
  background: #fee2e2;
  color: #991b1b;
}

.resumen-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  max-width: 500px;
}

.resumen-card {
  background: #f8f9fa;
  border: 1.5px solid #e9ecef;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}

.resumen-card.destacado {
  background: #fff5f5;
  border-color: #E63946;
}

.resumen-valor {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a2e;
}

.resumen-card.destacado .resumen-valor {
  color: #E63946;
}

.resumen-label {
  font-size: 0.78rem;
  color: #6c757d;
  margin-top: 4px;
  font-weight: 500;
}

.btn-abrir {
  background: #d1fae5;
  color: #065f46;
  border: 1.5px solid #6ee7b7;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.15s;
}

.btn-abrir:hover {
  background: #a7f3d0;
}

.btn-cerrar {
  background: #fee2e2;
  color: #991b1b;
  border: 1.5px solid #fca5a5;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.15s;
}

.btn-cerrar:hover {
  background: #fecaca;
}

.btn-pdf {
  padding: 5px 10px;
  border: 1.5px solid #dee2e6;
  border-radius: 6px;
  background: #fff;
  font-size: 0.78rem;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-pdf:hover { border-color: #E63946; color: #E63946; }

.tabla-wrapper {
  overflow-x: auto;
}

.tabla-caja {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.tabla-caja th {
  text-align: left;
  padding: 10px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6c757d;
  border-bottom: 2px solid #e9ecef;
}

.tabla-caja td {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f3f5;
}

.tabla-caja tfoot td {
  border-top: 2px solid #1a1a2e;
  border-bottom: none;
  padding-top: 12px;
}

.total-col {
  font-weight: 600;
  color: #E63946;
}

.mt-1 {
  margin-top: 4px;
}

.mt-2 {
  margin-top: 8px;
}

.mt-3 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.text-muted {
  color: #6c757d;
}
</style>