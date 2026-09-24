<template>
  <div class="login-layout">
    <div class="card p-4 login-card">
      <h3 class="section-title mb-1">Acceso Administrador</h3>
      <p class="text-muted mb-4" style="font-size:0.875rem">Ingresá tus credenciales para continuar.</p>

      <form @submit.prevent="ingresar">
        <label class="form-label">Email</label>
        <input
          v-model="email"
          type="email"
          class="input mb-3"
          placeholder="admin@local.com"
          required
          autofocus
        />
        <label class="form-label">Contraseña</label>
        <input
          v-model="password"
          type="password"
          class="input mb-3"
          placeholder="••••••••"
          required
        />
        <div v-if="error" class="alert-error mb-3">{{ error }}</div>
        <button type="submit" class="btn-primary w-full">Ingresar</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { useToast } from '../composables/useToast';

const email = ref('');
const password = ref('');
const error = ref('');
const auth = useAuthStore();
const router = useRouter();
const { error: toastError } = useToast();

async function ingresar() {
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    router.push('/historial');
  } catch {
    error.value = 'Credenciales inválidas';
    toastError('Credenciales inválidas');
  }
}
</script>

<style scoped>
.login-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}
.login-card { width: 100%; max-width: 400px; }
.section-title { font-size: 1.25rem; font-weight: 700; color: #1a1a2e; }
.text-muted { color: #6c757d; }
.form-label { font-size: 0.78rem; font-weight: 600; color: #6c757d; display: block; margin-bottom: 4px; }

.input {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #dee2e6;
  border-radius: 7px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.15s;
}
.input:focus { border-color: #E63946; }

.btn-primary {
  background: #E63946;
  color: #fff;
  border: none;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  padding: 11px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
  font-size: 0.95rem;
}
.btn-primary:hover { background: #c1121f; }

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border-radius: 7px;
  padding: 9px 12px;
  font-size: 0.875rem;
}

.w-full { width: 100%; }
.mb-3 { margin-bottom: 12px; }
.mb-4 { margin-bottom: 16px; }
.mb-1 { margin-bottom: 4px; }
</style>