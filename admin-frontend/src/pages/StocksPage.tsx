import { useState, useEffect, useCallback } from 'react';
import { adminStocksApi, parseApiError } from '../api/client';
import { Stock } from '../types/admin.types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function StocksPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Stock | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminStocksApi.list();
      setStocks(data);
    } catch (err) {
      setFormError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingStock(null);
    setFormCode('');
    setFormName('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (s: Stock) => {
    setEditingStock(s);
    setFormCode(s.stock_code);
    setFormName(s.name);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingStock) {
        await adminStocksApi.update(editingStock.id, { stock_code: formCode, name: formName });
      } else {
        await adminStocksApi.create(formCode, formName);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(parseApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminStocksApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setFormError(parseApiError(err).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold tracking-tight">Stocks</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white hover:bg-primary-deep font-semibold rounded-full px-5 py-2.5 text-sm transition-all">
          <Plus className="w-4 h-4" /> Add Stock
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Code</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Created</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={4} className="px-6 py-4"><div className="h-5 bg-white/5 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : stocks.map((s) => (
              <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-sm">{s.stock_code}</td>
                <td className="px-6 py-4 text-sm">{s.name}</td>
                <td className="px-6 py-4 text-sm text-white/40">{new Date(s.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(s)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors inline-flex">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(s)} className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors inline-flex ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-surface-elevated border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold mb-6">{editingStock ? 'Edit Stock' : 'Add Stock'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Stock Code</label>
                  <input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. PTT"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Name</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Stock name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
                {formError && <p className="text-sm text-red-400">{formError}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="flex-1 bg-primary text-white hover:bg-primary-deep font-semibold rounded-full py-3 text-sm transition-all disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 bg-white/5 border border-white/10 text-white/60 hover:text-white font-semibold rounded-full py-3 text-sm transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-surface-elevated border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
              <h2 className="text-xl font-bold mb-3">Delete Stock?</h2>
              <p className="text-white/50 text-sm mb-6">Delete <strong>{deleteTarget.stock_code}</strong>? This may fail if the stock is used in policies.</p>
              <div className="flex gap-3">
                <button onClick={handleDelete} className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 font-semibold rounded-full py-3 text-sm transition-all hover:bg-red-500/30">
                  Delete
                </button>
                <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-white/5 border border-white/10 text-white/60 hover:text-white font-semibold rounded-full py-3 text-sm transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
