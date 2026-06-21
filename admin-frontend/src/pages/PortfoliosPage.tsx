import { useState, useEffect, useCallback } from 'react';
import { adminPortfoliosApi, parseApiError } from '../api/client';
import { Portfolio } from '../types/admin.types';
import { X, Eye } from 'lucide-react';

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailPortfolio, setDetailPortfolio] = useState<Portfolio | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminPortfoliosApi.list();
      setPortfolios(data);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const viewDetail = async (p: Portfolio) => {
    try {
      const detail = await adminPortfoliosApi.getOne(p.id);
      setDetailPortfolio(detail);
    } catch (err) {
      setError(parseApiError(err).message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold tracking-tight">Portfolios</h1>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Code</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Customer</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Policy</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Orders</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Created</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={6} className="px-6 py-4"><div className="h-5 bg-white/5 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : portfolios.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-sm">{p.portfolio_code}</td>
                <td className="px-6 py-4 text-sm">{p.customer?.customer_code} — {p.customer?.name}</td>
                <td className="px-6 py-4 text-sm">{p.policy?.policy_code}</td>
                <td className="px-6 py-4 text-sm text-white/50">{p.orders?.length || 0}</td>
                <td className="px-6 py-4 text-sm text-white/40">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => viewDetail(p)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors inline-flex">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      {detailPortfolio && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setDetailPortfolio(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-surface-elevated border-l border-white/10 p-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{detailPortfolio.portfolio_code}</h2>
              <button onClick={() => setDetailPortfolio(null)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-sm text-white/40">Customer</span>
                <span className="text-sm font-semibold">{detailPortfolio.customer?.customer_code} — {detailPortfolio.customer?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-sm text-white/40">Policy</span>
                <span className="text-sm font-semibold">{detailPortfolio.policy?.policy_code}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-sm text-white/40">Created</span>
                <span className="text-sm">{new Date(detailPortfolio.created_at).toLocaleString()}</span>
              </div>
            </div>

            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Orders ({detailPortfolio.orders?.length || 0})</h3>
            {detailPortfolio.orders && detailPortfolio.orders.length > 0 ? (
              <div className="space-y-2">
                {detailPortfolio.orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div>
                      <p className="font-mono font-bold text-sm">{o.order_code}</p>
                      <p className="text-xs text-white/40">฿{Number(o.amount).toLocaleString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      o.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                      o.status === 'FAILED' ? 'bg-red-500/20 text-red-400' :
                      o.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{o.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/30">No orders yet</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
