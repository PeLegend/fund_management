import { useState, useMemo, useCallback, useRef } from 'react';
import { PnlDataPoint } from '../types/portfolio.types';

interface PnlChartProps {
  data: PnlDataPoint[];
  loading?: boolean;
}

type Timeframe = '1D' | '1W' | '1M';

const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
];

const CHART_PADDING = { top: 20, right: 70, bottom: 30, left: 10 };

export default function PnlChart({ data, loading }: PnlChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mouseIdx, setMouseIdx] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');

  // Filter data by timeframe
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];

    const now = new Date();
    const cutoff = new Date(now);

    switch (timeframe) {
      case '1D':
        cutoff.setDate(cutoff.getDate() - 1);
        break;
      case '1W':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case '1M':
      default:
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
    }

    const filtered = data.filter(d => new Date(d.date) >= cutoff);
    // Always include at least the last data point
    if (filtered.length === 0 && data.length > 0) {
      return [data[data.length - 1]];
    }
    return filtered;
  }, [data, timeframe]);

  const processedData = useMemo(() => {
    if (filteredData.length === 0) return { points: [], minVal: 0, maxVal: 0, yScale: 1 };

    const values = filteredData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = (maxVal - minVal) * 0.1 || maxVal * 0.1 || 100;
    const adjustedMin = minVal - padding;
    const adjustedMax = maxVal + padding;
    const yRange = adjustedMax - adjustedMin || 1;

    const points = filteredData.map((d, i) => ({
      x: filteredData.length === 1 ? 50 : (i / (filteredData.length - 1)) * 100,
      y: 100 - ((d.value - adjustedMin) / yRange) * 80 - 10,
      ...d,
    }));

    return { points, minVal: adjustedMin, maxVal: adjustedMax, yScale: yRange };
  }, [filteredData]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (processedData.points.length === 0 || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;

      let nearest = 0;
      let minDist = Infinity;
      processedData.points.forEach((p, i) => {
        const dist = Math.abs(p.x - xPercent);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      });

      setMouseIdx(nearest);
    },
    [processedData.points]
  );

  const handleMouseLeave = useCallback(() => {
    setMouseIdx(null);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (processedData.points.length === 0 || !svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const xPercent = ((touch.clientX - rect.left) / rect.width) * 100;

      let nearest = 0;
      let minDist = Infinity;
      processedData.points.forEach((p, i) => {
        const dist = Math.abs(p.x - xPercent);
        if (dist < minDist) {
          minDist = dist;
          nearest = i;
        }
      });

      setMouseIdx(nearest);
    },
    [processedData.points]
  );

  const handleTouchEnd = useCallback(() => {
    setMouseIdx(null);
  }, []);

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
          Portfolio Value
        </p>
        <div className="h-[120px] md:h-[160px] flex items-center justify-center">
          <p className="text-xs text-white/30">No order history yet</p>
        </div>
      </div>
    );
  }

  const { points } = processedData;
  const isPositive = points.length >= 2
    ? points[points.length - 1].value >= points[0].value
    : true;
  const strokeColor = isPositive ? '#00a87e' : '#e23b4a';
  const hoverPoint = mouseIdx !== null ? points[mouseIdx] : null;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  const yLabels = [0, 1, 2, 3, 4].map(i => {
    const fraction = i / 4;
    const value = processedData.minVal + processedData.yScale * (1 - fraction) * 0.8 + processedData.yScale * 0.1;
    const y = fraction * 100;
    return { y, label: value };
  });

  // X-axis: show first, middle, last unique dates
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
          Portfolio Value
        </p>
        <div className="flex gap-0.5 bg-white/[0.04] rounded-full p-0.5">
          {TIMEFRAME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTimeframe(opt.value)}
              className={`px-2 py-0.5 md:px-2.5 md:py-1 text-[9px] md:text-[10px] font-semibold rounded-full transition-all duration-200 ${
                timeframe === opt.value
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        {/* Hover tooltip */}
        {hoverPoint && (
          <div
            className="absolute z-10 pointer-events-none px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg text-[10px] md:text-xs font-mono"
            style={{
              left: `${hoverPoint.x}%`,
              top: '8px',
              transform: `translateX(${hoverPoint.x > 70 ? '-100%' : hoverPoint.x < 10 ? '0' : '-50%'})`,
              background: 'rgba(0,0,0,0.88)',
              border: '1px solid rgba(255,255,255,0.12)',
              minWidth: '130px',
            }}
          >
            <div className="text-white/50 mb-1">{hoverPoint.date}</div>
            <div className="text-white font-bold text-sm">
              ฿{hoverPoint.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-white/60 mt-1">
              Invested: ฿{hoverPoint.invested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className={hoverPoint.gain >= 0 ? 'text-revolut-teal' : 'text-revolut-danger'}>
              P/L: {hoverPoint.gain >= 0 ? '+' : ''}฿{hoverPoint.gain.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {' '}
              ({hoverPoint.gainPercent >= 0 ? '+' : ''}{hoverPoint.gainPercent.toFixed(2)}%)
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full cursor-crosshair h-[160px] md:h-[220px]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <defs>
            <linearGradient id="pnl-gradient-up" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00a87e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00a87e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="pnl-gradient-down" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e23b4a" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#e23b4a" stopOpacity="0" />
            </linearGradient>
          </defs>

          {yLabels.map((label, i) => (
            <line
              key={`h-${i}`}
              x1="0" y1={label.y} x2="100" y2={label.y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="0.3"
            />
          ))}

          <path d={areaPath} fill={`url(#pnl-gradient-${isPositive ? 'up' : 'down'})`} />
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {hoverPoint && (
            <>
              <line
                x1={hoverPoint.x} y1={0} x2={hoverPoint.x} y2={100}
                stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" strokeDasharray="1 1"
              />
              <circle
                cx={hoverPoint.x} cy={hoverPoint.y} r="1.5"
                fill={strokeColor} stroke="white" strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
        </svg>

        <div className="absolute left-0 top-0 h-full pointer-events-none" style={{ paddingTop: CHART_PADDING.top }}>
          {yLabels.map((label, i) => (
            <div
              key={`yl-${i}`}
              className="absolute text-[8px] md:text-[10px] font-mono text-white/30"
              style={{ top: `${label.y}%`, transform: 'translateY(-50%)', right: '4px' }}
            >
              ฿{(label.label / 1000).toFixed(0)}k
            </div>
          ))}
        </div>

        <div className="relative mt-1 px-0" style={{ height: '16px' }}>
          {xLabels.map((label, i) => (
            <span
              key={`xl-${i}`}
              className="absolute text-[8px] md:text-[10px] font-mono text-white/30"
              style={{ left: `${label.x}%`, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}
            >
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
