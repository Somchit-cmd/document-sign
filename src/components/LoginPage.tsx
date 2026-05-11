'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileSignature, Mail, Lock, Loader2, Shield, Award, LockKeyhole, Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const demoAccounts = [
  { email: 'admin@company.com', label: 'Super Admin', desc: 'Full system access', color: 'from-emerald-500 to-teal-600' },
  { email: 'hr@company.com', label: 'HR Director', desc: 'HR & approvals', color: 'from-teal-500 to-cyan-600' },
  { email: 'finance@company.com', label: 'Finance', desc: 'Finance workflows', color: 'from-cyan-500 to-emerald-600' },
  { email: 'legal@company.com', label: 'Legal', desc: 'Legal & compliance', color: 'from-emerald-600 to-teal-500' },
  { email: 'mgr-eng@company.com', label: 'Eng Manager', desc: 'Department manager', color: 'from-teal-600 to-emerald-500' },
  { email: 'emp1@company.com', label: 'Employee', desc: 'Sign & view docs', color: 'from-emerald-500 to-cyan-600' },
];

// Floating background icons - with positions as percentage + pixel offset for parallax
const floatingIcons = [
  { icon: '📄', x: 15, y: 20, delay: 0, duration: 6, parallaxFactor: 0.03 },
  { icon: '✍️', x: 75, y: 35, delay: 1, duration: 8, parallaxFactor: 0.05 },
  { icon: '📋', x: 25, y: 65, delay: 2, duration: 7, parallaxFactor: 0.02 },
  { icon: '🔐', x: 80, y: 75, delay: 0.5, duration: 9, parallaxFactor: 0.04 },
  { icon: '📝', x: 50, y: 15, delay: 3, duration: 6.5, parallaxFactor: 0.03 },
  { icon: '🤝', x: 60, y: 80, delay: 1.5, duration: 7.5, parallaxFactor: 0.05 },
  { icon: '📜', x: 10, y: 50, delay: 2.5, duration: 8.5, parallaxFactor: 0.02 },
  { icon: '🖊️', x: 85, y: 50, delay: 0.8, duration: 7.2, parallaxFactor: 0.04 },
  { icon: '🗂️', x: 40, y: 88, delay: 1.8, duration: 6.8, parallaxFactor: 0.03 },
  { icon: '🔏', x: 70, y: 12, delay: 3.2, duration: 8.2, parallaxFactor: 0.05 },
];

// Constellation connections between nearby icons
const constellationLines = [
  { from: 0, to: 2 },  // 📄 -> 📋
  { from: 1, to: 3 },  // ✍️ -> 🔐
  { from: 4, to: 9 },  // 📝 -> 🔏
  { from: 2, to: 6 },  // 📋 -> 📜
  { from: 5, to: 8 },  // 🤝 -> 🗂️
  { from: 1, to: 7 },  // ✍️ -> 🖊️
  { from: 0, to: 4 },  // 📄 -> 📝
  { from: 3, to: 5 },  // 🔐 -> 🤝
];

// Floating decorative shapes
const floatingShapes = [
  { type: 'circle', x: '8%', y: '30%', size: 60, color: 'bg-emerald-400/10', delay: 0, duration: 14 },
  { type: 'hexagon', x: '88%', y: '20%', size: 40, color: 'bg-teal-400/10', delay: 2, duration: 16 },
  { type: 'circle', x: '65%', y: '70%', size: 50, color: 'bg-cyan-400/10', delay: 4, duration: 12 },
  { type: 'hexagon', x: '20%', y: '85%', size: 35, color: 'bg-emerald-300/8', delay: 1, duration: 18 },
  { type: 'circle', x: '92%', y: '60%', size: 30, color: 'bg-teal-300/10', delay: 3, duration: 15 },
  { type: 'circle', x: '35%', y: '8%', size: 25, color: 'bg-cyan-300/8', delay: 5, duration: 13 },
];

