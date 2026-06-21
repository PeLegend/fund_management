import { useState, useMemo } from 'react';
import { StockPriceHistory } from '../types/stock.types';

interface StockChartProps {
  history: StockPriceHistory[];
  stockCode: string;
  loading?: boolean;
}

export default function StockChart({ history, stockCode, loading }: StockChartProps) {
  const [timeframe, setTimeframe] = useState<'1W' | '1M'>('1M');

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const daysToShow = timeframe === '1W' ? 7 : 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToShow);

    return history.filter(h => new Date(h.recorded_at) >= startDate);
  }, [history, timeframe]);

  const chartData = useMemo(() => {
    if (filteredHistory.length === 0) return [];

    const prices = filteredHistory.map(h => Number(h.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    return filteredHistory.map((h, i) => ({
      x: (i / (filteredHistory.length - 1)) * 100,
      y: ((Number(h.price) - minPrice) / range) * 80 + 10,
      price: Number(h.price),
      date: new Date(h.recorded_at).toLocaleDateString('th-TH'),
    }));
  }, [filteredHistory]);

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="h-40 bg-white/5 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <p className="text-white/40 text-center">No price data available</p>
      </div>
    );
  }

  const isUp = chartData[chartData.length - 1].price >= chartData[0].price;
  const strokeColor = isUp ? '#4ade80' : '#f87171';

  // Create SVG path
  const pathD = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.x} ${d.y}`).join(' ');
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          {stockCode} Price Chart
        </h3>
        <div className="flex gap-1">
          {(['1W', '1M'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                timeframe === tf
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-40">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.5"
            />
          ))}

          {/* Area fill */}
          <path
            d={areaD}
            fill={`url(#gradient-${isUp ? 'up' : 'down'})`}
            opacity="0.3"
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="gradient-up" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient-down" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f87171" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Price labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-white/40">
          <span>{filteredHistory.length > 0 ? `฿${Math.max(...filteredHistory.map(h => Number(h.price))).toLocaleString()}` : ''}</span>
          <span>{filteredHistory.length > 0 ? `฿${Math.min(...filteredHistory.map(h => Number(h.price))).toLocaleString()}` : ''}</span>
        </div>
      </div>

      {/* Current price */}
      {chartData.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/40">
            {chartData[chartData.length - 1].date}
          </span>
          <span className="font-semibold">
            ฿{chartData[chartData.length - 1].price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}
