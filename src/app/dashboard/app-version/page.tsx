'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { Smartphone, Loader2, Save, RefreshCw, ExternalLink } from 'lucide-react';

interface AppVersionData {
  id: string;
  android_min_version: string;
  android_latest_version: string;
  ios_min_version: string;
  ios_latest_version: string;
  force_update: boolean;
  update_message: string;
  store_url_android: string | null;
  store_url_ios: string | null;
}

export default function AppVersionPage() {
  const [data, setData] = useState<AppVersionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    android_min_version: '1.0.0', android_latest_version: '1.0.0',
    ios_min_version: '1.0.0', ios_latest_version: '1.0.0',
    force_update: false, update_message: 'A new version is available. Please update.',
    store_url_android: '', store_url_ios: '',
  });

  useEffect(() => { fetchVersion(); }, []);

  async function fetchVersion() {
    const { data: row } = await supabase.from('AppVersion').select('*').eq('id', 'current').single();
    if (row) {
      const d = row as AppVersionData;
      setData(d);
      setForm({
        android_min_version: d.android_min_version, android_latest_version: d.android_latest_version,
        ios_min_version: d.ios_min_version, ios_latest_version: d.ios_latest_version,
        force_update: d.force_update, update_message: d.update_message || '',
        store_url_android: d.store_url_android || '', store_url_ios: d.store_url_ios || '',
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from('AppVersion').update({
      android_min_version: form.android_min_version,
      android_latest_version: form.android_latest_version,
      ios_min_version: form.ios_min_version,
      ios_latest_version: form.ios_latest_version,
      force_update: form.force_update,
      update_message: form.update_message,
      store_url_android: form.store_url_android || null,
      store_url_ios: form.store_url_ios || null,
    }).eq('id', 'current');
    setSaving(false);
    fetchVersion();
  }

  return (
    <>
      <Header title="App Version Control" />
      <div className="p-8">
        <div className="max-w-2xl">
          <div className="bg-surface rounded-2xl border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2"><Smartphone className="w-4 h-4 text-gold" /> Version Management</h3>
              <p className="text-xs text-text-tertiary mt-0.5">Control minimum and latest versions for all LON apps</p>
            </div>

            {loading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 text-gold animate-spin" /></div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Android */}
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-cta-green/10 text-cta-green flex items-center justify-center text-[10px]">A</span> Android
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Min Version</label>
                      <input type="text" value={form.android_min_version} onChange={(e) => setForm({ ...form, android_min_version: e.target.value })}
                        className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-gold" placeholder="1.0.0" />
                      <p className="text-[10px] text-text-tertiary mt-1">Below this → force update</p>
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Latest Version</label>
                      <input type="text" value={form.android_latest_version} onChange={(e) => setForm({ ...form, android_latest_version: e.target.value })}
                        className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-gold" placeholder="1.0.0" />
                    </div>
                  </div>
                </div>

                {/* iOS */}
                <div>
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-info/10 text-info flex items-center justify-center text-[10px]">i</span> iOS
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Min Version</label>
                      <input type="text" value={form.ios_min_version} onChange={(e) => setForm({ ...form, ios_min_version: e.target.value })}
                        className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-gold" placeholder="1.0.0" />
                    </div>
                    <div>
                      <label className="block text-xs text-text-secondary mb-1">Latest Version</label>
                      <input type="text" value={form.ios_latest_version} onChange={(e) => setForm({ ...form, ios_latest_version: e.target.value })}
                        className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm font-mono focus:outline-none focus:border-gold" placeholder="1.0.0" />
                    </div>
                  </div>
                </div>

                {/* Force Update */}
                <div className="flex items-center justify-between bg-bg rounded-xl p-4">
                  <div>
                    <p className="text-sm font-medium">Force Update</p>
                    <p className="text-xs text-text-tertiary">Block app usage until user updates</p>
                  </div>
                  <button onClick={() => setForm({ ...form, force_update: !form.force_update })}
                    className={`w-12 h-7 rounded-full transition-colors flex items-center px-0.5 ${form.force_update ? 'bg-error justify-end' : 'bg-border justify-start'}`}>
                    <div className="w-6 h-6 bg-white rounded-full shadow" />
                  </button>
                </div>

                {/* Update Message */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Update Message</label>
                  <textarea value={form.update_message} onChange={(e) => setForm({ ...form, update_message: e.target.value })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold resize-none" rows={2} />
                </div>

                {/* Store URLs */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Play Store URL</label>
                    <input type="url" value={form.store_url_android} onChange={(e) => setForm({ ...form, store_url_android: e.target.value })}
                      className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="https://play.google.com/..." />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">App Store URL</label>
                    <input type="url" value={form.store_url_ios} onChange={(e) => setForm({ ...form, store_url_ios: e.target.value })}
                      className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" placeholder="https://apps.apple.com/..." />
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark disabled:opacity-50 transition-colors w-full justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Version Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
