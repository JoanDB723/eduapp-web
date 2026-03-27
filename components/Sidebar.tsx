'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/',                    label: 'Instituciones', icon: '🏫' },
  { href: '/instituciones/nueva', label: 'Nueva institución', icon: '➕' },
];

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 flex flex-col bg-brand-dark text-white shrink-0">

      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-accent font-bold text-lg">E</span>
          </div>
          <div>
            <p className="font-bold text-sm text-white">EduApp</p>
            <p className="text-white/40 text-xs">Panel de Implementación</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-white/12 text-white'
                  : 'text-white/55 hover:text-white hover:bg-white/8'
                }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
            <span className="text-accent text-xs font-bold">
              {userEmail[0]?.toUpperCase()}
            </span>
          </div>
          <p className="text-white/50 text-xs truncate">{userEmail}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2 rounded-xl text-xs text-white/40
                     hover:text-white hover:bg-white/8 transition-all"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
