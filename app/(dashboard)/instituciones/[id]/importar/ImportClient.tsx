'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { generateCredentials } from '@/lib/credentials';
import { importarExcel, type ImportPayload, type Credential } from './actions';

// ─── Exportar credenciales a Excel ────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  admin:   'Admin',
  teacher: 'Profesor',
  support: 'Apoyo',
  parent:  'Familia',
};

function downloadCredentialsExcel(credentials: Credential[]) {
  const rows = credentials.map((c) => ({
    'Nombre completo': c.nombre,
    'Rol':             ROLE_LABELS[c.role] ?? c.role,
    'Email':           c.email,
    'Contraseña':      c.password,
    'Grado / Sección': c.grade_section ?? '—',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 34 }, { wch: 16 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Credenciales');
  XLSX.writeFile(wb, 'credenciales_eduapp.xlsx');
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type UserRow = { nombre_completo: string; email: string; password: string };
type AlumnoRow = { nombre_alumno: string; codigo: string; grado: number; seccion: string; email: string; password: string };
type AsignacionRow = { nombre_profesor: string; nombre_curso: string; grado: number; seccion: string };

type PreviewData = {
  cursos: string[];
  admin: UserRow[];
  profesores: UserRow[];
  apoyo: UserRow[];
  alumnos: AlumnoRow[];
  asignaciones: AsignacionRow[];
  errors: string[];
};

type State =
  | { status: 'idle' }
  | { status: 'preview'; data: PreviewData }
  | { status: 'importing' }
  | { status: 'success'; credentials: Credential[] };

// ─── Helpers de parseo ─────────────────────────────────────────────────────────

function parseUserSheet(ws: XLSX.WorkSheet, sheetName: string): { rows: UserRow[]; errors: string[] } {
  const rows: UserRow[] = [];
  const errors: string[] = [];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

  data.forEach((row, i) => {
    const line = i + 2;
    const nombre = row['nombre_completo']?.toString().trim();
    if (!nombre) { errors.push(`Hoja "${sheetName}" fila ${line}: falta nombre_completo`); return; }
    try {
      rows.push({ nombre_completo: nombre, ...generateCredentials(nombre) });
    } catch (e: any) {
      errors.push(`Hoja "${sheetName}" fila ${line}: ${e.message}`);
    }
  });

  return { rows, errors };
}

function parseAlumnosSheet(ws: XLSX.WorkSheet): { rows: AlumnoRow[]; errors: string[] } {
  const rows: AlumnoRow[] = [];
  const errors: string[] = [];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

  data.forEach((row, i) => {
    const line = i + 2;
    const nombre  = row['nombre_alumno']?.toString().trim();
    const codigo  = row['codigo']?.toString().trim();
    const grado   = parseInt(row['grado']?.toString() ?? '');
    const seccion = row['seccion']?.toString().trim().toUpperCase();

    if (!nombre)                          { errors.push(`Hoja "alumnos" fila ${line}: falta nombre_alumno`); return; }
    if (!codigo)                          { errors.push(`Hoja "alumnos" fila ${line}: falta codigo`);        return; }
    if (isNaN(grado) || grado < 1 || grado > 5) { errors.push(`Hoja "alumnos" fila ${line}: grado debe ser 1-5`); return; }
    if (!seccion)                         { errors.push(`Hoja "alumnos" fila ${line}: falta seccion`);       return; }

    try {
      rows.push({ nombre_alumno: nombre, codigo, grado, seccion, ...generateCredentials(nombre) });
    } catch (e: any) {
      errors.push(`Hoja "alumnos" fila ${line}: ${e.message}`);
    }
  });

  return { rows, errors };
}

function parseAsignacionesSheet(ws: XLSX.WorkSheet): { rows: AsignacionRow[]; errors: string[] } {
  const rows: AsignacionRow[] = [];
  const errors: string[] = [];
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

  data.forEach((row, i) => {
    const line          = i + 2;
    const nombre_profesor = row['nombre_profesor']?.toString().trim();
    const nombre_curso    = row['nombre_curso']?.toString().trim();
    const grado           = parseInt(row['grado']?.toString() ?? '');
    const seccion         = row['seccion']?.toString().trim().toUpperCase();

    if (!nombre_profesor)                 { errors.push(`Hoja "asignaciones" fila ${line}: falta nombre_profesor`); return; }
    if (!nombre_curso)                    { errors.push(`Hoja "asignaciones" fila ${line}: falta nombre_curso`);    return; }
    if (isNaN(grado) || grado < 1 || grado > 5) { errors.push(`Hoja "asignaciones" fila ${line}: grado debe ser 1-5`); return; }
    if (!seccion)                         { errors.push(`Hoja "asignaciones" fila ${line}: falta seccion`);         return; }

    rows.push({ nombre_profesor, nombre_curso, grado, seccion });
  });

  return { rows, errors };
}

function parseWorkbook(wb: XLSX.WorkBook): PreviewData {
  const errors: string[] = [];

  // Verificar hojas requeridas
  const required = ['cursos', 'admin', 'profesores', 'apoyo', 'alumnos', 'asignaciones'];
  for (const s of required) {
    if (!wb.Sheets[s]) errors.push(`Hoja "${s}" no encontrada en el archivo`);
  }
  if (errors.length > 0) {
    return { cursos: [], admin: [], profesores: [], apoyo: [], alumnos: [], asignaciones: [], errors };
  }

  // Cursos
  const cursosData = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['cursos']);
  const cursos: string[] = [];
  cursosData.forEach((row, i) => {
    const nombre = row['nombre']?.toString().trim();
    if (!nombre) { errors.push(`Hoja "cursos" fila ${i + 2}: falta nombre`); return; }
    cursos.push(nombre);
  });

  const { rows: adminRows,       errors: adminErr }    = parseUserSheet(wb.Sheets['admin'],      'admin');
  const { rows: profesoresRows,  errors: profErr }     = parseUserSheet(wb.Sheets['profesores'], 'profesores');
  const { rows: apoyoRows,       errors: apoyoErr }    = parseUserSheet(wb.Sheets['apoyo'],      'apoyo');
  const { rows: alumnosRows,     errors: alumnosErr }  = parseAlumnosSheet(wb.Sheets['alumnos']);
  const { rows: asignRows,       errors: asignErr }    = parseAsignacionesSheet(wb.Sheets['asignaciones']);

  errors.push(...adminErr, ...profErr, ...apoyoErr, ...alumnosErr, ...asignErr);

  // Validaciones cruzadas
  const profNames  = new Set(profesoresRows.map((p) => p.nombre_completo));
  const courseSet  = new Set(cursos);

  asignRows.forEach((a, i) => {
    if (!profNames.has(a.nombre_profesor))
      errors.push(`Asignaciones fila ${i + 2}: "${a.nombre_profesor}" no está en la hoja "profesores"`);
    if (!courseSet.has(a.nombre_curso))
      errors.push(`Asignaciones fila ${i + 2}: "${a.nombre_curso}" no está en la hoja "cursos"`);
  });

  // Emails duplicados
  const allEmails = [
    ...adminRows.map((u) => u.email),
    ...profesoresRows.map((u) => u.email),
    ...apoyoRows.map((u) => u.email),
    ...alumnosRows.map((u) => u.email),
  ];
  const seen = new Set<string>();
  allEmails.forEach((email) => {
    if (seen.has(email))
      errors.push(`Email duplicado generado: "${email}" — revisa si hay nombres similares`);
    seen.add(email);
  });

  // Códigos duplicados
  const seenCodes = new Set<string>();
  alumnosRows.forEach((a) => {
    if (seenCodes.has(a.codigo))
      errors.push(`Código duplicado en alumnos: "${a.codigo}"`);
    seenCodes.add(a.codigo);
  });

  return { cursos, admin: adminRows, profesores: profesoresRows, apoyo: apoyoRows, alumnos: alumnosRows, asignaciones: asignRows, errors };
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function ImportClient({ institutionId }: { institutionId: string }) {
  const [state, setState] = useState<State>({ status: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result;
      if (!buffer) return;
      const wb   = XLSX.read(buffer, { type: 'array' });
      const data = parseWorkbook(wb);
      setState({ status: 'preview', data });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirm = async () => {
    if (state.status !== 'preview' || state.data.errors.length > 0) return;
    setState({ status: 'importing' });

    const { data } = state;
    const payload: ImportPayload = {
      institutionId,
      cursos:       data.cursos.map((nombre) => ({ nombre })),
      admin:        data.admin.map((u) => ({ ...u, role: 'admin' as const })),
      profesores:   data.profesores.map((u) => ({ ...u, role: 'teacher' as const })),
      apoyo:        data.apoyo.map((u) => ({ ...u, role: 'support' as const })),
      alumnos:      data.alumnos,
      asignaciones: data.asignaciones,
    };

    const result = await importarExcel(payload);

    if (result.ok) {
      setState({ status: 'success', credentials: result.credentials });
    } else {
      setState({ status: 'preview', data: { ...data, errors: [result.error] } });
    }
  };

  // ── IDLE ────────────────────────────────────────────────────────────────────
  if (state.status === 'idle') {
    return (
      <div className="space-y-4">
        {/* Descarga plantilla */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Paso 1 — Descarga la plantilla</p>
            <p className="text-xs text-gray-400 mt-0.5">Llena las 6 hojas con los datos del colegio. No cambies los nombres de columnas.</p>
          </div>
          <a href="/api/plantilla" download="plantilla_eduapp.xlsx"
            className="shrink-0 bg-brand text-white px-4 py-2 rounded-xl text-sm font-semibold
                       hover:bg-brand-medium transition-colors">
            ⬇ Descargar
          </a>
        </div>

        {/* Upload */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center
                     cursor-pointer hover:border-brand/40 hover:bg-brand/2 transition-all"
        >
          <div className="text-4xl mb-3">📂</div>
          <p className="font-semibold text-gray-700 mb-1">Paso 2 — Sube el Excel completado</p>
          <p className="text-sm text-gray-400">Arrastra el archivo aquí o haz click para seleccionarlo</p>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      </div>
    );
  }

  // ── IMPORTING ───────────────────────────────────────────────────────────────
  if (state.status === 'importing') {
    return (
      <div className="text-center py-24">
        <div className="text-4xl mb-4 animate-pulse">⚙️</div>
        <p className="font-semibold text-gray-700">Importando datos...</p>
        <p className="text-sm text-gray-400 mt-1">Creando cuentas y asignaciones. No cierres esta página.</p>
      </div>
    );
  }

  // ── SUCCESS ─────────────────────────────────────────────────────────────────
  if (state.status === 'success') {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-semibold text-green-800">Importación completada</p>
            <p className="text-sm text-green-600 mt-0.5">
              {state.credentials.length} cuentas creadas y guardadas en el historial.
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <p className="font-semibold text-gray-900">Credenciales generadas</p>
            <button
              onClick={() => downloadCredentialsExcel(state.credentials)}
              className="shrink-0 bg-brand text-white px-4 py-2 rounded-xl text-sm font-semibold
                         hover:bg-brand-medium transition-colors"
            >
              ⬇ Descargar Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Nombre</th>
                  <th className="px-5 py-3 text-left">Rol</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Contraseña</th>
                  <th className="px-5 py-3 text-left">Sección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.credentials.map((c, i) => (
                  <tr key={i}>
                    <td className="px-5 py-3 text-gray-900">{c.nombre}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{ROLE_LABELS[c.role] ?? c.role}</td>
                    <td className="px-5 py-3 text-gray-600 font-mono text-xs">{c.email}</td>
                    <td className="px-5 py-3 text-gray-600 font-mono text-xs">{c.password}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{c.grade_section ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={() => setState({ status: 'idle' })}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Importar otro Excel
        </button>
      </div>
    );
  }

  // ── PREVIEW ─────────────────────────────────────────────────────────────────
  const { data } = state;
  const hasErrors = data.errors.length > 0;
  const allUsers  = [...data.admin, ...data.profesores, ...data.apoyo];

  return (
    <div className="space-y-5">

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          { label: 'Cursos',       value: data.cursos.length,       icon: '📚' },
          { label: 'Admin',        value: data.admin.length,        icon: '🏛️' },
          { label: 'Profesores',   value: data.profesores.length,   icon: '👨‍🏫' },
          { label: 'Apoyo',        value: data.apoyo.length,        icon: '🩺' },
          { label: 'Alumnos',      value: data.alumnos.length,      icon: '🎒' },
          { label: 'Asignaciones', value: data.asignaciones.length, icon: '🔗' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-lg">{s.icon}</p>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Errores */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="font-semibold text-red-800 mb-3">
            {data.errors.length} error{data.errors.length !== 1 ? 'es' : ''} encontrado{data.errors.length !== 1 ? 's' : ''}
          </p>
          <ul className="space-y-1">
            {data.errors.map((err, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">✗</span>
                {err}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setState({ status: 'idle' })}
            className="mt-4 text-sm font-semibold text-red-700 hover:text-red-900 transition-colors"
          >
            ← Volver a subir
          </button>
        </div>
      )}

      {/* Credenciales a generar (solo si no hay errores) */}
      {!hasErrors && (
        <>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">Credenciales que se generarán</p>
                <p className="text-xs text-gray-400 mt-0.5">Revisa que los emails y contraseñas sean correctos antes de confirmar.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Nombre</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Contraseña</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allUsers.map((u, i) => (
                    <tr key={i}>
                      <td className="px-5 py-3 text-gray-900">{u.nombre_completo}</td>
                      <td className="px-5 py-3 text-gray-600 font-mono text-xs">{u.email}</td>
                      <td className="px-5 py-3 text-gray-600 font-mono text-xs">{u.password}</td>
                    </tr>
                  ))}
                  {data.alumnos.map((a, i) => (
                    <tr key={`a-${i}`} className="bg-blue-50/30">
                      <td className="px-5 py-3 text-gray-900">{a.nombre_alumno} <span className="text-xs text-gray-400">(familia)</span></td>
                      <td className="px-5 py-3 text-gray-600 font-mono text-xs">{a.email}</td>
                      <td className="px-5 py-3 text-gray-600 font-mono text-xs">{a.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 bg-brand text-white font-semibold py-3 rounded-xl text-sm
                         hover:bg-brand-medium transition-colors"
            >
              Confirmar e importar
            </button>
            <button
              onClick={() => setState({ status: 'idle' })}
              className="px-5 py-3 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
