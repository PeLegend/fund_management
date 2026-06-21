import { Policy } from './policy.types';
import { Order } from './order.types';

export interface Holding {
  stock_code: string;
  stock_name: string;
  units: number;
  purchase_price: number;
  current_price: number;
  invested_amount: number;
  current_value: number;
  gain_amount: number;
  gain_percent: number;
  weight: number;
}

export interface Portfolio {
  id: string;
  portfolio_code: string;
  customer_id: string;
  policy_id: string;
  created_at: string;
  policy: Policy;
  orders?: Order[];
  current_value?: number;
  total_invested?: number;
  gain_amount?: number;
  gain_percent?: number;
  pending_amount?: number;
  holdings?: Holding[];
}

export interface PnlDataPoint {
  date: string;
  value: number;
  invested: number;
  gain: number;
  gainPercent: number;
}
