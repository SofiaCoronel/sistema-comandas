<template>
  <div>
    <h2 class="section-title mb-4">📊 Estadísticas</h2>

    <!-- Resumen general -->
    <div class="resumen-grid mb-4">
      <div class="resumen-card">
        <div class="resumen-valor">{{ resumen.pedidos_hoy }}</div>
        <div class="resumen-label">Pedidos hoy</div>
      </div>

      <div class="resumen-card destacado">
        <div class="resumen-valor">
          ${{ Number(resumen.ventas_hoy).toLocaleString('es-AR') }}
        </div>
        <div class="resumen-label">Ventas hoy</div>
      </div>

      <div class="resumen-card">
        <div class="resumen-valor">{{ resumen.pedidos_mes }}</div>
        <div class="resumen-label">Pedidos este mes</div>
      </div>

      <div class="resumen-card destacado">
        <div class="resumen-valor">
          ${{ Number(resumen.ventas_mes).toLocaleString('es-AR') }}
        </div>
        <div class="resumen-label">Ventas este mes</div>
      </div>

      <div class="resumen-card">
        <div class="resumen-valor cancelados">
          {{ resumen.cancelados_mes }}
        </div>
        <div class="resumen-label">Cancelados este mes</div>
      </div>
    </div>

    <!-- Gráfico ventas por día -->
    <div class="card p-4 mb-4">
      <h5 class="tab-title mb-3">Ventas últimos 30 días</h5>
      <canvas ref="chartVentas" height="100"></canvas>
    </div>

    <!-- Productos más vendidos -->
    <div class="card p-4">
      <h5 class="tab-title mb-3">
        Productos más vendidos (últimos 30 días)
      </h5>

      <div class="productos-top">
        <div
          v-for="(p, i) in productosTop"
          :key="p.nombre_producto"
          class="producto-top-item"
        >
          <div class="producto-rank">
            #{{ i + 1 }}
          </div>

          <div class="producto-info">
            <div class="producto-top-nombre">
              {{ p.nombre_producto }}
            </div>

            <div class="producto-top-bar-wrap">
              <div
                class="producto-top-bar"
                :style="{
                  width: `${(p.total_vendido / productosTop[0].total_vendido) * 100}%`
                }"
              ></div>
            </div>
          </div>

          <div class="producto-stats">
            <span class="stat-vendido">
              {{ p.total_vendido }} uds
            </span>

            <span class="stat-facturado">
              ${{ Number(p.total_facturado).toLocaleString('es-AR') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { API_URL, useAuthStore } from '../stores/auth';

Chart.register(...registerables);

const auth = useAuthStore();
const headers = {
  Authorization: `Bearer ${auth.token}`,
};

const resumen = ref({
  pedidos_hoy: 0,
  ventas_hoy: 0,
  pedidos_mes: 0,
  ventas_mes: 0,
  cancelados_mes: 0,
});

const productosTop = ref([]);
const chartVentas = ref(null);

let chart = null;

onMounted(async () => {
  const [
    resumenData,
    ventasData,
    productosData,
  ] = await Promise.all([
    axios.get(`${API_URL}/estadisticas/resumen`, { headers }),
    axios.get(`${API_URL}/estadisticas/ventas-por-dia`, { headers }),
    axios.get(`${API_URL}/estadisticas/productos-top`, { headers }),
  ]);

  resumen.value = resumenData.data;
  productosTop.value = productosData.data;

  const ventas = ventasData.data;

  const isDark =
    document.documentElement.getAttribute('data-theme') === 'dark';

  const textColor = isDark ? '#9999bb' : '#6c757d';
  const gridColor = isDark ? '#2d2d44' : '#e9ecef';

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(chartVentas.value, {
    type: 'bar',

    data: {
      labels: ventas.map((v) =>
        new Date(v.fecha).toLocaleDateString('es-AR', {
          day: '2-digit',
          month: '2-digit',
        })
      ),

      datasets: [
        {
          label: 'Ventas ($)',
          data: ventas.map((v) => Number(v.total_ventas)),
          backgroundColor: 'rgba(230,57,70,0.8)',
          borderRadius: 6,
          yAxisID: 'y',
        },
        {
          label: 'Pedidos',
          data: ventas.map((v) => Number(v.total_pedidos)),
          backgroundColor: 'rgba(16,185,129,0.7)',
          borderRadius: 6,
          yAxisID: 'y1',
        },
      ],
    },

    options: {
      responsive: true,

      interaction: {
        mode: 'index',
        intersect: false,
      },

      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },

        tooltip: {
          callbacks: {
            label: (ctx) =>
              ctx.datasetIndex === 0
                ? `Ventas: $${Number(ctx.raw).toLocaleString('es-AR')}`
                : `Pedidos: ${ctx.raw}`,
          },
        },
      },

      scales: {
        x: {
          ticks: {
            color: textColor,
          },
          grid: {
            color: gridColor,
          },
        },

        y: {
          type: 'linear',
          position: 'left',

          ticks: {
            color: textColor,
            callback: (v) =>
              `$${Number(v).toLocaleString('es-AR')}`,
          },

          grid: {
            color: gridColor,
          },
        },

        y1: {
          type: 'linear',
          position: 'right',

          ticks: {
            color: textColor,
          },

          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  });
});
</script>

<style scoped>
.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
}

.tab-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
}

.resumen-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.resumen-card {
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  box-shadow: var(--shadow);
}

.resumen-card.destacado {
  border-color: var(--accent);
}

.resumen-valor {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.resumen-card.destacado .resumen-valor {
  color: var(--accent);
}

.resumen-valor.cancelados {
  color: var(--text-muted);
}

.resumen-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
  font-weight: 500;
}

.productos-top {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.producto-top-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.producto-rank {
  width: 28px;
  height: 28px;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.producto-info {
  flex: 1;
}

.producto-top-nombre {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}

.producto-top-bar-wrap {
  background: var(--border);
  border-radius: 4px;
  height: 6px;
  overflow: hidden;
}

.producto-top-bar {
  background: var(--accent);
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.producto-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.stat-vendido {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.stat-facturado {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent);
}

.mb-4 {
  margin-bottom: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}

@media (max-width: 768px) {
  .resumen-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>