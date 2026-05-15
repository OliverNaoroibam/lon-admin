'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, getInitials } from '@/lib/utils';
import { Truck, Loader2, CheckCircle, XCircle, Eye, X, MapPin, Phone, FileText, Car } from 'lucide-react';

interface DP {
  id: string;
  user_id: string;
  vehicle_type: string;
  vehicle_number: string | null;
  license_number: string | null;
  id_proof_url: string | null;
  license_url: string | null;
  vehicle_doc_url: string | null;
  is_verified: boolean;
  is_online: boolean;
  current_lat: number | null;
  current_lng: number | null;
  total_deliveries: number;
  rating: number;
  created_at: string;
  User: { full_name: string; phone: string; email: string } | null;
  DeliveryZone: { zone_name: string }[] | null;
}

export default function DeliveryPage() {
  const [partners, setPartners] = useState<DP[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'verified' | 'all'>('pending');
  const [selected, setSelected] = useState<DP | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchPartners(); }, [filter]);

  async function fetchPartners() {
    setLoading(true);
    let query = supabase
      .from('DeliveryPartner')
      .select('*, User:user_id(full_name, phone, email)')
      .order('created_at', { ascending: false });

    if (filter === 'pending') query = query.eq('is_verified', false);
    else if (filter === 'verified') query = query.eq('is_verified', true);

    const { data } = await query;
    if (data) setPartners(data as unknown as DP[]);
    setLoading(false);
  }

  async function handleAction(id: string, userId: string, action: 'approve' | 'reject') {
    setActionLoading(true);
    if (action === 'approve') {
      await supabase.from('DeliveryPartner').update({ is_verified: true }).eq('id', id);
      await supabase.from('User').update({ role: 'DELIVERY_PARTNER' }).eq('id', userId);
    } else {
      await supabase.from('DeliveryPartner').delete().eq('id', id);
    }
    setActionLoading(false);
    setSelected(null);
    fetchPartners();
  }

  return (
    <>
      <Header title="Delivery Partners" />
      <div className="p-8">
        <div className="flex gap-2 mb-6">
          {(['pending', 'verified', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                filter === f ? 'bg-gold/10 text-gold ring-1 ring-gold/20' : 'text-text-tertiary hover:text-text-primary hover:bg-bg'
              }`}>{f}</button>
          ))}
        </div>

        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" /></div>
          ) : partners.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No delivery partners found</p>
              <p className="text-xs text-text-tertiary mt-1">Partners will appear here after registering via the LON Delivery app</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Partner</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Deliveries</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Rating</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Applied</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((dp) => (
                  <tr key={dp.id} className="border-b border-border last:border-0 hover:bg-bg/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-info/10 flex items-center justify-center text-xs font-semibold text-info">
                          {getInitials(dp.User?.full_name || 'DP')}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{dp.User?.full_name || '—'}</p>
                          <p className="text-xs text-text-tertiary">{dp.User?.phone || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 text-sm"><Car className="w-3.5 h-3.5 text-text-tertiary" />{dp.vehicle_type || '—'}</div>
                      <p className="text-xs text-text-tertiary">{dp.vehicle_number || ''}</p>
                    </td>
                    <td className="px-5 py-3 text-sm">{dp.total_deliveries}</td>
                    <td className="px-5 py-3 text-sm">
                      {dp.rating > 0 ? <span className="text-gold">★ {dp.rating.toFixed(1)}</span> : <span className="text-text-tertiary">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`badge text-[10px] ${dp.is_verified ? 'badge-success' : 'badge-warning'}`}>
                          {dp.is_verified ? 'Verified' : 'Pending'}
                        </span>
                        {dp.is_verified && (
                          <span className={`w-2 h-2 rounded-full ${dp.is_online ? 'bg-success' : 'bg-text-tertiary'}`} title={dp.is_online ? 'Online' : 'Offline'} />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary">{formatDate(dp.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelected(dp)} className="p-2 rounded-lg hover:bg-bg"><Eye className="w-4 h-4 text-text-secondary" /></button>
                        {!dp.is_verified && (
                          <>
                            <button onClick={() => handleAction(dp.id, dp.user_id, 'approve')} className="p-2 rounded-lg hover:bg-success/10"><CheckCircle className="w-4 h-4 text-success" /></button>
                            <button onClick={() => handleAction(dp.id, dp.user_id, 'reject')} className="p-2 rounded-lg hover:bg-error/10"><XCircle className="w-4 h-4 text-error" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">Delivery Partner — {selected.User?.full_name}</h3>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-[11px] text-text-tertiary">Name</p><p className="text-sm font-medium">{selected.User?.full_name}</p></div>
                <div><p className="text-[11px] text-text-tertiary">Phone</p><p className="text-sm">{selected.User?.phone}</p></div>
                <div><p className="text-[11px] text-text-tertiary">Vehicle</p><p className="text-sm">{selected.vehicle_type} — {selected.vehicle_number || '—'}</p></div>
                <div><p className="text-[11px] text-text-tertiary">License</p><p className="text-sm">{selected.license_number || '—'}</p></div>
              </div>

              <div>
                <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">Documents</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'ID Proof', url: selected.id_proof_url },
                    { label: 'License', url: selected.license_url },
                    { label: 'Vehicle Doc', url: selected.vehicle_doc_url },
                  ].map((doc) => (
                    <a key={doc.label} href={doc.url || '#'} target="_blank" rel="noopener noreferrer"
                      className={`h-20 rounded-xl border flex flex-col items-center justify-center text-xs transition-colors ${
                        doc.url ? 'bg-bg border-border hover:border-gold text-text-secondary' : 'bg-bg/50 border-border/50 text-text-tertiary'
                      }`}>
                      <FileText className="w-4 h-4 mb-1" />
                      {doc.label}
                      {doc.url ? ' ↗' : ' (none)'}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {!selected.is_verified && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                <button onClick={() => handleAction(selected.id, selected.user_id, 'reject')} disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl border border-error/30 text-error text-sm font-medium hover:bg-error/5 disabled:opacity-50">Reject</button>
                <button onClick={() => handleAction(selected.id, selected.user_id, 'approve')} disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-success text-white text-sm font-medium hover:bg-success/90 disabled:opacity-50">
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />} Approve Partner
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
