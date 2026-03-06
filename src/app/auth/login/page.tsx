'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter both username and password');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 500);
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full h-[40px] px-[var(--sp-3)] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[14px] focus:outline-none focus:border-[var(--border-focus)] transition-colors placeholder:text-[var(--text-tertiary)]";

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col items-center justify-center p-[var(--sp-4)]">
      <div className="w-full max-w-[400px]">
        {/* Branding */}
        <div className="text-center mb-[var(--sp-8)]">
          <Logo size="large" className="mx-auto mb-[var(--sp-2)]" />
          <h1 className="text-[24px] font-bold text-[var(--text-primary)] tracking-tight">specdrivr</h1>
          <p className="text-[14px] text-[var(--text-secondary)]">Autonomous Development Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--sp-8)]">
          <h2 className="text-[18px] font-semibold text-[var(--text-primary)] mb-[var(--sp-6)]">Log in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-[var(--sp-5)]">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-[var(--sp-2)]">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className={inputClasses}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-[var(--sp-2)]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(inputClasses, "pr-[40px]")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-[var(--sp-3)] bg-[var(--bg-sunken)] border-l-4 border-[var(--status-blocked-text)] rounded-[var(--radius-sm)]">
                <p className="text-[12px] text-[var(--status-blocked-text)] font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full h-[40px] text-[14px] font-bold"
              loading={isLoading}
              disabled={isLoading || !username.trim() || !password}
            >
              Log in
            </Button>
          </form>

          <div className="mt-[var(--sp-8)] pt-[var(--sp-6)] border-t border-[var(--border-default)] text-center">
            <p className="text-[12px] text-[var(--text-tertiary)]">
              &copy; {new Date().getFullYear()} specdrivr
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
