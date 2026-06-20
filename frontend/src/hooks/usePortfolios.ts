import { useState, useEffect, useCallback } from 'react';
import { Portfolio } from '../types/portfolio.types';
import { portfoliosApi, parseApiError, ApiError } from '../api/client';

export function usePortfolios(customerCode: string | null) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchPortfolios = useCallback(async () => {
    if (!customerCode) return;
    setLoading(true);
    setError(null);
    try {
      const data = await portfoliosApi.list(customerCode);
      setPortfolios(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [customerCode]);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  return { portfolios, loading, error, refetch: fetchPortfolios };
}
