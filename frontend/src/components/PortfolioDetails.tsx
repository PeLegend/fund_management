import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Portfolio } from '../types/portfolio.types';
import { Button } from './ui/button';
import OrderTable from './OrderTable';
import ProfitLossTable from './ProfitLossTable';
import PnlChart from './PnlChart';
import { usePnlHistory } from '../hooks/usePnlHistory';
import { parseApiError, ordersApi, portfoliosApi } from '../api/client';
import { ArrowLeft, Plus } from 'lucide-react';

interface PortfolioDetailsProps {
  portfolio: Portfolio;
  onBack: () => void;
  onRefetch: () => void;
}

export default function PortfolioDetails({ portfolio: initialPortfolio, onBack, onRefetch }: PortfolioDetailsProps) {
  const navigate = useNavigate();
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio>(initialPortfolio);

  // Sync if parent passes a different portfolio
  useEffect(() => {
    setPortfolio(initialPortfolio);
  }, [initialPortfolio]);

  // Poll for fresh data while there are active orders
  const hasActiveOrders = useMemo(() => {
    return (portfolio.orders || []).some(o => o.status === 'PENDING' || o.status === 'PROCESSING');
  }, [portfolio.orders]);

  const fetchFreshData = useCallback(async () => {
    try {
      const fresh = await portfoliosApi.get(portfolio.portfolio_code);
      setPortfolio(fresh);
    } catch {
      // ignore polling errors
    }
  }, [portfolio.portfolio_code]);

  useEffect(() => {
    if (!hasActiveOrders) return;

    // Poll immediately, then every 3s
    fetchFreshData();
    const interval = setInterval(fetchFreshData, 3000);
    return () => clearInterval(interval);
  }, [hasActiveOrders, fetchFreshData]);

  const { data: pnlHistory, loading: pnlLoading } = usePnlHistory(portfolio);

  const totalInvested = portfolio.total_invested || 0;
  const currentValue = portfolio.current_value || 0;
  const gainAmount = portfolio.gain_amount || 0;
  const gainPercent = portfolio.gain_percent || 0;
  const pendingAmount = portfolio.pending_amount || 0;
  const holdings = portfolio.holdings || [];

  const isProfit = gainAmount >= 0;

  const handleCancelOrder = async (orderCode: string) => {
    try {
      setCancelError(null);
      await ordersApi.cancel(orderCode);
      fetchFreshData();
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

  const portfolioOrders = useMemo(() => {
    return [...(portfolio.orders || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [portfolio.orders]);

  return (
    <div className="space-y-6 md:space-y-10 view-animate text-white">
      {/* Back navigation header */}
      <div className="flex items-start gap-3 pb-5 border-b border-white/[0.08]">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-white/50 hover:text-white hover:bg-white/5 flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[11px] flex-shrink-0 mt-0.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </Button>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-mono text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
              {portfolio.portfolio_code}
            </h2>
            <span className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/[0.08] px-2 py-0.5 text-[9px] font-mono font-bold text-white/50">
              {portfolio.policy.policy_code}
            </span>
          </div>
          <p className="text-[11px] text-white/40 mt-0.5 font-medium truncate">{portfolio.policy.name}</p>
        </div>
      </div>

      {/* Main Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl p-4 md:p-5 space-y-2 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <p className="text-[10px] md:text-[11px] font-mono text-white/30 font-bold uppercase tracking-widest relative">Net Asset Value</p>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-white relative tracking-tight">
            ฿{currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {pendingAmount > 0 && (
            <p className="text-[11px] text-revolut-warning font-semibold relative">
              +฿{pendingAmount.toLocaleString()} pending
            </p>
          )}
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 md:p-5 space-y-2 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]">
          <p className="text-[10px] md:text-[11px] font-mono text-white/30 font-bold uppercase tracking-widest">Invested Capital</p>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-tight">
            ฿{totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl p-4 md:p-5 space-y-2 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]">
          <div className={`absolute inset-0 bg-gradient-to-br ${isProfit ? 'from-revolut-teal/5' : 'from-revolut-danger/5'} to-transparent pointer-events-none`} />
          <p className="text-[10px] md:text-[11px] font-mono text-white/30 font-bold uppercase tracking-widest relative">Total Return</p>
          <p className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight relative ${isProfit ? 'text-revolut-teal' : 'text-revolut-danger'}`}>
            {isProfit ? '+' : ''}
            ฿{gainAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className={`text-[11px] font-semibold relative ${isProfit ? 'text-revolut-teal/70' : 'text-revolut-danger/70'}`}>
            {isProfit ? '+' : ''}{gainPercent.toFixed(2)}% Yield
          </p>
        </div>
      </div>

      {/* PNL Chart */}
      <PnlChart data={pnlHistory} loading={pnlLoading} />

      {/* Holdings Table */}
      <div className="space-y-3">
        <h3 className="font-display text-base md:text-lg font-semibold text-white">Holdings & P/L</h3>
        <ProfitLossTable holdings={holdings} />
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="font-display text-base md:text-lg font-semibold text-white">Actions</h3>
        <div className="relative overflow-hidden rounded-2xl p-4 md:p-5 space-y-3 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]">
          <h4 className="font-semibold text-sm text-white">Deploy More Capital</h4>
          <p className="text-xs text-white/40 leading-relaxed">
            Add funds to this portfolio. Orders split automatically by policy weights.
          </p>
          <Button
            onClick={handleInvestMore}
            className="w-full h-11 bg-white text-black hover:bg-zinc-200 rounded-full font-bold text-sm transition-transform active:scale-[0.98] duration-150"
          >
            <Plus className="h-4 w-4 mr-2" />
            Invest More
          </Button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-3 pt-4 border-t border-white/[0.08]">
        <h3 className="font-display text-base md:text-lg font-semibold text-white">Transactions</h3>
        {cancelError && <p className="text-xs text-revolut-danger font-semibold mb-2">{cancelError}</p>}
        <OrderTable orders={portfolioOrders} onCancel={handleCancelOrder} />
      </div>
    </div>
  );
}
