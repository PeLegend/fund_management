import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePortfolios } from '../hooks/usePortfolios';
import { usePolicies } from '../hooks/usePolicies';
import { portfoliosApi } from '../api/client';
import PortfolioCard from '../components/PortfolioCard';
import CreatePortfolioModal from '../components/CreatePortfolioModal';
import PortfolioDetails from '../components/PortfolioDetails';
import { Button } from '../components/ui/button';
import { calculatePortfolioPerformance } from '../lib/performance';
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
    return portfolios.find(p => p.portfolio_code === selectedPortfolioCode);
  }, [portfolios, selectedPortfolioCode]);

  // Calculate aggregate wealth stats across all portfolios
  const aggregateStats = useMemo(() => {
    let totalInvestedAll = 0;
    let totalValueAll = 0;
    let totalPendingAll = 0;

    portfolios.forEach(p => {
      const { totalInvested, currentValue, pendingAmount } = calculatePortfolioPerformance(p);
      totalInvestedAll += totalInvested;
      totalValueAll += currentValue;
      totalPendingAll += pendingAmount;
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
              <h2 className="display-section text-5xl md:text-7xl lg:text-8xl text-white leading-none">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel rounded-2xl p-6 space-y-2">
                <p className="text-xs font-mono text-white/40 font-bold uppercase tracking-wider">Total Value</p>
                <p className="font-mono text-3xl font-bold text-white">
                  ฿{aggregateStats.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {aggregateStats.pendingAmount > 0 && (
                  <p className="text-xs text-revolut-warning font-semibold">
                    +฿{aggregateStats.pendingAmount.toLocaleString()} pending
                  </p>
                )}
              </div>

              <div className="glass-panel rounded-2xl p-6 space-y-2">
                <p className="text-xs font-mono text-white/40 font-bold uppercase tracking-wider">Invested Capital</p>
                <p className="font-mono text-3xl font-bold text-white">
                  ฿{aggregateStats.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-6 space-y-2">
                <p className="text-xs font-mono text-white/40 font-bold uppercase tracking-wider">Total Return</p>
                <div className="flex items-baseline gap-3">
                  <span className={`font-mono text-3xl font-bold ${isProfit ? 'text-revolut-teal' : 'text-revolut-danger'}`}>
                    {isProfit ? '+' : ''}฿{aggregateStats.gainAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`font-mono text-sm font-semibold ${isProfit ? 'text-revolut-teal' : 'text-revolut-danger'}`}>
                    ({isProfit ? '+' : ''}{aggregateStats.gainPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Grid or Empty State */}
          {portfolios.length === 0 ? (
            <div className="glass-panel rounded-[32px] p-16 text-center max-w-lg mx-auto space-y-6">
              <div className="mx-auto h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-white/50" />
              </div>
              <div className="space-y-2">
                <p className="text-white font-semibold text-xl">No active portfolios found</p>
                <p className="text-sm text-white/50 leading-relaxed font-light">
                  Select an investment policy and create your first portfolio to start allocating funds.
                </p>
              </div>
              <Button
                onClick={() => setModalOpen(true)}
                className="bg-white text-black hover:bg-zinc-200 font-semibold rounded-full px-6 py-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Initialize Portfolio
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

