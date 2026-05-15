'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Tag, Plus, Loader2, X, Save, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  creator_type: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  per_user_limit: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '', discount_type: 'percentage', discount_value: 10, min_order_amount: 0,
    max_discount_amount: 0, usage_limit: 0, per_user_limit: 1,
    valid_from: '', valid_until: '',
  });

  useEffect(() => { fetchCoupons(); }, []);

  async function fetchCoupons() {
    const { data } = await supabase.from('Coupon').select('*').order('created_at', { ascending: false });
    if (data) setCoupons(data as Coupon[]);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('Coupon').insert({
      code: form.code.toUpperCase(),
      creator_type: 'admin',
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_order_amount: form.min_order_amount || 0,
      max_discount_amount: form.max_discount_amount || null,
      usage_limit: form.usage_limit || null,
      per_user_limit: form.per_user_limit || 1,
      valid_from: form.valid_from,
      valid_until: form.valid_until,
      is_active: true,
    });
    setSaving(false);
    setShowModal(false);
    setForm({ code: '', discount_type: 'percentage', discount_value: 10, min_order_amount: 0, max_discount_amount: 0, usage_limit: 0, per_user_limit: 1, valid_from: '', valid_until: '' });
    fetchCoupons();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('Coupon').update({ is_active: !current }).eq('id', id);
    fetchCoupons();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this coupon?')) return;
    await supabase.from('Coupon').delete().eq('id', id);
    fetchCoupons();
  }

  function isExpired(c: Coupon) { return new Date(c.valid_until) < new Date(); }
  function isExhausted(c: Coupon) { return c.usage_limit ? c.used_count >= c.usage_limit : false; }

  return (
    <>
      <Header title="Coupon Manager" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-text-secondary">{coupons.length} coupons total · {coupons.filter(c => c.is_active && !isExpired(c)).length} active</p>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark transition-colors">
            <Plus className="w-4 h-4" /> New Coupon
          </button>
        </div>

        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" /></div>
          ) : coupons.length === 0 ? (
            <div className="p-12 text-center">
              <Tag className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No coupons yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Code</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Discount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Min Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Usage</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Validity</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg/50">
                    <td className="px-5 py-3">
                      <code className="px-2 py-1 bg-gold/10 text-gold text-xs font-bold rounded-lg">{c.code}</code>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium">
                      {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}
                      {c.max_discount_amount ? <span className="text-xs text-text-tertiary ml-1">(max {formatCurrency(c.max_discount_amount)})</span> : null}
                    </td>
                    <td className="px-5 py-3 text-sm">{c.min_order_amount > 0 ? formatCurrency(c.min_order_amount) : '—'}</td>
                    <td className="px-5 py-3 text-sm">
                      <span className={isExhausted(c) ? 'text-error font-medium' : ''}>
                        {c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ''}
                      </span>
                      <span className="text-xs text-text-tertiary ml-1">({c.per_user_limit}/user)</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary">
                      {formatDate(c.valid_from)} — {formatDate(c.valid_until)}
                    </td>
                    <td className="px-5 py-3">
                      {isExpired(c) ? <span className="badge badge-error text-[10px]">Expired</span>
                        : isExhausted(c) ? <span className="badge badge-warning text-[10px]">Exhausted</span>
                        : c.is_active ? <span className="badge badge-success text-[10px]">Active</span>
                        : <span className="badge text-[10px] bg-bg text-text-tertiary">Disabled</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleActive(c.id, c.is_active)} className="p-2 rounded-lg hover:bg-bg">
                          {c.is_active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4 text-text-tertiary" />}
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-error/10"><Trash2 className="w-4 h-4 text-error" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">Create Coupon</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Coupon Code *</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm font-mono uppercase focus:outline-none focus:border-gold" placeholder="YAOSHANG30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Type</label>
                  <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Value *</label>
                  <input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Min Order (₹)</label>
                  <input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Max Discount (₹)</label>
                  <input type="number" value={form.max_discount_amount} onChange={(e) => setForm({ ...form, max_discount_amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Total Usage Limit</label>
                  <input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="0 = unlimited" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Per User Limit</label>
                  <input type="number" value={form.per_user_limit} onChange={(e) => setForm({ ...form, per_user_limit: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Valid From *</label>
                  <input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Valid Until *</label>
                  <input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.code || !form.valid_from || !form.valid_until}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} <Tag className="w-4 h-4" /> Create Coupon
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
