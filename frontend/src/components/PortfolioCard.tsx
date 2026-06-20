import { Portfolio } from '../types/portfolio.types';
import { OrderStatus } from '../types/order.types';
import StatusBadge from './StatusBadge';
import { calculatePortfolioPerformance } from '../lib/performance';
import { Briefcase, ArrowRight } from 'lucide-react';

const ACCENT_COLORS = [
  'bg-revolut-teal',
  'bg-revolut-pink',
  'bg-revolut-light-blue',
  'bg-revolut-brown',
  'bg-revolut-light-green',
  'bg-revolut-warning',
  'bg-revolut-primary',
  'bg-revolut-yellow',
];

interface PortfolioCardProps {
  portfolio: Portfolio;
  latestStatus?: OrderStatus | null;
  onClick?: () => void;
}

export default function PortfolioCard({
  portfolio,
  latestStatus,
  onClick,
}: PortfolioCardProps) {
  const { totalInvested, currentValue, gainAmount, gainPercent, pendingAmount } =
    calculatePortfolioPerformance(portfolio);

  const isProfit = gainAmount >= 0;

  return (
    <div
      onClick={onClick}
      className="glass-panel text-white rounded-[32px] p-10 flex flex-col justify-between hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(73,79,223,0.15)] group cursor-pointer"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-4xl font-display font-semibold tracking-tight text-white mb-2 leading-none group-hover:text-primary transition-colors">
              {portfolio.portfolio_code}
            </h3>
            <p className="text-white/50 font-medium flex items-center gap-2 mt-4 tracking-wide text-sm">
              <Briefcase className="w-4 h-4 text-primary" /> {portfolio.policy.name}
            </p>
          </div>
          {latestStatus ? (
            <StatusBadge status={latestStatus} />
          ) : (
            <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-white/50">
              No orders
            </span>
          )}
        </div>

        <div className="w-full h-[1px] bg-white/10" />

        {/* Value and return display */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-mono text-white/40 font-bold uppercase tracking-wider">Account Value</p>
            <p className="font-mono text-2xl font-bold text-white mt-1">
              ฿{currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          {totalInvested > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-mono text-white/40 font-bold uppercase tracking-wider">Total Return</p>
              <span
                className={`inline-flex items-center text-sm font-mono font-bold mt-1.5 ${
                  isProfit ? 'text-revolut-teal' : 'text-revolut-danger'
                }`}
              >
                {isProfit ? '+' : ''}
                {gainPercent.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Allocation Strip */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/5">
          {portfolio.policy.policy_stocks.map((ps, idx) => {
            const colorClass = ACCENT_COLORS[idx % ACCENT_COLORS.length];
            return (
              <div
                key={ps.id}
                className={`${colorClass} h-full`}
                style={{ width: `${Number(ps.weight)}%` }}
                title={`${ps.stock.stock_code}: ${ps.weight}%`}
              />
            );
          })}
        </div>

        {/* Pending deposits warning */}
        {pendingAmount > 0 && (
          <div className="flex items-center justify-between text-[11px] font-semibold text-revolut-warning bg-revolut-warning/10 border border-revolut-warning/20 rounded-xl p-3">
            <span>Pending Allocation:</span>
            <span className="font-mono font-bold">฿{pendingAmount.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center opacity-60 group-hover:opacity-100 transition-opacity">
        <span className="text-sm font-bold uppercase tracking-widest text-white">Details</span>
        <ArrowRight className="w-5 h-5" />
      </div>
    </div>
  );
}

