'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate } from '@/lib/utils';
import { CalendarDays, Plus, Loader2, X, Save, Clock, Users, Zap, Trash2 } from 'lucide-react';

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  banner_url: string | null;
  start_date: string;
  end_date: string;
  discount_percentage: number | null;
  is_active: boolean;
  campaign_type: string;
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', banner_url: '', start_date: '', end_date: '',
    discount_percentage: 0, campaign_type: 'FESTIVAL', is_active: true,
  });

  useEffect(() => { fetchCampaigns(); }, []);

  async function fetchCampaigns() {
    const { data } = await supabase.from('Campaign').select('*').order('start_date', { ascending: false });
    if (data) setCampaigns(data as Campaign[]);
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('Campaign').insert({
      title: form.title,
      description: form.description || null,
      banner_url: form.banner_url || null,
      start_date: form.start_date,
      end_date: form.end_date,
      discount_percentage: form.discount_percentage || null,
      campaign_type: form.campaign_type,
      is_active: form.is_active,
    });
    setSaving(false);
    setShowModal(false);
    setForm({ title: '', description: '', banner_url: '', start_date: '', end_date: '', discount_percentage: 0, campaign_type: 'FESTIVAL', is_active: true });
    fetchCampaigns();
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('Campaign').update({ is_active: !current }).eq('id', id);
    fetchCampaigns();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign?')) return;
    await supabase.from('Campaign').delete().eq('id', id);
    fetchCampaigns();
  }

  function getDaysRemaining(endDate: string) {
    const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  const campaignTypes = ['FESTIVAL', 'SEASONAL', 'FLASH_SALE', 'CLEARANCE', 'CUSTOM'];

  return (
    <>
      <Header title="Festival Campaigns" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-text-secondary">Create and manage festival campaigns with countdown timers</p>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark transition-colors">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>

        {/* Campaign Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface rounded-2xl border border-border p-6 animate-pulse">
                <div className="h-5 w-40 bg-bg rounded mb-3" />
                <div className="h-3 w-60 bg-bg rounded" />
              </div>
            ))
          ) : campaigns.length === 0 ? (
            <div className="col-span-2 bg-surface rounded-2xl border border-border p-12 text-center">
              <CalendarDays className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No campaigns yet</p>
              <p className="text-xs text-text-tertiary mt-1">Create campaigns for Yaoshang, Lai Haraoba, and other festivals</p>
            </div>
          ) : (
            campaigns.map((c) => {
              const days = getDaysRemaining(c.end_date);
              const isExpired = days < 0;
              const isLive = !isExpired && c.is_active;

              return (
                <div key={c.id} className="bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-sm transition-shadow">
                  {c.banner_url && (
                    <div className="h-32 bg-bg">
                      <img src={c.banner_url} alt={c.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-semibold">{c.title}</h3>
                        {c.description && <p className="text-xs text-text-tertiary mt-0.5">{c.description}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`badge text-[10px] ${isLive ? 'badge-success' : isExpired ? 'badge-error' : 'badge-warning'}`}>
                          {isLive ? 'Live' : isExpired ? 'Ended' : 'Draft'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <Clock className="w-3 h-3" />
                        {formatDate(c.start_date)} — {formatDate(c.end_date)}
                      </div>
                      {c.discount_percentage && (
                        <span className="badge badge-gold text-[10px]">{c.discount_percentage}% OFF</span>
                      )}
                    </div>

                    {!isExpired && (
                      <div className="bg-bg rounded-xl p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-tertiary">Time remaining</span>
                          <span className={`text-sm font-bold ${days <= 3 ? 'text-error' : 'text-gold'}`}>
                            {days} day{days !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="badge badge-info text-[10px]">{c.campaign_type}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(c.id, c.is_active)}
                          className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
                            c.is_active ? 'text-error hover:bg-error/10' : 'text-success hover:bg-success/10'
                          }`}>
                          {c.is_active ? 'Pause' : 'Activate'}
                        </button>
                        <button onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg hover:bg-error/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-error" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">New Campaign</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="Yaoshang Festival Sale 2026" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold resize-none" rows={2} placeholder="Campaign description..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">End Date *</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Type</label>
                  <select value={form.campaign_type} onChange={(e) => setForm({ ...form, campaign_type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold">
                    {campaignTypes.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Discount %</label>
                  <input type="number" value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="e.g., 30" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Banner Image URL</label>
                <input type="url" value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="https://..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg">Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.title || !form.start_date || !form.end_date}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Zap className="w-4 h-4" /> Launch Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
