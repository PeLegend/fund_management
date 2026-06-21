import { useMemo } from 'react';
import { Holding } from '../types/portfolio.types';

interface PortfolioChartProps {
  holdings: Holding[];
}

export default function PortfolioChart({ holdings }: PortfolioChartProps) {
  const chartData = useMemo(() => {
    if (holdings.length === 0) return [];

    const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
    let accumulated = 0;

    return holdings.map((h) => {
      const startPercent = (accumulated / totalValue) * 100;
      accumulated += h.current_value;
      const endPercent = (accumulated / totalValue) * 100;

      return {
        stock_code: h.stock_code,
        weight: h.weight,
        value: h.current_value,
        percent: (h.current_value / totalValue) * 100,
        start: startPercent,
        end: endPercent,
      };
    });
  }, [holdings]);

  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#f97316', // orange
    '#eab308', // yellow
  ];

  if (holdings.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <p className="text-white/40 text-center">No holdings yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
        Portfolio Allocation
      </h3>

      {/* Allocation bar */}
      <div className="relative h-4 rounded-full overflow-hidden bg-white/5">
        {chartData.map((d, i) => (
          <div
            key={d.stock_code}
            className="absolute h-full transition-all duration-500"
            style={{
              left: `${d.start}%`,
              width: `${d.end - d.start}%`,
              backgroundColor: colors[i % colors.length],
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {chartData.map((d, i) => (
          <div key={d.stock_code} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-white/60">{d.stock_code}</span>
            <span className="font-semibold ml-auto">{d.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
