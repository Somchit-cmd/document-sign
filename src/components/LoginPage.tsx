'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileSignature, Mail, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const demoAccounts = [
  { email: 'admin@company.com', label: 'Super Admin', desc: 'Full system access' },
  { email: 'hr@company.com', label: 'HR Director', desc: 'HR & approvals' },
  { email: 'finance@company.com', label: 'Finance', desc: 'Finance workflows' },
  { email: 'legal@company.com', label: 'Legal', desc: 'Legal & compliance' },
  { email: 'mgr-eng@company.com', label: 'Eng Manager', desc: 'Department manager' },
  { email: 'emp1@company.com', label: 'Employee', desc: 'Sign & view docs' },
];

export function LoginPage() {
  const { login, isLoading } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email || 'admin@company.com', password || 'demo');
    } catch {
      setError('Login failed. Please check your credentials.');
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setError('');
    try {
      await login(demoEmail, 'demo');
    } catch {
      setError('Demo login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 flex flex-col justify-center px-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-3">
              <FileSignature className="h-10 w-10 text-emerald-300" />
            </div>
            <div>
              <span className="text-3xl font-bold tracking-tight">DocuSign</span>
              <span className="block text-sm text-emerald-300 font-medium">Enterprise</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Secure Document<br />
            Signing Platform
          </h1>
          <p className="text-emerald-200 text-lg max-w-md leading-relaxed mb-8">
            Enterprise-grade electronic signatures with approval workflows, audit trails, and real-time collaboration for internal teams.
          </p>
          <div className="space-y-4">
            {[
              'Legally binding e-signatures with full audit trail',
              'Multi-step approval workflows & conditional routing',
              'SSO integration with Azure AD, Google & LDAP',
              'Real-time collaboration & smart notifications',
              'AI-powered OCR, summarization & field detection',
              'Role-based access control & encryption at rest',
            ].map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div className="rounded-full bg-emerald-400/20 p-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <span className="text-emerald-100">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <FileSignature className="h-8 w-8 text-primary" />
            <div>
              <span className="text-2xl font-bold">DocuSign</span>
              <span className="block text-xs text-muted-foreground font-medium">Enterprise</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-muted-foreground mt-1">
              Sign in with your corporate account to continue
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              Or continue with SSO
            </span>
          </div>

          {/* SSO Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Button variant="outline" className="w-full" onClick={() => handleDemoLogin('admin@company.com')}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
              <span className="text-xs">Microsoft</span>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleDemoLogin('admin@company.com')}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span className="text-xs">Google</span>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleDemoLogin('admin@company.com')}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L8.32 13.617l-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>
              <span className="text-xs">LDAP</span>
            </Button>
          </div>

          {/* Demo Accounts */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Quick Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account.email)}
                  disabled={isLoading}
                  className="flex flex-col items-start rounded-md border border-border bg-background px-3 py-2 text-left hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <span className="text-sm font-medium">{account.label}</span>
                  <span className="text-[11px] text-muted-foreground">{account.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By signing in, you agree to the internal use policy. <br />
            This platform is for authorized employees only.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
