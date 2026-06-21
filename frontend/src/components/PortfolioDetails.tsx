import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Portfolio } from '../types/portfolio.types';
import { Button } from './ui/button';
import { calculatePortfolioPerformance, generatePerformanceHistory } from '../lib/performance';
import OrderTable from './OrderTable';
import { parseApiError, ordersApi } from '../api/client';
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react';

interface PortfolioDetailsProps {
  portfolio: Portfolio;
  onBack: () => void;
  onRefetch: () => void;
}

export default function PortfolioDetails({ portfolio, onBack, onRefetch }: PortfolioDetailsProps) {
  const navigate = useNavigate();
  const [activeInterval, setActiveInterval] = useState<'1W' | '1M' | '1Y'>('1M');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ xPct: number; yPct: number } | null>(null);

  const { totalInvested, currentValue, gainAmount, gainPercent, holdings, pendingAmount } =
    useMemo(() => calculatePortfolioPerformance(portfolio), [portfolio]);

  const isProfit = gainAmount >= 0;

  // Generate SVG line chart points
  const pointsCount = activeInterval === '1W' ? 7 : activeInterval === '1M' ? 12 : 24;
  const historyPoints = useMemo(() => {
    return generatePerformanceHistory(portfolio, activeInterval, pointsCount);
  }, [portfolio, activeInterval, pointsCount]);

  // Compute SVG Path
  const svgPath = useMemo(() => {
    if (totalInvested === 0 || historyPoints.every(p => p === 0)) {
      const emptyCoords = historyPoints.map((_, idx) => ({
        x: (idx / (historyPoints.length - 1)) * 600,
        y: 100,
      }));
      return { line: 'M 0 100 L 600 100', area: 'M 0 100 L 600 100 L 600 200 L 0 200 Z', coords: emptyCoords };
    }
    const min = Math.min(...historyPoints);
    const max = Math.max(...historyPoints);
    const range = max - min || 1;

    const coords = historyPoints.map((val, idx) => {
      const x = (idx / (historyPoints.length - 1)) * 600;
      const y = 200 - (30 + ((val - min) / range) * 140);
      return { x, y };
    });

    const linePath = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(' ');
    const areaPath = `${linePath} L 600 200 L 0 200 Z`;

    return { line: linePath, area: areaPath, coords };
  }, [historyPoints, totalInvested]);

  const handleCancelOrder = async (orderCode: string) => {
    try {
      setCancelError(null);
      await ordersApi.cancel(orderCode);
      onRefetch();
    } catch (err) {
      const apiError = parseApiError(err);
      setCancelError(apiError.message);
    }
  };

  const handleInvestMore = () => {
    navigate('/orders', {
      state: { preselectedPortfolioCode: portfolio.portfolio_code },
    });
  };

  // Get orders specifically for this portfolio
  const portfolioOrders = useMemo(() => {
    return [...(portfolio.orders || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [portfolio.orders]);

  return (
    <div className="space-y-10 view-animate text-white">
      {/* Back navigation header */}
      <div className="flex items-center gap-6 pb-6 border-b border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-2 h-10 px-4 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-mono text-3xl font-bold tracking-tight text-white">
              {portfolio.portfolio_code}
            </h2>
            <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-mono font-bold text-white/70">
              {portfolio.policy.policy_code}
            </span>
          </div>
          <p className="text-sm text-white/50 mt-1 font-medium">{portfolio.policy.name}</p>
        </div>
      </div>

      {/* Main Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 space-y-2">
          <p className="text-xs font-mono text-white/40 font-bold uppercase tracking-wider">Net Asset Value</p>
          <p className="font-mono text-3xl font-bold text-white">
            ฿{currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {pendingAmount > 0 && (
            <p className="text-xs text-revolut-warning font-semibold">
              +฿{pendingAmount.toLocaleString()} pending
            </p>
          )}
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-2">
          <p className="text-xs font-mono text-white/40 font-bold uppercase tracking-wider">Invested Capital</p>
          <p className="font-mono text-3xl font-bold text-white">
            ฿{totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-2">
          <p className="text-xs font-mono text-white/40 font-bold uppercase tracking-wider">Total Return</p>
          <p className={`font-mono text-3xl font-bold ${isProfit ? 'text-revolut-teal' : 'text-revolut-danger'}`}>
            {isProfit ? '+' : ''}
            ฿{gainAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-xs font-semibold ${isProfit ? 'text-revolut-teal' : 'text-revolut-danger'}`}>
            {isProfit ? '+' : ''}{gainPercent.toFixed(2)}% Yield
          </p>
        </div>
      </div>

      {/* SVG Historical Chart Card */}
      <div className="glass-panel rounded-3xl p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-display text-xl font-semibold text-white">Performance</h3>
            <p className="text-xs text-white/40 mt-1">Portfolio value</p>
          </div>
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
            {(['1W', '1M', '1Y'] as const).map(interval => (
              <button
                key={interval}
                onClick={() => setActiveInterval(interval)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeInterval === interval
                    ? 'bg-white text-black shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {interval}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Curve Graphic */}
        <div className="relative h-[220px] w-full rounded-2xl bg-black/40 flex flex-col justify-end p-2 overflow-hidden border border-white/5">
          <svg
            key={activeInterval}
            className="h-full w-full animate-in fade-in duration-300"
            viewBox="0 0 600 200"
            preserveAspectRatio="none"
            onMouseMove={(e) => {
              if (!svgPath.coords.length) return;
              const svgRect = e.currentTarget.getBoundingClientRect();
              const containerRect = e.currentTarget.parentElement!.getBoundingClientRect();
              const mouseXSvg = ((e.clientX - svgRect.left) / svgRect.width) * 600;
              let nearest = 0;
              let minDist = Infinity;
              svgPath.coords.forEach((c, i) => {
                const dist = Math.abs(c.x - mouseXSvg);
                if (dist < minDist) { minDist = dist; nearest = i; }
              });
              setHoveredIdx(nearest);
              setMousePos({
                xPct: ((e.clientX - containerRect.left) / containerRect.width) * 100,
                yPct: ((e.clientY - containerRect.top) / containerRect.height) * 100,
              });
            }}
            onMouseLeave={() => { setHoveredIdx(null); setMousePos(null); }}
          >
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#494fdf" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#494fdf" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {totalInvested > 0 && (
              <path d={svgPath.area} fill="url(#chartGrad)" />
            )}
            <path
              d={svgPath.line}
              fill="none"
              stroke="#494fdf"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {hoveredIdx !== null && svgPath.coords[hoveredIdx] && (
              <>
                <line
                  x1={svgPath.coords[hoveredIdx].x}
                  y1={0}
                  x2={svgPath.coords[hoveredIdx].x}
                  y2={200}
                  stroke="white"
                  strokeOpacity="0.15"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <circle
                  cx={svgPath.coords[hoveredIdx].x}
                  cy={svgPath.coords[hoveredIdx].y}
                  r="5"
                  fill="#494fdf"
                  stroke="white"
                  strokeWidth="2"
                />
              </>
            )}
          </svg>

          {/* Tooltip overlay */}
          {hoveredIdx !== null && mousePos && historyPoints[hoveredIdx] > 0 && (
            <div
              className="absolute pointer-events-none z-10 transition-opacity duration-150"
              style={{
                left: `${mousePos.xPct}%`,
                top: `${mousePos.yPct}%`,
                transform: 'translate(-50%, -120%)',
              }}
            >
              <div className="bg-black/80 border border-white/10 rounded-xl px-4 py-2 shadow-xl backdrop-blur-sm">
                <p className="font-mono text-sm font-bold text-white whitespace-nowrap">
                  ฿{historyPoints[hoveredIdx].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5 text-center">
                  {hoveredIdx + 1} / {historyPoints.length}
                </p>
              </div>
            </div>
          )}

          {totalInvested === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <p className="text-sm font-semibold text-white/40 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" /> Awaiting capital deployment
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Holdings & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left cols: Positions Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display text-xl font-semibold text-white">Positions</h3>
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-white/60">
                    <th className="px-6 py-4 text-xs font-mono font-bold uppercase tracking-wider">Asset</th>
                    <th className="px-6 py-4 text-xs font-mono font-bold uppercase tracking-wider">Weight</th>
                    <th className="px-6 py-4 text-xs font-mono font-bold uppercase tracking-wider">Invested</th>
                    <th className="px-6 py-4 text-xs font-mono font-bold uppercase tracking-wider">Value</th>
                    <th className="px-6 py-4 text-right text-xs font-mono font-bold uppercase tracking-wider">Returns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {holdings.map((h) => {
                    const isStockProfit = h.gainAmount >= 0;
                    return (
                      <tr key={h.stockCode} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`h-2.5 w-2.5 rounded-full ${h.colorClass}`} />
                            <div>
                              <span className="font-mono text-sm font-bold text-white block">{h.stockCode}</span>
                              <span className="text-[10px] text-white/40 block truncate max-w-[120px]">{h.stockName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-white/80 font-medium">{h.weight}%</td>
                        <td className="px-6 py-4 font-mono text-sm text-white/60">
                          ฿{h.invested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-white font-medium">
                          ฿{h.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`font-mono text-sm font-bold ${isStockProfit ? 'text-revolut-teal' : 'text-revolut-danger'}`}>
                            {isStockProfit ? '+' : ''}{h.gainAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
                          </div>
                          <div className={`text-[10px] ${isStockProfit ? 'text-revolut-teal' : 'text-revolut-danger'} font-semibold`}>
                            {isStockProfit ? '+' : ''}{h.gainPercent.toFixed(2)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right col: Quick actions panel */}
        <div className="space-y-4">
          <h3 className="font-display text-xl font-semibold text-white">Actions</h3>
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h4 className="font-semibold text-base text-white">Deploy More Capital</h4>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              Add more funds to this portfolio. Orders will automatically be split among stocks based on policy weights.
            </p>
            <Button
              onClick={handleInvestMore}
              className="w-full h-12 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm transition-transform active:scale-[0.98] duration-150"
            >
              <Plus className="h-4 w-4 mr-2" />
              Invest More
            </Button>
          </div>
        </div>
      </div>

      {/* Transaction History (renders in dark mode overlay style) */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <h3 className="font-display text-xl font-semibold text-white">Transactions</h3>
        {cancelError && <p className="text-sm text-revolut-danger font-semibold mb-2">{cancelError}</p>}
        {/* We wrap OrderTable inside a block that styles table rows appropriately if needed, but OrderTable itself handles styling */}
        <OrderTable orders={portfolioOrders} onCancel={handleCancelOrder} />
      </div>
    </div>
  );
}

