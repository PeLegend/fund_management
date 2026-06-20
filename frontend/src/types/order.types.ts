export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface OrderStock {
  id: string;
  order_id: string;
  stock_id: string;
  weight: number;
  allocated_amount: number;
  stock: {
    id: string;
    stock_code: string;
    name: string;
  };
}

export interface Order {
  id: string;
  order_code: string;
  portfolio_id: string;
  amount: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  order_stocks: OrderStock[];
}
