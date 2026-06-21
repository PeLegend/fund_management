import { useState, useEffect, useRef } from 'react';
import { Portfolio, PnlDataPoint, Holding } from '../types/portfolio.types';
import { stocksApi } from '../api/client';

interface UsePnlHistoryResult {
  data: PnlDataPoint[];
  loading: boolean;
  error: string | null;
}

export function usePnlHistory(portfolio: Portfolio | null): UsePnlHistoryResult {
  const [data, setData] = useState<PnlDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevKey = useRef('');

  // Key based on current holdings snapshot
  const holdingsKey = portfolio?.holdings
    ? portfolio.holdings.map(h => `${h.stock_code}:${h.units}`).join('|')
    : '';

  useEffect(() => {
    if (!portfolio || !holdingsKey) {
      setData([]);
      prevKey.current = '';
      return;
    }

    if (holdingsKey === prevKey.current) {
      if (loading) setLoading(false);
      return;
    }
    prevKey.current = holdingsKey;

    let cancelled = false;

    async function compute() {
      setLoading(true);
      setError(null);

      try {
        const holdings = portfolio!.holdings || [];
        if (holdings.length === 0) {
          if (!cancelled) {
            setData([]);
            setLoading(false);
          }
          return;
        }

        // Fetch price history for all held stocks
        const stockCodes = holdings.map((h: Holding) => h.stock_code);
        const histories = await Promise.all(
          stockCodes.map(code => stocksApi.getHistory(code, 365))
        );

        if (cancelled) return;

        // Build price lookup: stockCode -> dateStr -> price
        const priceMap = new Map<string, Map<string, number>>();
        stockCodes.forEach((code, i) => {
          const dateMap = new Map<string, number>();
          histories[i].forEach(h => {
            const dateStr = h.recorded_at.split('T')[0];
            dateMap.set(dateStr, Number(h.price));
          });
          priceMap.set(code, dateMap);
        });

        // Find the earliest price date across all stocks
        let earliestDate = new Date();
        priceMap.forEach(dateMap => {
          dateMap.forEach((_, dateStr) => {
            const d = new Date(dateStr);
            if (d < earliestDate) earliestDate = d;
          });
        });

        const today = new Date();
        earliestDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // Generate daily dates
        const dates: string[] = [];
        const cursor = new Date(earliestDate);
        while (cursor <= today) {
          dates.push(cursor.toISOString().split('T')[0]);
          cursor.setDate(cursor.getDate() + 1);
        }

        // Sample to ~60 points
        let sampledDates = dates;
        if (dates.length > 60) {
          const step = Math.ceil(dates.length / 60);
          sampledDates = dates.filter((_, i) => i % step === 0);
          if (sampledDates[sampledDates.length - 1] !== dates[dates.length - 1]) {
            sampledDates.push(dates[dates.length - 1]);
          }
        }

        // Compute portfolio value at each date using current holdings units
        const totalInvested = holdings.reduce((sum: number, h: Holding) => sum + (h.invested_amount || 0), 0);

        const result: PnlDataPoint[] = sampledDates.map(dateStr => {
          let totalValue = 0;

          holdings.forEach((h: Holding) => {
            if (h.units <= 0) return;

            const dateMap = priceMap.get(h.stock_code);
            let price = 0;
            if (dateMap) {
              // Find closest price on or before this date
              const d = new Date(dateStr);
              for (let lookback = 0; lookback < 7; lookback++) {
                const key = d.toISOString().split('T')[0];
                if (dateMap.has(key)) {
                  price = dateMap.get(key)!;
                  break;
                }
                d.setDate(d.getDate() - 1);
              }
            }

            totalValue += h.units * price;
          });

          const gain = totalInvested > 0 ? totalValue - totalInvested : 0;
          const gainPercent = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

          return {
            date: dateStr,
            value: totalValue,
            invested: totalInvested,
            gain,
            gainPercent,
          };
        });

        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to compute PNL history');
          setLoading(false);
        }
      }
    }

    compute();

    return () => {
      cancelled = true;
    };
  }, [holdingsKey, portfolio]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
}
