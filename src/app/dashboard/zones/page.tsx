'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatCurrency } from '@/lib/utils';
import { MapPin, Plus, Loader2, X, Save, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface Zone {
  id: string;
  name: string;
  pin_codes: string[];
  base_price: number;
  per_km_price: number;
  is_active: boolean;
  created_at: string;
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', pin_codes: '', base_price: 40, per_km_price: 5 });

  useEffect(() => { fetchZones(); }, []);

  async function fetchZones() {
    const { data } = await supabase.from('DeliveryZone').select('*').order('name', { ascending: true });
    if (data) setZones(data as Zone[]);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      name: form.name,
      pin_codes: form.pin_codes.split(',').map(s => s.trim()).filter(Boolean),
      base_price: form.base_price,
      per_km_price: form.per_km_price,
    };
    if (editing) {
      await supabase.from('DeliveryZone').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('DeliveryZone').insert({ ...payload, is_active: true });
    }
    setSaving(false);
    setShowModal(false);
    setEditing(null);
    fetchZones();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('DeliveryZone').update({ is_active: !current }).eq('id', id);
    fetchZones();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this zone?')) return;
    await supabase.from('DeliveryZone').delete().eq('id', id);
    fetchZones();
  }

  return (
    <>
      <Header title="Delivery Zones" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-text-secondary">Define delivery areas with pin codes and pricing</p>
          <button onClick={() => { setEditing(null); setForm({ name: '', pin_codes: '', base_price: 40, per_km_price: 5 }); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark transition-colors">
            <Plus className="w-4 h-4" /> Add Zone
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-2xl border border-border p-5 animate-pulse"><div className="h-5 w-32 bg-bg rounded" /></div>
          )) : zones.length === 0 ? (
            <div className="col-span-3 bg-surface rounded-2xl border border-border p-12 text-center">
              <MapPin className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No delivery zones defined</p>
              <p className="text-xs text-text-tertiary mt-1">Add zones to enable delivery in specific areas</p>
            </div>
          ) : zones.map((z) => (
            <div key={z.id} className="bg-surface rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-info/10 flex items-center justify-center"><MapPin className="w-4 h-4 text-info" /></div>
                  <div>
                    <h3 className="text-sm font-semibold">{z.name}</h3>
                    <p className="text-xs text-text-tertiary">{z.pin_codes?.length || 0} pin codes</p>
                  </div>
                </div>
                <span className={`badge text-[10px] ${z.is_active ? 'badge-success' : 'badge-error'}`}>{z.is_active ? 'Active' : 'Off'}</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {(z.pin_codes || []).slice(0, 8).map((p) => (
                  <code key={p} className="px-1.5 py-0.5 bg-bg text-[10px] text-text-secondary rounded font-mono">{p}</code>
                ))}
                {(z.pin_codes || []).length > 8 && <span className="text-[10px] text-text-tertiary">+{z.pin_codes.length - 8} more</span>}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-bg rounded-lg p-2 text-center">
                  <p className="text-xs text-text-tertiary">Base Price</p>
                  <p className="text-sm font-bold">{formatCurrency(z.base_price)}</p>
                </div>
                <div className="bg-bg rounded-lg p-2 text-center">
                  <p className="text-xs text-text-tertiary">Per km</p>
                  <p className="text-sm font-bold">{formatCurrency(z.per_km_price)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <button onClick={() => { setEditing(z); setForm({ name: z.name, pin_codes: (z.pin_codes || []).join(', '), base_price: z.base_price, per_km_price: z.per_km_price }); setShowModal(true); }}
                  className="text-xs text-gold hover:underline">Edit</button>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(z.id, z.is_active)} className="p-1.5 rounded-lg hover:bg-bg">
                    {z.is_active ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4 text-text-tertiary" />}
                  </button>
                  <button onClick={() => handleDelete(z.id)} className="p-1.5 rounded-lg hover:bg-error/10"><Trash2 className="w-3.5 h-3.5 text-error" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-md m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">{editing ? 'Edit Zone' : 'New Zone'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Zone Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="Imphal Central" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Pin Codes (comma-separated)</label>
                <textarea value={form.pin_codes} onChange={(e) => setForm({ ...form, pin_codes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold resize-none font-mono" rows={2}
                  placeholder="795001, 795002, 795003" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Base Price (₹)</label>
                  <input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Per km (₹)</label>
                  <input type="number" value={form.per_km_price} onChange={(e) => setForm({ ...form, per_km_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
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
