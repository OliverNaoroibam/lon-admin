'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Flower2 } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/dashboard');
    } else {
      setError('Invalid password');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D]">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, #C4943D 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold/10 mb-5">
            <Flower2 className="w-7 h-7 text-gold" />
          </div>
          <h1
            className="text-4xl font-bold text-white tracking-[6px]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            LON
          </h1>
          <p className="text-gold text-xs tracking-[4px] mt-1 font-medium">
            ADMIN PANEL
          </p>
        </div>

        {/* Login card */}
        <div className="bg-[#141414] rounded-2xl border border-[#2A2A2A] p-8">
          <h2 className="text-lg font-semibold text-white mb-1">
            Welcome back
          </h2>
          <p className="text-[#888] text-sm mb-6">
            Enter admin password to continue
          </p>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#888] mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2A2A2A] rounded-xl text-white text-sm placeholder-[#555] focus:outline-none focus:border-gold transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 bg-error/10 border border-error/20 rounded-lg">
                <p className="text-error text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 bg-gold hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#555] text-xs mt-6">
          LON Manipur — Internal Admin Access Only
        </p>
      </div>
    </div>
  );
}
