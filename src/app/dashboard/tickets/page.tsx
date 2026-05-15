'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, getInitials } from '@/lib/utils';
import { Headphones, Loader2, X, CheckCircle, Clock, MessageCircle } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  description: string;
  status: string;
  priority: string | null;
  resolution: string | null;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  User: { full_name: string; email: string | null } | null;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'acknowledged' | 'resolved' | 'all'>('open');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTickets(); }, [filter]);

  async function fetchTickets() {
    setLoading(true);
    let query = supabase
      .from('GrievanceTicket')
      .select('*, User:user_id(full_name, email)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    if (data) setTickets(data as unknown as Ticket[]);
    setLoading(false);
  }

  async function handleAcknowledge(id: string) {
    await supabase.from('GrievanceTicket').update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() }).eq('id', id);
    setSelected(null);
    fetchTickets();
  }

  async function handleResolve(id: string) {
    setSaving(true);
    await supabase.from('GrievanceTicket').update({
      status: 'resolved', resolution: resolution, resolved_at: new Date().toISOString(),
    }).eq('id', id);
    setSaving(false);
    setSelected(null);
    setResolution('');
    fetchTickets();
  }

  const categoryColors: Record<string, string> = {
    order: 'badge-info', payment: 'badge-gold', delivery: 'badge-warning',
    product: 'bg-purple-100 text-purple-700', account: 'badge-error', other: 'bg-bg text-text-secondary',
  };
  const priorityColors: Record<string, string> = { high: 'text-error', medium: 'text-warning', low: 'text-text-tertiary' };

  function getSLA(ticket: Ticket) {
    const created = new Date(ticket.created_at);
    const now = ticket.resolved_at ? new Date(ticket.resolved_at) : new Date();
    const hours = Math.round((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    return hours;
  }

  return (
    <>
      <Header title="Support Tickets" />
      <div className="p-8">
        <div className="flex gap-2 mb-6">
          {(['open', 'acknowledged', 'resolved', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                filter === f ? 'bg-gold/10 text-gold ring-1 ring-gold/20' : 'text-text-tertiary hover:text-text-primary hover:bg-bg'
              }`}>{f}</button>
          ))}
        </div>

        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" /></div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center">
              <Headphones className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No tickets found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Subject</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">SLA</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">View</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-bg/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center text-[10px] font-semibold text-gold">
                          {getInitials(t.User?.full_name || 'U')}
                        </div>
                        <div>
                          <p className="text-sm">{t.User?.full_name || '—'}</p>
                          <p className="text-[10px] text-text-tertiary">{t.User?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm max-w-[200px] truncate">{t.subject}</td>
                    <td className="px-5 py-3"><span className={`badge text-[10px] ${categoryColors[t.category] || 'badge-info'}`}>{t.category}</span></td>
                    <td className="px-5 py-3">
                      <span className={`badge text-[10px] ${t.status === 'open' ? 'badge-error' : t.status === 'acknowledged' ? 'badge-warning' : 'badge-success'}`}>{t.status}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${getSLA(t) > 48 ? 'text-error' : getSLA(t) > 24 ? 'text-warning' : 'text-text-secondary'}`}>
                        {getSLA(t)}h
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary">{formatDate(t.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => { setSelected(t); setResolution(t.resolution || ''); }} className="p-2 rounded-lg hover:bg-bg">
                        <MessageCircle className="w-4 h-4 text-text-secondary" />
                      </button>
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
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">Ticket Details</h3>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-[11px] text-text-tertiary">User</p><p className="text-sm font-medium">{selected.User?.full_name}</p></div>
                <div><p className="text-[11px] text-text-tertiary">Category</p><p className="text-sm capitalize">{selected.category}</p></div>
              </div>
              <div>
                <p className="text-[11px] text-text-tertiary">Subject</p>
                <p className="text-sm font-medium">{selected.subject}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-tertiary">Description</p>
                <p className="text-sm text-text-secondary">{selected.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 bg-bg rounded-xl p-3">
                <div><p className="text-[10px] text-text-tertiary">Created</p><p className="text-xs">{formatDate(selected.created_at)}</p></div>
                <div><p className="text-[10px] text-text-tertiary">Acknowledged</p><p className="text-xs">{selected.acknowledged_at ? formatDate(selected.acknowledged_at) : '—'}</p></div>
                <div><p className="text-[10px] text-text-tertiary">Resolved</p><p className="text-xs">{selected.resolved_at ? formatDate(selected.resolved_at) : '—'}</p></div>
              </div>
              {selected.status !== 'resolved' && (
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Resolution</label>
                  <textarea value={resolution} onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold resize-none" rows={3}
                    placeholder="Describe the resolution..." />
                </div>
              )}
            </div>
            {selected.status !== 'resolved' && (
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
                {selected.status === 'open' && (
                  <button onClick={() => handleAcknowledge(selected.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-warning bg-warning/10 hover:bg-warning/20">
                    <Clock className="w-4 h-4" /> Acknowledge
                  </button>
                )}
                <button onClick={() => handleResolve(selected.id)} disabled={saving || !resolution}
                  className="flex items-center gap-2 px-5 py-2.5 bg-success text-white rounded-xl text-sm font-medium hover:bg-success/90 disabled:opacity-50">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} <CheckCircle className="w-4 h-4" /> Resolve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
