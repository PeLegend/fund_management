import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolios } from '../hooks/usePortfolios';
import { usePolicies } from '../hooks/usePolicies';
import { portfoliosApi } from '../api/client';
import PortfolioCard from '../components/PortfolioCard';
import CreatePortfolioModal from '../components/CreatePortfolioModal';
import PortfolioDetails from '../components/PortfolioDetails';
import AggregatePnlChart from '../components/AggregatePnlChart';
import { Button } from '../components/ui/button';
import { Plus, Briefcase } from 'lucide-react';

export default function PortfoliosPage() {
  const { customerCode } = useAuth();
  const { portfolios, loading, error, refetch } = usePortfolios(customerCode);
  const { policies } = usePolicies();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPortfolioCode, setSelectedPortfolioCode] = useState<string | null>(null);

  const handleCreate = async (policyCode: string) => {
    if (!customerCode) return;
    await portfoliosApi.create(customerCode, policyCode);
    refetch();
  };

  // Find currently selected portfolio object
  const selectedPortfolio = useMemo(() => {
    return portfolios.find(p => p.portfolio_code === selectedPortfolioCode) || null;
  }, [portfolios, selectedPortfolioCode]);

  // Calculate aggregate wealth stats across all portfolios
  const aggregateStats = useMemo(() => {
    let totalInvestedAll = 0;
    let totalValueAll = 0;
    let totalPendingAll = 0;

    portfolios.forEach(p => {
      totalInvestedAll += p.total_invested || 0;
      totalValueAll += p.current_value || 0;
      totalPendingAll += p.pending_amount || 0;
    });

    const totalGainAll = totalValueAll - totalInvestedAll;
    const totalGainPercentAll = totalInvestedAll > 0 ? (totalGainAll / totalInvestedAll) * 100 : 0;

    return {
      totalInvested: totalInvestedAll,
      currentValue: totalValueAll,
      gainAmount: totalGainAll,
      gainPercent: totalGainPercentAll,
      pendingAmount: totalPendingAll,
    };
  }, [portfolios]);

  const isProfit = aggregateStats.gainAmount >= 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-8 animate-pulse">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
              <div className="h-4 w-64 bg-zinc-800 rounded-lg" />
            </div>
            <div className="h-10 w-36 bg-zinc-800 rounded-lg" />
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-zinc-800 rounded-xl" />
            <div className="h-24 bg-zinc-800 rounded-xl" />
            <div className="h-24 bg-zinc-800 rounded-xl" />
          </div>
          {/* Grid skeleton */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-48 bg-zinc-800 rounded-2xl" />
            <div className="h-48 bg-zinc-800 rounded-2xl" />
            <div className="h-48 bg-zinc-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-white">
          <h3 className="font-display font-semibold text-red-400 text-lg mb-1">Failed to load portfolios</h3>
          <p className="text-sm text-red-300">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 lg:px-16 py-12 space-y-12 view-animate">
      {selectedPortfolio ? (
        /* Render Details Panel */
        <PortfolioDetails
          portfolio={selectedPortfolio}
          onBack={() => setSelectedPortfolioCode(null)}
          onRefetch={refetch}
        />
      ) : (
        <>
          {/* Page Header with Create Button matching mockup */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-8 border-b border-white/10">
            <div>
              <span className="text-white/60 font-bold tracking-widest uppercase text-xs mb-3 block">
                Private Wealth
              </span>
              <h2 className="display-section text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-white leading-none">
                Your<br />Portfolios.
              </h2>
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-primary text-white rounded-full px-8 py-4 font-semibold hover:bg-primary-deep transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(73,79,223,0.4)] flex items-center gap-3"
            >
              <Plus className="w-5 h-5" /> Create New
            </Button>
          </div>

          {/* Aggregate Stats Dashboard */}
          {portfolios.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative overflow-hidden rounded-2xl p-6 space-y-3 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <p className="text-[11px] font-mono text-white/40 font-bold uppercase tracking-widest relative">Total Value</p>
                <p className="font-mono text-2xl sm:text-3xl font-bold text-white relative tracking-tight">
                  ฿{aggregateStats.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {aggregateStats.pendingAmount > 0 && (
                  <p className="text-[11px] text-revolut-warning font-semibold relative">
                    +฿{aggregateStats.pendingAmount.toLocaleString()} pending
                  </p>
                )}
              </div>

              <div className="relative overflow-hidden rounded-2xl p-6 space-y-3 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]">
                <p className="text-[11px] font-mono text-white/40 font-bold uppercase tracking-widest">Invested Capital</p>
                <p className="font-mono text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  ฿{aggregateStats.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="relative overflow-hidden rounded-2xl p-6 space-y-3 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08]">
                <div className={`absolute inset-0 bg-gradient-to-br ${isProfit ? 'from-revolut-teal/5' : 'from-revolut-danger/5'} to-transparent pointer-events-none`} />
                <p className="text-[11px] font-mono text-white/40 font-bold uppercase tracking-widest relative">Total Return</p>
                <div className="flex items-baseline gap-2 relative">
                  <span className={`font-mono text-2xl sm:text-3xl font-bold tracking-tight ${isProfit ? 'text-revolut-teal' : 'text-revolut-danger'}`}>
                    {isProfit ? '+' : ''}฿{aggregateStats.gainAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`font-mono text-xs font-semibold ${isProfit ? 'text-revolut-teal/70' : 'text-revolut-danger/70'}`}>
                    {isProfit ? '+' : ''}{aggregateStats.gainPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Aggregate PNL Chart */}
          {portfolios.length > 0 && (
            <AggregatePnlChart portfolios={portfolios} />
          )}

          {/* Portfolio Grid or Empty State */}
          {portfolios.length === 0 ? (
            <div className="relative overflow-hidden rounded-[28px] p-10 sm:p-16 text-center max-w-lg mx-auto space-y-6 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.08]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              <div className="relative mx-auto h-14 w-14 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white/40" />
              </div>
              <div className="relative space-y-2">
                <p className="text-white font-semibold text-lg">No active portfolios</p>
                <p className="text-sm text-white/40 leading-relaxed max-w-[280px] mx-auto">
                  Select an investment policy to start allocating capital automatically.
                </p>
              </div>
              <Button
                onClick={() => setModalOpen(true)}
                className="relative bg-white text-black hover:bg-zinc-200 font-semibold rounded-full px-6 py-4 text-sm transition-transform active:scale-[0.98]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Portfolio
              </Button>
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {portfolios.map((portfolio) => {
                const latestOrder = portfolio.orders?.[0];
                return (
                  <PortfolioCard
                    key={portfolio.id}
                    portfolio={portfolio}
                    latestStatus={latestOrder?.status}
                    onClick={() => setSelectedPortfolioCode(portfolio.portfolio_code)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      <CreatePortfolioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        policies={policies}
        onSubmit={handleCreate}
      />
    </div>
  );
}

