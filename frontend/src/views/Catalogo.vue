<template>
  <div>
    <h2 class="section-title mb-4">Catálogo de Productos</h2>

    <!-- Formulario -->
    <div class="card p-4 mb-4">
      <h5 class="tab-title mb-3">
        {{ editando ? '✏️ Editar producto' : '➕ Nuevo producto' }}
      </h5>

      <div class="form-grid">
        <div>
          <label class="form-label">Nombre</label>
          <input v-model="form.nombre" class="input" placeholder="Ej: Hamburguesa Doble" required />
        </div>

        <!-- Categoría con dropdown -->
        <div style="position: relative">
          <label class="form-label">Categoría</label>

          <input v-model="form.categoria" class="input" placeholder="Seleccioná o escribí una nueva..."
            @focus="mostrarCategorias = true" @blur="setTimeout(() => mostrarCategorias = false, 150)"
            autocomplete="off" required />

          <div v-if="mostrarCategorias" class="dropdown-categorias">
            <!-- Categorías existentes -->
            <div v-for="cat in categorias" :key="cat" class="dropdown-item"
              @click="form.categoria = cat; mostrarCategorias = false">
              {{ cat }}
            </div>

            <!-- Crear nueva categoría -->
            <div v-if="form.categoria && !categorias.includes(form.categoria)" class="dropdown-item nueva"
              @click="mostrarCategorias = false">
              ➕ Crear categoría "{{ form.categoria }}"
            </div>
          </div>
        </div>

        <div>
          <label class="form-label">Precio ($)</label>
          <input v-model.number="form.precio" type="number" class="input" placeholder="0" required />
        </div>

        <div>
          <label class="form-label">Descripción (opcional)</label>
          <input v-model="form.descripcion" class="input" placeholder="Ej: Con papas fritas" />
        </div>
      </div>

      <div class="form-actions mt-3">
        <button class="btn-primary" @click="guardar">
          {{ editando ? '✏️ Guardar cambios' : '➕ Agregar producto' }}
        </button>

        <button v-if="editando" class="btn-cancelar" @click="cancelarEdicion">
          Cancelar
        </button>
      </div>
    </div>

    <!-- Tabla por categoría -->
    <div v-for="cat in categorias" :key="cat" class="mb-4">
      <div class="cat-header">
        <span class="cat-label">{{ cat }}</span>
        <span class="cat-count">
          {{ productosPorCategoria(cat).length }} productos
        </span>
      </div>

      <div class="card">
        <table class="tabla-catalogo">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="p in productosPorCategoria(cat)" :key="p.id" :class="{ 'row-editando': editando === p.id }">
              <td class="td-nombre">{{ p.nombre }}</td>

              <td class="td-desc">
                {{ p.descripcion || '-' }}
              </td>

              <td class="td-precio">
                ${{ Number(p.precio).toLocaleString('es-AR') }}
              </td>

              <td class="td-acciones">
                <button class="btn-editar" @click="editar(p)">
                  ✏️ Editar
                </button>

                <button class="btn-eliminar" @click="eliminar(p.id)">
                  ✕
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import { API_URL, useAuthStore } from '../stores/auth';
import { useConfirm } from '../composables/useConfirm';
import { useToast } from '../composables/useToast';

const { confirmar } = useConfirm();
const { success, error } = useToast();


const productos = ref([]);
const auth = useAuthStore();
const editando = ref(null);
const form = ref({ nombre: '', categoria: '', precio: 0, descripcion: '' });
const headers = { Authorization: `Bearer ${auth.token}` };
const mostrarCategorias = ref(false);

onMounted(cargar);

const categorias = computed(() => [...new Set(productos.value.map((p) => p.categoria))]);
function productosPorCategoria(cat) {
  return productos.value.filter((p) => p.categoria === cat);
}

async function cargar() {
  const { data } = await axios.get(`${API_URL}/catalogo`);
  productos.value = data;
}

