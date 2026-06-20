import { useState, useEffect, useCallback, useRef } from 'react';
import { Order } from '../types/order.types';
import { ordersApi, parseApiError, ApiError } from '../api/client';

export function useOrders(portfolioCode: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!portfolioCode) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.list(portfolioCode);
      setOrders(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [portfolioCode]);

  // Polling logic
  useEffect(() => {
    if (!portfolioCode) return;

    fetchOrders();

    intervalRef.current = setInterval(() => {
      setOrders((prev) => {
        const hasActive = prev.some(
          (o) => o.status === 'PENDING' || o.status === 'PROCESSING',
        );
        if (hasActive) {
          fetchOrders();
        }
        return prev;
      });
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [portfolioCode, fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}
