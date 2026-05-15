'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart3, TrendingUp, Users, ShoppingCart, Package, IndianRupee, Loader2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface Stats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  gmv: number;
  avgOrderValue: number;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock time-series (will be real once orders accumulate)
  const revenueData = [
    { month: 'Jan', revenue: 0, orders: 0 },
    { month: 'Feb', revenue: 0, orders: 0 },
    { month: 'Mar', revenue: 0, orders: 0 },
    { month: 'Apr', revenue: 0, orders: 0 },
    { month: 'May', revenue: stats?.gmv || 0, orders: stats?.totalOrders || 0 },
  ];

  const sectionData = [
    { name: 'Buy Traditional', value: 40, color: '#C4943D' },
    { name: 'Rent Traditional', value: 25, color: '#8B6914' },
    { name: 'Modern', value: 20, color: '#2C2C2C' },
    { name: 'Thrift', value: 15, color: '#5A8F3C' },
  ];

  useEffect(() => { fetchStats(); }, []);

  async function fetchStats() {
    const [
      { count: totalUsers },
      { count: totalSellers },
      { count: totalProducts },
      { count: totalOrders },
    ] = await Promise.all([
      supabase.from('User').select('*', { count: 'exact', head: true }),
      supabase.from('SellerProfile').select('*', { count: 'exact', head: true }),
      supabase.from('Product').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('Order').select('*', { count: 'exact', head: true }),
    ]);

    const { data: orderData } = await supabase
      .from('Order')
      .select('grand_total')
      .in('status', ['DELIVERED', 'COMPLETED']);

    const gmv = orderData?.reduce((s, o) => s + (o.grand_total || 0), 0) || 0;
    const count = totalOrders || 0;

    setStats({
      totalUsers: totalUsers || 0,
      totalSellers: totalSellers || 0,
      totalProducts: totalProducts || 0,
      totalOrders: count,
      gmv,
      avgOrderValue: count > 0 ? gmv / count : 0,
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <>
        <Header title="Analytics" />
        <div className="p-8 flex items-center justify-center h-96">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Analytics" />
      <div className="p-8">
        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-info bg-info/10' },
            { label: 'Active Sellers', value: stats?.totalSellers || 0, icon: ShoppingCart, color: 'text-gold bg-gold/10' },
            { label: 'Live Products', value: stats?.totalProducts || 0, icon: Package, color: 'text-cta-green bg-cta-green/10' },
            { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingCart, color: 'text-warning bg-warning/10' },
            { label: 'GMV', value: formatCurrency(stats?.gmv || 0), icon: IndianRupee, color: 'text-success bg-success/10' },
            { label: 'Avg Order', value: formatCurrency(stats?.avgOrderValue || 0), icon: TrendingUp, color: 'text-info bg-info/10' },
          ].map((s) => (
            <div key={s.label} className="bg-surface rounded-2xl border border-border p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <p className="text-xs text-text-tertiary">{s.label}</p>
              <p className="text-lg font-bold mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-surface rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-1">Revenue Trend</h3>
            <p className="text-xs text-text-tertiary mb-4">Monthly GMV from completed orders</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C4943D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C4943D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#888' }} />
                <YAxis tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#C4943D" fill="url(#colorRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Section Distribution */}
          <div className="bg-surface rounded-2xl border border-border p-6">
            <h3 className="font-semibold mb-1">Section Split</h3>
            <p className="text-xs text-text-tertiary mb-4">Product distribution by section</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sectionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {sectionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {sectionData.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-text-secondary">{s.name}</span>
                  </div>
                  <span className="font-medium">{s.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-surface rounded-2xl border border-border p-6 mt-6">
          <h3 className="font-semibold mb-1">Monthly Orders</h3>
          <p className="text-xs text-text-tertiary mb-4">Order volume over time</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#888' }} />
              <YAxis tick={{ fontSize: 12, fill: '#888' }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E5E5E5', borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="orders" fill="#A8D66E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
