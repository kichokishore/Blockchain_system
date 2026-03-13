import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getUsers: () => api.get('/auth/users'),
};

// ─── Wallets ──────────────────────────────────────────
export const walletAPI = {
  create: (walletName, password) => api.post('/wallets', { walletName, password }),
  getAll: () => api.get('/wallets'),
  getDetails: (address) => api.get(`/wallets/${address}`),
  import: (mnemonic, password, walletName) => api.post('/wallets/import', { mnemonic, password, walletName }),
  export: (address, password) => api.post(`/wallets/${address}/export`, { password }),
  rename: (address, name) => api.put(`/wallets/${address}/rename`, { name }),
};

// ─── Transactions ─────────────────────────────────────
export const txAPI = {
  create: (data) => api.post('/transactions', data),
  getPending: () => api.get('/transactions/pending'),
  mine: (minerAddress) => api.post('/transactions/mine', { minerAddress }),
  getById: (txId) => api.get(`/transactions/${txId}`),
  getForAddress: (address, params) => api.get(`/addresses/${address}/transactions`, { params }),
  getAuditLog: (params) => api.get('/transactions/audit', { params }),
  getAnalytics: (days) => api.get('/transactions/analytics', { params: { days } }),
};

// ─── Smart Contracts ──────────────────────────────────
export const contractAPI = {
  deploy: (data) => api.post('/contracts', data),
  getAll: () => api.get('/contracts'),
  getById: (id) => api.get(`/contracts/${id}`),
  call: (contractId, data) => api.post(`/contracts/${contractId}/call`, data),
  getTransactions: (id) => api.get(`/contracts/${id}/transactions`),
};

// ─── Explorer ─────────────────────────────────────────
export const explorerAPI = {
  getChain: (params) => api.get('/explorer/chain', { params }),
  getBlock: (identifier) => api.get(`/explorer/blocks/${identifier}`),
  getStats: () => api.get('/explorer/stats'),
  validate: () => api.get('/explorer/validate'),
  search: (q) => api.get('/explorer/search', { params: { q } }),
};

export default api;
