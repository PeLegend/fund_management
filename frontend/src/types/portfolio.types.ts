import { Policy } from './policy.types';
import { Order } from './order.types';

export interface Portfolio {
  id: string;
  portfolio_code: string;
  customer_id: string;
  policy_id: string;
  created_at: string;
  policy: Policy;
  orders?: Order[];
}
