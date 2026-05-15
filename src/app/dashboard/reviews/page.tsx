'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate, getInitials } from '@/lib/utils';
import { Star, Loader2, Eye, EyeOff, Trash2, MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified_purchase: boolean;
  seller_response: string | null;
  created_at: string;
  Product: { title: string } | null;
  User: { full_name: string } | null;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '1' | '2' | '3'>('all');

  useEffect(() => { fetchReviews(); }, [filter]);

  async function fetchReviews() {
    setLoading(true);
    let query = supabase
      .from('Review')
      .select('*, Product:product_id(title), User:buyer_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter !== 'all') query = query.lte('rating', parseInt(filter));
    const { data } = await query;
    if (data) setReviews(data as unknown as Review[]);
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this review? This cannot be undone.')) return;
    await supabase.from('Review').delete().eq('id', id);
    fetchReviews();
  }

  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <>
      <Header title="Review Moderation" />
      <div className="p-8">
        <div className="flex gap-2 mb-6">
          {[{ v: 'all', l: 'All Reviews' }, { v: '1', l: '≤ 1 Star' }, { v: '2', l: '≤ 2 Stars' }, { v: '3', l: '≤ 3 Stars' }].map((f) => (
            <button key={f.v} onClick={() => setFilter(f.v as typeof filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f.v ? 'bg-gold/10 text-gold ring-1 ring-gold/20' : 'text-text-tertiary hover:text-text-primary hover:bg-bg'
              }`}>{f.l}</button>
          ))}
        </div>

        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" /></div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No reviews found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {reviews.map((r) => (
                <div key={r.id} className="p-5 hover:bg-bg/30">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-xs font-semibold text-gold flex-shrink-0">
                        {getInitials(r.User?.full_name || 'U')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium">{r.User?.full_name || 'Anonymous'}</p>
                          <span className={`text-sm ${r.rating <= 2 ? 'text-error' : r.rating <= 3 ? 'text-warning' : 'text-gold'}`}>
                            {stars(r.rating)}
                          </span>
                          {r.is_verified_purchase && <span className="badge badge-success text-[10px]">Verified</span>}
                        </div>
                        <p className="text-xs text-text-tertiary mb-1">
                          on <span className="font-medium text-text-secondary">{r.Product?.title || 'Unknown Product'}</span> · {formatDate(r.created_at)}
                        </p>
                        {r.title && <p className="text-sm font-medium mb-0.5">{r.title}</p>}
                        {r.body && <p className="text-sm text-text-secondary">{r.body}</p>}
                        {r.seller_response && (
                          <div className="mt-2 pl-3 border-l-2 border-gold/30">
                            <p className="text-xs text-text-tertiary flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Seller Response</p>
                            <p className="text-sm text-text-secondary">{r.seller_response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-error/10 flex-shrink-0">
                      <Trash2 className="w-4 h-4 text-error" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
