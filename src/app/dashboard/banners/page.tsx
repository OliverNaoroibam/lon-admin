'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  ImageIcon, Plus, Loader2, X, Save, CheckCircle, XCircle, Eye, Clock, ExternalLink,
} from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_link: string | null;
  banner_type: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  click_count: number;
  created_at: string;
  request_seller_id: string | null;
  SellerProfile: { shop_name: string } | null;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', subtitle: '', image_url: '', cta_link: '', banner_type: 'hero',
    start_date: '', end_date: '', sort_order: 0, is_active: true,
  });

  useEffect(() => { fetchBanners(); }, [filter]);

  async function fetchBanners() {
    setLoading(true);
    let query = supabase
      .from('Banner')
      .select('*, SellerProfile:request_seller_id(shop_name)')
      .order('sort_order', { ascending: true });

    if (filter === 'active') query = query.eq('is_active', true);
    else if (filter === 'pending') query = query.eq('is_active', false);

    const { data, error } = await query;
    if (!error && data) {
      let filtered = data as unknown as Banner[];
      if (filter === 'expired') {
        const now = new Date().toISOString();
        filtered = filtered.filter(b => b.end_date && b.end_date < now);
      }
      setBanners(filtered);
    }
    setLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('Banner').update({ is_active: !current }).eq('id', id);
    fetchBanners();
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('Banner').insert({
      title: form.title,
      subtitle: form.subtitle || null,
      image_url: form.image_url,
      cta_link: form.cta_link || null,
      banner_type: form.banner_type,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
    });
    setSaving(false);
    setShowModal(false);
    setForm({ title: '', subtitle: '', image_url: '', cta_link: '', banner_type: 'hero', start_date: '', end_date: '', sort_order: 0, is_active: true });
    fetchBanners();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this banner?')) return;
    await supabase.from('Banner').delete().eq('id', id);
    fetchBanners();
  }

  const bannerTypes: Record<string, string> = {
    hero: 'Hero Banner',
    mid: 'Mid Section',
    category: 'Category Page',
    festival: 'Festival',
    promo: 'Promotion',
  };

  return (
    <>
      <Header title="Banner Management" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['all', 'active', 'pending', 'expired'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  filter === f ? 'bg-gold/10 text-gold ring-1 ring-gold/20' : 'text-text-tertiary hover:text-text-primary hover:bg-bg'
                }`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark transition-colors">
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        </div>

        {/* Banner Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-2xl border border-border overflow-hidden animate-pulse">
                <div className="h-40 bg-bg" />
                <div className="p-4"><div className="h-4 w-32 bg-bg rounded" /></div>
              </div>
            ))
          ) : banners.length === 0 ? (
            <div className="col-span-3 bg-surface rounded-2xl border border-border p-12 text-center">
              <ImageIcon className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No banners found</p>
            </div>
          ) : (
            banners.map((banner) => (
              <div key={banner.id} className="bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-sm transition-shadow">
                {/* Image */}
                <div className="h-40 bg-bg relative">
                  {banner.image_url ? (
                    <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-text-tertiary" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className={`badge text-[10px] ${banner.is_active ? 'badge-success' : 'badge-warning'}`}>
                      {banner.is_active ? 'Live' : 'Draft'}
                    </span>
                  </div>
                  {banner.SellerProfile && (
                    <div className="absolute bottom-2 left-2">
                      <span className="badge badge-gold text-[10px]">
                        By: {banner.SellerProfile.shop_name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-sm font-semibold text-text-primary mb-1">{banner.title}</p>
                  {banner.subtitle && <p className="text-xs text-text-tertiary mb-2">{banner.subtitle}</p>}

                  <div className="flex items-center gap-2 mb-3">
                    <span className="badge badge-info text-[10px]">
                      {bannerTypes[banner.banner_type] || banner.banner_type}
                    </span>
                    {banner.start_date && banner.end_date && (
                      <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                        <Clock className="w-3 h-3" />
                        {formatDate(banner.start_date)} — {formatDate(banner.end_date)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-text-tertiary">Order: {banner.sort_order} · {banner.click_count || 0} clicks</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleActive(banner.id, banner.is_active)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          banner.is_active ? 'hover:bg-error/10' : 'hover:bg-success/10'
                        }`}>
                        {banner.is_active
                          ? <XCircle className="w-4 h-4 text-error" />
                          : <CheckCircle className="w-4 h-4 text-success" />}
                      </button>
                      <button onClick={() => handleDelete(banner.id)}
                        className="p-1.5 rounded-lg hover:bg-error/10 transition-colors">
                        <X className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">Create Banner</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="Yaoshang Sale 2026" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Subtitle</label>
                <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="Up to 40% off traditional wear" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Image URL *</label>
                <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Link URL</label>
                <input type="url" value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="Deep link or URL" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Placement</label>
                  <select value={form.banner_type} onChange={(e) => setForm({ ...form, banner_type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold">
                    {Object.entries(bannerTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.image_url}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" /> Create Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
