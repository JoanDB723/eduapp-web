import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  const wb = XLSX.utils.book_new();

  // ── Hoja 1: Cursos ───────────────────────────────────────────────────────────
  const wsCursos = XLSX.utils.aoa_to_sheet([
    ['nombre'],
    ['Matemáticas'],
    ['Comunicación'],
    ['Historia'],
    ['Ciencias'],
    ['Inglés'],
  ]);
  wsCursos['!cols'] = [{ wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsCursos, 'cursos');

  // ── Hoja 2: Admin (directora) — solo 1 fila ──────────────────────────────────
  const wsAdmin = XLSX.utils.aoa_to_sheet([
    ['nombre_completo'],
    ['Rosa Mamani Torres'],
  ]);
  wsAdmin['!cols'] = [{ wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsAdmin, 'admin');

  // ── Hoja 3: Profesores ───────────────────────────────────────────────────────
  const wsProfesores = XLSX.utils.aoa_to_sheet([
    ['nombre_completo'],
    ['Juan Pérez García'],
    ['María López Torres'],
  ]);
  wsProfesores['!cols'] = [{ wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsProfesores, 'profesores');

  // ── Hoja 4: Apoyo ────────────────────────────────────────────────────────────
  const wsApoyo = XLSX.utils.aoa_to_sheet([
    ['nombre_completo'],
    ['Lucía Quispe Ramos'],
  ]);
  wsApoyo['!cols'] = [{ wch: 35 }];
  XLSX.utils.book_append_sheet(wb, wsApoyo, 'apoyo');

  // ── Hoja 5: Alumnos ──────────────────────────────────────────────────────────
  // Email y contraseña se generan automáticamente del nombre
  const wsAlumnos = XLSX.utils.aoa_to_sheet([
    ['nombre_alumno', 'codigo', 'grado', 'seccion'],
    ['Carlos Mendoza Ruiz',  '2025001', '1', 'A'],
    ['Lucía Fernández Díaz', '2025002', '1', 'B'],
    ['Andrés Torres Vega',   '2025003', '2', 'A'],
  ]);
  wsAlumnos['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 8 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsAlumnos, 'alumnos');

  // ── Hoja 6: Asignaciones ─────────────────────────────────────────────────────
  // nombre_profesor debe coincidir exactamente con la hoja "profesores"
  const wsAsignaciones = XLSX.utils.aoa_to_sheet([
    ['nombre_profesor', 'nombre_curso', 'grado', 'seccion'],
    ['Juan Pérez García',  'Matemáticas',  '1', 'A'],
    ['Juan Pérez García',  'Matemáticas',  '1', 'B'],
    ['María López Torres', 'Comunicación', '1', 'A'],
    ['María López Torres', 'Comunicación', '2', 'A'],
  ]);
  wsAsignaciones['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 8 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, wsAsignaciones, 'asignaciones');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="plantilla_eduapp.xlsx"',
    },
  });
}
