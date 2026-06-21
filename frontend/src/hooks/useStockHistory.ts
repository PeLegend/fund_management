import { useState, useEffect, useCallback } from 'react';
import { StockPriceHistory } from '../types/stock.types';
import { stocksApi, parseApiError, ApiError } from '../api/client';

export function useStockHistory(stockCode: string | null, days = 30) {
  const [history, setHistory] = useState<StockPriceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!stockCode) return;

    try {
      setLoading(true);
      setError(null);
      const data = await stocksApi.getHistory(stockCode, days);
      setHistory(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [stockCode, days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, error, refetch: fetchHistory };
}
