<template>
  <div>
    <h2 class="section-title mb-4">Configuración</h2>

    <!-- Tabs -->
    <div class="tabs mb-4">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: tabActivo === tab.id }"
        @click="tabActivo = tab.id">
        {{ tab.icon }} {{ tab.label }}
      </button>
    </div>


    <!-- Tab: Envío -->
    <div v-if="tabActivo === 'envio'" class="card p-4">
      <h5 class="tab-title">Tabla de precios de envío</h5>
      <p class="text-muted mb-3" style="font-size:0.875rem">Distancias mayores aumenta $200 cada 0.5 km.</p>

      <table class="tabla-envio">
        <thead>
          <tr>
            <th>Hasta (km)</th>
            <th>Precio ($)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(tramo, i) in envio.tabla" :key="i">
            <td>
              <input v-model.number="tramo.hasta_km" type="number" class="input input-sm"
                :disabled="i === envio.tabla.length - 1" />
            </td>
            <td>
              <input v-model.number="tramo.precio" type="number" class="input input-sm" />
            </td>
            <td>
              <button v-if="i !== envio.tabla.length - 1" class="btn-eliminar"
                @click="envio.tabla.splice(i, 1)">✕</button>
            </td>
          </tr>
        </tbody>
      </table>

      <button class="btn-secundario mt-3" @click="agregarTramo">+ Agregar tramo</button>
      <div v-if="msg.envio" class="msg-ok mt-3">{{ msg.envio }}</div>
      <button class="btn-primary mt-3" @click="guardarEnvio">Guardar tabla de envío</button>
    </div>

    <!-- Tab: Usuarios -->
    <div v-if="tabActivo === 'usuarios'" class="card p-4">
      <h5 class="tab-title">Usuarios administradores</h5>

      <div class="form-grid mb-4">
        <input v-model="nuevo.nombre" class="input" placeholder="Nombre" />
        <input v-model="nuevo.email" type="email" class="input" placeholder="Email" />
        <input v-model="nuevo.password" type="password" class="input full" placeholder="Contraseña" />
        <div v-if="msg.nuevoError" class="full alert-error">{{ msg.nuevoError }}</div>
        <button class="btn-primary full" @click="crearUsuario">Crear usuario</button>
      </div>

      <table class="tabla-usuarios">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Creado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id">
            <td>{{ u.nombre }}</td>
            <td>{{ u.email }}</td>
            <td>{{ new Date(u.creado_en).toLocaleDateString('es-AR') }}</td>
            <td>
              <button v-if="u.id !== auth.usuario.id" class="btn-eliminar" @click="eliminarUsuario(u)">✕</button>
              <span v-else class="text-muted small">yo</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tab: Contraseña -->
    <div v-if="tabActivo === 'password'" class="card p-4">
      <h5 class="tab-title">Cambiar mi contraseña</h5>
      <div class="form-grid" style="max-width:400px">
        <input v-model="pass.actual" type="password" class="input full" placeholder="Contraseña actual" />
        <input v-model="pass.nueva" type="password" class="input full" placeholder="Contraseña nueva" />
        <input v-model="pass.confirmar" type="password" class="input full" placeholder="Confirmar contraseña nueva" />
        <div v-if="msg.passError" class="full alert-error">{{ msg.passError }}</div>
        <div v-if="msg.passOk" class="full msg-ok">{{ msg.passOk }}</div>
        <button class="btn-primary full" @click="cambiarPassword">Cambiar contraseña</button>
      </div>
    </div>

    <!-- Tab: Impresora -->
    <div v-if="tabActivo === 'impresora'" class="card p-4">
      <h5 class="tab-title">Configuración de impresora</h5>
      <p class="text-muted mb-3" style="font-size:0.875rem">
        La impresora se configura desde el Print Agent instalado en la PC del local.
      </p>
      <a href="http://localhost:4000" target="_blank" class="btn-primary mb-4"
        style="display:inline-block; text-decoration:none">
        🖨️ Abrir panel del Print Agent
      </a>

      <hr class="my-4" />

      <h5 class="tab-title">Instalación del Print Agent</h5>
      <p class="text-muted mb-3" style="font-size:0.875rem">
        Si todavía no tenés el Print Agent instalado en esta PC, descargalo y seguí los pasos.
      </p>

      <div class="steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-content">
            <h6>Descargá el Print Agent</h6>
            <p>Hacé click para descargar el ejecutable.</p>
            <a :href="DOWNLOAD_URL" class="btn-download" download>⬇️ Descargar PrintAgent.exe</a>
          </div>
        </div>

        <div class="step">
          <div class="step-num">2</div>
          <div class="step-content">
            <h6>Ejecutá el archivo</h6>
            <p>Doble click en <strong>PrintAgent.exe</strong>. Si Windows muestra una advertencia, hacé click en
              <strong>"Más información" → "Ejecutar de todas formas"</strong>.
            </p>
          </div>
        </div>

        <div class="step">
          <div class="step-num">3</div>
          <div class="step-content">
            <h6>Configurá tu impresora</h6>
            <p>Una vez corriendo el Print Agent, abrí el panel:</p>
            <a href="http://localhost:4000" target="_blank" class="btn-secondary">🖥️ Abrir panel de configuración</a>
          </div>
        </div>

        <div class="step">
          <div class="step-num">4</div>
          <div class="step-content">
            <h6>Inicio automático (opcional)</h6>
            <p>Para que arranque solo al encender la PC, creá un acceso directo del <strong>PrintAgent.exe</strong> en:
            </p>
            <code>C:\Users\TU_USUARIO\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup</code>
          </div>
        </div>
      </div>

      <div class="info-box mt-4">
        <strong>📋 Requisito previo — Instalar driver de impresora:</strong>
        <ul class="mt-2">
          <li>Conectá la impresora por USB</li>
          <li>Descargá e instalá el driver genérico para impresoras térmicas de 80mm:
            <a href="https://www.gainscha.com.tw/driver.html" target="_blank" class="link-driver">
              ⬇️ Descargar driver POS-80 (Gainscha)
            </a>
          </li>
          <li>Verificá que aparezca en <strong>Configuración → Impresoras y escáneres</strong></li>
          <li>Hacé una impresión de prueba desde Windows para confirmar que funciona</li>
          <li>Recién ahí instalá y configurá el Print Agent</li>
        </ul>

        <strong>⚠️ Importante:</strong>
        <ul class="mt-2">
          <li>El Print Agent debe estar corriendo siempre que la tienda esté abierta.</li>
          <li>La impresora debe estar instalada en Windows antes de configurar el Print Agent.</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { API_URL, useAuthStore } from '../stores/auth';
