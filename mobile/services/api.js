import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Interceptor: adjunta access token ────────
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Interceptor: refresca token si expira ────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });
        await SecureStore.setItemAsync('access_token', data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────
export const authAPI = {
  registro: (datos) => api.post('/auth/registro', datos),
  login: (datos) => api.post('/auth/login', datos),
  loginAdmin: (datos) => api.post('/auth/admin/login', datos),
  logout: () => api.post('/auth/logout'),
  perfil: () => api.get('/auth/perfil'),
};

// ─── QR ───────────────────────────────────────
export const qrAPI = {
  generarQR: () => api.get('/qr/generar'),
  escanear: (datos) => api.post('/qr/escanear', datos),
  infoCliente: (datos) => api.post('/qr/info', datos),
};

// ─── Cupones ──────────────────────────────────
export const couponAPI = {
  listar: () => api.get('/coupons'),
  detalle: (id) => api.get(`/coupons/${id}`),
  canjear: (coupon_id) => api.post('/coupons/canjear', { coupon_id }),
};

// ─── Historial ────────────────────────────────
export const transactionAPI = {
  historial: (pagina = 1) => api.get(`/transactions/historial?pagina=${pagina}`),
};

// ─── Admin ────────────────────────────────────
export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  cupones: () => api.get('/admin/cupones'),
  historialDia: (fecha) => api.get(`/admin/historial${fecha ? `?fecha=${fecha}` : ''}`),
  crearCupon: (datos) => api.post('/coupons/admin/crear', datos),
  actualizarCupon: (id, datos) => api.put(`/coupons/admin/${id}`, datos),
};

export default api;
