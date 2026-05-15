'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import { Wallet, Loader2, ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';

interface WalletTx {
  id: string;
  amount: number;
  type: string;
  source: string;
  description: string | null;
  balance_after: number;
  created_at: string;
  User: { full_name: string } | null;
}

export default function WalletPage() {
  const [txns, setTxns] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchTxns(); }, [filter]);

  async function fetchTxns() {
    setLoading(true);
    let query = supabase
      .from('WalletTransaction')
      .select('*, User:user_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filter !== 'all') query = query.eq('type', filter);
    const { data } = await query;
    if (data) setTxns(data as unknown as WalletTx[]);
    setLoading(false);
  }

  const filtered = search
    ? txns.filter(t => t.User?.full_name?.toLowerCase().includes(search.toLowerCase()) || t.source?.toLowerCase().includes(search.toLowerCase()))
    : txns;

  const totalCredit = txns.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit = txns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <Header title="Wallet Transactions" />
      <div className="p-8">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-gold" /><p className="text-xs text-text-tertiary">Total Transactions</p></div>
            <p className="text-lg font-bold">{txns.length}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2"><ArrowUpRight className="w-4 h-4 text-success" /><p className="text-xs text-text-tertiary">Credits</p></div>
            <p className="text-lg font-bold text-success">{formatCurrency(totalCredit)}</p>
          </div>
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2"><ArrowDownRight className="w-4 h-4 text-error" /><p className="text-xs text-text-tertiary">Debits</p></div>
            <p className="text-lg font-bold text-error">{formatCurrency(totalDebit)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['all', 'credit', 'debit'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  filter === f ? 'bg-gold/10 text-gold ring-1 ring-gold/20' : 'text-text-tertiary hover:text-text-primary hover:bg-bg'
                }`}>{f}</button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold w-64"
              placeholder="Search by name or source..." />
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No transactions found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Source</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Balance After</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-bg/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center text-[10px] font-semibold text-gold">
                          {getInitials(t.User?.full_name || 'U')}
                        </div>
                        <span className="text-sm">{t.User?.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {t.type === 'credit'
                          ? <ArrowUpRight className="w-3.5 h-3.5 text-success" />
                          : <ArrowDownRight className="w-3.5 h-3.5 text-error" />}
                        <span className={`text-xs font-medium ${t.type === 'credit' ? 'text-success' : 'text-error'}`}>{t.type}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-sm font-semibold ${t.type === 'credit' ? 'text-success' : 'text-error'}`}>
                        {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3"><span className="badge badge-info text-[10px]">{t.source}</span></td>
                    <td className="px-5 py-3 text-xs text-text-secondary max-w-[200px] truncate">{t.description || '—'}</td>
                    <td className="px-5 py-3 text-sm font-medium">{formatCurrency(t.balance_after)}</td>
                    <td className="px-5 py-3 text-xs text-text-secondary">{formatDate(t.created_at)}</td>
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
