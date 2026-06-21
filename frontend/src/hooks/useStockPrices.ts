import { useState, useEffect, useCallback, useRef } from 'react';
import { Stock } from '../types/stock.types';
import { stocksApi, parseApiError, ApiError } from '../api/client';

export function useStockPrices() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStocks = useCallback(async () => {
    try {
      setError(null);
      const data = await stocksApi.list();
      setStocks(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchStocks();

    intervalRef.current = setInterval(() => {
      fetchStocks();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStocks]);

  return { stocks, loading, error, refetch: fetchStocks };
}
