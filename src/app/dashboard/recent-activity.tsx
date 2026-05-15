'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';
import {
  UserPlus,
  ShoppingCart,
  Store,
  Package,
  AlertTriangle,
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'user_signup' | 'order_placed' | 'seller_applied' | 'product_listed' | 'dispute_opened';
  message: string;
  timestamp: string;
}

const typeConfig = {
  user_signup: { icon: UserPlus, color: 'text-info bg-info/10' },
  order_placed: { icon: ShoppingCart, color: 'text-success bg-success/10' },
  seller_applied: { icon: Store, color: 'text-gold bg-gold/10' },
  product_listed: { icon: Package, color: 'text-cta-green bg-cta-green/10' },
  dispute_opened: { icon: AlertTriangle, color: 'text-error bg-error/10' },
};

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, []);

  async function fetchActivity() {
    try {
      // Fetch recent users
      const { data: recentUsers } = await supabase
        .from('User')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent orders
      const { data: recentOrders } = await supabase
        .from('Order')
        .select('id, order_number, created_at, grand_total')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent seller profiles
      const { data: recentSellers } = await supabase
        .from('SellerProfile')
        .select('id, shop_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // Combine and sort all activities
      const allActivities: Activity[] = [];

      recentUsers?.forEach((u) => {
        allActivities.push({
          id: `user_${u.id}`,
          type: 'user_signup',
          message: `${u.full_name || 'New user'} signed up`,
          timestamp: u.created_at,
        });
      });

      recentOrders?.forEach((o) => {
        allActivities.push({
          id: `order_${o.id}`,
          type: 'order_placed',
          message: `Order #${o.order_number} placed — ₹${o.grand_total}`,
          timestamp: o.created_at,
        });
      });

      recentSellers?.forEach((s) => {
        allActivities.push({
          id: `seller_${s.id}`,
          type: 'seller_applied',
          message: `${s.shop_name || 'New seller'} applied`,
          timestamp: s.created_at,
        });
      });

      // Sort by timestamp descending
      allActivities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(allActivities.slice(0, 10));
    } catch (err) {
      console.error('Failed to fetch activity:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface rounded-2xl border border-border">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-text-primary">Recent Activity</h3>
        <p className="text-xs text-text-tertiary mt-0.5">Latest platform events</p>
      </div>

      <div className="p-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-9 h-9 bg-bg rounded-xl" />
                <div className="flex-1">
                  <div className="h-3 w-48 bg-bg rounded mb-1" />
                  <div className="h-2 w-24 bg-bg rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-text-tertiary">No activity yet</p>
            <p className="text-xs text-text-tertiary mt-1">
              Activity will appear as users sign up and place orders
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {activities.map((activity) => {
              const config = typeConfig[activity.type];
              const Icon = config.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-bg transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">
                      {activity.message}
                    </p>
                    <p className="text-[11px] text-text-tertiary">
                      {formatDateTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
