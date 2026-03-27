'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const ROLES = [
  { value: '',        label: 'Todos' },
  { value: 'admin',   label: 'Admin' },
  { value: 'teacher', label: 'Profesores' },
  { value: 'support', label: 'Apoyo' },
  { value: 'parent',  label: 'Familias' },
];

export default function PersonasFilter({ active }: { active: string }) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const setFiltro = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('rol', value);
    else params.delete('rol');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {ROLES.map((r) => (
        <button
          key={r.value}
          onClick={() => setFiltro(r.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${active === r.value
              ? 'bg-brand text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-brand/40'}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
