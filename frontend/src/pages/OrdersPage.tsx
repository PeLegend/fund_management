import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolios } from '../hooks/usePortfolios';
import { useOrders } from '../hooks/useOrders';
import { ordersApi, parseApiError } from '../api/client';
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
import { ChevronDown, X, ArrowUpRight } from 'lucide-react';

export default function OrdersPage() {
  const { customerCode } = useAuth();
  const { portfolios } = usePortfolios(customerCode);
  const location = useLocation();
  const locationState = location.state as { preselectedPortfolioCode?: string } | null;
  const [selectedPortfolio, setSelectedPortfolio] = useState<string | null>(
    locationState?.preselectedPortfolioCode || null
  );
  const { orders, loading, refetch } = useOrders(selectedPortfolio);

  const [amount, setAmount] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPortfolio || !amount) return;

    setCreating(true);
    setCreateError(null);
    try {
      await ordersApi.create(selectedPortfolio, parseFloat(amount));
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
          <h2 className="display-section text-5xl md:text-7xl lg:text-8xl text-white leading-none">
            Transaction<br />History.
          </h2>
        </div>
        <Button
          onClick={() => {
            setCreateError(null);
            setModalOpen(true);
          }}
          disabled={!selectedPortfolio}
          className="bg-white text-black hover:bg-zinc-200 font-semibold rounded-full px-10 py-5 text-lg transition-all duration-300 active:scale-[0.98] flex items-center gap-3 disabled:opacity-40 shadow-lg"
        >
          <ArrowUpRight className="w-5 h-5" /> Execute Order
        </Button>
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
          {/* Orders Dense Table */}
          {sortedOrders.length === 0 ? (
            <div className="rounded-[32px] border border-dashed border-white/10 p-16 text-center max-w-md mx-auto space-y-3 bg-white/5 text-white">
              <p className="font-semibold text-lg">No orders yet</p>
              <p className="text-sm text-white/60 leading-relaxed font-light">
                Deploy capital to create your first order.
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
        <DialogContent className="glass-panel text-white border-white/10 rounded-[32px] p-12 max-w-xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl">
          <DialogHeader className="flex flex-row justify-between items-center mb-6">
            <DialogTitle className="text-4xl font-display font-semibold tracking-tight text-white">
              Execute Trade
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

              <div>
                <Label htmlFor="orderAmount" className="block text-sm font-semibold text-white/50 mb-3 tracking-wide uppercase">
                  Capital Allocation (THB)
                </Label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 font-bold text-lg select-none">
                    ฿
                  </span>
                  <Input
                    id="orderAmount"
                    type="number"
                    placeholder="e.g. 1,000,000"
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

            {createError && <p className="text-sm text-red-500 font-semibold">{createError}</p>}

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={creating || !amount}
                className="w-full bg-primary text-white hover:bg-primary-deep rounded-full py-5 text-lg font-bold transition-all duration-300 active:scale-[0.98]"
              >
                {creating ? 'Processing...' : 'Confirm Order'}
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

