'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/header';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Settings,
  Loader2,
  X,
  Save,
  ChevronRight,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  children?: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('Category')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data) {
      // Build tree
      const map = new Map<string, Category>();
      const roots: Category[] = [];

      data.forEach((c: Category) => {
        map.set(c.id, { ...c, children: [] });
      });

      data.forEach((c: Category) => {
        const node = map.get(c.id)!;
        if (c.parent_id && map.has(c.parent_id)) {
          map.get(c.parent_id)!.children!.push(node);
        } else {
          roots.push(node);
        }
      });

      setCategories(roots);
    }
    setLoading(false);
  }

  function openCreate(parentId?: string) {
    setEditingCategory(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      parent_id: parentId || '',
      display_order: 0,
      is_active: true,
    });
    setShowModal(true);
  }

  function openEdit(cat: Category) {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      parent_id: cat.parent_id || '',
      display_order: cat.display_order,
      is_active: cat.is_active,
    });
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      description: form.description || null,
      parent_id: form.parent_id || null,
      display_order: form.display_order,
      is_active: form.is_active,
    };

    if (editingCategory) {
      await supabase.from('Category').update(payload).eq('id', editingCategory.id);
    } else {
      await supabase.from('Category').insert(payload);
    }

    setSaving(false);
    setShowModal(false);
    fetchCategories();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Sub-categories will become orphaned.')) return;
    await supabase.from('Category').delete().eq('id', id);
    fetchCategories();
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function renderCategory(cat: Category, depth: number = 0) {
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expandedIds.has(cat.id);

    return (
      <div key={cat.id}>
        <div
          className={`flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-bg/50 transition-colors ${
            depth > 0 ? 'bg-bg/30' : ''
          }`}
          style={{ paddingLeft: `${16 + depth * 28}px` }}
        >
          <GripVertical className="w-4 h-4 text-text-tertiary cursor-grab flex-shrink-0" />

          {hasChildren ? (
            <button onClick={() => toggleExpand(cat.id)} className="p-0.5">
              <ChevronRight
                className={`w-4 h-4 text-text-secondary transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>
          ) : (
            <div className="w-5" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-text-primary">{cat.name}</p>
              {!cat.is_active && (
                <span className="badge badge-error text-[10px]">Inactive</span>
              )}
            </div>
            <p className="text-xs text-text-tertiary">/{cat.slug}</p>
          </div>

          {hasChildren && (
            <span className="text-xs text-text-tertiary bg-bg px-2 py-0.5 rounded-full">
              {cat.children!.length} sub
            </span>
          )}

          <span className="text-xs text-text-tertiary">{formatDate(cat.created_at)}</span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openCreate(cat.id)}
              className="p-1.5 rounded-lg hover:bg-cta-green/10 transition-colors"
              title="Add sub-category"
            >
              <Plus className="w-3.5 h-3.5 text-cta-green" />
            </button>
            <button
              onClick={() => openEdit(cat)}
              className="p-1.5 rounded-lg hover:bg-info/10 transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5 text-info" />
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="p-1.5 rounded-lg hover:bg-error/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5 text-error" />
            </button>
          </div>
        </div>

        {isExpanded &&
          hasChildren &&
          cat.children!.map((child) => renderCategory(child, depth + 1))}
      </div>
    );
  }

  return (
    <>
      <Header title="Category Manager" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-text-secondary">
              Manage categories and sub-categories for all 4 sections
            </p>
          </div>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg/50">
            <div className="w-4" />
            <div className="w-5" />
            <p className="flex-1 text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Category
            </p>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider w-20">
              Date
            </p>
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider w-24 text-right">
              Actions
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-gold animate-spin mx-auto" />
            </div>
          ) : categories.length === 0 ? (
            <div className="p-12 text-center">
              <Settings className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">No categories yet</p>
              <p className="text-xs text-text-tertiary mt-1">Click &quot;Add Category&quot; to create your first one</p>
            </div>
          ) : (
            categories.map((cat) => renderCategory(cat))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-semibold">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-bg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold transition-colors"
                  placeholder="e.g., Wedding Wear"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold transition-colors"
                  placeholder="wedding-wear"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold transition-colors resize-none"
                  rows={3}
                  placeholder="Brief description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-bg border border-border rounded-xl text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="w-4 h-4 rounded accent-gold"
                    />
                    <span className="text-sm text-text-primary">Active</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:bg-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name}
                className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-xl text-sm font-medium hover:bg-gold-dark disabled:opacity-50 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
