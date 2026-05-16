'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import ImageCropUploader, { type CropPreset } from '@/components/image-crop-uploader';
import { formatDate } from '@/lib/utils';
import {
  ImageIcon, Plus, Loader2, X, Save, CheckCircle, XCircle,
  Clock, Pencil, Upload, Trash2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  cta_link: string | null;
  banner_type: string;
  is_active: boolean;
  is_approved: boolean;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
  click_count: number;
  created_at: string;
  request_seller_id: string | null;
  SellerProfile: { shop_name: string } | null;
}

type BannerForm = {
  title: string;
  subtitle: string;
  image_url: string;
  cta_link: string;
  banner_type: string;
  start_date: string;
  end_date: string;
  sort_order: number;
  is_active: boolean;
};

const EMPTY_FORM: BannerForm = {
  title: '', subtitle: '', image_url: '', cta_link: '',
  banner_type: 'hero', start_date: '', end_date: '',
  sort_order: 0, is_active: true,
};

const BANNER_TYPES: Record<string, { label: string; crop: CropPreset; hint: string }> = {
  hero:     { label: 'Hero Banner',    crop: 'hero_banner',     hint: '16:5 — Home screen carousel' },
  mid:      { label: 'Mid Section',    crop: 'mid_banner',      hint: '16:6 — Between sections' },
  festival: { label: 'Festival',       crop: 'festival_banner', hint: '21:9 — Campaign hero' },
  category: { label: 'Category Page',  crop: 'category_tile',   hint: '1:1 — Category grid tile' },
  promo:    { label: 'Promotion',      crop: 'hero_banner',     hint: '16:5 — Promo strip' },
};

