'use client';

import { useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { crearPersona } from '../actions';

type Role = 'admin' | 'teacher' | 'support' | 'parent';

const ROLES: { value: Role; label: string; icon: string; desc: string }[] = [
  { value: 'admin',   label: 'Directora', icon: '🏛️', desc: 'Acceso completo de supervisión' },
  { value: 'teacher', label: 'Profesor',  icon: '👨‍🏫', desc: 'Dicta cursos en secciones' },
  { value: 'support', label: 'Apoyo',     icon: '🩺', desc: 'Psicólogo o auxiliar' },
  { value: 'parent',  label: 'Familia',   icon: '👪', desc: 'Cuenta compartida alumno + padres' },
];

export default function NuevaPersonaPage() {
  const params        = useParams<{ id: string }>();
  const institutionId = params.id;
  const router        = useRouter();

  const [role, setRole]         = useState<Role | ''>('');
  const [nombre, setNombre]     = useState('');
  const [codigo, setCodigo]     = useState('');
  const [grado, setGrado]       = useState('');
  const [seccion, setSeccion]   = useState('');
  const [result, setResult]     = useState<{ email: string; password: string } | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [isPending, start]      = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !nombre.trim()) return;

    start(async () => {
      const res = await crearPersona({
        institutionId,
        nombre:         nombre.trim(),
        role,
        studentCodigo:  role === 'parent' ? codigo.trim() : undefined,
        studentGrado:   role === 'parent' ? parseInt(grado) : undefined,
        studentSeccion: role === 'parent' ? seccion.trim().toUpperCase() : undefined,
      });

      if (res.error) { setError(res.error); return; }
      setResult({ email: res.email!, password: res.password! });
    });
  };

  if (result) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">Persona creada correctamente</p>
              <p className="text-sm text-green-600">Anota las credenciales antes de salir.</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 space-y-2">
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="font-mono font-medium text-gray-900">{result.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Contraseña</p>
              <p className="font-mono font-bold text-gray-900 text-lg">{result.password}</p>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => { setResult(null); setNombre(''); setCodigo(''); setGrado(''); setSeccion(''); setRole(''); }}
              className="flex-1 border border-brand text-brand text-sm font-semibold py-2.5 rounded-xl
                         hover:bg-brand/5 transition-colors"
            >
              Agregar otra
            </button>
            <button
              onClick={() => router.push(`/instituciones/${institutionId}/personas`)}
              className="flex-1 bg-brand text-white text-sm font-semibold py-2.5 rounded-xl
                         hover:bg-brand-medium transition-colors"
            >
              Volver a personas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <Link
        href={`/instituciones/${institutionId}/personas`}
        className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block"
      >
        ← Volver a personas
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Agregar persona</h1>
      <p className="text-gray-500 text-sm mb-8">Las credenciales se generan automáticamente del nombre.</p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Selector de rol */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Rol</h2>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <label key={r.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="sr-only peer"
                />
                <div className="border-2 border-gray-200 rounded-xl p-3 peer-checked:border-brand
                                peer-checked:bg-brand/5 hover:border-gray-300 transition-all">
                  <p className="text-base mb-1">{r.icon}</p>
                  <p className="text-sm font-semibold text-gray-800">{r.label}</p>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Nombre */}
        {role && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Datos</h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Nombre completo</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez García"
                required
                className="input"
              />
              <p className="text-xs text-gray-400">
                El email y contraseña se generarán automáticamente de este nombre.
              </p>
            </div>

            {/* Campos extra para familia */}
            {role === 'parent' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Código del alumno</label>
                  <input
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Ej: 2025042"
                    required
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Grado</label>
                    <select value={grado} onChange={(e) => setGrado(e.target.value)} required className="input">
                      <option value="">Seleccionar...</option>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}ro</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Sección</label>
                    <input
                      value={seccion}
                      onChange={(e) => setSeccion(e.target.value)}
                      placeholder="Ej: A"
                      maxLength={1}
                      required
                      className="input uppercase"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || !role || !nombre.trim()}
          className="w-full bg-brand text-white font-semibold py-3 rounded-xl text-sm
                     hover:bg-brand-medium transition-colors disabled:opacity-50"
        >
          {isPending ? 'Creando...' : 'Crear persona'}
        </button>
      </form>
    </div>
  );
}
