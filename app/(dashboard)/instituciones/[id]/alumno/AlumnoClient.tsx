'use client';

import { useState, useTransition } from 'react';
import { agregarAlumnoNuevo, cambiarSeccionAlumno, searchStudents } from './actions';

type Grade   = { id: string; name: string; sections: { id: string; name: string }[] };
type Student = { id: string; full_name: string; student_code: string; sections: any };

export default function AlumnoClient({
  institutionId,
  grades,
}: {
  institutionId: string;
  grades: Grade[];
}) {
  const [mode, setMode] = useState<'nuevo' | 'mover'>('nuevo');

  return (
    <div className="max-w-xl mx-auto">
      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-6">
        <button
          onClick={() => setMode('nuevo')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors
            ${mode === 'nuevo' ? 'bg-brand text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          Alumno nuevo
        </button>
        <button
          onClick={() => setMode('mover')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors
            ${mode === 'mover' ? 'bg-brand text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
        >
          Cambiar de sección
        </button>
      </div>

      {mode === 'nuevo'
        ? <NuevoAlumnoForm institutionId={institutionId} grades={grades} />
        : <CambiarSeccionForm institutionId={institutionId} grades={grades} />
      }
    </div>
  );
}

// ─── Formulario alumno nuevo ───────────────────────────────────────────────

function NuevoAlumnoForm({ institutionId, grades }: { institutionId: string; grades: Grade[] }) {
  const [gradeId,    setGradeId]    = useState('');
  const [sectionId,  setSectionId]  = useState('');
  const [fullName,   setFullName]   = useState('');
  const [code,       setCode]       = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState('');
  const [done,       setDone]       = useState<{ email: string; password: string; name: string } | null>(null);
  const [isPending,  startTransition] = useTransition();

  const selectedGrade = grades.find((g) => g.id === gradeId);

  const handleSubmit = () => {
    setError('');
    if (!sectionId || !fullName || !code || !email || !password) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    startTransition(async () => {
      const result = await agregarAlumnoNuevo({ institutionId, sectionId, fullName, studentCode: code, email, password });
      if (result.error) { setError(result.error); return; }
      setDone(result.credentials!);
    });
  };

  if (done) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">✅</span>
        <h2 className="font-bold text-green-800">Alumno agregado correctamente</h2>
      </div>
      <p className="text-sm text-green-700">Entrega estas credenciales al apoderado de <strong>{done.name}</strong>:</p>
      <div className="bg-white border border-green-200 rounded-xl p-4 space-y-2 font-mono text-sm">
        <p><span className="text-gray-500">Email:</span> <strong>{done.email}</strong></p>
        <p><span className="text-gray-500">Contraseña:</span> <strong>{done.password}</strong></p>
      </div>
      <button
        onClick={() => { setDone(null); setFullName(''); setCode(''); setEmail(''); setPassword(''); setGradeId(''); setSectionId(''); }}
        className="text-sm text-green-700 underline"
      >
        Agregar otro alumno
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Grado */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Grado</label>
        <select
          value={gradeId}
          onChange={(e) => { setGradeId(e.target.value); setSectionId(''); }}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        >
          <option value="">Seleccionar grado...</option>
          {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Sección */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Sección</label>
        <select
          value={sectionId}
          onChange={(e) => setSectionId(e.target.value)}
          disabled={!gradeId}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
        >
          <option value="">Seleccionar sección...</option>
          {selectedGrade?.sections.map((s) => <option key={s.id} value={s.id}>Sección {s.name}</option>)}
        </select>
      </div>

      <hr className="border-gray-100" />

      {/* Datos del alumno */}
      {[
        { label: 'Nombre completo', value: fullName, onChange: setFullName, placeholder: 'Ej: María García Torres' },
        { label: 'Código de alumno', value: code, onChange: setCode, placeholder: 'Ej: 2025001' },
        { label: 'Email del apoderado', value: email, onChange: setEmail, placeholder: 'Ej: garcia@gmail.com' },
        { label: 'Contraseña', value: password, onChange: setPassword, placeholder: 'Mínimo 6 caracteres' },
      ].map((field) => (
        <div key={field.label}>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{field.label}</label>
          <input
            type="text"
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-brand text-white py-3 rounded-xl text-sm font-semibold hover:bg-brand-medium transition-colors disabled:opacity-50"
      >
        {isPending ? 'Agregando...' : 'Agregar alumno'}
      </button>
    </div>
  );
}

// ─── Formulario cambiar sección ────────────────────────────────────────────

function CambiarSeccionForm({ institutionId, grades }: { institutionId: string; grades: Grade[] }) {
  const [query,      setQuery]      = useState('');
  const [results,    setResults]    = useState<Student[]>([]);
  const [searching,  setSearching]  = useState(false);
  const [selected,   setSelected]   = useState<Student | null>(null);
  const [gradeId,    setGradeId]    = useState('');
  const [sectionId,  setSectionId]  = useState('');
  const [error,      setError]      = useState('');
  const [done,       setDone]       = useState(false);
  const [isPending,  startTransition] = useTransition();

  const selectedGrade = grades.find((g) => g.id === gradeId);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const data = await searchStudents(institutionId, query.trim());
    setResults(data as Student[]);
    setSearching(false);
  };

  const handleMover = () => {
    setError('');
    if (!selected || !sectionId) { setError('Selecciona un alumno y una sección.'); return; }
    startTransition(async () => {
      const result = await cambiarSeccionAlumno({ institutionId, studentId: selected.id, newSectionId: sectionId });
      if (result.error) { setError(result.error); return; }
      setDone(true);
    });
  };

  if (done) return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
      <span className="text-3xl">✅</span>
      <p className="font-bold text-green-800">Sección actualizada correctamente</p>
      <p className="text-sm text-green-700">
        <strong>{selected?.full_name}</strong> ya aparece en la nueva sección del profesor.
      </p>
      <button onClick={() => { setDone(false); setSelected(null); setQuery(''); setResults([]); setGradeId(''); setSectionId(''); }}
        className="text-sm text-green-700 underline">
        Mover otro alumno
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Buscar alumno */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Buscar alumno</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Nombre o código..."
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-medium transition-colors disabled:opacity-50"
          >
            {searching ? '...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Resultados */}
      {results.length > 0 && !selected && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {results.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900">{s.full_name}</p>
              <p className="text-xs text-gray-400">
                {s.sections?.grades?.name} — Sec. {s.sections?.name} · {s.student_code}
              </p>
            </button>
          ))}
        </div>
      )}

      {results.length === 0 && query && !searching && (
        <p className="text-sm text-gray-400 text-center">Sin resultados para "{query}"</p>
      )}

      {/* Alumno seleccionado */}
      {selected && (
        <div className="bg-brand/5 border border-brand/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">{selected.full_name}</p>
            <p className="text-xs text-gray-400">
              Actualmente: {selected.sections?.grades?.name} — Sec. {selected.sections?.name}
            </p>
          </div>
          <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
        </div>
      )}

      {selected && (
        <>
          <hr className="border-gray-100" />
          <p className="text-sm font-semibold text-gray-700">Nueva sección:</p>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Grado</label>
            <select
              value={gradeId}
              onChange={(e) => { setGradeId(e.target.value); setSectionId(''); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              <option value="">Seleccionar grado...</option>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Sección</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              disabled={!gradeId}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
            >
              <option value="">Seleccionar sección...</option>
              {selectedGrade?.sections.map((s) => <option key={s.id} value={s.id}>Sección {s.name}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleMover}
            disabled={isPending}
            className="w-full bg-brand text-white py-3 rounded-xl text-sm font-semibold hover:bg-brand-medium transition-colors disabled:opacity-50"
          >
            {isPending ? 'Actualizando...' : 'Cambiar sección'}
          </button>
        </>
      )}
    </div>
  );
}
