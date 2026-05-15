'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Package, Search, Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  original_price: number;
  sale_price: number;
  listing_type: string;
  section_type: string | null;
  is_active: boolean;
  admin_approved: boolean;
  view_count: number;
  created_at: string;
  Category: { name: string } | null;
  SellerProfile: { shop_name: string } | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  async function fetchProducts() {
    setLoading(true);
    let query = supabase
      .from('Product')
      .select('*, Category(name), SellerProfile:seller_id(shop_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter === 'pending') {
      query = query.eq('admin_approved', false).eq('is_active', true);
    } else if (filter === 'approved') {
      query = query.eq('admin_approved', true);
    }

    const { data, error } = await query;
    if (!error && data) setProducts(data as unknown as Product[]);
    setLoading(false);
  }

  async function handleApprove(id: string) {
    await supabase.from('Product').update({ admin_approved: true }).eq('id', id);
    fetchProducts();
  }

  async function handleReject(id: string) {
    await supabase.from('Product').update({ is_active: false, admin_approved: false }).eq('id', id);
    fetchProducts();
  }

  const sectionColors: Record<string, string> = {
    BUY_TRADITIONAL: 'badge-gold',
    RENT_TRADITIONAL: 'bg-rent-traditional/10 text-rent-traditional',
    MODERN: 'bg-modern/10 text-modern',
    THRIFT: 'bg-thrift/10 text-thrift',
  };

  return (
    <>
      <Header title="Products" />
      <div className="p-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 'pending' as const, label: 'Pending Approval' },
            { value: 'approved' as const, label: 'Approved' },
            { value: 'all' as const, label: 'All' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === tab.value
                  ? 'bg-gold/10 text-gold ring-1 ring-gold/20'
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
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No products found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Seller</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Section</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Type</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Listed</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-text-primary line-clamp-1">{product.title}</p>
                      <p className="text-xs text-text-tertiary">{product.Category?.name || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{product.SellerProfile?.shop_name || '—'}</td>
                    <td className="px-6 py-4">
                      {product.section_type && (
                        <span className={`badge ${sectionColors[product.section_type] || 'badge-gold'}`}>
                          {product.section_type.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{formatCurrency(product.sale_price)}</p>
                      {product.sale_price < product.original_price && (
                        <p className="text-xs text-text-tertiary line-through">{formatCurrency(product.original_price)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-info">{product.listing_type}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-secondary">{formatDate(product.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!product.admin_approved && product.is_active && (
                          <>
                            <button onClick={() => handleApprove(product.id)} className="p-2 rounded-lg hover:bg-success/10" title="Approve">
                              <CheckCircle className="w-4 h-4 text-success" />
                            </button>
                            <button onClick={() => handleReject(product.id)} className="p-2 rounded-lg hover:bg-error/10" title="Reject">
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
      </div>
    </>
  );
}
