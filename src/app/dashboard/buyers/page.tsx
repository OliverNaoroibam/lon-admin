'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, getInitials } from '@/lib/utils';
import { Search, Users, Loader2 } from 'lucide-react';

interface Buyer {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  profile_picture_url: string | null;
  role: string;
  is_active: boolean;
  wallet_balance: number;
  created_at: string;
  last_login_at: string | null;
}

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBuyers();
  }, []);

  async function fetchBuyers() {
    const { data, error } = await supabase
      .from('User')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setBuyers(data as Buyer[]);
    }
    setLoading(false);
  }

  async function toggleActive(userId: string, currentState: boolean) {
    await supabase
      .from('User')
      .update({ is_active: !currentState })
      .eq('id', userId);
    fetchBuyers();
  }

  const filtered = buyers.filter(
    (b) =>
      (b.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (b.phone || '').includes(search) ||
      (b.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header title="All Buyers" />
      <div className="p-8">
        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm placeholder-text-tertiary focus:outline-none focus:border-gold transition-colors"
            />
          </div>
          <span className="text-sm text-text-secondary">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No users found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">User</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Wallet</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Joined</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((buyer) => (
                  <tr key={buyer.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-sm font-semibold text-gold">
                          {getInitials(buyer.full_name || 'U')}
                        </div>
                        <p className="text-sm font-medium">{buyer.full_name || '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{buyer.phone || '—'}</p>
                      <p className="text-xs text-text-tertiary">{buyer.email || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-gold">{buyer.role}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">₹{buyer.wallet_balance || 0}</td>
                    <td className="px-6 py-4 text-xs text-text-secondary">{formatDate(buyer.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${buyer.is_active ? 'badge-success' : 'badge-error'}`}>
                        {buyer.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleActive(buyer.id, buyer.is_active)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          buyer.is_active
                            ? 'text-error hover:bg-error/10'
                            : 'text-success hover:bg-success/10'
                        }`}
                      >
                        {buyer.is_active ? 'Suspend' : 'Activate'}
                      </button>
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
