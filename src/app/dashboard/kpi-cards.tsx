'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Truck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface KPI {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
}

export function KPICards() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  async function fetchKPIs() {
    try {
      const [
        { count: totalBuyers },
        { count: totalSellers },
        { count: totalProducts },
        { count: totalOrders },
      ] = await Promise.all([
        supabase.from('User').select('*', { count: 'exact', head: true }).eq('role', 'BUYER'),
        supabase.from('SellerProfile').select('*', { count: 'exact', head: true }),
        supabase.from('Product').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('Order').select('*', { count: 'exact', head: true }),
      ]);

      // Fetch GMV (sum of grand_total)
      const { data: gmvData } = await supabase
        .from('Order')
        .select('grand_total')
        .in('status', ['DELIVERED', 'COMPLETED']);

      const gmv = gmvData?.reduce((sum, o) => sum + (o.grand_total || 0), 0) || 0;

      // Pending seller approvals
      const { count: pendingSellers } = await supabase
        .from('SellerProfile')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'PENDING');

      setKpis([
        {
          label: 'Total Buyers',
          value: (totalBuyers || 0).toLocaleString(),
          change: '+12 this week',
          trend: 'up',
          icon: Users,
          color: 'text-info bg-info/10',
        },
        {
          label: 'Active Sellers',
          value: (totalSellers || 0).toLocaleString(),
          change: `${pendingSellers || 0} pending`,
          trend: (pendingSellers || 0) > 0 ? 'up' : 'neutral',
          icon: Store,
          color: 'text-gold bg-gold/10',
        },
        {
          label: 'Products Listed',
          value: (totalProducts || 0).toLocaleString(),
          change: 'Live listings',
          trend: 'neutral',
          icon: Package,
          color: 'text-cta-green bg-cta-green/10',
        },
        {
          label: 'Total Orders',
          value: (totalOrders || 0).toLocaleString(),
          change: 'All time',
          trend: 'neutral',
          icon: ShoppingCart,
          color: 'text-warning bg-warning/10',
        },
        {
          label: 'GMV',
          value: formatCurrency(gmv),
          change: 'Completed orders',
          trend: gmv > 0 ? 'up' : 'neutral',
          icon: IndianRupee,
          color: 'text-success bg-success/10',
        },
        {
          label: 'Delivery Partners',
          value: '0',
          change: 'Pending setup',
          trend: 'neutral',
          icon: Truck,
          color: 'text-text-secondary bg-text-secondary/10',
        },
      ]);
    } catch (err) {
      console.error('Failed to fetch KPIs:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface rounded-2xl border border-border p-5 animate-pulse"
          >
            <div className="w-10 h-10 rounded-xl bg-bg mb-3" />
            <div className="h-3 w-16 bg-bg rounded mb-2" />
            <div className="h-6 w-12 bg-bg rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-surface rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow"
        >
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${kpi.color}`}
          >
            <kpi.icon className="w-5 h-5" />
          </div>

          {/* Label */}
          <p className="text-xs text-text-secondary font-medium mb-1">
            {kpi.label}
          </p>

          {/* Value */}
          <p className="text-xl font-bold text-text-primary">{kpi.value}</p>

          {/* Change */}
          <div className="flex items-center gap-1 mt-1">
            {kpi.trend === 'up' && (
              <TrendingUp className="w-3 h-3 text-success" />
            )}
            {kpi.trend === 'down' && (
              <TrendingDown className="w-3 h-3 text-error" />
            )}
            <span className="text-[11px] text-text-tertiary">
              {kpi.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
