export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type OrderType = 'BUY' | 'SELL';

export interface OrderStock {
  id: string;
  order_id: string;
  stock_id: string;
  weight: number;
  allocated_amount: number;
  units: number;
  purchase_price: number;
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
  order_type: OrderType;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  order_stocks: OrderStock[];
}
