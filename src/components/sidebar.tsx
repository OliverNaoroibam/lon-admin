'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Store,
  Truck,
  Package,
  ShoppingCart,
  BarChart3,
  Flag,
  Settings,
  LogOut,
  Flower2,
  ImageIcon,
  AlertTriangle,
  CreditCard,
  CalendarDays,
  MessageSquare,
  Tag,
  Star,
  CalendarHeart,
  Sparkles,
  MapPin,
  Smartphone,
  Headphones,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Users',
    items: [
      { href: '/dashboard/buyers', label: 'All Buyers', icon: Users },
      { href: '/dashboard/sellers', label: 'Seller Queue', icon: Store },
      { href: '/dashboard/delivery', label: 'DP Queue', icon: Truck },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/dashboard/products', label: 'Products', icon: Package },
      { href: '/dashboard/categories', label: 'Categories', icon: Settings },
      { href: '/dashboard/banners', label: 'Banners', icon: ImageIcon },
      { href: '/dashboard/events', label: 'Events', icon: CalendarHeart },
      { href: '/dashboard/onboarding', label: 'Onboarding', icon: Sparkles },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
      { href: '/dashboard/disputes', label: 'Disputes', icon: AlertTriangle },
      { href: '/dashboard/payouts', label: 'Payouts', icon: CreditCard },
      { href: '/dashboard/coupons', label: 'Coupons', icon: Tag },
      { href: '/dashboard/campaigns', label: 'Campaigns', icon: CalendarDays },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { href: '/dashboard/reviews', label: 'Reviews', icon: Star },
      { href: '/dashboard/flags', label: 'Flags', icon: Flag },
      { href: '/dashboard/tickets', label: 'Tickets', icon: Headphones },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
      { href: '/dashboard/reports', label: 'Reports', icon: CreditCard },
      { href: '/dashboard/wallet', label: 'Wallet Log', icon: Wallet },
      { href: '/dashboard/zones', label: 'Delivery Zones', icon: MapPin },
      { href: '/dashboard/app-version', label: 'App Version', icon: Smartphone },
      { href: '/dashboard/cms', label: 'CMS & Policies', icon: MessageSquare },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/login', { method: 'DELETE' });
    document.cookie = 'lon_admin_auth=; Max-Age=0; path=/';
    router.push('/');
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-border-dark flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border-dark">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center">
            <Flower2 className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h1
              className="text-lg font-bold text-white tracking-[4px]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              LON
            </h1>
            <p className="text-[10px] text-gold tracking-[2px] -mt-0.5">
              ADMIN
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 mb-2 text-[10px] font-semibold text-[#555] uppercase tracking-[2px]">
              {group.label}
            </p>
            {group.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 mb-0.5',
                    isActive
                      ? 'bg-gold/15 text-gold font-medium'
                      : 'text-[#888] hover:text-white hover:bg-sidebar-hover'
                  )}
                >
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.label === 'Seller Queue' && (
                    <span className="ml-auto bg-warning/20 text-warning text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      !
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border-dark">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[#888] hover:text-error hover:bg-error/5 transition-all duration-200"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
