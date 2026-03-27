'use client';

import { useState, useTransition } from 'react';
import { eliminarInstitucion } from './actions';

export default function EliminarInstitucion({
  institutionId,
  institutionName,
}: {
  institutionId: string;
  institutionName: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleEliminar = () => {
    setError('');
    startTransition(async () => {
      const result = await eliminarInstitucion(institutionId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-red-400 hover:text-red-600 font-medium transition-colors"
      >
        Eliminar institución
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Eliminar institución</h2>
            <p className="text-sm text-gray-500 mb-4">
              Esta acción eliminará <strong>todos los datos</strong> de{' '}
              <strong>{institutionName}</strong>: alumnos, profesores, notas, asistencias y más.
              Esta acción <strong>no se puede deshacer</strong>.
            </p>

            <p className="text-sm text-gray-700 mb-2">
              Escribe <span className="font-mono font-semibold text-gray-900">{institutionName}</span> para confirmar:
            </p>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={institutionName}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-300"
            />

            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setOpen(false); setConfirm(''); setError(''); }}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={confirm !== institutionName || isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold
                           hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