import { useConfirm } from '../composables/useConfirm';
import { useToast } from '../composables/useToast';

const { confirmar } = useConfirm();
const { success, error } = useToast();


const auth = useAuthStore();
const tabActivo = ref('envio');

const tabs = [
  { id: 'envio', label: 'Envío', icon: '🛵' },
  { id: 'usuarios', label: 'Usuarios', icon: '👤' },
  { id: 'password', label: 'Contraseña', icon: '🔒' },
  { id: 'impresora', label: 'Impresora', icon: '🖨️' },
];

const headers = { Authorization: `Bearer ${auth.token}` };

const envio = ref({ tabla: [] });
const usuarios = ref([]);
const nuevo = ref({ nombre: '', email: '', password: '' });
const pass = ref({ actual: '', nueva: '', confirmar: '' });
const msg = ref({});
const osrmEstado = ref({ requests_hoy: 0, limite: 200, restantes: 200 });

const DOWNLOAD_URL = 'https://github.com/SofiaCoronel/sistema-comandas/releases/download/v1.0.0/PrintAgent.exe';


let debounceTimer = null;

onMounted(async () => {
  const { data } = await axios.get(`${API_URL}/configuracion`);
  envio.value.tabla = data.envio_tabla || '';
  envio.value.tabla = data.envio_tabla || [];

  const res = await axios.get(`${API_URL}/usuarios`, { headers });
  usuarios.value = res.data;
});


// Envío
function agregarTramo() {
  const ultimo = envio.value.tabla[envio.value.tabla.length - 1];
  envio.value.tabla.splice(envio.value.tabla.length - 1, 0, {
    hasta_km: ultimo.hasta_km - 1,
    precio: 0,
  });
}

async function guardarEnvio() {
  await axios.put(`${API_URL}/configuracion/envio_tabla`, { valor: envio.value.tabla }, { headers });
  success('✓ Tabla de envío guardada');
}

// Usuarios
async function crearUsuario() {
  msg.value.nuevoError = '';
  try {
    const { data } = await axios.post(`${API_URL}/usuarios`, nuevo.value, { headers });
    usuarios.value.unshift(data);
    success('Usuario creado correctamente');

    nuevo.value = { nombre: '', email: '', password: '' };
  } catch (e) {
    msg.value.nuevoError = e.response?.data?.error || 'Error al crear usuario';
  }
}

async function eliminarUsuario(u) {
  const ok = await confirmar({
    t: `¿Eliminar a ${u.nombre}?`,
    m: 'El usuario perderá acceso al sistema inmediatamente.',
    label: 'Eliminar',
    tipo: 'danger',
  });
  if (!ok) return;
  await axios.delete(`${API_URL}/usuarios/${u.id}`, { headers });
  usuarios.value = usuarios.value.filter((x) => x.id !== u.id);
}