// Particle dots with deterministic positions
const particlePositions = [
  { left: '15%', top: '25%' }, { left: '75%', top: '45%' },
  { left: '35%', top: '65%' }, { left: '85%', top: '20%' },
  { left: '50%', top: '80%' }, { left: '25%', top: '40%' },
  { left: '65%', top: '15%' }, { left: '45%', top: '55%' },
  { left: '80%', top: '70%' }, { left: '20%', top: '85%' },
  { left: '55%', top: '30%' }, { left: '70%', top: '60%' },
  { left: '5%', top: '55%' }, { left: '95%', top: '35%' },
  { left: '40%', top: '10%' }, { left: '60%', top: '90%' },
  { left: '30%', top: '45%' }, { left: '90%', top: '50%' },
  { left: '12%', top: '72%' }, { left: '48%', top: '38%' },
];
const particleDelays = [0, 0.8, 1.6, 2.4, 3.2, 0.4, 1.2, 2.0, 2.8, 3.6, 1.0, 1.8, 0.6, 2.2, 3.0, 1.4, 0.2, 2.6, 1.6, 3.4];
const particleDurations = [6, 8, 7, 9, 6.5, 7.5, 8.5, 6.8, 7.2, 9.5, 6.3, 8.2, 7.8, 6.5, 9.0, 7.0, 8.0, 6.2, 7.5, 9.2];

// Phrases for cycling typing animation
const TAGLINE_PHRASES = [
  'Secure Document Signing',
  'Enterprise Workflows',
  'Digital Signatures',
  'Audit Trail Compliant',
];

// Cycling typing effect component
function CyclingTypingEffect({ phrases, typeSpeed = 60, deleteSpeed = 40, pauseDuration = 2000 }: {
  phrases: string[];
  typeSpeed?: number;
  deleteSpeed?: number;
  pauseDuration?: number;
}) {
  const [displayed, setDisplayed] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      // Typing
      if (displayed.length < currentPhrase.length) {
        timeout = setTimeout(() => {
          setDisplayed(currentPhrase.slice(0, displayed.length + 1));
        }, typeSpeed);
      } else {
        // Finished typing, wait then start deleting
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    } else {
      // Deleting
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed(currentPhrase.slice(0, displayed.length - 1));
        }, deleteSpeed);
      } else {
        // Finished deleting, move to next phrase - wrap in timeout to avoid direct setState in effect
        timeout = setTimeout(() => {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }, 50);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, phraseIndex, phrases, typeSpeed, deleteSpeed, pauseDuration]);

  // Blink cursor
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <span>
      {displayed}
      <span className={showCursor ? 'opacity-100' : 'opacity-0'} style={{ transition: 'opacity 0.1s' }}>
        |
      </span>
    </span>
  );
}

