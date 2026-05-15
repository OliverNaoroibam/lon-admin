'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  ShoppingCart, Loader2, Eye, X, MapPin, Phone, Package, Clock, Truck, CheckCircle, XCircle, AlertTriangle,
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  grand_total: number;
  subtotal: number;
  delivery_fee: number;
  payment_method: string;
  payment_status: string;
  is_cod: boolean;
  gift_wrap: boolean;
  created_at: string;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  delivery_address_snapshot: Record<string, string> | null;
  User: { full_name: string; phone: string } | null;
  SellerProfile: { shop_name: string } | null;
}

const statusColors: Record<string, string> = {
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-info',
  PROCESSING: 'badge-info',
  SHIPPED: 'bg-purple-500/10 text-purple-600',
  OUT_FOR_DELIVERY: 'bg-blue-500/10 text-blue-600',
  DELIVERED: 'badge-success',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-error',
  RETURNED: 'badge-error',
  REFUNDED: 'bg-orange-500/10 text-orange-600',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => { fetchOrders(); }, [filter]);

  async function fetchOrders() {
    setLoading(true);
    let query = supabase
      .from('Order')
      .select('*, User:buyer_id(full_name, phone), SellerProfile:seller_id(shop_name)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (filter !== 'ALL') query = query.eq('status', filter);

    const { data } = await query;
    if (data) setOrders(data as unknown as Order[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const updates: Record<string, unknown> = { status };
    if (status === 'DELIVERED') updates.delivered_at = new Date().toISOString();
    if (status === 'CANCELLED') updates.cancelled_at = new Date().toISOString();

    await supabase.from('Order').update(updates).eq('id', id);
    setSelected(null);
    fetchOrders();
  }

  const filters = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <>
      <Header title="All Orders" />
      <div className="p-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                filter === f ? 'bg-gold/10 text-gold ring-1 ring-gold/20' : 'text-text-tertiary hover:text-text-primary hover:bg-bg'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: orders.length, color: 'text-text-primary' },
            { label: 'Pending', value: orders.filter(o => o.status === 'PENDING').length, color: 'text-warning' },
            { label: 'In Transit', value: orders.filter(o => ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.status)).length, color: 'text-info' },
            { label: 'Revenue', value: formatCurrency(orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status)).reduce((s, o) => s + (o.grand_total || 0), 0)), color: 'text-success' },
          ].map((s) => (
            <div key={s.label} className="bg-surface rounded-xl border border-border p-4">
              <p className="text-xs text-text-tertiary">{s.label}</p>
              <p className={`text-lg font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" /></div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingCart className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No orders found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Seller</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Payment</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-mono font-medium">#{order.order_number}</p>
                      {order.gift_wrap && <span className="text-[10px] text-gold">🎁 Gift</span>}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm">{order.User?.full_name || '—'}</p>
                      <p className="text-xs text-text-tertiary">{order.User?.phone || ''}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-text-secondary">{order.SellerProfile?.shop_name || '—'}</td>
                    <td className="px-5 py-3 text-sm font-medium">{formatCurrency(order.grand_total)}</td>
                    <td className="px-5 py-3">
                      <span className={`badge text-[10px] ${order.is_cod ? 'badge-warning' : 'badge-success'}`}>
                        {order.is_cod ? 'COD' : order.payment_method || 'Online'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`badge text-[10px] ${statusColors[order.status] || 'badge-info'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary">{formatDate(order.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setSelected(order)} className="p-2 rounded-lg hover:bg-bg">
                        <Eye className="w-4 h-4 text-text-secondary" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-semibold">Order #{selected.order_number}</h3>
                <p className="text-xs text-text-tertiary mt-0.5">{formatDate(selected.created_at)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg rounded-xl p-4">
                  <p className="text-xs text-text-tertiary mb-1">Customer</p>
                  <p className="text-sm font-medium">{selected.User?.full_name || '—'}</p>
                  <p className="text-xs text-text-tertiary flex items-center gap-1 mt-1"><Phone className="w-3 h-3" />{selected.User?.phone}</p>
                </div>
                <div className="bg-bg rounded-xl p-4">
                  <p className="text-xs text-text-tertiary mb-1">Seller</p>
                  <p className="text-sm font-medium">{selected.SellerProfile?.shop_name || '—'}</p>
                </div>
              </div>

              <div className="bg-bg rounded-xl p-4">
                <p className="text-xs text-text-tertiary mb-2">Price Breakdown</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span>{formatCurrency(selected.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Delivery</span><span>{formatCurrency(selected.delivery_fee)}</span></div>
                  <div className="flex justify-between font-semibold border-t border-border pt-1.5 mt-1.5">
                    <span>Total</span><span className="text-gold">{formatCurrency(selected.grand_total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`badge ${statusColors[selected.status] || 'badge-info'}`}>{selected.status}</span>
                <span className={`badge ${selected.is_cod ? 'badge-warning' : 'badge-success'}`}>{selected.is_cod ? 'COD' : 'Paid Online'}</span>
                {selected.payment_status && <span className="badge badge-info">{selected.payment_status}</span>}
              </div>

              {selected.cancellation_reason && (
                <div className="bg-error/5 border border-error/20 rounded-xl p-4">
                  <p className="text-xs text-error font-medium mb-1">Cancellation Reason</p>
                  <p className="text-sm text-text-primary">{selected.cancellation_reason}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              {selected.status === 'PENDING' && (
                <>
                  <button onClick={() => updateStatus(selected.id, 'CANCELLED')}
                    className="px-4 py-2 rounded-xl border border-error/30 text-error text-sm font-medium hover:bg-error/5">
                    Cancel Order
                  </button>
                  <button onClick={() => updateStatus(selected.id, 'CONFIRMED')}
                    className="px-4 py-2 rounded-xl bg-success text-white text-sm font-medium hover:bg-success/90">
                    Confirm Order
                  </button>
                </>
              )}
              {selected.status === 'CONFIRMED' && (
                <button onClick={() => updateStatus(selected.id, 'PROCESSING')}
                  className="px-4 py-2 rounded-xl bg-info text-white text-sm font-medium hover:bg-info/90">
                  Mark Processing
                </button>
              )}
              {selected.status === 'SHIPPED' && (
                <button onClick={() => updateStatus(selected.id, 'DELIVERED')}
                  className="px-4 py-2 rounded-xl bg-success text-white text-sm font-medium hover:bg-success/90">
                  Mark Delivered
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
