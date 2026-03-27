'use client';

import { useState, useTransition } from 'react';
import { getCoursesBySection, getGradeTable, CourseOption, GradeRow, CategoryCol } from './actions';

type Grade   = { id: string; name: string; sections: { id: string; name: string }[] };
type Period  = { id: string; name: string; order_num: number };

function gradeColor(v: number | null): string {
  if (v === null) return 'text-gray-300';
  return v >= 11 ? 'text-blue-800 font-bold' : 'text-red-600 font-bold';
}

function fmtGrade(v: number | null): string {
  if (v === null) return '—';
  return v.toFixed(2).replace(/\.?0+$/, '') || '0';
}

export default function NotasClient({
  institutionId,
  grades,
  periods,
}: {
  institutionId: string;
  grades: Grade[];
  periods: Period[];
}) {
  const [selectedGrade,    setSelectedGrade]    = useState<Grade | null>(null);
  const [selectedSection,  setSelectedSection]  = useState<{ id: string; name: string } | null>(null);
  const [courses,          setCourses]          = useState<CourseOption[]>([]);
  const [selectedCourse,   setSelectedCourse]   = useState<CourseOption | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [rows,             setRows]             = useState<GradeRow[]>([]);
  const [categories,       setCategories]       = useState<CategoryCol[]>([]);
  const [isPending,        startTransition]     = useTransition();

  const handleSelectSection = (section: { id: string; name: string }) => {
    setSelectedSection(section);
    setSelectedCourse(null);
    setSelectedPeriodId('');
    setRows([]);
    setCategories([]);
    startTransition(async () => {
      const data = await getCoursesBySection(section.id);
      setCourses(data);
    });
  };

  const handleSelectPeriod = (periodId: string) => {
    if (!selectedCourse) return;
    setSelectedPeriodId(periodId);
    setRows([]);
    setCategories([]);
    startTransition(async () => {
      const { rows, categories } = await getGradeTable(selectedCourse.tsId, institutionId, periodId);
      setRows(rows);
      setCategories(categories);
    });
  };

  const reset = () => {
    setSelectedGrade(null);
    setSelectedSection(null);
    setSelectedCourse(null);
    setSelectedPeriodId('');
    setCourses([]);
    setRows([]);
    setCategories([]);
  };

  // Breadcrumb text
  const breadcrumb = [
    selectedGrade?.name,
    selectedSection && `Sección ${selectedSection.name}`,
    selectedCourse?.courseName,
  ].filter(Boolean).join(' › ');

  return (
    <div className="space-y-6">

      {/* Breadcrumb + reset */}
      {breadcrumb && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{breadcrumb}</p>
          <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ✕ Reiniciar
          </button>
        </div>
      )}

      {/* Paso 1: Grado */}
      {!selectedGrade && (
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Selecciona un grado
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {grades.map((g) => (
              <button
                key={g.id}
                onClick={() => { setSelectedGrade(g); setSelectedSection(null); }}
                className="text-left bg-white border border-gray-200 rounded-xl p-4
                           hover:border-brand/40 hover:shadow-sm transition-all"
              >
                <p className="font-semibold text-gray-900 text-sm">{g.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {g.sections.length} sección{g.sections.length !== 1 ? 'es' : ''}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 2: Sección */}
      {selectedGrade && !selectedSection && (
        <div>
          <button
            onClick={() => setSelectedGrade(null)}
            className="text-xs text-gray-400 hover:text-gray-600 mb-3 inline-block transition-colors"
          >
            ← {selectedGrade.name}
          </button>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Selecciona una sección
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {selectedGrade.sections.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSection(s)}
                className="bg-white border border-gray-200 rounded-xl p-4
                           hover:border-brand/40 hover:shadow-sm transition-all text-left"
              >
                <p className="font-semibold text-gray-900 text-sm">Sección {s.name}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paso 3: Curso */}
      {selectedSection && !selectedCourse && (
        <div>
          <button
            onClick={() => { setSelectedSection(null); setCourses([]); }}
            className="text-xs text-gray-400 hover:text-gray-600 mb-3 inline-block transition-colors"
          >
            ← Sección {selectedSection.name}
          </button>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Selecciona un curso
          </p>
          {isPending ? (
            <p className="text-sm text-gray-400 animate-pulse">Cargando cursos...</p>
          ) : courses.length === 0 ? (
            <p className="text-sm text-gray-400">Sin cursos asignados a esta sección.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {courses.map((c) => (
                <button
                  key={c.tsId}
                  onClick={() => { setSelectedCourse(c); setSelectedPeriodId(''); setRows([]); }}
                  className="text-left bg-white border border-gray-200 rounded-xl p-4
                             hover:border-brand/40 hover:shadow-sm transition-all"
                >
                  <p className="font-semibold text-gray-900 text-sm">{c.courseName}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Paso 4: Bimestre */}
      {selectedCourse && (
        <div>
          <button
            onClick={() => { setSelectedCourse(null); setSelectedPeriodId(''); setRows([]); }}
            className="text-xs text-gray-400 hover:text-gray-600 mb-3 inline-block transition-colors"
          >
            ← {selectedCourse.courseName}
          </button>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Selecciona hasta qué bimestre ver
          </p>
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPeriod(p.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  selectedPeriodId === p.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand/40'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de notas */}
      {selectedPeriodId && (
        <div className="mt-2">
          {isPending ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-400 animate-pulse">Calculando notas...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-400">Sin notas registradas para este bimestre.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 min-w-[180px]">
                        Alumno
                      </th>
                      {rows[0].periods.map((p) => (
                        <th key={p.periodId} className="px-4 py-3 font-semibold text-gray-600 text-center whitespace-nowrap">
                          {p.periodName}
                        </th>
                      ))}
                      <th className="px-4 py-3 font-semibold text-gray-900 text-center bg-gray-100 whitespace-nowrap">
                        Promedio general
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr
                        key={row.studentId}
                        className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {row.studentName}
                        </td>
                        {row.periods.map((p) => (
                          <td key={p.periodId} className={`px-4 py-3 text-center ${gradeColor(p.finalGrade)}`}>
                            {fmtGrade(p.finalGrade)}
                          </td>
                        ))}
                        <td className={`px-4 py-3 text-center bg-gray-50 text-base ${gradeColor(row.overallAvg)}`}>
                          {fmtGrade(row.overallAvg)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Leyenda */}
              <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-800 inline-block" />
                  ≥ 11 Aprobado
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
                  &lt; 11 Desaprobado
                </span>
                <span className="ml-auto">— = Sin notas registradas</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
