'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Correo o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">

      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent opacity-10" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-brand-light opacity-10" />
      </div>

      <div className="relative w-full max-w-md px-6">

        {/* Logo y título */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/15 mb-4">
            <span className="text-3xl font-bold text-accent">E</span>
          </div>
          <h1 className="text-2xl font-bold text-white">EduApp</h1>
          <p className="text-white/50 text-sm mt-1 uppercase tracking-widest">Panel de Implementación</p>
        </div>

        {/* Card */}
        <div className="bg-white/8 border border-white/12 rounded-3xl p-8 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-1">Acceso restringido</h2>
          <p className="text-white/45 text-sm mb-7">Solo para el equipo de implementación.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide">
                Correo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="w-full bg-white/8 border border-white/18 text-white placeholder-white/30
                           rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/70
                           focus:bg-white/12 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wide">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/8 border border-white/18 text-white placeholder-white/30
                           rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/70
                           focus:bg-white/12 transition-all"
              />
            </div>

            {error && (
              <p className="text-accent text-sm bg-accent/10 border border-accent/25 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#B8922E] via-accent to-[#D4B360]
                         text-brand-dark font-bold py-3 rounded-xl text-sm
                         hover:opacity-90 active:opacity-80 transition-opacity
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Ingresar al panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
