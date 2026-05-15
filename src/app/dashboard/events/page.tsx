'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate } from '@/lib/utils';
import { CalendarHeart, Plus, Loader2, X, Save, Trash2, Link as LinkIcon } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  event_date: string | null;
  countdown_days: number;
  banner_image_url: string | null;
  linked_category_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', type: 'festival', description: '', event_date: '', countdown_days: 14,
    banner_image_url: '', sort_order: 0,
  });

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    const { data } = await supabase.from('Event').select('*').order('sort_order', { ascending: true });
    if (data) setEvents(data as Event[]);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      name: form.name, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      type: form.type, description: form.description || null,
      event_date: form.event_date || null, countdown_days: form.countdown_days,
      banner_image_url: form.banner_image_url || null, sort_order: form.sort_order,
    };
    if (editing) {
      await supabase.from('Event').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('Event').insert({ ...payload, is_active: true });
    }
    setSaving(false);
    setShowModal(false);
    setEditing(null);
    fetchEvents();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('Event').update({ is_active: !current }).eq('id', id);
    fetchEvents();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event?')) return;
    await supabase.from('Event').delete().eq('id', id);
    fetchEvents();
  }

  function getDaysUntil(date: string | null) {
    if (!date) return null;
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <>
      <Header title="Events & Festivals" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-text-secondary">Manage Manipuri festivals and cultural events linked to products</p>
          <button onClick={() => { setEditing(null); setForm({ name: '', slug: '', type: 'festival', description: '', event_date: '', countdown_days: 14, banner_image_url: '', sort_order: events.length }); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark transition-colors">
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-5 animate-pulse"><div className="h-5 w-32 bg-bg rounded" /></div>
          )) : events.length === 0 ? (
            <div className="col-span-3 bg-surface rounded-2xl border border-border p-12 text-center">
              <CalendarHeart className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No events yet</p>
            </div>
          ) : events.map((e) => {
            const days = getDaysUntil(e.event_date);
            return (
              <div key={e.id} className="bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-sm transition-shadow">
                {e.banner_image_url && (
                  <div className="h-28 bg-bg"><img src={e.banner_image_url} alt={e.name} className="w-full h-full object-cover" /></div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-semibold">{e.name}</h3>
                    <span className={`badge text-[10px] ${e.is_active ? 'badge-success' : 'badge-error'}`}>{e.is_active ? 'Active' : 'Hidden'}</span>
                  </div>
                  {e.description && <p className="text-xs text-text-tertiary mb-2">{e.description}</p>}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="badge badge-info text-[10px]">{e.type}</span>
                    {e.event_date && <span className="text-xs text-text-secondary">{formatDate(e.event_date)}</span>}
                    {days !== null && days > 0 && (
                      <span className={`text-xs font-bold ${days <= 7 ? 'text-error' : 'text-gold'}`}>{days}d away</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-text-tertiary">/{e.slug} · countdown: {e.countdown_days}d</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditing(e); setForm({ name: e.name, slug: e.slug, type: e.type, description: e.description || '', event_date: e.event_date || '', countdown_days: e.countdown_days, banner_image_url: e.banner_image_url || '', sort_order: e.sort_order }); setShowModal(true); }}
                        className="text-xs text-gold hover:underline">Edit</button>
                      <button onClick={() => toggleActive(e.id, e.is_active)} className="text-xs text-text-tertiary hover:text-text-primary ml-2">
                        {e.is_active ? 'Hide' : 'Show'}
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="p-1 ml-1 rounded-lg hover:bg-error/10"><Trash2 className="w-3.5 h-3.5 text-error" /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">{editing ? 'Edit Event' : 'New Event'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="Yaoshang" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold">
                    <option value="festival">Festival</option>
                    <option value="wedding">Wedding</option>
                    <option value="cultural">Cultural</option>
                    <option value="seasonal">Seasonal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Event Date</label>
                  <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Countdown Days</label>
                  <input type="number" value={form.countdown_days} onChange={(e) => setForm({ ...form, countdown_days: parseInt(e.target.value) || 14 })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Banner Image URL</label>
                <input type="url" value={form.banner_image_url} onChange={(e) => setForm({ ...form, banner_image_url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="https://..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} <Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
