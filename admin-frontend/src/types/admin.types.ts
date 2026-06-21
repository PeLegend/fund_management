export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type OrderType = 'BUY' | 'SELL';

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  created_at: string;
}

export interface Stock {
  id: string;
  stock_code: string;
  name: string;
  created_at: string;
}

export interface PolicyStock {
  id: string;
  policy_id: string;
  stock_id: string;
  weight: number;
  stock: Stock;
}

export interface Policy {
  id: string;
  policy_code: string;
  name: string;
  created_at: string;
  policy_stocks: PolicyStock[];
}

export interface Portfolio {
  id: string;
  portfolio_code: string;
  customer_id: string;
  policy_id: string;
  created_at: string;
  customer: Customer;
  policy: Policy;
  orders?: Order[];
}

export interface OrderStock {
  id: string;
  order_id: string;
  stock_id: string;
  weight: number;
  allocated_amount: number;
  stock: Stock;
}

export interface Order {
  id: string;
  order_code: string;
  portfolio_id: string;
  amount: number;
  order_type: OrderType;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  order_stocks: OrderStock[];
  portfolio?: Portfolio;
}

export interface DashboardStats {
  totalCustomers: number;
  totalStocks: number;
  totalPolicies: number;
  totalPortfolios: number;
  totalOrders: number;
  ordersByStatus: { status: OrderStatus; count: number }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
