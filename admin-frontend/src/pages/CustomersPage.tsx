import { useState, useEffect, useCallback } from 'react';
import { adminCustomersApi, parseApiError } from '../api/client';
import { Customer, PaginatedResponse } from '../types/admin.types';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomersPage() {
  const [data, setData] = useState<PaginatedResponse<Customer> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminCustomersApi.list(page, 10);
      setData(result);
    } catch (err) {
      setFormError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingCustomer(null);
    setFormCode('');
    setFormName('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormCode(c.customer_code);
    setFormName(c.name);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      if (editingCustomer) {
        await adminCustomersApi.update(editingCustomer.id, { name: formName });
      } else {
        await adminCustomersApi.create(formCode, formName);
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
      await adminCustomersApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setFormError(parseApiError(err).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold tracking-tight">Customers</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-primary text-white hover:bg-primary-deep font-semibold rounded-full px-5 py-2.5 text-sm transition-all">
          <Plus className="w-4 h-4" /> Add Customer
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
            ) : data?.items.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-sm">{c.customer_code}</td>
                <td className="px-6 py-4 text-sm">{c.name}</td>
                <td className="px-6 py-4 text-sm text-white/40">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors inline-flex">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors inline-flex ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/40">Page {data.page} of {data.totalPages} ({data.total} total)</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-surface-elevated border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold mb-6">{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Customer Code</label>
                  <input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    disabled={!!editingCustomer}
                    placeholder="e.g. C003"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary disabled:opacity-50 transition-colors"
                    required={!editingCustomer}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Name</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Full name"
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
              <h2 className="text-xl font-bold mb-3">Delete Customer?</h2>
              <p className="text-white/50 text-sm mb-6">Are you sure you want to delete <strong>{deleteTarget.customer_code}</strong>? This action cannot be undone.</p>
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
