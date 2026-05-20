import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  usuario: null,
  tarjeta: null,
  admin: null,
  cargando: true,

  // ─── Inicializar sesión al arrancar la app ─────
  inicializar: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) {
        set({ cargando: false });
        return;
      }
      const { data } = await authAPI.perfil();
      set({ usuario: data, tarjeta: data.tarjeta, cargando: false });
    } catch {
      await SecureStore.deleteItemAsync('access_token');
      set({ usuario: null, tarjeta: null, cargando: false });
    }
  },

  // ─── Registro ─────────────────────────────────
  registro: async (datos) => {
    const { data } = await authAPI.registro(datos);
    await SecureStore.setItemAsync('access_token', data.access_token);
    set({ usuario: data.usuario, tarjeta: data.tarjeta });
    return data;
  },

  // ─── Login usuario ────────────────────────────
  login: async (email, contrasena) => {
    const { data } = await authAPI.login({ email, contrasena });
    await SecureStore.setItemAsync('access_token', data.access_token);
    set({ usuario: data.usuario, tarjeta: data.tarjeta });
    return data;
  },

  // ─── Login admin ──────────────────────────────
  loginAdmin: async (email, contrasena) => {
    const { data } = await authAPI.loginAdmin({ email, contrasena });
    await SecureStore.setItemAsync('access_token', data.access_token);
    set({ admin: data.admin });
    return data;
  },

  // ─── Logout ───────────────────────────────────
  logout: async () => {
    try { await authAPI.logout(); } catch {}
    await SecureStore.deleteItemAsync('access_token');
    set({ usuario: null, tarjeta: null, admin: null });
  },

  // ─── Actualizar tarjeta ───────────────────────
  actualizarTarjeta: (tarjeta) => set({ tarjeta }),
}));

export default useAuthStore;
