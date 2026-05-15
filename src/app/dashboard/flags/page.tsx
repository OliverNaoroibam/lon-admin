'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, getInitials } from '@/lib/utils';
import { Flag, Loader2, CheckCircle, X, Eye } from 'lucide-react';

interface Report {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  description: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  User: { full_name: string } | null;
}

export default function FlagsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'all'>('pending');
  const [selected, setSelected] = useState<Report | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => { fetchReports(); }, [filter]);

  async function fetchReports() {
    setLoading(true);
    let query = supabase
      .from('Report')
      .select('*, User:reporter_id(full_name)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    if (data) setReports(data as unknown as Report[]);
    setLoading(false);
  }

  async function handleResolve(id: string, action: 'reviewed' | 'dismissed') {
    await supabase.from('Report').update({ status: action, admin_notes: notes }).eq('id', id);
    setSelected(null);
    setNotes('');
    fetchReports();
  }

  const typeColor: Record<string, string> = { product: 'badge-info', seller: 'badge-gold', review: 'badge-warning', user: 'badge-error' };

  return (
    <>
      <Header title="Content Flags" />
      <div className="p-8">
        <div className="flex gap-2 mb-6">
          {(['pending', 'reviewed', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                filter === f ? 'bg-gold/10 text-gold ring-1 ring-gold/20' : 'text-text-tertiary hover:text-text-primary hover:bg-bg'
              }`}>{f}</button>
          ))}
        </div>

        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" /></div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center">
              <Flag className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No reports found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Reporter</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Reason</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-error/10 flex items-center justify-center text-[10px] font-semibold text-error">
                          {getInitials(r.User?.full_name || 'U')}
                        </div>
                        <span className="text-sm">{r.User?.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className={`badge text-[10px] ${typeColor[r.target_type] || 'badge-info'}`}>{r.target_type}</span></td>
                    <td className="px-5 py-3 text-sm text-text-secondary max-w-[200px] truncate">{r.reason}</td>
                    <td className="px-5 py-3">
                      <span className={`badge text-[10px] ${r.status === 'pending' ? 'badge-warning' : r.status === 'reviewed' ? 'badge-success' : 'bg-bg text-text-tertiary'}`}>{r.status}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary">{formatDate(r.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => { setSelected(r); setNotes(r.admin_notes || ''); }} className="p-2 rounded-lg hover:bg-bg"><Eye className="w-4 h-4 text-text-secondary" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-md m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">Report Details</h3>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-[11px] text-text-tertiary">Type</p><p className="text-sm font-medium capitalize">{selected.target_type}</p></div>
                <div><p className="text-[11px] text-text-tertiary">Target ID</p><p className="text-xs font-mono text-text-secondary truncate">{selected.target_id}</p></div>
              </div>
              <div>
                <p className="text-[11px] text-text-tertiary">Reason</p>
                <p className="text-sm">{selected.reason}</p>
                {selected.description && <p className="text-sm text-text-secondary mt-1">{selected.description}</p>}
              </div>
              {selected.status === 'pending' && (
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Admin Notes</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold resize-none" rows={3}
                    placeholder="Action taken or reason for dismissal..." />
                </div>
              )}
            </div>
            {selected.status === 'pending' && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
                <button onClick={() => handleResolve(selected.id, 'dismissed')}
                  className="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-bg">Dismiss</button>
                <button onClick={() => handleResolve(selected.id, 'reviewed')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-success text-white rounded-xl text-sm font-medium hover:bg-success/90">
                  <CheckCircle className="w-4 h-4" /> Mark Reviewed
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
