'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, formatCurrency } from '@/lib/utils';
import { AlertTriangle, Loader2, Eye, X, Camera, CheckCircle, Scale } from 'lucide-react';

interface Dispute {
  id: string;
  status: string;
  reason: string;
  description: string | null;
  evidence_urls: string[] | null;
  admin_notes: string | null;
  resolution: string | null;
  refund_amount: number | null;
  damage_tier: string | null;
  created_at: string;
  resolved_at: string | null;
  Order: { order_number: string; grand_total: number } | null;
  User: { full_name: string; phone: string } | null;
}

const tierInfo: Record<string, { label: string; refund: string; color: string }> = {
  NONE: { label: 'No Damage', refund: '100% deposit back', color: 'badge-success' },
  MINOR: { label: 'Minor Damage', refund: '25% deducted', color: 'badge-warning' },
  MODERATE: { label: 'Moderate Damage', refund: '50% deducted', color: 'bg-orange-500/10 text-orange-600' },
  SEVERE: { label: 'Severe Damage', refund: '100% deducted', color: 'badge-error' },
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'OPEN' | 'RESOLVED' | 'ALL'>('OPEN');
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [resolveForm, setResolveForm] = useState({ notes: '', resolution: '', damage_tier: 'NONE', refund_amount: 0 });

  useEffect(() => { fetchDisputes(); }, [filter]);

  async function fetchDisputes() {
    setLoading(true);
    let query = supabase
      .from('Dispute')
      .select('*, Order:order_id(order_number, grand_total), User:buyer_id(full_name, phone)')
      .order('created_at', { ascending: false });

    if (filter !== 'ALL') query = query.eq('status', filter);
    const { data } = await query;
    if (data) setDisputes(data as unknown as Dispute[]);
    setLoading(false);
  }

  async function handleResolve(id: string) {
    await supabase.from('Dispute').update({
      status: 'RESOLVED',
      admin_notes: resolveForm.notes,
      resolution: resolveForm.resolution,
      damage_tier: resolveForm.damage_tier,
      refund_amount: resolveForm.refund_amount,
      resolved_at: new Date().toISOString(),
    }).eq('id', id);
    setSelected(null);
    fetchDisputes();
  }

  return (
    <>
      <Header title="Dispute Center" />
      <div className="p-8">
        <div className="flex gap-2 mb-6">
          {(['OPEN', 'RESOLVED', 'ALL'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f ? 'bg-gold/10 text-gold ring-1 ring-gold/20' : 'text-text-tertiary hover:text-text-primary hover:bg-bg'
              }`}>
              {f}
            </button>
          ))}
        </div>

        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" /></div>
          ) : disputes.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No disputes found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Reason</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Tier</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Filed</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-bg/50">
                    <td className="px-5 py-3 text-sm font-mono">#{d.Order?.order_number || '—'}</td>
                    <td className="px-5 py-3 text-sm">{d.User?.full_name || '—'}</td>
                    <td className="px-5 py-3 text-sm text-text-secondary max-w-[200px] truncate">{d.reason}</td>
                    <td className="px-5 py-3 text-sm font-medium">{formatCurrency(d.Order?.grand_total || 0)}</td>
                    <td className="px-5 py-3">
                      {d.damage_tier ? (
                        <span className={`badge text-[10px] ${tierInfo[d.damage_tier]?.color || 'badge-info'}`}>
                          {tierInfo[d.damage_tier]?.label || d.damage_tier}
                        </span>
                      ) : <span className="text-xs text-text-tertiary">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge text-[10px] ${d.status === 'OPEN' ? 'badge-error' : 'badge-success'}`}>{d.status}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary">{formatDate(d.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => { setSelected(d); setResolveForm({ notes: d.admin_notes || '', resolution: d.resolution || '', damage_tier: d.damage_tier || 'NONE', refund_amount: d.refund_amount || 0 }); }}
                        className="p-2 rounded-lg hover:bg-bg"><Eye className="w-4 h-4 text-text-secondary" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Dispute Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">Dispute — Order #{selected.Order?.order_number}</h3>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-error/5 border border-error/20 rounded-xl p-4">
                <p className="text-xs text-error font-medium mb-1">Reason</p>
                <p className="text-sm">{selected.reason}</p>
                {selected.description && <p className="text-sm text-text-secondary mt-2">{selected.description}</p>}
              </div>

              {/* Evidence photos */}
              {selected.evidence_urls && selected.evidence_urls.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider flex items-center gap-1"><Camera className="w-3 h-3" /> Evidence Photos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.evidence_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block h-24 rounded-xl bg-bg border border-border overflow-hidden hover:border-gold transition-colors">
                        <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolve form */}
              {selected.status === 'OPEN' && (
                <div className="space-y-4 border-t border-border pt-5">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1"><Scale className="w-3 h-3" /> Resolution</p>

                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Damage Tier</label>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(tierInfo).map(([key, info]) => (
                        <button key={key} onClick={() => setResolveForm({ ...resolveForm, damage_tier: key })}
                          className={`p-2 rounded-xl border text-xs font-medium text-center transition-all ${
                            resolveForm.damage_tier === key
                              ? 'border-gold bg-gold/10 text-gold'
                              : 'border-border text-text-secondary hover:bg-bg'
                          }`}>
                          {info.label}
                          <p className="text-[10px] text-text-tertiary mt-0.5">{info.refund}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Refund Amount (₹)</label>
                    <input type="number" value={resolveForm.refund_amount}
                      onChange={(e) => setResolveForm({ ...resolveForm, refund_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                  </div>

                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Resolution Notes</label>
                    <textarea value={resolveForm.notes}
                      onChange={(e) => setResolveForm({ ...resolveForm, notes: e.target.value })}
                      className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold resize-none" rows={3}
                      placeholder="Admin decision and reasoning..." />
                  </div>

                  <div>
                    <label className="block text-xs text-text-secondary mb-1">Resolution Summary</label>
                    <input type="text" value={resolveForm.resolution}
                      onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })}
                      className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold"
                      placeholder="e.g., Full refund issued, Item was defective" />
                  </div>
                </div>
              )}
            </div>

            {selected.status === 'OPEN' && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                <button onClick={() => setSelected(null)} className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-bg">Cancel</button>
                <button onClick={() => handleResolve(selected.id)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-success text-white rounded-xl text-sm font-medium hover:bg-success/90">
                  <CheckCircle className="w-4 h-4" /> Resolve Dispute
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
