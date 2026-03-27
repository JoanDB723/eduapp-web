'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  editarNombre,
  toggleActivo,
  resetearPassword,
  agregarAsignacion,
  eliminarAsignacion,
  cambiarSeccion,
} from '../actions';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Student = {
  id: string;
  full_name: string;
  student_code: string;
  sections: { id: string; name: string; grades: { id: string; name: string; order_num: number } };
};

type User = {
  id: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'support' | 'parent';
  is_active: boolean;
  email: string;
  student: Student | null;
};

type Assignment = {
  id: string;
  academic_year: string;
  courses: { id: string; name: string };
  sections: { id: string; name: string; grades: { name: string; order_num: number } };
};

type Course  = { id: string; name: string };
type Section = { id: string; name: string; gradeOrderNum: number; gradeName: string };

// ─── Labels ────────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  admin:   'Directora',
  teacher: 'Profesor',
  support: 'Apoyo',
  parent:  'Familia',
};

const ROLE_COLOR: Record<string, string> = {
  admin:   'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100 text-blue-700',
  support: 'bg-green-100 text-green-700',
  parent:  'bg-orange-100 text-orange-700',
};

const ROLE_ICON: Record<string, string> = {
  admin:   '🏛️',
  teacher: '👨‍🏫',
  support: '🩺',
  parent:  '👪',
};

// ─── Componente principal ──────────────────────────────────────────────────────

