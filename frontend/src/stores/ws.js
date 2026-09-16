import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useWsStore = defineStore('ws', () => {
  const ws = ref(null);
  const callbacks = ref({});

  function conectar(url) {
    if (ws.value?.readyState === WebSocket.OPEN) return;

    ws.value = new WebSocket(url);

    ws.value.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (callbacks.value[msg.type]) {
        callbacks.value[msg.type](msg);
      }
    };

    ws.value.onclose = () => {
      setTimeout(() => conectar(url), 5000);
    };

    ws.value.onerror = (err) => {
      console.error('WS error:', err);
    };
  }

  function on(type, callback) {
    callbacks.value[type] = callback;
  }

  return { conectar, on };
});