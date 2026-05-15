'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, getInitials } from '@/lib/utils';
import {
  CheckCircle,
  XCircle,
  Eye,
  Store,
  MapPin,
  Phone,
  ExternalLink,
  X,
  Loader2,
} from 'lucide-react';

interface Seller {
  id: string;
  user_id: string;
  shop_name: string;
  shop_description: string;
  shop_address: string;
  shop_city: string;
  shop_category: string;
  shop_logo_url: string | null;
  cover_image_url: string | null;
  verification_status: string;
  gov_id_type: string;
  gov_id_front_url: string | null;
  gov_id_back_url: string | null;
  pan_number: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_holder_name: string | null;
  upi_id: string | null;
  gstin: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  created_at: string;
  User: {
    full_name: string;
    phone: string;
    email: string;
    profile_picture_url: string | null;
  } | null;
}

export function SellerQueue() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSellers();
  }, [filter]);

  async function fetchSellers() {
    setLoading(true);
    let query = supabase
      .from('SellerProfile')
      .select('*, User!inner(full_name, phone, email, profile_picture_url)')
      .order('created_at', { ascending: false });

    if (filter !== 'ALL') {
      query = query.eq('verification_status', filter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setSellers(data as unknown as Seller[]);
    }
    setLoading(false);
  }

  async function handleAction(sellerId: string, action: 'APPROVED' | 'REJECTED') {
    setActionLoading(true);
    const { error } = await supabase
      .from('SellerProfile')
      .update({
        verification_status: action,
        verified_at: action === 'APPROVED' ? new Date().toISOString() : null,
      })
      .eq('id', sellerId);

    if (!error) {
      // Also update user role if approved
      if (action === 'APPROVED') {
        const seller = sellers.find((s) => s.id === sellerId);
        if (seller) {
          await supabase
            .from('User')
            .update({
              role: 'SELLER',
              seller_status: 'APPROVED',
            })
            .eq('id', seller.user_id);
        }
      }

      setSelectedSeller(null);
      fetchSellers();
    }
    setActionLoading(false);
  }

  const filterTabs = [
    { value: 'PENDING' as const, label: 'Pending', color: 'bg-warning/10 text-warning' },
    { value: 'APPROVED' as const, label: 'Approved', color: 'bg-success/10 text-success' },
    { value: 'REJECTED' as const, label: 'Rejected', color: 'bg-error/10 text-error' },
    { value: 'ALL' as const, label: 'All', color: 'bg-bg text-text-secondary' },
  ];

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab.value
                ? tab.color + ' ring-1 ring-current/20'
                : 'text-text-tertiary hover:text-text-primary hover:bg-bg'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" />
            <p className="text-sm text-text-tertiary mt-2">Loading sellers...</p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="p-12 text-center">
            <Store className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No {filter.toLowerCase()} applications</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Seller
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Shop
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Applied
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller) => (
                <tr
                  key={seller.id}
                  className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-sm font-semibold text-gold">
                        {getInitials(seller.User?.full_name || 'U')}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {seller.User?.full_name || '—'}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {seller.User?.phone || seller.User?.email || '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-text-primary font-medium">
                      {seller.shop_name || '—'}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {seller.shop_category || '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <MapPin className="w-3 h-3" />
                      {seller.shop_city || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-text-secondary">
                      {formatDate(seller.created_at)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`badge ${
                        seller.verification_status === 'APPROVED'
                          ? 'badge-success'
                          : seller.verification_status === 'REJECTED'
                          ? 'badge-error'
                          : 'badge-warning'
                      }`}
                    >
                      {seller.verification_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedSeller(seller)}
                        className="p-2 rounded-lg hover:bg-bg transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-text-secondary" />
                      </button>
                      {seller.verification_status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAction(seller.id, 'APPROVED')}
                            className="p-2 rounded-lg hover:bg-success/10 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4 text-success" />
                          </button>
                          <button
                            onClick={() => handleAction(seller.id, 'REJECTED')}
                            className="p-2 rounded-lg hover:bg-error/10 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4 text-error" />
                          </button>
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

      {/* Detail Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-text-primary">
                Seller Application — {selectedSeller.shop_name}
              </h3>
              <button
                onClick={() => setSelectedSeller(null)}
                className="p-2 rounded-lg hover:bg-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Name" value={selectedSeller.User?.full_name} />
                  <InfoField label="Phone" value={selectedSeller.User?.phone} icon={<Phone className="w-3 h-3" />} />
                  <InfoField label="Email" value={selectedSeller.User?.email} />
                  <InfoField label="ID Type" value={selectedSeller.gov_id_type} />
                </div>
              </div>

              {/* Store Info */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Store Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Shop Name" value={selectedSeller.shop_name} />
                  <InfoField label="Category" value={selectedSeller.shop_category} />
                  <InfoField label="City" value={selectedSeller.shop_city} />
                  <InfoField label="GSTIN" value={selectedSeller.gstin} />
                </div>
                {selectedSeller.shop_description && (
                  <div className="mt-3">
                    <InfoField label="Description" value={selectedSeller.shop_description} />
                  </div>
                )}
              </div>

              {/* Payment Info */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Payment Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Bank Account" value={selectedSeller.bank_account_number ? '•••• ' + selectedSeller.bank_account_number.slice(-4) : null} />
                  <InfoField label="IFSC" value={selectedSeller.bank_ifsc} />
                  <InfoField label="Account Holder" value={selectedSeller.bank_holder_name} />
                  <InfoField label="UPI" value={selectedSeller.upi_id} />
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Social Links
                </h4>
                <div className="flex gap-3">
                  {selectedSeller.instagram_url && (
                    <a href={selectedSeller.instagram_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg text-sm text-text-secondary hover:text-text-primary transition-colors">
                      Instagram <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedSeller.facebook_url && (
                    <a href={selectedSeller.facebook_url} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg text-sm text-text-secondary hover:text-text-primary transition-colors">
                      Facebook <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {!selectedSeller.instagram_url && !selectedSeller.facebook_url && (
                    <p className="text-sm text-text-tertiary">No social links provided</p>
                  )}
                </div>
              </div>

              {/* ID Documents */}
              {(selectedSeller.gov_id_front_url || selectedSeller.gov_id_back_url) && (
                <div>
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                    ID Documents
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSeller.gov_id_front_url && (
                      <a href={selectedSeller.gov_id_front_url} target="_blank" rel="noopener noreferrer"
                         className="block h-32 rounded-xl bg-bg border border-border flex items-center justify-center text-sm text-text-secondary hover:border-gold transition-colors">
                        ID Front ↗
                      </a>
                    )}
                    {selectedSeller.gov_id_back_url && (
                      <a href={selectedSeller.gov_id_back_url} target="_blank" rel="noopener noreferrer"
                         className="block h-32 rounded-xl bg-bg border border-border flex items-center justify-center text-sm text-text-secondary hover:border-gold transition-colors">
                        ID Back ↗
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal actions */}
            {selectedSeller.verification_status === 'PENDING' && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                <button
                  onClick={() => handleAction(selectedSeller.id, 'REJECTED')}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl border border-error/30 text-error text-sm font-medium hover:bg-error/5 disabled:opacity-50 transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction(selectedSeller.id, 'APPROVED')}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-success text-white text-sm font-medium hover:bg-success/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Approve Seller
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function InfoField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] text-text-tertiary mb-0.5">{label}</p>
      <p className="text-sm text-text-primary flex items-center gap-1.5">
        {icon}
        {value || <span className="text-text-tertiary">—</span>}
      </p>
    </div>
  );
}
