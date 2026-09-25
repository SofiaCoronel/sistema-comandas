<template>
  <nav class="navbar px-4 py-2">
    <span class="brand">🍔 MANJAR URBANO</span>
    <div class="nav-links">
      <router-link to="/">Nuevo Pedido</router-link>
      <router-link v-if="auth.token" to="/historial" class="nav-link-badge">
        Historial
        <span v-if="pendientes > 0" class="badge-pendientes">{{ pendientes }}</span>
      </router-link>
      <router-link v-if="auth.token" to="/catalogo">Catálogo</router-link>
      <router-link v-if="auth.token" to="/caja">Caja</router-link>
      <router-link v-if="auth.token" to="/configuracion">Configuración</router-link>
      <button v-if="auth.token" class="btn-salir" @click="salir">Salir</button>
      <router-link v-else to="/login" class="btn-login">Admin</router-link>
    </div>
  </nav>
  <main class="main-content">
    <router-view />
  </main>
  <ConfirmModal />
  <ToastContainer />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useWsStore } from './stores/ws';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { API_URL } from './stores/auth';
import { usePrintAgent } from './stores/PrintAgent';

const auth = useAuthStore();
const ws = useWsStore();
const router = useRouter();
const printAgent = usePrintAgent();

const pendientes = ref(0);
let intervaloBadge = null;


onMounted(() => {
  ws.conectar(import.meta.env.VITE_WS_URL);

  // Iniciar agente de impresión
  printAgent.iniciar();

  if (auth.token) {
    cargarPendientes();
    intervaloBadge = setInterval(cargarPendientes, 30000);
  }

  ws.on('nueva_comanda', () => {
    pendientes.value++;
  });

  ws.on('estado_actualizado', (msg) => {
    if (
      msg.comanda.estado === 'entregado' ||
      msg.comanda.estado === 'cancelado'
    ) {
      if (pendientes.value > 0) pendientes.value--;
    }
  });
});

onUnmounted(() => {
  clearInterval(intervaloBadge);

  // Detener agente de impresión
  printAgent.detener();
});

async function cargarPendientes() {
  if (!auth.token) return;

  try {
    const { data } = await axios.get(`${API_URL}/comandas`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    });

    pendientes.value = data.filter(
      (c) => c.estado === 'pendiente'
    ).length;
  } catch { }
}

function salir() {
  auth.logout();
  clearInterval(intervaloBadge);
  pendientes.value = 0;
  router.push('/login');
}
</script>


<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', sans-serif;
  background: #F8F9FA;
  color: #1a1a2e;
  min-height: 100vh;
}

.navbar {
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.brand {
  color: #fff;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-links a {
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.15s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.nav-link-badge {
  position: relative;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.15s;
}

.nav-link-badge:hover,
.nav-link-badge.router-link-active {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.badge-pendientes {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #E63946;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.btn-salir {
  background: #E63946;
  color: #fff;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-salir:hover {
  background: #c1121f;
}

.btn-login {
  background: rgba(255, 255, 255, 0.15);
  color: #fff !important;
  padding: 6px 14px;
  border-radius: 6px;
}

.main-content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px;
}

.card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #e9ecef;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.btn-primary {
  background: #E63946;
  color: #fff;
  border: none;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 0.95rem;
}

.btn-primary:hover {
  background: #c1121f;
}

.btn-primary:disabled {
  background: #adb5bd;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 8px;
    padding: 10px 16px;
  }

  .nav-links {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }

  .nav-links a,
  .nav-link-badge {
    text-align: center;
    font-size: 0.75rem;
    padding: 6px 4px;
  }

  .btn-salir {
    grid-column: 1 / -1;
    width: 100%;
  }

  .btn-darkmode {
    display: none;
  }

  .main-content {
    padding: 16px 12px;
  }
}
</style>
```