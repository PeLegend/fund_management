import { useState, useEffect } from 'react';
import { adminDashboardApi, parseApiError } from '../api/client';
import { DashboardStats } from '../types/admin.types';
import { Users, Briefcase, ShoppingCart, TrendingUp, FileText, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminDashboardApi.getStats();
        setStats(data);
      } catch (err) {
        setError(parseApiError(err).message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
        <p className="text-red-400 font-semibold">Failed to load dashboard: {error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Customers', value: stats.totalCustomers, icon: Users, color: 'text-blue-400' },
    { label: 'Portfolios', value: stats.totalPortfolios, icon: Briefcase, color: 'text-purple-400' },
    { label: 'Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-primary-300' },
    { label: 'Stocks', value: stats.totalStocks, icon: TrendingUp, color: 'text-teal' },
    { label: 'Policies', value: stats.totalPolicies, icon: FileText, color: 'text-yellow-400' },
  ];

  const statusCards = [
    { label: 'Pending', count: stats.ordersByStatus.find(s => s.status === 'PENDING')?.count || 0, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { label: 'Processing', count: stats.ordersByStatus.find(s => s.status === 'PROCESSING')?.count || 0, icon: Loader, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Completed', count: stats.ordersByStatus.find(s => s.status === 'COMPLETED')?.count || 0, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { label: 'Failed', count: stats.ordersByStatus.find(s => s.status === 'FAILED')?.count || 0, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-display font-bold tracking-tight">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Orders by Status */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-white/70">Orders by Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card) => (
            <div key={card.label} className={`${card.bg} border rounded-2xl p-5 space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">{card.label}</span>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className={`text-3xl font-bold ${card.color}`}>{card.count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
