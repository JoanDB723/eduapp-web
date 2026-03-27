'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export type CreateInstitutionState = {
  error?: string;
  success?: boolean;
  institutionId?: string;
};

export async function createInstitution(
  _prev: CreateInstitutionState,
  formData: FormData,
): Promise<CreateInstitutionState> {
  const supabase = createAdminClient();

  const name         = formData.get('name') as string;
  const academicYear = formData.get('academic_year') as string;
  const numGrades    = parseInt(formData.get('num_grades') as string, 10);
  const sectionNames = (formData.get('sections') as string).split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  const numPeriods   = parseInt(formData.get('num_periods') as string, 10);

  if (!name?.trim()) return { error: 'El nombre de la institución es obligatorio.' };

  // ── 1. Crear institución ──────────────────────────────────────────────────
  const { data: institution, error: instError } = await supabase
    .from('institutions')
    .insert({ name: name.trim(), current_academic_year: academicYear })
    .select('id')
    .single();

  if (instError || !institution) {
    return { error: `Error al crear institución: ${instError?.message}` };
  }

  const institutionId = institution.id;

  // ── 2. Crear grados ───────────────────────────────────────────────────────
  const GRADE_NAMES = ['1ro', '2do', '3ro', '4to', '5to'];
  const gradesPayload = Array.from({ length: numGrades }, (_, i) => ({
    institution_id: institutionId,
    name: `${GRADE_NAMES[i] ?? `${i + 1}ro`} de Secundaria`,
    order_num: i + 1,
  }));

  const { data: grades, error: gradesError } = await supabase
    .from('grades')
    .insert(gradesPayload)
    .select('id');

  if (gradesError || !grades) {
    return { error: `Error al crear grados: ${gradesError?.message}` };
  }

  // ── 3. Crear secciones ────────────────────────────────────────────────────
  const sectionsPayload = grades.flatMap((grade) =>
    sectionNames.map((secName) => ({
      institution_id: institutionId,
      grade_id: grade.id,
      name: secName,
    })),
  );

  const { error: sectionsError } = await supabase
    .from('sections')
    .insert(sectionsPayload);

  if (sectionsError) {
    return { error: `Error al crear secciones: ${sectionsError.message}` };
  }

  // ── 4. Crear períodos académicos ──────────────────────────────────────────
  const PERIOD_CONFIGS: Record<number, { name: string; start: string; end: string }[]> = {
    4: [
      { name: 'Bimestre 1', start: `${academicYear}-03-10`, end: `${academicYear}-05-09` },
      { name: 'Bimestre 2', start: `${academicYear}-05-12`, end: `${academicYear}-07-18` },
      { name: 'Bimestre 3', start: `${academicYear}-08-04`, end: `${academicYear}-10-03` },
      { name: 'Bimestre 4', start: `${academicYear}-10-06`, end: `${academicYear}-12-19` },
    ],
    3: [
      { name: 'Trimestre 1', start: `${academicYear}-03-10`, end: `${academicYear}-05-30` },
      { name: 'Trimestre 2', start: `${academicYear}-06-02`, end: `${academicYear}-08-29` },
      { name: 'Trimestre 3', start: `${academicYear}-09-01`, end: `${academicYear}-12-19` },
    ],
  };

  const periods = PERIOD_CONFIGS[numPeriods] ?? PERIOD_CONFIGS[4];
  const periodsPayload = periods.map((p, i) => ({
    institution_id: institutionId,
    name: p.name,
    start_date: p.start,
    end_date: p.end,
    academic_year: academicYear,
    order_num: i + 1,
  }));

  const { error: periodsError } = await supabase
    .from('academic_periods')
    .insert(periodsPayload);

  if (periodsError) {
    return { error: `Error al crear períodos: ${periodsError.message}` };
  }

  redirect(`/instituciones/${institutionId}?nuevo=true`);
}
