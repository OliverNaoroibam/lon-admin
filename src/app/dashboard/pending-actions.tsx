'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Store, Truck, Package, AlertTriangle, ArrowRight } from 'lucide-react';

interface PendingItem {
  label: string;
  count: number;
  href: string;
  icon: React.ElementType;
  color: string;
  urgency: 'high' | 'medium' | 'low';
}

export function PendingActions() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    try {
      const [
        { count: pendingSellers },
        { count: pendingProducts },
        { count: pendingDPs },
        { count: openDisputes },
      ] = await Promise.all([
        supabase
          .from('SellerProfile')
          .select('*', { count: 'exact', head: true })
          .eq('verification_status', 'PENDING'),
        supabase
          .from('Product')
          .select('*', { count: 'exact', head: true })
          .eq('admin_approved', false)
          .eq('is_active', true),
        supabase
          .from('DeliveryPartner')
          .select('*', { count: 'exact', head: true })
          .eq('is_verified', false),
        supabase
          .from('Dispute')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'OPEN'),
      ]);

      setItems([
        {
          label: 'Seller Applications',
          count: pendingSellers || 0,
          href: '/dashboard/sellers',
          icon: Store,
          color: 'text-gold bg-gold/10',
          urgency: (pendingSellers || 0) > 0 ? 'high' : 'low',
        },
        {
          label: 'Product Approvals',
          count: pendingProducts || 0,
          href: '/dashboard/products',
          icon: Package,
          color: 'text-cta-green bg-cta-green/10',
          urgency: (pendingProducts || 0) > 5 ? 'high' : 'medium',
        },
        {
          label: 'DP Verification',
          count: pendingDPs || 0,
          href: '/dashboard/delivery',
          icon: Truck,
          color: 'text-info bg-info/10',
          urgency: 'medium',
        },
        {
          label: 'Open Disputes',
          count: openDisputes || 0,
          href: '/dashboard/disputes',
          icon: AlertTriangle,
          color: 'text-error bg-error/10',
          urgency: (openDisputes || 0) > 0 ? 'high' : 'low',
        },
      ]);
    } catch (err) {
      console.error('Failed to fetch pending actions:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface rounded-2xl border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-text-primary">Pending Actions</h3>
        <p className="text-xs text-text-tertiary mt-0.5">Items requiring your attention</p>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-10 h-10 bg-bg rounded-xl" />
                <div className="flex-1">
                  <div className="h-3 w-24 bg-bg rounded" />
                </div>
                <div className="h-6 w-8 bg-bg rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-bg transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {item.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.count > 0 && (
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        item.urgency === 'high'
                          ? 'bg-error/10 text-error'
                          : item.urgency === 'medium'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-bg text-text-secondary'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
