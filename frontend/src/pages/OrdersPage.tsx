import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolios } from '../hooks/usePortfolios';
import { useOrders } from '../hooks/useOrders';
import { ordersApi, portfoliosApi, parseApiError } from '../api/client';
import { Holding } from '../types/portfolio.types';
import OrderTable from '../components/OrderTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { ChevronDown, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function OrdersPage() {
  const { customerCode } = useAuth();
  const { portfolios } = usePortfolios(customerCode);
  const location = useLocation();
  const locationState = location.state as { preselectedPortfolioCode?: string } | null;
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(
    locationState?.preselectedPortfolioCode || null
  );
  const { orders, loading, error: ordersError, refetch } = useOrders(selectedPortfolio);

  const [amount, setAmount] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [orderMode, setOrderMode] = useState<'BUY' | 'SELL'>('BUY');
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [holdingsLoading, setHoldingsLoading] = useState(false);

  // Fetch holdings when portfolio changes or when entering sell mode
  useEffect(() => {
    if (!selectedPortfolio || orderMode !== 'SELL') {
      setHoldings([]);
      return;
    }

    const fetchHoldings = async () => {
      setHoldingsLoading(true);
      try {
        const portfolio = await portfoliosApi.get(selectedPortfolio);
        setHoldings(portfolio.holdings || []);
      } catch {
        setHoldings([]);
      } finally {
        setHoldingsLoading(false);
      }
    };

    fetchHoldings();
  }, [selectedPortfolio, orderMode]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolio || !amount) return;

    setCreating(true);
    setCreateError(null);
    try {
      if (orderMode === 'SELL') {
        await ordersApi.sell(selectedPortfolio, parseFloat(amount));
      } else {
        await ordersApi.create(selectedPortfolio, parseFloat(amount));
      }
      setAmount('');
      setModalOpen(false);
      refetch();
    } catch (err) {
      const apiError = parseApiError(err);
      setCreateError(apiError.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async (orderCode: string) => {
    try {
      await ordersApi.cancel(orderCode);
      refetch();
    } catch (err) {
      const apiError = parseApiError(err);
      setCreateError(apiError.message);
    }
  };

  // Sort all orders chronologically descending
  const sortedOrders = useMemo(() => {
    return [...orders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders]);

  if (loading && !selectedPortfolio) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-8 animate-pulse">
          <div className="space-y-3">
            <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
            <div className="h-4 w-96 bg-zinc-900/50 rounded-lg" />
          </div>
          <div className="h-12 w-full bg-zinc-900 rounded-lg" />
          <div className="space-y-4">
            <div className="h-24 bg-zinc-900 rounded-xl" />
            <div className="h-24 bg-zinc-900 rounded-xl" />
            <div className="h-24 bg-zinc-900 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 lg:px-16 py-12 space-y-12 view-animate text-white">
      {/* Page Header matching mockup */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-8 border-b border-white/10">
        <div>
          <span className="text-white/40 font-bold tracking-widest uppercase text-xs mb-3 block">
            Order Ledger
          </span>
          <h2 className="display-section text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-white leading-none">
            Transaction<br />History.
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Buy/Sell Toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => { setOrderMode('BUY'); setCreateError(null); }}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                orderMode === 'BUY'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => { setOrderMode('SELL'); setCreateError(null); }}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${
                orderMode === 'SELL'
                  ? 'bg-white text-black'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Sell
            </button>
          </div>
          <Button
            onClick={() => {
              setCreateError(null);
              setModalOpen(true);
            }}
            disabled={!selectedPortfolio}
            className="bg-white text-black hover:bg-zinc-200 font-semibold rounded-full px-10 py-5 text-lg transition-all duration-300 active:scale-[0.98] flex items-center gap-3 disabled:opacity-40 shadow-lg"
          >
            {orderMode === 'SELL' ? (
              <><ArrowDownRight className="w-5 h-5" /> Redeem Fund</>
            ) : (
              <><ArrowUpRight className="w-5 h-5" /> Execute Order</>
            )}
          </Button>
        </div>
      </div>

      {/* Portfolio Selector */}
      <div className="space-y-3 max-w-md">
        <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
          Select Portfolio
        </Label>
        <div className="relative">
          <select
            value={selectedPortfolio || ''}
            onChange={(e) => setSelectedPortfolio(e.target.value || null)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-base focus:outline-none focus:border-primary appearance-none font-semibold text-white cursor-pointer"
          >
            <option value="" disabled className="bg-zinc-950 text-white/40">Choose a portfolio</option>
            {portfolios.map((p) => (
              <option key={p.id} value={p.portfolio_code} className="bg-zinc-950 text-white">
                {p.portfolio_code} — {p.policy.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
        </div>
      </div>

      {selectedPortfolio ? (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Orders Error State */}
          {ordersError && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-white">
              <p className="text-sm font-semibold text-red-400">Failed to load orders: {ordersError.message}</p>
            </div>
          )}

          {/* Orders Dense Table */}
          {sortedOrders.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-white/10 p-16 text-center max-w-md mx-auto space-y-3 bg-white/5 text-white">
              <p className="font-semibold text-lg">No orders yet</p>
              <p className="text-sm text-white/60 leading-relaxed font-light">
                {orderMode === 'SELL'
                  ? 'Redeem your fund holdings to see transactions here.'
                  : 'Deploy capital to create your first order.'}
              </p>
            </div>
          ) : (
            <OrderTable orders={sortedOrders} onCancel={handleCancel} />
          )}
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-white/10 p-16 text-center max-w-md mx-auto space-y-3 bg-white/5 text-white">
          <p className="font-semibold text-lg">No portfolio selected</p>
          <p className="text-sm text-white/60 leading-relaxed font-light">
            Select a portfolio from the dropdown above to manage orders.
          </p>
        </div>
      )}

      {/* Execute Order Modal (Dialog matching mockup) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="glass-panel text-white border-white/10 rounded-[32px] p-6 sm:p-8 md:p-12 max-w-xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl">
          <DialogHeader className="flex flex-row justify-between items-center mb-6">
            <DialogTitle className="text-4xl font-display font-semibold tracking-tight text-white">
              {orderMode === 'SELL' ? 'Redeem Fund' : 'Execute Trade'}
            </DialogTitle>
            <button
              onClick={() => setModalOpen(false)}
              className="text-white/50 hover:text-white transition-all duration-300 hover:rotate-90 bg-white/5 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>

          <form onSubmit={handleCreateOrder} className="space-y-8">
            <div className="space-y-6">
              <div>
                <Label className="block text-sm font-semibold text-white/50 mb-3 tracking-wide uppercase">
                  Target Portfolio
                </Label>
                <div className="relative">
                  <select
                    disabled
                    value={selectedPortfolio || ''}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-lg appearance-none font-semibold text-white/50 cursor-not-allowed"
                  >
                    <option value={selectedPortfolio || ''}>{selectedPortfolio}</option>
                  </select>
                </div>
              </div>

              {/* Holdings summary for sell mode */}
              {orderMode === 'SELL' && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                  <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                    Current Holdings
                  </Label>
                  {holdingsLoading ? (
                    <p className="text-sm text-white/40">Loading holdings...</p>
                  ) : holdings.length === 0 ? (
                    <p className="text-sm text-white/40">No holdings to sell</p>
                  ) : (
                    <div className="space-y-2">
                      {holdings.map((h) => (
                        <div key={h.stock_code} className="flex justify-between items-center text-sm">
                          <span className="font-mono font-bold text-white/80">
                            {h.stock_code}
                            <span className="text-white/30 mx-1.5">·</span>
                            <span className="text-white/50">{h.units.toFixed(4)} units</span>
                          </span>
                          <span className="font-mono text-white/60">
                            ฿{h.current_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center">
                        <span className="text-xs font-semibold text-white/50 uppercase">Total Value</span>
                        <span className="font-mono font-bold text-white">
                          ฿{holdings.reduce((sum, h) => sum + h.current_value, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="orderAmount" className="block text-sm font-semibold text-white/50 mb-3 tracking-wide uppercase">
                  {orderMode === 'SELL' ? 'Redemption Amount (THB)' : 'Capital Allocation (THB)'}
                </Label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 font-bold text-lg select-none">
                    ฿
                  </span>
                  <Input
                    id="orderAmount"
                    type="number"
                    placeholder={orderMode === 'SELL' ? 'e.g. 50,000' : 'e.g. 1,000,000'}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setCreateError(null);
                    }}
                    min="1"
                    step="0.01"
                    className="pl-12 h-16 bg-black/50 border border-white/10 rounded-2xl px-6 py-5 text-lg placeholder:text-white/30 focus-visible:ring-primary focus-visible:bg-black/70 font-bold text-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {createError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-400 text-xs font-bold">!</span>
                </div>
                <p className="text-sm text-red-400 font-semibold leading-relaxed">{createError}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={creating || !amount || (orderMode === 'SELL' && holdings.length === 0)}
                className={`w-full rounded-full py-5 text-lg font-bold transition-all duration-300 active:scale-[0.98] ${
                  orderMode === 'SELL'
                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-primary text-white hover:bg-primary-deep'
                }`}
              >
                {creating ? 'Processing...' : orderMode === 'SELL' ? 'Confirm Redemption' : 'Confirm Order'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModalOpen(false)}
                className="w-full text-white/60 hover:text-white hover:bg-white/5 rounded-full py-5 text-lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

