import { ref } from 'vue';

const visible = ref(false);
const titulo = ref('');
const mensaje = ref('');
const labelConfirmar = ref('Confirmar');
const tipoBoton = ref('danger'); // 'danger' | 'success' | 'warning'
let resolveFn = null;

export function useConfirm() {
  function confirmar({ t, m, label = 'Confirmar', tipo = 'danger' }) {
    titulo.value = t;
    mensaje.value = m;
    labelConfirmar.value = label;
    tipoBoton.value = tipo;
    visible.value = true;
    return new Promise((resolve) => { resolveFn = resolve; });
  }

  function aceptar() { visible.value = false; resolveFn(true); }
  function cancelar() { visible.value = false; resolveFn(false); }

  return { visible, titulo, mensaje, labelConfirmar, tipoBoton, confirmar, aceptar, cancelar };
}