import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error instanceof AxiosError && error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_email');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export interface ApiError {
  statusCode: number;
  message: string;
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof AxiosError && error.response) {
    return {
      statusCode: error.response.status,
      message: error.response.data?.message || error.message,
    };
  }
  return { statusCode: 500, message: 'An unexpected error occurred' };
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<{ access_token: string; user: { id: string; email: string; role: string } }> => {
    const { data } = await api.post<{ access_token: string; user: { id: string; email: string; role: string } }>('/auth/login', { email, password });
    return data;
  },
};

// Dashboard API
export const adminDashboardApi = {
  getStats: async () => {
    const { data } = await api.get('/admin/dashboard');
    return data;
  },
};

// Customers API
export const adminCustomersApi = {
  list: async (page = 1, limit = 10) => {
    const { data } = await api.get('/admin/customers', { params: { page, limit } });
    return data;
  },
  getOne: async (id: string) => {
    const { data } = await api.get(`/admin/customers/${id}`);
    return data;
  },
  create: async (customer_code: string, name: string) => {
    const { data } = await api.post('/admin/customers', { customer_code, name });
    return data;
  },
  update: async (id: string, body: { name?: string }) => {
    const { data } = await api.patch(`/admin/customers/${id}`, body);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/admin/customers/${id}`);
  },
};

// Stocks API
export const adminStocksApi = {
  list: async () => {
    const { data } = await api.get('/admin/stocks');
    return data;
  },
  create: async (stock_code: string, name: string) => {
    const { data } = await api.post('/admin/stocks', { stock_code, name });
    return data;
  },
  update: async (id: string, body: { stock_code?: string; name?: string }) => {
    const { data } = await api.patch(`/admin/stocks/${id}`, body);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/admin/stocks/${id}`);
  },
};

// Policies API
export const adminPoliciesApi = {
  list: async () => {
    const { data } = await api.get('/admin/policies');
    return data;
  },
  getOne: async (id: string) => {
    const { data } = await api.get(`/admin/policies/${id}`);
    return data;
  },
  create: async (body: { policy_code: string; name: string; policy_stocks: { stock_id: string; weight: number }[] }) => {
    const { data } = await api.post('/admin/policies', body);
    return data;
  },
  update: async (id: string, body: { name?: string; policy_stocks?: { stock_id: string; weight: number }[] }) => {
    const { data } = await api.patch(`/admin/policies/${id}`, body);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/admin/policies/${id}`);
  },
};

// Portfolios API
export const adminPortfoliosApi = {
  list: async () => {
    const { data } = await api.get('/admin/portfolios');
    return data;
  },
  getOne: async (id: string) => {
    const { data } = await api.get(`/admin/portfolios/${id}`);
    return data;
  },
};

// Orders API
export const adminOrdersApi = {
  list: async (status?: string) => {
    const params = status ? { status } : {};
    const { data } = await api.get('/admin/orders', { params });
    return data;
  },
  getOne: async (id: string) => {
    const { data } = await api.get(`/admin/orders/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/admin/orders/${id}/status`, { status });
    return data;
  },
};
