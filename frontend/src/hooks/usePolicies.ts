import { useState, useEffect, useCallback } from 'react';
import { Policy } from '../types/policy.types';
import { policiesApi, parseApiError, ApiError } from '../api/client';

export function usePolicies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await policiesApi.list();
      setPolicies(data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  return { policies, loading, error, refetch: fetchPolicies };
}
