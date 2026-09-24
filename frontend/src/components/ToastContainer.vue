<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="toast-item"
          :class="t.tipo"
        >
          <span class="toast-icon">
            {{ t.tipo === 'success' ? '✅' : t.tipo === 'error' ? '❌' : 'ℹ️' }}
          </span>
          <span class="toast-mensaje">{{ t.mensaje }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../composables/useToast';
const { toasts } = useToast();
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  min-width: 260px;
  max-width: 360px;
}

.toast-item.success { background: #d1fae5; color: #065f46; border: 1.5px solid #6ee7b7; }
.toast-item.error { background: #fee2e2; color: #991b1b; border: 1.5px solid #fca5a5; }
.toast-item.info { background: #e0f2fe; color: #0369a1; border: 1.5px solid #7dd3fc; }

.toast-icon { font-size: 1rem; }
.toast-mensaje { flex: 1; }

.toast-enter-active { animation: slideIn 0.25s ease; }
.toast-leave-active { animation: slideOut 0.2s ease forwards; }

@keyframes slideIn {
  from { transform: translateX(60px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(60px); opacity: 0; }
}
</style>