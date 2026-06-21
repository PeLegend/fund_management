export interface Stock {
  id: string;
  stock_code: string;
  name: string;
  current_price: number;
  previous_close: number;
  price_change: number;
  price_change_percent: number;
  created_at: string;
}

export interface StockPriceHistory {
  id: string;
  stock_id: string;
  price: number;
  recorded_at: string;
}