export function LoginPage() {
  const { login, isLoading } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // Parallax effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (leftPanelRef.current) {
        const rect = leftPanelRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setMousePos({ x, y });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Compute icon positions with parallax
  const iconPositions = useMemo(() => {
    return floatingIcons.map((item) => ({
      ...item,
      px: item.x + mousePos.x * item.parallaxFactor * 100,
      py: item.y + mousePos.y * item.parallaxFactor * 100,
    }));
  }, [mousePos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email || 'admin@company.com', password || 'demo');
    } catch {
      setError('Login failed. Please check your credentials.');
    }
  };

  const handleDemoLogin = useCallback(async (demoEmail: string) => {
    setEmail(demoEmail);
    setError('');
    try {
      await login(demoEmail, 'demo');
    } catch {
      setError('Demo login failed. Please try again.');
    }
  }, [login]);

  return (
    <div className="min-h-screen flex" suppressHydrationWarning>
      {/* Left side - Branding with animated gradient */}
      <div
        ref={leftPanelRef}
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white animate-gradient-shift"
      >
        {/* Animated geometric pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-white/20 rounded-full animate-geometric-rotate" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 border border-white/10 rounded-full animate-geometric-rotate" style={{ animationDirection: 'reverse', animationDuration: '45s' }} />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 border border-emerald-300/20 rounded-full animate-geometric-rotate" style={{ animationDuration: '30s' }} />
        </div>

        {/* Dot grid pattern overlay */}
        <div className="absolute inset-0 dot-grid-bg opacity-30" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />

        {/* Floating decorative shapes (circles & hexagons) */}
        {floatingShapes.map((shape, i) => (
          <motion.div
            key={`shape-${i}`}
            className={`absolute ${shape.color} ${shape.type === 'hexagon' ? 'hexagon' : 'rounded-full'}`}
            style={{
              left: shape.x,
              top: shape.y,
              width: shape.size,
              height: shape.size,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0.08, 0.15, 0.08],
              scale: [0.95, 1.05, 0.95],
              y: [0, -20, 5, -10, 0],
            }}
            transition={{
              delay: shape.delay,
              duration: shape.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* SVG Constellation lines between floating icons */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1]">
          {constellationLines.map((line, i) => {
            const from = iconPositions[line.from];
            const to = iconPositions[line.to];
            return (
              <motion.line
                key={`constellation-${i}`}
                x1={`${from.px}%`}
                y1={`${from.py}%`}
                x2={`${to.px}%`}
                y2={`${to.py}%`}
                stroke="white"
                strokeWidth="0.5"
                className="constellation-line"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.05, 0.15, 0.05] }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.3,
                }}
              />
            );
          })}
        </svg>

        {/* Floating document/signature/contract icons with parallax */}
        {iconPositions.map((item, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl opacity-20 select-none z-[2]"
            style={{ left: `${item.px}%`, top: `${item.py}%` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 0.2,
              y: [0, -15, 5, -10, 0],
            }}
            transition={{
              delay: item.delay,
              duration: item.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {item.icon}
          </motion.div>
        ))}

        {/* Particle system with slowly moving dots */}
        {particlePositions.map((pos, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full bg-emerald-400/30 z-[1]"
            style={{
              left: pos.left,
              top: pos.top,
              width: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1,
              height: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1,
            }}
            animate={{
              y: [0, -30, -60, -80],
              x: [0, (i % 2 === 0 ? 10 : -10), (i % 2 === 0 ? -5 : 5), 0],
              opacity: [0.3, 0.5, 0.3, 0],
              scale: [1, 1.2, 0.8, 0],
            }}
            transition={{
              duration: particleDurations[i] || 7,
              repeat: Infinity,
              delay: particleDelays[i] || 0,
              ease: 'easeOut',
            }}
          />
        ))}

        {/* Main content with glassmorphism frosted glass panel */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 flex flex-col justify-center px-16 w-full"
        >
          <div className="glass-panel rounded-2xl p-8 max-w-lg">
            <div className="flex items-center gap-3 mb-8">
              <div className="rounded-xl bg-white/15 backdrop-blur-sm p-3 border border-white/15">
                <FileSignature className="h-10 w-10 text-emerald-300" />
              </div>
              <div>
                <span className="text-3xl font-bold tracking-tight">DocuSign</span>
                <span className="block text-sm text-emerald-300 font-medium">Enterprise</span>
              </div>
            </div>

            <h1 className="text-4xl font-bold leading-tight mb-4">
              <span className="gradient-text-animated">
                <CyclingTypingEffect phrases={TAGLINE_PHRASES} typeSpeed={60} deleteSpeed={35} pauseDuration={2200} />
              </span>
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
                  transition={{ delay: 0.5 + i * 0.12, duration: 0.5, ease: 'easeOut' }}
                  className="flex items-center gap-3"
                >
                  <div className="rounded-full bg-emerald-400/20 p-1">
                    <motion.div
                      className="h-2 w-2 rounded-full bg-emerald-400"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7 + i * 0.12, duration: 0.3, type: 'spring' }}
                    />
                  </div>
                  <span className="text-emerald-100">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* Trust bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="mt-12 pt-6 border-t border-white/10"
            >
              <p className="text-emerald-300/70 text-xs font-medium mb-3 uppercase tracking-wider">Trusted by 10,000+ enterprises</p>
              <div className="flex items-center gap-6">
                {/* Security badges */}
                <div className="flex items-center gap-2 text-emerald-200/60 text-xs">
                  <Shield className="h-4 w-4" />
                  <span>SOC 2</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-200/60 text-xs">
                  <Award className="h-4 w-4" />
                  <span>ISO 27001</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-200/60 text-xs">
                  <LockKeyhole className="h-4 w-4" />
                  <span>GDPR</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-200/60 text-xs">
                  <Globe className="h-4 w-4" />
                  <span>HIPAA</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background relative">
        {/* Subtle dot grid on right side */}
        <div className="absolute inset-0 dot-grid-bg opacity-[0.03] dark:opacity-[0.02]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <FileSignature className="h-8 w-8 text-primary" />
            <div>
              <span className="text-2xl font-bold">DocuSign</span>
              <span className="block text-xs text-muted-foreground font-medium">Enterprise</span>
            </div>
          </div>

          {/* Login Card with shimmer sweep */}
          <div className="glass-card rounded-2xl p-8 card-shadow-premium relative overflow-hidden card-shimmer-sweep">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-muted-foreground mt-1">
                Sign in with your corporate account to continue
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
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
                    className="pl-10 input-glow-focus"
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
                    className="pl-10 input-glow-focus"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center transition-all duration-200 ${
                    rememberMe ? 'bg-emerald-600 border-emerald-600' : 'border-muted-foreground/40 hover:border-emerald-500'
                  }`}>
                    {rememberMe && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-xs text-muted-foreground">Remember me</span>
                </div>
              </div>
              {/* Sign In button with shimmer */}
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 btn-click-scale relative overflow-hidden animate-btn-shimmer" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
                {isLoading && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{ opacity: 0.3 }}
                  />
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                Or continue with SSO
              </span>
            </div>

            {/* SSO Buttons with brand-specific gradient backgrounds */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Button
                variant="outline"
                className="w-full btn-click-scale group h-11 relative overflow-hidden transition-all duration-300 hover:border-blue-500/40"
                onClick={() => handleDemoLogin('admin@company.com')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-500/0 to-blue-600/0 group-hover:from-blue-600/10 group-hover:via-blue-500/15 group-hover:to-blue-600/10 transition-all duration-300" />
                <svg className="mr-2 h-4 w-4" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                <span className="text-xs">Microsoft</span>
              </Button>
              <Button
                variant="outline"
                className="w-full btn-click-scale group h-11 relative overflow-hidden transition-all duration-300 hover:border-red-400/30"
                onClick={() => handleDemoLogin('admin@company.com')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-yellow-500/0 via-blue-500/0 to-green-500/0 group-hover:from-red-500/8 group-hover:via-yellow-500/8 group-hover:via-blue-500/8 group-hover:to-green-500/8 transition-all duration-300" />
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                <span className="text-xs">Google</span>
              </Button>
              <Button
                variant="outline"
                className="w-full btn-click-scale group h-11 relative overflow-hidden transition-all duration-300 hover:border-purple-500/40"
                onClick={() => handleDemoLogin('admin@company.com')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-500/0 to-purple-600/0 group-hover:from-purple-600/10 group-hover:via-purple-500/15 group-hover:to-purple-600/10 transition-all duration-300" />
                <svg className="mr-2 h-4 w-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L8.32 13.617l-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>
                <span className="text-xs">LDAP</span>
              </Button>
            </div>

            {/* Demo Accounts with scale + glow */}
            <div className="rounded-xl border border-border bg-gradient-to-b from-muted/30 to-muted/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Quick Demo Access
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((account, i) => (
                  <motion.button
                    key={account.email}
                    onClick={() => handleDemoLogin(account.email)}
                    disabled={isLoading}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-start rounded-lg border border-border bg-background px-3 py-2.5 text-left hover:shadow-md hover:border-emerald-500/30 transition-all duration-200 disabled:opacity-50 relative overflow-hidden group micro-glow"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${account.color} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-300`} />
                    <span className="text-sm font-medium relative z-10">{account.label}</span>
                    <span className="text-[11px] text-muted-foreground relative z-10">{account.desc}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Security / Compliance badge at bottom of card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-5 flex items-center justify-center gap-3 text-[10px] text-muted-foreground/60"
          >
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>SOC 2 Type II</span>
            </div>
            <span className="text-muted-foreground/30">·</span>
            <div className="flex items-center gap-1">
              <LockKeyhole className="h-3 w-3" />
              <span>256-bit AES</span>
            </div>
            <span className="text-muted-foreground/30">·</span>
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <span>GDPR Ready</span>
            </div>
          </motion.div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            By signing in, you agree to the internal use policy. <br />
            This platform is for authorized employees only.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