// ─── Upload helper: dataURL → Supabase Storage → public URL ──────────────────
async function uploadCroppedImage(dataUrl: string, folder: string): Promise<string> {
  // Convert base64 dataURL → Blob
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = blob.type === 'image/png' ? 'png' : 'jpg';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('banners')
    .upload(fileName, blob, { contentType: blob.type, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('banners').getPublicUrl(fileName);
  return data.publicUrl;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'expired'>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BannerForm>(EMPTY_FORM);

  // Cropper state
  const [showCropper, setShowCropper] = useState(false);
  const [cropPreset, setCropPreset] = useState<CropPreset>('hero_banner');
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── Data fetching ──────────────────────────────────────────────────────────
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
        filtered = filtered.filter((b) => b.end_date && b.end_date < now);
      }
      setBanners(filtered);
    }
    setLoading(false);
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────
  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(banner: Banner) {
    setEditingId(banner.id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle ?? '',
      image_url: banner.image_url,
      cta_link: banner.cta_link ?? '',
      banner_type: banner.banner_type,
      start_date: banner.start_date ? banner.start_date.slice(0, 10) : '',
      end_date: banner.end_date ? banner.end_date.slice(0, 10) : '',
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  // ── Image crop + upload ────────────────────────────────────────────────────
  function triggerCrop() {
    const preset = BANNER_TYPES[form.banner_type]?.crop ?? 'hero_banner';
    setCropPreset(preset);
    setShowCropper(true);
  }

  async function handleCropped(dataUrl: string) {
    setShowCropper(false);
    setUploadingImage(true);
    try {
      const url = await uploadCroppedImage(dataUrl, `admin/${form.banner_type}`);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Image upload failed. Check Supabase Storage bucket "banners" exists and is public.');
    } finally {
      setUploadingImage(false);
    }
  }

  // ── Save banner ────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.title || !form.image_url) return;
    setSaving(true);
    const payload = {
      title: form.title,
      subtitle: form.subtitle || null,
      image_url: form.image_url,
      cta_link: form.cta_link || null,
      banner_type: form.banner_type,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      sort_order: form.sort_order,
      is_active: form.is_active,
      is_approved: true,
    };

    if (editingId) {
      await supabase.from('Banner').update(payload).eq('id', editingId);
    } else {
      await supabase.from('Banner').insert(payload);
    }

    setSaving(false);
    closeModal();
    fetchBanners();
  }

  // ── Toggle / Delete ────────────────────────────────────────────────────────
  async function toggleActive(id: string, current: boolean) {
    await supabase.from('Banner').update({ is_active: !current }).eq('id', id);
    fetchBanners();
  }

  async function handleDelete(id: string) {
    if (!confirm('Permanently delete this banner?')) return;
    await supabase.from('Banner').delete().eq('id', id);
    fetchBanners();
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Header title="Banner Management" />
      <div className="p-8">

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['all', 'active', 'pending', 'expired'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                  filter === f
                    ? 'bg-gold/10 text-gold ring-1 ring-gold/20'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-bg'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        </div>

        {/* Aspect ratio legend */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(BANNER_TYPES).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5 px-3 py-1 bg-surface border border-border rounded-full text-xs text-text-secondary">
              <ImageIcon className="w-3 h-3 text-gold" />
              <span className="font-medium text-text-primary">{v.label}</span>
              <span className="text-text-tertiary">· {v.hint}</span>
            </div>
          ))}
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
              <button onClick={openCreate} className="mt-4 text-sm text-gold hover:underline">
                Create your first banner →
              </button>
            </div>
          ) : (
            banners.map((banner) => (
              <div key={banner.id} className="bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow group">
                {/* Image */}
                <div className="h-40 bg-bg relative">
                  {banner.image_url ? (
                    <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-text-tertiary" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={`badge text-[10px] ${banner.is_active ? 'badge-success' : 'badge-warning'}`}>
                      {banner.is_active ? 'Live' : 'Draft'}
                    </span>
                    <span className="badge badge-info text-[10px]">
                      {BANNER_TYPES[banner.banner_type]?.label ?? banner.banner_type}
                    </span>
                  </div>

                  {banner.SellerProfile && (
                    <div className="absolute bottom-2 left-2">
                      <span className="badge badge-gold text-[10px]">
                        By: {banner.SellerProfile.shop_name}
                      </span>
                    </div>
                  )}

                  {/* Edit overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(banner)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-text-primary shadow-lg hover:bg-gold hover:text-white transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-sm font-semibold text-text-primary mb-1 truncate">{banner.title}</p>
                  {banner.subtitle && (
                    <p className="text-xs text-text-tertiary mb-2 truncate">{banner.subtitle}</p>
                  )}

                  {banner.start_date && banner.end_date && (
                    <div className="flex items-center gap-1 text-[10px] text-text-tertiary mb-3">
                      <Clock className="w-3 h-3" />
                      {formatDate(banner.start_date)} — {formatDate(banner.end_date)}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-text-tertiary">
                      Order #{banner.sort_order} · {banner.click_count || 0} clicks
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(banner)}
                        className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4 text-gold" />
                      </button>
                      <button
                        onClick={() => toggleActive(banner.id, banner.is_active)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          banner.is_active ? 'hover:bg-error/10' : 'hover:bg-success/10'
                        }`}
                        title={banner.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {banner.is_active
                          ? <XCircle className="w-4 h-4 text-error" />
                          : <CheckCircle className="w-4 h-4 text-success" />}
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="p-1.5 rounded-lg hover:bg-error/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-error" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-surface z-10">
              <h3 className="font-semibold">
                {editingId ? 'Edit Banner' : 'Create Banner'}
              </h3>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-bg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Banner Type — first so crop preset is correct */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                  Placement / Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(BANNER_TYPES).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setForm((f) => ({ ...f, banner_type: k }))}
                      className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${
                        form.banner_type === k
                          ? 'border-gold bg-gold/5 ring-1 ring-gold/20'
                          : 'border-border hover:border-gold/30 hover:bg-bg'
                      }`}
                    >
                      <span className={`text-sm font-medium ${form.banner_type === k ? 'text-gold' : 'text-text-primary'}`}>
                        {v.label}
                      </span>
                      <span className="text-[10px] text-text-tertiary mt-0.5">{v.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload with Crop */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                  Banner Image *
                </label>
                <div
                  className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                    form.image_url ? 'border-border' : 'border-dashed border-border hover:border-gold/40'
                  }`}
                >
                  {form.image_url ? (
                    <div className="relative">
                      <img
                        src={form.image_url}
                        alt="Banner preview"
                        className="w-full object-cover"
                        style={{ maxHeight: 160 }}
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center group/img">
                        <button
                          onClick={triggerCrop}
                          disabled={uploadingImage}
                          className="opacity-0 group-hover/img:opacity-100 flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl text-sm font-medium shadow-lg hover:bg-gold hover:text-white transition-all"
                        >
                          {uploadingImage
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Upload className="w-4 h-4" />}
                          Replace Image
                        </button>
                      </div>
                      {/* Current image URL */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-1.5">
                        <p className="text-[10px] text-white/70 truncate">{form.image_url}</p>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={triggerCrop}
                      disabled={uploadingImage}
                      className="w-full py-10 flex flex-col items-center gap-2 hover:bg-bg/50 transition-colors"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-6 h-6 text-gold animate-spin" />
                          <span className="text-sm text-text-secondary">Uploading…</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-text-tertiary" />
                          <span className="text-sm text-text-secondary">Click to upload &amp; crop</span>
                          <span className="text-[11px] text-text-tertiary">
                            Will be cropped to {BANNER_TYPES[form.banner_type]?.hint}
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold"
                  placeholder="Yaoshang Sale 2026"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold"
                  placeholder="Up to 40% off traditional wear"
                />
              </div>

              {/* CTA Link */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                  Link / Deep Link URL
                </label>
                <input
                  type="url"
                  value={form.cta_link}
                  onChange={(e) => setForm({ ...form, cta_link: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold"
                  placeholder="lon://campaign/yaoshang-2026"
                />
              </div>

              {/* Dates + Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                    Status
                  </label>
                  <button
                    onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      form.is_active
                        ? 'border-success bg-success/5 text-success'
                        : 'border-border bg-bg text-text-secondary'
                    }`}
                  >
                    {form.is_active ? '● Live' : '○ Draft'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border sticky bottom-0 bg-surface">
              <button onClick={closeModal} className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.image_url || uploadingImage}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {editingId ? 'Save Changes' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Crop Modal ─────────────────────────────────────────────────── */}
      {showCropper && (
        <ImageCropUploader
          preset={cropPreset}
          onCropped={handleCropped}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </>
  );
}
