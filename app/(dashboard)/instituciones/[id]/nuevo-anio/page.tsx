'use client';

import { useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cambiarAnioAcademico } from './actions';

const DEFAULT_PERIODOS = [
  { name: 'Bimestre 1', order_num: 1, start_date: '', end_date: '' },
  { name: 'Bimestre 2', order_num: 2, start_date: '', end_date: '' },
  { name: 'Bimestre 3', order_num: 3, start_date: '', end_date: '' },
  { name: 'Bimestre 4', order_num: 4, start_date: '', end_date: '' },
];

export default function NuevoAnioPage() {
  const params        = useParams<{ id: string }>();
  const institutionId = params.id;
  const router        = useRouter();

  const [anio, setAnio]         = useState(String(new Date().getFullYear() + 1));
  const [periodos, setPeriodos] = useState(DEFAULT_PERIODOS);
  const [error, setError]       = useState<string | null>(null);
  const [isPending, start]      = useTransition();

  const updatePeriodo = (index: number, field: 'start_date' | 'end_date', value: string) => {
    setPeriodos((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const incomplete = periodos.some((p) => !p.start_date || !p.end_date);
    if (incomplete) {
      setError('Completa las fechas de inicio y fin de todos los bimestres.');
      return;
    }

    start(async () => {
      const res = await cambiarAnioAcademico(institutionId, anio, periodos);
      if (res.error) { setError(res.error); return; }
      router.push(`/instituciones/${institutionId}?anio=${anio}`);
    });
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <Link
        href={`/instituciones/${institutionId}`}
        className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block"
      >
        ← Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Nuevo año académico</h1>
      <p className="text-gray-500 text-sm mb-8">
        Crea los períodos (bimestres) para el nuevo año. La app móvil pasará a mostrar
        estos períodos en la pantalla de notas de todos los profesores.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Año */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Año académico</h2>
          <input
            type="number"
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            min={2024}
            max={2099}
            required
            className="input w-32"
          />
        </div>

        {/* Bimestres */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Fechas de los bimestres</h2>
          {periodos.map((p, i) => (
            <div key={p.order_num} className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">{p.name}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Inicio</label>
                  <input
                    type="date"
                    value={p.start_date}
                    onChange={(e) => updatePeriodo(i, 'start_date', e.target.value)}
                    required
                    className="input"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Fin</label>
                  <input
                    type="date"
                    value={p.end_date}
                    onChange={(e) => updatePeriodo(i, 'end_date', e.target.value)}
                    required
                    className="input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Al confirmar, la app móvil cambiará inmediatamente al año <strong>{anio}</strong> para
          todos los profesores de esta institución.
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-brand text-white font-semibold py-3 rounded-xl text-sm
                     hover:bg-brand-medium transition-colors disabled:opacity-50"
        >
          {isPending ? 'Aplicando...' : `Activar año ${anio}`}
        </button>
      </form>
    </div>
  );
}
