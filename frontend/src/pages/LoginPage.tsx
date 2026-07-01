import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useRef } from 'react';
import { Truck, Shield, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/shared/Button';
import { cn } from '@/lib/utils';

type LoginMode = 'driver' | 'admin';

export function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('driver');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const ctx = gsap.context(() => {
      gsap.from('.login-card', {
        y: 40, opacity: 0, duration: 0.8,
        ease: 'power3.out', delay: 0.2,
      });
      gsap.from('.login-logo', {
        scale: 0.7, opacity: 0, duration: 0.6,
        ease: 'back.out(1.7)', delay: 0.1,
      });
      gsap.from('.login-bg-orb', {
        scale: 0, opacity: 0, duration: 1.5,
        ease: 'power2.out', stagger: 0.2,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'driver') {
        if (!vehicleNumber.trim()) { setError('Vehicle number is required'); return; }
        await login({ vehicleNumber: vehicleNumber.trim().toUpperCase(), password });
      } else {
        if (!username.trim()) { setError('Username is required'); return; }
        await login({ username: username.trim(), password });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [mode, vehicleNumber, username, password, login]);

  return (
    <div
      ref={containerRef}
      className="min-h-dvh bg-surface-900 flex items-center justify-center p-4 relative overflow-hidden"
    >
      {/* Background orbs */}
      <div className="login-bg-orb absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] max-w-lg max-h-lg rounded-full bg-brand-600/10 blur-[120px] pointer-events-none" />
      <div className="login-bg-orb absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] max-w-lg max-h-lg rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
      <div className="login-bg-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] max-w-xs max-h-xs rounded-full bg-emerald-600/5 blur-[80px] pointer-events-none" />

      <div className="login-card w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="login-logo flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-glow mb-4">
            <Truck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Balaji Fleet</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time vehicle tracking</p>
        </div>

        {/* Mode toggle */}
        <div className="relative flex bg-white/5 rounded-xl p-1 mb-6 border border-white/8">
          <motion.div
            layoutId="mode-indicator"
            className="absolute inset-y-1 rounded-lg bg-white/10 border border-white/12 shadow-sm"
            style={{ width: 'calc(50% - 4px)', left: mode === 'driver' ? '4px' : 'calc(50%)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          {(['driver', 'admin'] as LoginMode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              className={cn(
                'relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
                mode === m ? 'text-white' : 'text-slate-500 hover:text-slate-300',
              )}
            >
              {m === 'driver' ? <Truck size={14} /> : <Shield size={14} />}
              {m === 'driver' ? 'Driver' : 'Admin'}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="glass rounded-2xl p-6 shadow-card">
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  {mode === 'driver' ? 'Vehicle Number' : 'Admin Username'}
                </label>
                {mode === 'driver' ? (
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="AP09AB1234"
                    className="input-field font-mono uppercase"
                    autoCapitalize="characters"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                  />
                ) : (
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="input-field"
                    autoComplete="username"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 overflow-hidden"
                  >
                    <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                variant={mode === 'driver' ? 'success' : 'primary'}
                size="lg"
                fullWidth
                loading={loading}
                glowing
                rightIcon={<ArrowRight size={16} />}
              >
                {mode === 'driver' ? 'Start Driving' : 'Enter Dashboard'}
              </Button>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Helper text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-600">
            {mode === 'driver'
              ? 'Enter your vehicle number and password to start tracking.'
              : 'Admin access for fleet management only.'}
          </p>
        </div>

        {/* Version */}
        <p className="text-center text-[10px] text-slate-800 mt-6">
          Balaji Readymix Fleet Tracker v1.0 · Powered by OpenStreetMap
        </p>
      </div>
    </div>
  );
}