export default function PersonaDetail({
  user: initialUser,
  assignments: initialAssignments,
  courses,
  sections,
  institutionId,
}: {
  user:        User;
  assignments: Assignment[];
  courses:     Course[];
  sections:    Section[];
  institutionId: string;
}) {
  const router = useRouter();
  const [user, setUser]             = useState(initialUser);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue]     = useState(initialUser.full_name);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  const clearError = () => setGlobalError(null);

  // ── Guardar nombre ────────────────────────────────────────────────────────
  const handleSaveName = () => {
    if (!nameValue.trim()) return;
    startTransition(async () => {
      const res = await editarNombre(user.id, nameValue, institutionId);
      if (res.error) { setGlobalError(res.error); return; }
      setUser((u) => ({ ...u, full_name: nameValue }));
      setEditingName(false);
    });
  };

  // ── Toggle activo ─────────────────────────────────────────────────────────
  const handleToggle = () => {
    startTransition(async () => {
      const res = await toggleActivo(user.id, !user.is_active, institutionId);
      if (res.error) { setGlobalError(res.error); return; }
      setUser((u) => ({ ...u, is_active: !u.is_active }));
    });
  };

  // ── Resetear contraseña ───────────────────────────────────────────────────
  const handleReset = () => {
    startTransition(async () => {
      const res = await resetearPassword(user.id, user.full_name);
      if (res.error) { setGlobalError(res.error); return; }
      setNewPassword(res.password!);
    });
  };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-brand/8 flex items-center justify-center text-2xl shrink-0">
          {ROLE_ICON[user.role]}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{user.full_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLOR[user.role]}`}>
              {ROLE_LABEL[user.role]}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
              ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
              {user.is_active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Error global */}
      {globalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex justify-between">
          {globalError}
          <button onClick={clearError} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Datos de la cuenta */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Datos de la cuenta</h2>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Email</p>
          <p className="text-sm font-mono text-gray-700 mt-1">{user.email}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Nombre completo</p>
          {editingName ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="input flex-1 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
              <button onClick={handleSaveName} disabled={isPending}
                className="px-3 py-2 bg-brand text-white text-xs font-semibold rounded-lg
                           hover:bg-brand-medium transition-colors disabled:opacity-50">
                Guardar
              </button>
              <button onClick={() => { setEditingName(false); setNameValue(user.full_name); }}
                className="px-3 py-2 text-gray-500 text-xs font-semibold rounded-lg
                           hover:bg-gray-100 transition-colors">
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <p className="text-sm text-gray-700">{user.full_name}</p>
              <button onClick={() => setEditingName(true)}
                className="text-xs font-semibold text-brand hover:text-brand-medium transition-colors">
                Editar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contraseña */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-gray-900">Contraseña</h2>
        {newPassword ? (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-xs text-green-600 font-medium mb-1">Nueva contraseña generada — anótala antes de cerrar:</p>
            <p className="font-mono text-green-800 font-bold text-lg tracking-wider">{newPassword}</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Genera una nueva contraseña automáticamente.</p>
            <button onClick={handleReset} disabled={isPending}
              className="text-sm font-semibold text-amber-600 hover:text-amber-800 transition-colors disabled:opacity-50">
              Resetear contraseña
            </button>
          </div>
        )}
      </div>

      {/* Estado */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Estado</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {user.is_active ? 'Puede iniciar sesión.' : 'No puede iniciar sesión.'}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50
              ${user.is_active
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
          >
            {user.is_active ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>

      {/* Asignaciones — solo profesores */}
      {user.role === 'teacher' && (
        <AsignacionesSection
          teacherId={user.id}
          institutionId={institutionId}
          assignments={assignments}
          setAssignments={setAssignments}
          courses={courses}
          sections={sections}
          setError={setGlobalError}
        />
      )}

      {/* Alumno vinculado — solo familias */}
      {user.role === 'parent' && user.student && (
        <AlumnoSection
          student={user.student}
          userId={user.id}
          institutionId={institutionId}
          sections={sections}
          setError={setGlobalError}
          onSectionChanged={() => router.refresh()}
        />
      )}
    </div>
  );
}

// ─── Sección asignaciones ──────────────────────────────────────────────────────

function AsignacionesSection({
  teacherId, institutionId, assignments, setAssignments, courses, sections, setError,
}: {
  teacherId:      string;
  institutionId:  string;
  assignments:    Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  courses:        Course[];
  sections:       Section[];
  setError:       (e: string) => void;
}) {
  const router = useRouter();
  const [courseId, setCourseId]   = useState('');
  const [sectionId, setSectionId] = useState('');
  const [isPending, start]        = useTransition();

  const handleAdd = () => {
    if (!courseId || !sectionId) return;
    start(async () => {
      const res = await agregarAsignacion(teacherId, courseId, sectionId, institutionId);
      if (res.error) { setError(res.error); return; }
      setCourseId('');
      setSectionId('');
      router.refresh();
    });
  };

  const handleDelete = (assignmentId: string) => {
    start(async () => {
      const res = await eliminarAsignacion(assignmentId, teacherId, institutionId);
      if (res.error) { setError(res.error); return; }
      setAssignments((a) => a.filter((x) => x.id !== assignmentId));
    });
  };

  const sorted = [...sections].sort((a, b) =>
    a.gradeOrderNum - b.gradeOrderNum || a.name.localeCompare(b.name),
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">Asignaciones</h2>

      {assignments.length === 0 ? (
        <p className="text-sm text-gray-400">Sin asignaciones aún.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-900">{a.courses.name}</p>
                <p className="text-xs text-gray-400">
                  {a.sections.grades.name} — Sección {a.sections.name} · {a.academic_year}
                </p>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                disabled={isPending}
                className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Agregar asignación</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Curso</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="input text-sm">
              <option value="">Seleccionar...</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sección</label>
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="input text-sm">
              <option value="">Seleccionar...</option>
              {sorted.map((s) => (
                <option key={s.id} value={s.id}>{s.gradeName} — {s.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={isPending || !courseId || !sectionId}
          className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-xl
                     hover:bg-brand-medium transition-colors disabled:opacity-50"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}

// ─── Sección alumno vinculado ──────────────────────────────────────────────────

function AlumnoSection({
  student, userId, institutionId, sections, setError, onSectionChanged,
}: {
  student:           Student;
  userId:            string;
  institutionId:     string;
  sections:          Section[];
  setError:          (e: string) => void;
  onSectionChanged:  () => void;
}) {
  const [sectionId, setSectionId] = useState('');
  const [isPending, start]        = useTransition();

  const handleChange = () => {
    if (!sectionId) return;
    start(async () => {
      const res = await cambiarSeccion(student.id, sectionId, userId, institutionId);
      if (res.error) { setError(res.error); return; }
      setSectionId('');
      onSectionChanged();
    });
  };

  const sorted = [...sections].sort((a, b) =>
    a.gradeOrderNum - b.gradeOrderNum || a.name.localeCompare(b.name),
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
      <h2 className="font-semibold text-gray-900">Alumno vinculado</h2>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-400">Nombre</p>
          <p className="font-medium text-gray-900 mt-0.5">{student.full_name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Código</p>
          <p className="font-medium font-mono text-gray-900 mt-0.5">{student.student_code}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Sección actual</p>
          <p className="font-medium text-gray-900 mt-0.5">
            {student.sections.grades.name} — {student.sections.name}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cambiar sección</p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="input text-sm">
              <option value="">Seleccionar nueva sección...</option>
              {sorted.map((s) => (
                <option key={s.id} value={s.id}>{s.gradeName} — {s.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleChange}
            disabled={isPending || !sectionId}
            className="px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl
                       hover:bg-brand-medium transition-colors disabled:opacity-50"
          >
            Cambiar
          </button>
        </div>
      </div>
    </div>
  );
}
