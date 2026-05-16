'use client';

import { Bell, Search, Printer } from 'lucide-react';

export default function Header({ title }: { title: string }) {
  return (
    <header className="h-16 border-b border-border bg-surface flex items-center justify-between px-8">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 bg-bg border border-border rounded-xl text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        {/* Print Button */}
        <button 
          onClick={() => window.print()}
          className="relative p-2 rounded-xl hover:bg-bg transition-colors"
          title="Print Page"
        >
          <Printer className="w-5 h-5 text-text-secondary" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-bg transition-colors">
          <Bell className="w-5 h-5 text-text-secondary" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-error rounded-full text-[9px] text-white font-bold flex items-center justify-center">
            3
          </span>
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center">
          <span className="text-sm font-semibold text-gold">A</span>
        </div>
      </div>
    </header>
  );
}
