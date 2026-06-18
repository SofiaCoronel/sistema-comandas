import { defineStore } from 'pinia';
import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    usuario: JSON.parse(localStorage.getItem('usuario') || 'null'),
  }),
  actions: {
    async login(email, password) {
      const { data } = await axios.post(`${API_URL}/auth/login`, { email, password });
      this.token = data.token;
      this.usuario = data.usuario;
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
    },
    logout() {
      this.token = null;
      this.usuario = null;
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    },
  },
});