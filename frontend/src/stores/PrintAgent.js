import { ref } from 'vue';
import axios from 'axios';

const conectado = ref(false);
let intervalo = null;

export function usePrintAgent() {
  async function verificar() {
    try {
      await axios.get('http://localhost:4000/api/health', { timeout: 2000 });
      conectado.value = true;
    } catch {
      conectado.value = false;
    }
  }

  function iniciar() {
    verificar();
    intervalo = setInterval(verificar, 15000);
  }

  function detener() {
    clearInterval(intervalo);
  }

  return { conectado, iniciar, detener, verificar };
}