async function guardar() {
  if (!form.value.nombre || !form.value.categoria || !form.value.precio) return;
  if (editando.value) {
    await axios.put(`${API_URL}/catalogo/${editando.value}`, { ...form.value, activo: true }, { headers });
  } else {
    await axios.post(`${API_URL}/catalogo`, form.value, { headers });
  }
  cancelarEdicion();
  cargar();
  success(editando.value ? 'Producto actualizado' : 'Producto agregado');

}

function editar(p) {
  form.value = { ...p };
  editando.value = p.id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicion() {
  form.value = { nombre: '', categoria: '', precio: 0, descripcion: '' };
  editando.value = null;
}

async function eliminar(id) {
  const ok = await confirmar({
    t: '¿Eliminar producto?',
    m: 'Esta acción no se puede deshacer.',
    label: 'Eliminar',
    tipo: 'danger',
  });
  if (!ok) return;
  await axios.delete(`${API_URL}/catalogo/${id}`, { headers });
  cargar();
  success('Producto eliminado');

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
}

.form-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #6c757d;
  display: block;
  margin-bottom: 4px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 12px;
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

.form-actions {
  display: flex;
  gap: 10px;
  align-items: center;
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

.dropdown-categorias {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1.5px solid #dee2e6;
  border-radius: 7px;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-top: 2px;
  overflow: hidden;
}
.dropdown-item {
  padding: 9px 12px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.1s;
  color: #1a1a2e;
}
.dropdown-item:hover { background: #f8f9fa; }
.dropdown-item.nueva {
  color: #E63946;
  font-weight: 500;
  border-top: 1px solid #f1f3f5;
}
.dropdown-item.nueva:hover { background: #fff5f5; }

.btn-cancelar {
  background: #fff;
  color: #6c757d;
  border: 1.5px solid #dee2e6;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.15s;
}

.btn-cancelar:hover {
  border-color: #6c757d;
  color: #1a1a2e;
}

.cat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.cat-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: #6c757d;
}

.cat-count {
  font-size: 0.75rem;
  color: #adb5bd;
}

.tabla-catalogo {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.tabla-catalogo thead tr {
  border-bottom: 2px solid #e9ecef;
}

.tabla-catalogo th {
  text-align: left;
  padding: 10px 14px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6c757d;
}

.tabla-catalogo td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f3f5;
  vertical-align: middle;
}

.tabla-catalogo tbody tr:last-child td {
  border-bottom: none;
}

.tabla-catalogo tbody tr:hover {
  background: #fafafa;
}

.tabla-catalogo tbody tr.row-editando {
  background: #fff5f5;
}

.td-nombre {
  font-weight: 600;
  color: #1a1a2e;
}

.td-desc {
  color: #6c757d;
  font-size: 0.875rem;
}

.td-precio {
  font-weight: 700;
  color: #E63946;
  white-space: nowrap;
}

.td-acciones {
  white-space: nowrap;
}

.btn-editar {
  background: #fff;
  border: 1.5px solid #dee2e6;
  border-radius: 6px;
  padding: 5px 10px;
  font-family: 'Inter', sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  margin-right: 6px;
  color: #1a1a2e;
}

.btn-editar:hover {
  border-color: #1a1a2e;
}

.btn-eliminar {
  background: none;
  border: 1.5px solid #fca5a5;
  border-radius: 6px;
  padding: 5px 9px;
  color: #E63946;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s;
}

.btn-eliminar:hover {
  background: #fee2e2;
}

.mt-3 {
  margin-top: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .form-grid { grid-template-columns: 1fr; }
  
  .tabla-catalogo thead { display: none; }
  .tabla-catalogo tr {
    display: block;
    border: 1.5px solid var(--border, #e9ecef);
    border-radius: 8px;
    margin-bottom: 10px;
    padding: 10px;
  }
  .tabla-catalogo td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border, #f1f3f5);
    padding: 6px 4px;
    font-size: 0.875rem;
  }
  .tabla-catalogo td:last-child { border-bottom: none; }
  .td-precio { color: #E63946; font-weight: 700; }
  .td-acciones { justify-content: flex-end; gap: 8px; }
}

@media (max-width: 480px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>