// Contraseña
async function cambiarPassword() {
  msg.value.passError = '';
  msg.value.passOk = '';
  if (pass.value.nueva !== pass.value.confirmar) {
    msg.value.passError = 'Las contraseñas nuevas no coinciden';
    return;
  }
  if (pass.value.nueva.length < 6) {
    msg.value.passError = 'Mínimo 6 caracteres';
    return;
  }
  try {
    await axios.patch(`${API_URL}/usuarios/password`, {
      password_actual: pass.value.actual,
      password_nuevo: pass.value.nueva,
    }, { headers });
    success('Contraseña actualizada');
    pass.value = { actual: '', nueva: '', confirmar: '' };
  } catch (e) {
    msg.value.passError = e.response?.data?.error || 'Error al cambiar contraseña';
  }
}
</script>

<style scoped>
.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a2e;
}

.tab-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
}

.tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 16px;
  border: 1.5px solid #dee2e6;
  border-radius: 8px;
  background: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
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

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6c757d;
  display: block;
  margin-bottom: 4px;
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
}

.input:focus {
  border-color: #E63946;
}

.input-sm {
  padding: 6px 10px;
  font-size: 0.875rem;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 8px;
}

.step {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.step-num {
  width: 30px;
  height: 30px;
  background: #E63946;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.step-content h6 {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 4px;
}

.step-content p {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 8px;
}

.btn-download {
  display: inline-block;
  background: #E63946;
  color: #fff;
  text-decoration: none;
  padding: 9px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  transition: background 0.15s;
}

.btn-download:hover {
  background: #c1121f;
}

.btn-secondary {
  display: inline-block;
  background: #fff;
  color: #1a1a2e;
  text-decoration: none;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1.5px solid #1a1a2e;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.15s;
}

.btn-secondary:hover {
  background: #1a1a2e;
  color: #fff;
}

.info-box {
  background: #fff3cd;
  border: 1.5px solid #ffc107;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 0.875rem;
  color: #856404;
}

.info-box ul {
  padding-left: 18px;
  margin: 0;
}

.info-box li {
  margin-bottom: 6px;
}

.link-driver {
  display: inline-block;
  margin-top: 4px;
  color: #E63946;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
}
.link-driver:hover { text-decoration: underline; }

code {
  display: inline-block;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.78rem;
  color: #1a1a2e;
  word-break: break-all;
  margin-top: 4px;
}

.my-4 {
  margin: 16px 0;
}

.mt-2 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.mb-4 {
  margin-bottom: 16px;
}

.sugerencias {
  border: 1.5px solid #dee2e6;
  border-radius: 7px;
  margin-top: 4px;
  overflow: hidden;
}

.sugerencia-item {
  padding: 8px 12px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.1s;
}

.sugerencia-item:hover {
  background: #fff5f5;
  color: #E63946;
}

.direccion-confirmada {
  margin-top: 6px;
  font-size: 0.82rem;
  color: #065f46;
  background: #d1fae5;
  padding: 6px 10px;
  border-radius: 6px;
}

.osrm-estado {
  background: #f8f9fa;
  border: 1.5px solid #dee2e6;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.875rem;
  margin-bottom: 16px;
}

.osrm-estado.alerta {
  background: #fff5f5;
  border-color: #E63946;
}

.tabla-envio {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.tabla-envio th {
  text-align: left;
  padding: 8px 10px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6c757d;
  border-bottom: 2px solid #e9ecef;
}

.tabla-envio td {
  padding: 6px 10px;
}

.tabla-usuarios {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.tabla-usuarios th {
  text-align: left;
  padding: 8px 10px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #6c757d;
  border-bottom: 2px solid #e9ecef;
}

.tabla-usuarios td {
  padding: 8px 10px;
  border-bottom: 1px solid #f1f3f5;
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
  font-size: 0.9rem;
}

.btn-primary:hover {
  background: #c1121f;
}

.btn-secundario {
  background: #fff;
  color: #1a1a2e;
  border: 1.5px solid #dee2e6;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s;
}

.btn-secundario:hover {
  border-color: #1a1a2e;
}

.btn-eliminar {
  background: none;
  border: none;
  color: #E63946;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px 8px;
}

.msg-ok {
  background: #d1fae5;
  color: #065f46;
  border-radius: 7px;
  padding: 8px 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border-radius: 7px;
  padding: 8px 12px;
  font-size: 0.875rem;
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

.text-muted {
  color: #6c757d;
}

.small {
  font-size: 0.8rem;
}

@media (max-width: 768px) {
  .tabs { gap: 4px; }
  .tab-btn { padding: 6px 10px; font-size: 0.78rem; }

  .form-grid { grid-template-columns: 1fr; }

  .tabla-usuarios thead { display: none; }
  .tabla-usuarios tr {
    display: block;
    border: 1.5px solid var(--border, #e9ecef);
    border-radius: 8px;
    margin-bottom: 10px;
    padding: 10px;
  }
  .tabla-usuarios td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border, #f1f3f5);
    padding: 6px 4px;
    font-size: 0.875rem;
  }
  .tabla-usuarios td:last-child { border-bottom: none; justify-content: flex-end; }

  
}

</style>