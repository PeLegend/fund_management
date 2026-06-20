export interface PolicyStock {
  id: string;
  policy_id: string;
  stock_id: string;
  weight: number;
  stock: {
    id: string;
    stock_code: string;
    name: string;
  };
}

export interface Policy {
  id: string;
  policy_code: string;
  name: string;
  created_at: string;
  policy_stocks: PolicyStock[];
}
