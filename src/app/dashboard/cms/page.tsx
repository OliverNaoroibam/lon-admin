'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate } from '@/lib/utils';
import {
  MessageSquare, FileText, Plus, Loader2, X, Save, Trash2, Eye,
  Upload, Bell, CheckCircle, Pencil,
} from 'lucide-react';

interface PolicyDocument {
  id: string;
  title: string;
  slug: string;
  content: string;
  version: string;
  is_active: boolean;
  updated_at: string;
}

interface Announcement {
  id: string;
  title: string;
  body: string;
  target_role: string;
  is_active: boolean;
  created_at: string;
}

export default function CMSPage() {
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'policies' | 'announcements'>('policies');
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyDocument | null>(null);
  const [saving, setSaving] = useState(false);

  const [policyForm, setPolicyForm] = useState({ title: '', slug: '', content: '', version: '1.0' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', body: '', target_role: 'ALL' });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from('PolicyDocument').select('*').order('updated_at', { ascending: false }),
      supabase.from('Notification').select('*').eq('type', 'ANNOUNCEMENT').order('created_at', { ascending: false }).limit(20),
    ]);
    if (p) setPolicies(p as PolicyDocument[]);
    if (a) setAnnouncements(a as unknown as Announcement[]);
    setLoading(false);
  }

  async function savePolicy() {
    setSaving(true);
    if (editingPolicy) {
      await supabase.from('PolicyDocument').update({
        title: policyForm.title,
        content: policyForm.content,
        version: policyForm.version,
      }).eq('id', editingPolicy.id);
    } else {
      await supabase.from('PolicyDocument').insert({
        title: policyForm.title,
        slug: policyForm.slug || policyForm.title.toLowerCase().replace(/\s+/g, '-'),
        content: policyForm.content,
        version: policyForm.version,
        is_active: true,
      });
    }
    setSaving(false);
    setShowPolicyModal(false);
    setEditingPolicy(null);
    setPolicyForm({ title: '', slug: '', content: '', version: '1.0' });
    fetchData();
  }

  async function sendAnnouncement() {
    setSaving(true);
    await supabase.from('Notification').insert({
      type: 'ANNOUNCEMENT',
      title: announcementForm.title,
      body: announcementForm.body,
      is_read: false,
    });
    setSaving(false);
    setShowAnnouncementModal(false);
    setAnnouncementForm({ title: '', body: '', target_role: 'ALL' });
    fetchData();
  }

  async function deletePolicy(id: string) {
    if (!confirm('Delete this policy?')) return;
    await supabase.from('PolicyDocument').delete().eq('id', id);
    fetchData();
  }

  function openEditPolicy(p: PolicyDocument) {
    setEditingPolicy(p);
    setPolicyForm({ title: p.title, slug: p.slug, content: p.content, version: p.version });
    setShowPolicyModal(true);
  }

  return (
    <>
      <Header title="CMS & Policies" />
      <div className="p-8">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-border">
          {(['policies', 'announcements'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-all capitalize ${
                activeTab === tab ? 'border-gold text-gold' : 'border-transparent text-text-tertiary hover:text-text-primary'
              }`}>
              {tab === 'policies' ? '📄 Policy Documents' : '📢 Announcements'}
            </button>
          ))}
        </div>

        {activeTab === 'policies' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-text-secondary">Manage terms, privacy policy, and other legal documents</p>
              <button onClick={() => { setEditingPolicy(null); setPolicyForm({ title: '', slug: '', content: '', version: '1.0' }); setShowPolicyModal(true); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark transition-colors">
                <Plus className="w-4 h-4" /> New Policy
              </button>
            </div>

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-surface rounded-xl border border-border p-4 animate-pulse">
                    <div className="h-4 w-40 bg-bg rounded" />
                  </div>
                ))
              ) : policies.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                  <FileText className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">No policies yet</p>
                </div>
              ) : (
                policies.map((p) => (
                  <div key={p.id} className="bg-surface rounded-xl border border-border p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.title}</p>
                        <p className="text-xs text-text-tertiary">v{p.version} • /{p.slug} • Updated {formatDate(p.updated_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge text-[10px] ${p.is_active ? 'badge-success' : 'badge-error'}`}>
                        {p.is_active ? 'Published' : 'Draft'}
                      </span>
                      <button onClick={() => openEditPolicy(p)} className="p-2 rounded-lg hover:bg-bg"><Pencil className="w-4 h-4 text-text-secondary" /></button>
                      <button onClick={() => deletePolicy(p.id)} className="p-2 rounded-lg hover:bg-error/10"><Trash2 className="w-4 h-4 text-error" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'announcements' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-text-secondary">Broadcast messages to all users</p>
              <button onClick={() => setShowAnnouncementModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark transition-colors">
                <Bell className="w-4 h-4" /> New Announcement
              </button>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="bg-surface rounded-2xl border border-border p-12 text-center">
                  <Bell className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">No announcements yet</p>
                </div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="bg-surface rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{a.title}</p>
                      <span className="text-xs text-text-tertiary">{formatDate(a.created_at)}</span>
                    </div>
                    <p className="text-sm text-text-secondary">{a.body}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Policy Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-2xl m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">{editingPolicy ? 'Edit Policy' : 'New Policy'}</h3>
              <button onClick={() => setShowPolicyModal(false)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Title *</label>
                  <input type="text" value={policyForm.title}
                    onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="Terms & Conditions" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Version</label>
                  <input type="text" value={policyForm.version} onChange={(e) => setPolicyForm({ ...policyForm, version: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="1.0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Content (Markdown) *</label>
                <textarea value={policyForm.content} onChange={(e) => setPolicyForm({ ...policyForm, content: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold resize-none font-mono" rows={12}
                  placeholder="# Terms & Conditions&#10;&#10;## 1. Introduction&#10;..." />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowPolicyModal(false)} className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg">Cancel</button>
              <button onClick={savePolicy} disabled={saving || !policyForm.title || !policyForm.content}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} <Save className="w-4 h-4" /> {editingPolicy ? 'Update' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">New Announcement</h3>
              <button onClick={() => setShowAnnouncementModal(false)} className="p-2 rounded-lg hover:bg-bg"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Title *</label>
                <input type="text" value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="Festival Sale is Live!" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Message *</label>
                <textarea value={announcementForm.body} onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold resize-none" rows={4}
                  placeholder="Your announcement message..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Target Audience</label>
                <select value={announcementForm.target_role} onChange={(e) => setAnnouncementForm({ ...announcementForm, target_role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold">
                  <option value="ALL">All Users</option>
                  <option value="BUYER">Buyers Only</option>
                  <option value="SELLER">Sellers Only</option>
                  <option value="DELIVERY_PARTNER">Delivery Partners Only</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowAnnouncementModal(false)} className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg">Cancel</button>
              <button onClick={sendAnnouncement} disabled={saving || !announcementForm.title || !announcementForm.body}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} <Bell className="w-4 h-4" /> Send Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
