'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { createInstitution, type CreateInstitutionState } from './actions';

const initialState: CreateInstitutionState = {};

export default function NuevaInstitucionPage() {
  const [state, action, pending] = useActionState(createInstitution, initialState);
  const [sections, setSections] = useState('A, B, C');

  return (
    <div className="p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-3 inline-block">
          ← Volver a instituciones
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nueva institución</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configura el colegio. Grados, secciones y períodos se crean automáticamente.
        </p>
      </div>

      <form action={action} className="space-y-6">

        {/* Nombre */}
        <Section title="Institución" subtitle="Datos básicos del colegio">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Nombre del colegio</label>
            <input
              name="name"
              type="text"
              placeholder="Ej: I.E. San Martín de Porres"
              required
              className="input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Año académico</label>
            <input
              name="academic_year"
              type="number"
              defaultValue={new Date().getFullYear()}
              min={2020}
              max={2035}
              required
              className="input"
            />
          </div>
        </Section>

        {/* Grados */}
        <Section title="Grados" subtitle="¿Cuántos grados tiene el colegio?">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="cursor-pointer">
                <input type="radio" name="num_grades" value={n} defaultChecked={n === 5} className="sr-only peer" />
                <div className="border-2 border-gray-200 rounded-xl p-3 text-center text-sm font-medium
                                text-gray-500 peer-checked:border-brand peer-checked:bg-brand/5
                                peer-checked:text-brand hover:border-gray-300 transition-all">
                  {n}ro{n > 1 ? '' : ''}
                  <br />
                  <span className="text-xs font-normal">grado{n !== 1 ? 's' : ''}</span>
                </div>
              </label>
            ))}
          </div>
        </Section>

        {/* Secciones */}
        <Section title="Secciones" subtitle="Letras de sección separadas por coma">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              Secciones por grado
            </label>
            <input
              name="sections"
              type="text"
              value={sections}
              onChange={(e) => setSections(e.target.value)}
              placeholder="A, B, C"
              required
              className="input"
            />
            <p className="text-xs text-gray-400">
              Se crearán estas secciones para cada grado. Ej: "A, B" crea 2 secciones por grado.
            </p>
          </div>

          {/* Preview */}
          {sections && (
            <div className="flex flex-wrap gap-2 mt-2">
              {sections.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean).map((s) => (
                <span key={s} className="px-2.5 py-1 bg-brand/8 text-brand text-xs font-semibold rounded-lg border border-brand/20">
                  Sección {s}
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Períodos */}
        <Section title="Períodos académicos" subtitle="¿Cómo divide el año el colegio?">
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 4, label: '4 Bimestres', sub: 'Más común en Perú' },
              { value: 3, label: '3 Trimestres', sub: 'Alternativa trimestral' },
            ].map((opt) => (
              <label key={opt.value} className="cursor-pointer">
                <input type="radio" name="num_periods" value={opt.value} defaultChecked={opt.value === 4} className="sr-only peer" />
                <div className="border-2 border-gray-200 rounded-xl p-4 peer-checked:border-brand
                                peer-checked:bg-brand/5 hover:border-gray-300 transition-all">
                  <p className="font-semibold text-sm text-gray-800 peer-checked:text-brand">{opt.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{opt.sub}</p>
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Las fechas exactas de cada período las puedes ajustar luego en Supabase.
          </p>
        </Section>

        {/* Error */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {state.error}
          </div>
        )}

        {/* Botones */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="flex-1 bg-brand text-white font-semibold py-3 rounded-xl text-sm
                       hover:bg-brand-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Creando institución...' : 'Crear institución'}
          </button>
          <Link
            href="/"
            className="px-5 py-3 rounded-xl text-sm font-medium text-gray-500
                       hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

function Section({ title, subtitle, children }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div className="border-b border-gray-100 pb-3">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
