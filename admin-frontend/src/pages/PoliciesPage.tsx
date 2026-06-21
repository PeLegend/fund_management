import { useState, useEffect, useCallback } from 'react';
import { adminPoliciesApi, adminStocksApi, parseApiError } from '../api/client';
import { Policy, Stock } from '../types/admin.types';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface PolicyStockForm {
  stock_id: string;
  weight: number;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formStocks, setFormStocks] = useState<PolicyStockForm[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Policy | null>(null);
  const [detailPolicy, setDetailPolicy] = useState<Policy | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([adminPoliciesApi.list(), adminStocksApi.list()]);
      setPolicies(p);
      setAllStocks(s);
    } catch (err) {
      setFormError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingPolicy(null);
    setFormCode('');
    setFormName('');
    setFormStocks([{ stock_id: '', weight: 0 }]);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Policy) => {
    setEditingPolicy(p);
    setFormCode(p.policy_code);
    setFormName(p.name);
    setFormStocks(p.policy_stocks.map(ps => ({ stock_id: ps.stock_id, weight: Number(ps.weight) })));
    setFormError(null);
    setModalOpen(true);
  };

  const addStockRow = () => setFormStocks([...formStocks, { stock_id: '', weight: 0 }]);
  const removeStockRow = (index: number) => setFormStocks(formStocks.filter((_, i) => i !== index));
  const updateStockRow = (index: number, field: keyof PolicyStockForm, value: string | number) => {
    const updated = [...formStocks];
    updated[index] = { ...updated[index], [field]: value };
    setFormStocks(updated);
  };

  const totalWeight = formStocks.reduce((sum, s) => sum + (Number(s.weight) || 0), 0);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      setFormError(`Total weight must be 100% (currently ${totalWeight}%)`);
      return;
    }
    if (formStocks.some(s => !s.stock_id)) {
      setFormError('All stock rows must have a stock selected');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const body = { policy_code: formCode, name: formName, policy_stocks: formStocks };
      if (editingPolicy) {
        await adminPoliciesApi.update(editingPolicy.id, { name: formName, policy_stocks: formStocks });
      } else {
        await adminPoliciesApi.create(body);
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
      await adminPoliciesApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setFormError(parseApiError(err).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold tracking-tight">Policies</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white hover:bg-primary-deep font-semibold rounded-full px-5 py-2.5 text-sm transition-all">
          <Plus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Code</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider"># Stocks</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Created</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td colSpan={5} className="px-6 py-4"><div className="h-5 bg-white/5 rounded animate-pulse" /></td>
                </tr>
              ))
            ) : policies.map((p) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setDetailPolicy(p)}>
                <td className="px-6 py-4 font-mono font-bold text-sm">{p.policy_code}</td>
                <td className="px-6 py-4 text-sm">{p.name}</td>
                <td className="px-6 py-4 text-sm text-white/50">{p.policy_stocks.length}</td>
                <td className="px-6 py-4 text-sm text-white/40">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors inline-flex">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(p)} className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors inline-flex ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      {detailPolicy && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setDetailPolicy(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface-elevated border-l border-white/10 p-8 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{detailPolicy.name}</h2>
              <button onClick={() => setDetailPolicy(null)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-white/40 font-mono mb-6">{detailPolicy.policy_code}</p>
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Allocation</h3>
            <div className="space-y-3">
              {detailPolicy.policy_stocks.map((ps) => (
                <div key={ps.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{ps.stock.stock_code[0]}</div>
                    <div>
                      <p className="font-bold text-sm">{ps.stock.stock_code}</p>
                      <p className="text-xs text-white/40">{ps.stock.name}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-primary-300">{Number(ps.weight)}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-surface-elevated border border-white/10 rounded-2xl p-8 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
              <h2 className="text-xl font-bold mb-6">{editingPolicy ? 'Edit Policy' : 'Add Policy'}</h2>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Policy Code</label>
                    <input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="e.g. KMASTER"
                      disabled={!!editingPolicy}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary disabled:opacity-50 transition-colors" required={!editingPolicy} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Name</label>
                    <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Policy name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-colors" required />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Stock Allocation</label>
                    <span className={`text-xs font-bold ${totalWeight === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                      Total: {totalWeight}%
                    </span>
                  </div>
                  <div className="space-y-2">
                    {formStocks.map((row, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <select value={row.stock_id} onChange={(e) => updateStockRow(i, 'stock_id', e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary appearance-none transition-colors">
                          <option value="" className="bg-zinc-900">Select stock</option>
                          {allStocks.map(s => <option key={s.id} value={s.id} className="bg-zinc-900">{s.stock_code} — {s.name}</option>)}
                        </select>
                        <input type="number" value={row.weight || ''} onChange={(e) => updateStockRow(i, 'weight', Number(e.target.value))}
                          placeholder="%" min="0" max="100"
                          className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm text-center focus:outline-none focus:border-primary transition-colors" />
                        {formStocks.length > 1 && (
                          <button type="button" onClick={() => removeStockRow(i)} className="p-2 text-white/30 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addStockRow} className="mt-2 text-xs text-primary-300 hover:text-primary font-semibold transition-colors">+ Add Stock</button>
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
              <h2 className="text-xl font-bold mb-3">Delete Policy?</h2>
              <p className="text-white/50 text-sm mb-6">Delete <strong>{deleteTarget.policy_code}</strong>? This may fail if the policy has active portfolios.</p>
              <div className="flex gap-3">
                <button onClick={handleDelete} className="flex-1 bg-red-500/20 text-red-400 border border-red-500/30 font-semibold rounded-full py-3 text-sm transition-all hover:bg-red-500/30">Delete</button>
                <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-white/5 border border-white/10 text-white/60 hover:text-white font-semibold rounded-full py-3 text-sm transition-all">Cancel</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
