'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import ImageCropUploader from '@/components/image-crop-uploader';
import { formatDate } from '@/lib/utils';
import { Sparkles, Loader2, Plus, X, Save, Trash2, GripVertical, Upload, ImageIcon } from 'lucide-react';

// Upload helper
async function uploadSlideImage(dataUrl: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = blob.type === 'image/png' ? 'png' : 'jpg';
  const fileName = `onboarding/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('profile-photos')  // reuse existing public bucket
    .upload(fileName, blob, { contentType: blob.type, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
  return data.publicUrl;
}

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string | null;
  emoji: string | null;
  gradient_start: string;
  gradient_end: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export default function OnboardingPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', subtitle: '', emoji: '', image_url: '',
    gradient_start: '#8B2252', gradient_end: '#C2185B', sort_order: 0,
  });
  const [showCropper, setShowCropper] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  async function handleCropped(dataUrl: string) {
    setShowCropper(false);
    setUploadingImage(true);
    try {
      const url = await uploadSlideImage(dataUrl);
      setForm((f) => ({ ...f, image_url: url }));
    } catch { alert('Upload failed.'); }
    finally { setUploadingImage(false); }
  }

  useEffect(() => { fetchSlides(); }, []);

  async function fetchSlides() {
    const { data } = await supabase.from('OnboardingSlide').select('*').order('sort_order', { ascending: true });
    if (data) setSlides(data as Slide[]);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    if (editing) {
      await supabase.from('OnboardingSlide').update({
        title: form.title, subtitle: form.subtitle, emoji: form.emoji || null,
        image_url: form.image_url || null,
        gradient_start: form.gradient_start, gradient_end: form.gradient_end, sort_order: form.sort_order,
      }).eq('id', editing.id);
    } else {
      await supabase.from('OnboardingSlide').insert({
        title: form.title, subtitle: form.subtitle, emoji: form.emoji || null,
        image_url: form.image_url || null,
        gradient_start: form.gradient_start, gradient_end: form.gradient_end, sort_order: form.sort_order, is_active: true,
      });
    }
    setSaving(false);
    setShowModal(false);
    setEditing(null);
    fetchSlides();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('OnboardingSlide').update({ is_active: !current }).eq('id', id);
    fetchSlides();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this slide?')) return;
    await supabase.from('OnboardingSlide').delete().eq('id', id);
    fetchSlides();
  }

  function openEdit(s: Slide) {
    setEditing(s);
    setForm({
      title: s.title, subtitle: s.subtitle, emoji: s.emoji || '',
      image_url: s.image_url || '',
      gradient_start: s.gradient_start, gradient_end: s.gradient_end, sort_order: s.sort_order
    });
    setShowModal(true);
  }

  return (
    <>
      <Header title="Onboarding Slides" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-text-secondary">{slides.length} slides — shown to new users on first launch</p>
          <button onClick={() => { setEditing(null); setForm({ title: '', subtitle: '', emoji: '', gradient_start: '#8B2252', gradient_end: '#C2185B', sort_order: slides.length }); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark transition-colors">
            <Plus className="w-4 h-4" /> Add Slide
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl animate-pulse bg-bg" />
          )) : slides.map((s) => (
            <div key={s.id} className="rounded-2xl overflow-hidden relative cursor-pointer group"
              onClick={() => openEdit(s)}
              style={{ background: `linear-gradient(135deg, ${s.gradient_start}, ${s.gradient_end})` }}>
              <div className="p-5 h-48 flex flex-col justify-end text-white relative">
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); toggleActive(s.id, s.is_active); }}
                    className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-[10px] font-medium">
                    {s.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                    className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full">#{s.sort_order + 1}</span>
                  {!s.is_active && <span className="text-[10px] bg-error/80 px-2 py-0.5 rounded-full">Hidden</span>}
                </div>
                {s.emoji && <p className="text-4xl mb-2">{s.emoji}</p>}
                <h3 className="text-lg font-bold leading-tight">{s.title}</h3>
                <p className="text-xs text-white/80 mt-1 line-clamp-2">{s.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-md m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">{editing ? 'Edit Slide' : 'New Slide'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="Discover LON" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Subtitle *</label>
                <textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Emoji</label>
                  <input type="text" value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm text-center focus:outline-none focus:border-gold" placeholder="🪷" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Gradient 1</label>
                  <input type="color" value={form.gradient_start} onChange={(e) => setForm({ ...form, gradient_start: e.target.value })}
                    className="w-full h-[42px] rounded-xl border border-border cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Gradient 2</label>
                  <input type="color" value={form.gradient_end} onChange={(e) => setForm({ ...form, gradient_end: e.target.value })}
                    className="w-full h-[42px] rounded-xl border border-border cursor-pointer" />
                </div>
              </div>

              {/* Background Image Upload */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                  Background Image <span className="text-text-tertiary normal-case font-normal">(optional — 9:16 portrait, overlays gradient)</span>
                </label>
                <div className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                  form.image_url ? 'border-border' : 'border-dashed border-border hover:border-gold/40'
                }`}>
                  {form.image_url ? (
                    <div className="relative h-28">
                      <img src={form.image_url} alt="Slide bg" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center gap-2 group">
                        <button onClick={() => setShowCropper(true)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium shadow-lg hover:bg-gold hover:text-white transition-all">
                          <Upload className="w-3.5 h-3.5" /> Replace
                        </button>
                        <button onClick={() => setForm((f) => ({ ...f, image_url: '' }))}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium shadow-lg hover:bg-error hover:text-white transition-all">
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowCropper(true)} disabled={uploadingImage}
                      className="w-full py-5 flex flex-col items-center gap-1.5 hover:bg-bg/50 transition-colors">
                      {uploadingImage
                        ? <Loader2 className="w-5 h-5 text-gold animate-spin" />
                        : <ImageIcon className="w-5 h-5 text-text-tertiary" />}
                      <span className="text-xs text-text-secondary">
                        {uploadingImage ? 'Uploading…' : 'Add background photo (9:16)'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
              {/* Preview */}
              <div className="rounded-xl h-24 flex items-end p-3"
                style={{ background: `linear-gradient(135deg, ${form.gradient_start}, ${form.gradient_end})` }}>
                <div className="text-white">
                  {form.emoji && <span className="text-lg mr-1">{form.emoji}</span>}
                  <span className="text-sm font-bold">{form.title || 'Preview'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.subtitle}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} <Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCropper && (
        <ImageCropUploader
          preset="onboarding_slide"
          label="Onboarding Slide Background"
          onCropped={handleCropped}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </>
  );
}
