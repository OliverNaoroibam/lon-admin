'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import { CreditCard, Loader2, CheckCircle, Clock, ArrowUpRight, Wallet } from 'lucide-react';

interface Payout {
  id: string;
  amount: number;
  status: string;
  payout_method: string;
  razorpay_payout_id: string | null;
  scheduled_date: string;
  created_at: string;
  processed_at: string | null;
  SellerProfile: { shop_name: string; bank_account_number: string | null; upi_id: string | null } | null;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'scheduled' | 'processed' | 'ALL'>('scheduled');
  const [stats, setStats] = useState({ pending: 0, pendingAmount: 0, paid: 0, paidAmount: 0 });

  useEffect(() => { fetchPayouts(); }, [filter]);

  async function fetchPayouts() {
    setLoading(true);
    let query = supabase
      .from('SellerPayout')
      .select('*, SellerProfile:seller_id(shop_name, bank_account_number, upi_id)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter !== 'ALL') query = query.eq('status', filter);

    const { data } = await query;
    if (data) {
      const all = data as unknown as Payout[];
      setPayouts(all);
      setStats({
        pending: all.filter(p => p.status === 'scheduled').length,
        pendingAmount: all.filter(p => p.status === 'scheduled').reduce((s, p) => s + p.amount, 0),
        paid: all.filter(p => p.status === 'processed').length,
        paidAmount: all.filter(p => p.status === 'processed').reduce((s, p) => s + p.amount, 0),
      });
    }
    setLoading(false);
  }

  async function handlePay(id: string) {
    if (!confirm('Mark this payout as paid? Make sure you have transferred the amount.')) return;
    await supabase.from('SellerPayout').update({
      status: 'processed',
      processed_at: new Date().toISOString(),
      razorpay_payout_id: `PAY_${Date.now()}`,
    }).eq('id', id);
    fetchPayouts();
  }

  return (
    <>
      <Header title="Payout Manager" />
      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-warning" /><p className="text-xs text-text-tertiary">Pending</p></div>
            <p className="text-lg font-bold text-warning">{stats.pending}</p>
            <p className="text-xs text-text-tertiary">{formatCurrency(stats.pendingAmount)}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-success" /><p className="text-xs text-text-tertiary">Paid</p></div>
            <p className="text-lg font-bold text-success">{stats.paid}</p>
            <p className="text-xs text-text-tertiary">{formatCurrency(stats.paidAmount)}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-gold" /><p className="text-xs text-text-tertiary">Min Threshold</p></div>
            <p className="text-lg font-bold">₹200</p>
            <p className="text-xs text-text-tertiary">Per payout cycle</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2"><ArrowUpRight className="w-4 h-4 text-info" /><p className="text-xs text-text-tertiary">Payout Cycle</p></div>
            <p className="text-lg font-bold">Weekly</p>
            <p className="text-xs text-text-tertiary">Every Monday</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {(['scheduled', 'processed', 'ALL'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                filter === f ? 'bg-gold/10 text-gold ring-1 ring-gold/20' : 'text-text-tertiary hover:text-text-primary hover:bg-bg'
              }`}>
              {f === 'scheduled' ? 'Pending' : f === 'processed' ? 'Paid' : f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" /></div>
          ) : payouts.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No payouts found</p>
              <p className="text-xs text-text-tertiary mt-1">Payouts are generated weekly from completed orders</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Seller</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Period</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Method</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Ref</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-xs font-semibold text-gold">
                          {getInitials(p.SellerProfile?.shop_name || 'S')}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{p.SellerProfile?.shop_name || '—'}</p>
                          <p className="text-xs text-text-tertiary">{p.SellerProfile?.upi_id || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold">{formatCurrency(p.amount)}</td>
                    <td className="px-5 py-3 text-xs text-text-secondary">{formatDate(p.scheduled_date)}</td>
                    <td className="px-5 py-3"><span className="badge badge-info text-[10px]">{p.payout_method || 'Bank'}</span></td>
                    <td className="px-5 py-3">
                      <span className={`badge text-[10px] ${p.status === 'processed' ? 'badge-success' : 'badge-warning'}`}>{p.status === 'processed' ? 'PAID' : 'PENDING'}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-tertiary font-mono">{p.razorpay_payout_id || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      {p.status === 'scheduled' && (
                        <button onClick={() => handlePay(p.id)}
                          className="px-3 py-1.5 bg-success/10 text-success text-xs font-medium rounded-lg hover:bg-success/20 transition-colors">
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
