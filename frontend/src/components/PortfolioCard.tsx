import { Portfolio } from '../types/portfolio.types';
import { OrderStatus } from '../types/order.types';
import StatusBadge from './StatusBadge';
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
  const totalInvested = portfolio.total_invested || 0;
  const currentValue = portfolio.current_value || 0;
  const gainAmount = portfolio.gain_amount || 0;
  const gainPercent = portfolio.gain_percent || 0;
  const pendingAmount = portfolio.pending_amount || 0;

  const isProfit = gainAmount >= 0;

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden text-white rounded-[24px] p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(73,79,223,0.12)] group cursor-pointer"
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-white mb-1 leading-none group-hover:text-primary transition-colors">
              {portfolio.portfolio_code}
            </h3>
            <p className="text-white/40 font-medium flex items-center gap-2 mt-3 text-xs tracking-wide">
              <Briefcase className="w-3.5 h-3.5 text-primary/60" /> {portfolio.policy.name}
            </p>
          </div>
          {latestStatus ? (
            <StatusBadge status={latestStatus} />
          ) : (
            <span className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 text-[10px] font-medium text-white/40">
              No orders
            </span>
          )}
        </div>

        <div className="w-full h-px bg-white/[0.08]" />

        {/* Value and return display */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-mono text-white/30 font-bold uppercase tracking-widest">Account Value</p>
            <p className="font-mono text-xl sm:text-2xl font-bold text-white mt-1 tracking-tight">
              ฿{currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          {totalInvested > 0 && (
            <div className="text-right">
              <p className="text-[10px] font-mono text-white/30 font-bold uppercase tracking-widest">Return</p>
              <span
                className={`inline-flex items-center text-sm font-mono font-bold mt-1 ${
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
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
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
          <div className="flex items-center justify-between text-[11px] font-semibold text-revolut-warning bg-revolut-warning/[0.08] border border-revolut-warning/20 rounded-xl p-3">
            <span>Pending Allocation</span>
            <span className="font-mono font-bold">฿{pendingAmount.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-white/[0.06] flex justify-between items-center opacity-40 group-hover:opacity-80 transition-opacity">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white">View Details</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );
}

