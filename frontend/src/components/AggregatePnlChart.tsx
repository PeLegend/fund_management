import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Portfolio, PnlDataPoint, Holding } from '../types/portfolio.types';
import { stocksApi } from '../api/client';

interface AggregatePnlChartProps {
  portfolios: Portfolio[];
}

type Timeframe = '1D' | '1W' | '1M';

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
];

const CHART_HEIGHT = 200;

export default function AggregatePnlChart({ portfolios }: AggregatePnlChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mouseIdx, setMouseIdx] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [rawData, setRawData] = useState<PnlDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const prevKey = useRef('');

  // Aggregate holdings from all portfolios
  const aggregateHoldings = useMemo(() => {
    const holdingsMap = new Map<string, { units: number; investedAmount: number; stockCode: string }>();

    portfolios.forEach(p => {
      (p.holdings || []).forEach((h: Holding) => {
        const existing = holdingsMap.get(h.stock_code) || { units: 0, investedAmount: 0, stockCode: h.stock_code };
        existing.units += h.units || 0;
        existing.investedAmount += h.invested_amount || 0;
        holdingsMap.set(h.stock_code, existing);
      });
    });

    return Array.from(holdingsMap.values()).filter(h => h.units > 0);
  }, [portfolios]);

  // Key for cache busting
  const holdingsKey = aggregateHoldings.map(h => `${h.stockCode}:${h.units}`).join('|');

  // Compute data from holdings + stock price history
  useEffect(() => {
    if (aggregateHoldings.length === 0) {
      setRawData([]);
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

      try {
        const stockCodes = aggregateHoldings.map(h => h.stockCode);
        const histories = await Promise.all(
          stockCodes.map(code => stocksApi.getHistory(code, 365))
        );

        if (cancelled) return;

        const priceMap = new Map<string, Map<string, number>>();
        stockCodes.forEach((code, i) => {
          const dateMap = new Map<string, number>();
          histories[i].forEach(h => {
            const dateStr = h.recorded_at.split('T')[0];
            dateMap.set(dateStr, Number(h.price));
          });
          priceMap.set(code, dateMap);
        });

        // Find earliest date
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

        const dates: string[] = [];
        const cursor = new Date(earliestDate);
        while (cursor <= today) {
          dates.push(cursor.toISOString().split('T')[0]);
          cursor.setDate(cursor.getDate() + 1);
        }

        let sampledDates = dates;
        if (dates.length > 60) {
          const step = Math.ceil(dates.length / 60);
          sampledDates = dates.filter((_, i) => i % step === 0);
          if (sampledDates[sampledDates.length - 1] !== dates[dates.length - 1]) {
            sampledDates.push(dates[dates.length - 1]);
          }
        }

        const totalInvested = aggregateHoldings.reduce((sum, h) => sum + h.investedAmount, 0);

        const result: PnlDataPoint[] = sampledDates.map(dateStr => {
          let totalValue = 0;

          aggregateHoldings.forEach(h => {
            const dateMap = priceMap.get(h.stockCode);
            let price = 0;
            if (dateMap) {
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

          return { date: dateStr, value: totalValue, invested: totalInvested, gain, gainPercent };
        });

        if (!cancelled) {
          setRawData(result);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    compute();
    return () => { cancelled = true; };
  }, [holdingsKey, aggregateHoldings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter by timeframe
  const data = useMemo(() => {
    if (rawData.length === 0) return [];
    const now = new Date();
    const cutoff = new Date(now);
    switch (timeframe) {
      case '1D': cutoff.setDate(cutoff.getDate() - 1); break;
      case '1W': cutoff.setDate(cutoff.getDate() - 7); break;
      default: cutoff.setMonth(cutoff.getMonth() - 1); break;
    }
    const filtered = rawData.filter(d => new Date(d.date) >= cutoff);
    return filtered.length > 0 ? filtered : (rawData.length > 0 ? [rawData[rawData.length - 1]] : []);
  }, [rawData, timeframe]);

  const processedData = useMemo(() => {
    if (data.length === 0) return { points: [], minVal: 0, maxVal: 0, yScale: 1 };
    const values = data.map(d => d.value).filter(v => v > 0);
    if (values.length === 0) return { points: [], minVal: 0, maxVal: 0, yScale: 1 };
    const minVal = Math.min(...values) * 0.9;
    const maxVal = Math.max(...values) * 1.1;
    const yRange = maxVal - minVal || 1;
    const points = data.map((d, i) => ({
      x: data.length === 1 ? 50 : (i / (data.length - 1)) * 100,
      y: d.value > 0 ? 100 - ((d.value - minVal) / yRange) * 80 - 10 : 90,
      ...d,
    }));
    return { points, minVal, maxVal, yScale: yRange };
  }, [data]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (processedData.points.length === 0 || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      let nearest = 0;
      let minDist = Infinity;
      processedData.points.forEach((p, i) => {
        const dist = Math.abs(p.x - xPercent);
        if (dist < minDist) { minDist = dist; nearest = i; }
      });
      setMouseIdx(nearest);
    },
    [processedData.points]
  );

  const handleMouseLeave = useCallback(() => setMouseIdx(null), []);

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]">
        <div className="h-[180px] md:h-[240px] bg-white/[0.03] rounded-lg animate-pulse" />
      </div>
    );
  }

  if (data.length === 0 || processedData.points.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]">
        <p className="text-[11px] font-mono text-white/30 font-bold uppercase tracking-widest mb-4">
          Combined Portfolio Value
        </p>
        <div className="h-[120px] md:h-[160px] flex items-center justify-center">
          <p className="text-xs text-white/30">No order history yet</p>
        </div>
      </div>
    );
  }

  const { points } = processedData;
  const isPositive = points.length >= 2 ? points[points.length - 1].value >= points[0].value : true;
  const strokeColor = isPositive ? '#00a87e' : '#e23b4a';
  const hoverPoint = mouseIdx !== null ? points[mouseIdx] : null;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  const yLabels = [0, 2, 4].map(i => {
    const fraction = i / 4;
    const value = processedData.minVal + processedData.yScale * (1 - fraction) * 0.8 + processedData.yScale * 0.1;
    return { y: fraction * 100, label: value };
  });

  // X-axis: show first, middle, last date — skip if duplicates
  const uniqueDates = new Map<string, number>();
  points.forEach(p => {
    if (!uniqueDates.has(p.date)) uniqueDates.set(p.date, p.x);
  });
  const dateEntries = Array.from(uniqueDates.entries());
  const xLabels = dateEntries.length >= 3
    ? [
        { x: dateEntries[0][1], label: formatDate(dateEntries[0][0]) },
        { x: dateEntries[Math.floor(dateEntries.length / 2)][1], label: formatDate(dateEntries[Math.floor(dateEntries.length / 2)][0]) },
        { x: dateEntries[dateEntries.length - 1][1], label: formatDate(dateEntries[dateEntries.length - 1][0]) },
      ]
    : dateEntries.map(([date, x]) => ({ x, label: formatDate(date) }));

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 space-y-3 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-mono text-white/30 font-bold uppercase tracking-widest">
          Combined Portfolio Value
        </p>
        <div className="flex gap-0.5 bg-white/[0.04] rounded-full p-0.5">
          {TIMEFRAME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTimeframe(opt.value)}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition-all duration-200 ${
                timeframe === opt.value ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {hoverPoint && (
          <div
            className="absolute z-10 pointer-events-none px-3 py-2 rounded-lg text-xs font-mono"
            style={{
              left: `${hoverPoint.x}%`,
              top: '8px',
              transform: `translateX(${hoverPoint.x > 70 ? '-100%' : hoverPoint.x < 10 ? '0' : '-50%'})`,
              background: 'rgba(0,0,0,0.88)',
              border: '1px solid rgba(255,255,255,0.12)',
              minWidth: '140px',
            }}
          >
            <div className="text-white/50 mb-1">{hoverPoint.date}</div>
            <div className="text-white font-bold text-sm">
              ฿{hoverPoint.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full cursor-crosshair"
          style={{ height: CHART_HEIGHT }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="agg-pnl-gradient-up" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00a87e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00a87e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="agg-pnl-gradient-down" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e23b4a" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#e23b4a" stopOpacity="0" />
            </linearGradient>
          </defs>

          {yLabels.map((label, i) => (
            <line key={`h-${i}`} x1="0" y1={label.y} x2="100" y2={label.y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.3" />
          ))}

          <path d={areaPath} fill={`url(#agg-pnl-gradient-${isPositive ? 'up' : 'down'})`} />
          <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="0.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />

          {hoverPoint && (
            <>
              <line x1={hoverPoint.x} y1={0} x2={hoverPoint.x} y2={100} stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" strokeDasharray="1 1" />
              <circle cx={hoverPoint.x} cy={hoverPoint.y} r="1.5" fill={strokeColor} stroke="white" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>

        <div className="absolute left-0 top-0 h-full pointer-events-none" style={{ paddingTop: 20 }}>
          {yLabels.map((label, i) => (
            <div key={`yl-${i}`} className="absolute text-[10px] font-mono text-white/30" style={{ top: `${label.y}%`, transform: 'translateY(-50%)', right: '4px' }}>
              ฿{(label.label / 1000).toFixed(0)}k
            </div>
          ))}
        </div>

        <div className="relative flex justify-between mt-1 px-0">
          {xLabels.map((label, i) => (
            <span key={`xl-${i}`} className="text-[10px] font-mono text-white/30"
              style={{ position: 'absolute', left: `${label.x}%`, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
              {label.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
