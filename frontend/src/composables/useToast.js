import { ref } from 'vue';

const toasts = ref([]);

export function useToast() {
  function toast({ mensaje, tipo = 'success', duracion = 3000 }) {
    const id = Date.now();
    toasts.value.push({ id, mensaje, tipo });
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, duracion);
  }

  function success(mensaje) { toast({ mensaje, tipo: 'success' }); }
  function error(mensaje) { toast({ mensaje, tipo: 'error' }); }
  function info(mensaje) { toast({ mensaje, tipo: 'info' }); }

  return { toasts, success, error, info };
}