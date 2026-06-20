import axios, { AxiosError } from 'axios';
import { Policy } from '../types/policy.types';
import { Portfolio } from '../types/portfolio.types';
import { Order } from '../types/order.types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

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

// Policies API
export const policiesApi = {
  list: async (): Promise<Policy[]> => {
    const { data } = await api.get<Policy[]>('/policies');
    return data;
  },
  getByCode: async (policy_code: string): Promise<Policy> => {
    const { data } = await api.get<Policy>(`/policies/${policy_code}`);
    return data;
  },
};

// Portfolios API
export const portfoliosApi = {
  list: async (customer_code: string): Promise<Portfolio[]> => {
    const { data } = await api.get<Portfolio[]>('/portfolios', {
      params: { customer_code },
    });
    return data;
  },
  create: async (customer_code: string, policy_code: string): Promise<Portfolio> => {
    const { data } = await api.post<Portfolio>('/portfolios', {
      customer_code,
      policy_code,
    });
    return data;
  },
};

// Orders API
export const ordersApi = {
  list: async (portfolio_code: string): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/orders', {
      params: { portfolio_code },
    });
    return data;
  },
  create: async (portfolio_code: string, amount: number): Promise<Order> => {
    const { data } = await api.post<Order>('/orders', {
      portfolio_code,
      amount,
    });
    return data;
  },
  cancel: async (order_code: string): Promise<Order> => {
    const { data } = await api.patch<Order>(`/orders/${order_code}/cancel`);
    return data;
  },
};

// Customers API
export const customersApi = {
  getByCode: async (customer_code: string): Promise<{ id: string; customer_code: string; name: string }> => {
    const { data } = await api.get<{ id: string; customer_code: string; name: string }>(`/customers/${customer_code}`);
    return data;
  },
  register: async (customer_code: string, name: string): Promise<{ id: string; customer_code: string; name: string }> => {
    const { data } = await api.post<{ id: string; customer_code: string; name: string }>('/customers', {
      customer_code,
      name,
    });
    return data;
  },
};
