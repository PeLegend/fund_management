import { useState, useEffect, useCallback } from 'react';
import { adminOrdersApi, parseApiError } from '../api/client';
import { Order, OrderStatus } from '../types/admin.types';
import StatusBadge from '../components/StatusBadge';
import { X, ChevronDown } from 'lucide-react';

const STATUS_OPTIONS: OrderStatus[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PROCESSING', 'FAILED'],
  PROCESSING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('PENDING');
  const [updating, setUpdating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminOrdersApi.list(filterStatus || undefined);
      setOrders(data);
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openStatusModal = (order: Order) => {
    setStatusModal(order);
    const allowed = ALLOWED_TRANSITIONS[order.status];
    setNewStatus(allowed[0] || order.status);
  };

  const handleUpdateStatus = async () => {
    if (!statusModal) return;
    setUpdating(true);
    try {
      await adminOrdersApi.updateStatus(statusModal.id, newStatus);
      setStatusModal(null);
      fetchData();
    } catch (err) {
      setError(parseApiError(err).message);
    } finally {
      setUpdating(false);
    }
  };

  const allowedForCurrent = statusModal ? ALLOWED_TRANSITIONS[statusModal.status] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold tracking-tight">Orders</h1>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white appearance-none pr-10 focus:outline-none focus:border-primary cursor-pointer transition-colors"
          >
            <option value="" className="bg-zinc-900">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Order Code</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Type</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Portfolio</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Amount</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Created</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={7} className="px-6 py-4"><div className="h-5 bg-white/5 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : orders.map((o) => (
              <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-sm">{o.order_code}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    o.order_type === 'SELL'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  }`}>
                    {o.order_type === 'SELL' ? 'Sell' : 'Buy'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-white/50">{o.portfolio?.portfolio_code || o.portfolio_id}</td>
                <td className="px-6 py-4 text-sm font-semibold">฿{Number(o.amount).toLocaleString()}</td>
                <td className="px-6 py-4"><StatusBadge status={o.status} /></td>
                <td className="px-6 py-4 text-sm text-white/40">{new Date(o.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 text-right">
                  {ALLOWED_TRANSITIONS[o.status].length > 0 && (
                    <button onClick={() => openStatusModal(o)} className="text-xs bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 font-semibold rounded-full px-4 py-1.5 transition-all">
                      Update Status
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-white/30">No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status Update Modal */}
      {statusModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setStatusModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-surface-elevated border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Update Status</h2>
                <button onClick={() => setStatusModal(null)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-sm text-white/40">Order</span>
                  <span className="text-sm font-mono font-bold">{statusModal.order_code}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/10">
                  <span className="text-sm text-white/40">Current Status</span>
                  <StatusBadge status={statusModal.status} />
                </div>
              </div>

              {allowedForCurrent.length > 0 ? (
                <>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none mb-6 focus:outline-none focus:border-primary cursor-pointer transition-colors"
                  >
                    {allowedForCurrent.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
                  </select>

                  <div className="flex gap-3">
                    <button onClick={handleUpdateStatus} disabled={updating} className="flex-1 bg-primary text-white hover:bg-primary-deep font-semibold rounded-full py-3 text-sm transition-all disabled:opacity-50">
                      {updating ? 'Updating...' : 'Update'}
                    </button>
                    <button onClick={() => setStatusModal(null)} className="flex-1 bg-white/5 border border-white/10 text-white/60 hover:text-white font-semibold rounded-full py-3 text-sm transition-all">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/40 text-center py-4">This order has no valid status transitions.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
