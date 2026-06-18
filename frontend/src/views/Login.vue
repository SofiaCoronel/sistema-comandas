<template>
  <div class="row justify-content-center">
    <div class="col-md-4">
      <h3 class="mb-3">Acceso Administrador</h3>
      <form @submit.prevent="ingresar">
        <input v-model="email" type="email" class="form-control mb-2" placeholder="Email" required />
        <input v-model="password" type="password" class="form-control mb-2" placeholder="Contraseña" required />
        <div v-if="error" class="alert alert-danger py-1">{{ error }}</div>
        <button class="btn btn-primary w-100">Ingresar</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const error = ref('');
const auth = useAuthStore();
const router = useRouter();

async function ingresar() {
  try {
    await auth.login(email.value, password.value);
    router.push('/historial');
  } catch {
    error.value = 'Credenciales inválidas';
  }
}
</script>