'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Flag, Loader2, Download, Calendar, IndianRupee, FileText, RefreshCw } from 'lucide-react';

interface CommissionSettings {
  commission_buy_traditional: number;
  commission_rent_traditional: number;
  commission_modern: number;
  commission_thrift: number;
  tcs_rate: number;
  max_cod_amount: number;
  min_payout_amount: number;
  payout_cycle_days: number;
  free_delivery_threshold: number;
  referral_bonus_amount: number;
  cod_enabled: boolean;
}

export default function ReportsPage() {
  const [settings, setSettings] = useState<CommissionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    commission_buy_traditional: 8,
    commission_rent_traditional: 15,
    commission_modern: 10,
    commission_thrift: 12,
    tcs_rate: 1,
    max_cod_amount: 5000,
    min_payout_amount: 500,
    payout_cycle_days: 7,
    free_delivery_threshold: 999,
    referral_bonus_amount: 50,
    cod_enabled: true,
  });

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    const { data } = await supabase.from('PlatformSettings').select('*').limit(1).single();
    if (data) {
      const s = {
        commission_buy_traditional: data.commission_buy_traditional || 8,
        commission_rent_traditional: data.commission_rent_traditional || 15,
        commission_modern: data.commission_modern || 10,
        commission_thrift: data.commission_thrift || 12,
        tcs_rate: data.tcs_rate || 1,
        max_cod_amount: data.max_cod_amount || 5000,
        min_payout_amount: data.min_payout_amount || 500,
        payout_cycle_days: data.payout_cycle_days || 7,
        free_delivery_threshold: data.free_delivery_threshold || 999,
        referral_bonus_amount: data.referral_bonus_amount || 50,
        cod_enabled: data.cod_enabled !== false,
      };
      setSettings(s);
      setForm(s);
    }
    setLoading(false);
  }

  async function handleSaveSettings() {
    setSaving(true);
    await supabase.from('PlatformSettings').update({
      commission_buy_traditional: form.commission_buy_traditional,
      commission_rent_traditional: form.commission_rent_traditional,
      commission_modern: form.commission_modern,
      commission_thrift: form.commission_thrift,
      tcs_rate: form.tcs_rate,
      max_cod_amount: form.max_cod_amount,
      min_payout_amount: form.min_payout_amount,
      payout_cycle_days: form.payout_cycle_days,
      free_delivery_threshold: form.free_delivery_threshold,
      referral_bonus_amount: form.referral_bonus_amount,
      cod_enabled: form.cod_enabled,
    }).eq('id', 'default');
    setSaving(false);
    fetchSettings();
  }

  function exportCSV() {
    alert('Export functionality will generate a CSV of all transactions for the selected period. This will be connected to actual order data in production.');
  }

  return (
    <>
      <Header title="Reports & Commission Settings" />
      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Commission Settings */}
          <div className="bg-surface rounded-2xl border border-border">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2"><IndianRupee className="w-4 h-4 text-gold" /> Commission & Business Rules</h3>
              <p className="text-xs text-text-tertiary mt-0.5">These settings apply platform-wide</p>
            </div>
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-gold animate-spin" /></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Buy Traditional (%)</label>
                      <input type="number" value={form.commission_buy_traditional} onChange={(e) => setForm({ ...form, commission_buy_traditional: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Rent Traditional (%)</label>
                      <input type="number" value={form.commission_rent_traditional} onChange={(e) => setForm({ ...form, commission_rent_traditional: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Modern (%)</label>
                      <input type="number" value={form.commission_modern} onChange={(e) => setForm({ ...form, commission_modern: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Thrift (%)</label>
                      <input type="number" value={form.commission_thrift} onChange={(e) => setForm({ ...form, commission_thrift: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 mt-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">TCS Rate (%)</label>
                      <input type="number" value={form.tcs_rate} onChange={(e) => setForm({ ...form, tcs_rate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                      <p className="text-[10px] text-text-tertiary mt-1">Tax Collected at Source</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">COD Max Limit (₹)</label>
                      <input type="number" value={form.max_cod_amount} onChange={(e) => setForm({ ...form, max_cod_amount: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                      <p className="text-[10px] text-text-tertiary mt-1">Max order for cash on delivery</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Min Payout (₹)</label>
                      <input type="number" value={form.min_payout_amount} onChange={(e) => setForm({ ...form, min_payout_amount: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                      <p className="text-[10px] text-text-tertiary mt-1">Minimum seller payout amount</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Payout Cycle (days)</label>
                    <input type="number" value={form.payout_cycle_days} onChange={(e) => setForm({ ...form, payout_cycle_days: parseInt(e.target.value) || 7 })}
                      className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                  </div>
                  <button onClick={handleSaveSettings} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark disabled:opacity-50 transition-colors w-full justify-center">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Save Settings
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Reports */}
          <div className="space-y-4">
            {/* TCS/GST Export */}
            <div className="bg-surface rounded-2xl border border-border p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-info" /> TCS/GST Report</h3>
              <p className="text-xs text-text-secondary mb-4">Export monthly tax compliance data for filing</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">From</label>
                  <input type="month" className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">To</label>
                  <input type="month" className="w-full px-3 py-2 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold" />
                </div>
              </div>
              <button onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-info text-white rounded-xl text-sm font-medium hover:bg-info/90 transition-colors w-full justify-center">
                <Download className="w-4 h-4" /> Export TCS Report (CSV)
              </button>
            </div>

            {/* Revenue Report */}
            <div className="bg-surface rounded-2xl border border-border p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-3"><IndianRupee className="w-4 h-4 text-success" /> Revenue Report</h3>
              <p className="text-xs text-text-secondary mb-4">Download full revenue breakdown with commission splits</p>
              <button onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-success text-white rounded-xl text-sm font-medium hover:bg-success/90 transition-colors w-full justify-center">
                <Download className="w-4 h-4" /> Export Revenue Report (CSV)
              </button>
            </div>

            {/* Seller Payout Report */}
            <div className="bg-surface rounded-2xl border border-border p-6">
              <h3 className="font-semibold flex items-center gap-2 mb-3"><Calendar className="w-4 h-4 text-gold" /> Seller Payout Report</h3>
              <p className="text-xs text-text-secondary mb-4">All payouts with bank details and reference numbers</p>
              <button onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark transition-colors w-full justify-center">
                <Download className="w-4 h-4" /> Export Payout Report (CSV)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
