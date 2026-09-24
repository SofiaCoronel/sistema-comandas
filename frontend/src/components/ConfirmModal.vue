<template>
  <Teleport to="body">
    <div v-if="visible" class="confirm-overlay">
      <div class="confirm-box">
        <div class="confirm-icon" :class="tipoBoton">
          <span v-if="tipoBoton === 'danger'">⚠️</span>
          <span v-else-if="tipoBoton === 'success'">✅</span>
          <span v-else>💬</span>
        </div>
        <h5 class="confirm-titulo">{{ titulo }}</h5>
        <p class="confirm-mensaje">{{ mensaje }}</p>
        <div class="confirm-actions">
          <button class="btn-cancelar" @click="cancelar">Cancelar</button>
          <button class="btn-confirmar" :class="tipoBoton" @click="aceptar">{{ labelConfirmar }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useConfirm } from '../composables/useConfirm';
const { visible, titulo, mensaje, labelConfirmar, tipoBoton, aceptar, cancelar } = useConfirm();
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.confirm-box {
  background: #fff;
  border-radius: 14px;
  padding: 32px 28px 24px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  animation: slideUp 0.15s ease;
}

@keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.confirm-icon {
  font-size: 2.2rem;
  margin-bottom: 14px;
}

.confirm-titulo {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.confirm-mensaje {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 24px;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-cancelar {
  flex: 1;
  padding: 10px 16px;
  border: 1.5px solid #dee2e6;
  border-radius: 8px;
  background: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.15s;
}
.btn-cancelar:hover { border-color: #6c757d; color: #1a1a2e; }

.btn-confirmar {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  color: #fff;
}
.btn-confirmar.danger { background: #E63946; }
.btn-confirmar.danger:hover { background: #c1121f; }
.btn-confirmar.success { background: #10b981; }
.btn-confirmar.success:hover { background: #059669; }
.btn-confirmar.warning { background: #f59e0b; }
.btn-confirmar.warning:hover { background: #d97706; }
</style>