'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export type CourseOption = {
  tsId: string;
  courseName: string;
};

export type GradeRow = {
  studentId: string;
  studentName: string;
  periods: {
    periodId: string;
    periodName: string;
    orderNum: number;
    finalGrade: number | null;
  }[];
  overallAvg: number | null;
};

export type CategoryCol = {
  catId: string;
  catName: string;
  catWeight: number;
};

export async function getCoursesBySection(sectionId: string): Promise<CourseOption[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('teacher_sections')
    .select('id, courses(name)')
    .eq('section_id', sectionId);
  if (error) return [];
  return (data ?? []).map((ts: any) => ({
    tsId: ts.id,
    courseName: ts.courses?.name ?? '—',
  }));
}

export async function getGradeTable(
  tsId: string,
  institutionId: string,
  upToPeriodId: string,
): Promise<{ rows: GradeRow[]; categories: CategoryCol[] }> {
  const supabase = createAdminClient();

  // Current academic year for the institution
  const { data: inst } = await supabase
    .from('institutions')
    .select('current_academic_year')
    .eq('id', institutionId)
    .single();

  // All periods for this institution (current year only)
  const { data: allPeriods } = await supabase
    .from('academic_periods')
    .select('id, name, order_num')
    .eq('institution_id', institutionId)
    .eq('academic_year', inst?.current_academic_year ?? '')
    .order('order_num');

  const periods = allPeriods ?? [];
  const upToOrder = periods.find((p: any) => p.id === upToPeriodId)?.order_num ?? 0;
  const selectedPeriods = periods.filter((p: any) => p.order_num <= upToOrder);

  // Students in this section
  const { data: tsData } = await supabase
    .from('teacher_sections')
    .select('section:sections(students(id, full_name))')
    .eq('id', tsId)
    .single();

  const students: { id: string; full_name: string }[] =
    ((tsData as any)?.section?.students ?? []).sort((a: any, b: any) =>
      a.full_name.localeCompare(b.full_name),
    );

  if (students.length === 0) return { rows: [], categories: [] };

  // Categories for the selected (last) period — used as column headers
  const { data: cats } = await supabase
    .from('grade_categories')
    .select('id, name, weight, order_num')
    .eq('teacher_section_id', tsId)
    .eq('academic_period_id', upToPeriodId)
    .order('order_num');

  const categories: CategoryCol[] = (cats ?? []).map((c: any) => ({
    catId: c.id,
    catName: c.name,
    catWeight: c.weight,
  }));

  // For each selected period, calculate final grade per student
  const periodGradeMap = new Map<string, Map<string, number | null>>();
  // periodId → studentId → grade

  for (const period of selectedPeriods) {
    const { data: periodCats } = await supabase
      .from('grade_categories')
      .select('id, weight')
      .eq('teacher_section_id', tsId)
      .eq('academic_period_id', period.id);

    if (!periodCats || periodCats.length === 0) {
      periodGradeMap.set(period.id, new Map());
      continue;
    }

    const catIds = periodCats.map((c: any) => c.id);
    const { data: evals } = await supabase
      .from('grade_evaluations')
      .select('id, category_id')
      .in('category_id', catIds);

    const evalIds = (evals ?? []).map((e: any) => e.id);
    let scores: { evaluation_id: string; student_id: string; score: number | null }[] = [];
    if (evalIds.length > 0) {
      const { data: sc } = await supabase
        .from('evaluation_scores')
        .select('evaluation_id, student_id, score')
        .in('evaluation_id', evalIds);
      scores = sc ?? [];
    }

    const scoreMap = new Map<string, Map<string, number | null>>();
    scores.forEach((s) => {
      if (!scoreMap.has(s.evaluation_id)) scoreMap.set(s.evaluation_id, new Map());
      scoreMap.get(s.evaluation_id)!.set(s.student_id, s.score);
    });

    // Manual bimestral overrides for this period
    const { data: manuals } = await supabase
      .from('student_bimestral_grades')
      .select('student_id, manual_grade')
      .eq('teacher_section_id', tsId)
      .eq('academic_period_id', period.id);
    const manualMap = new Map((manuals ?? []).map((m: any) => [m.student_id, m.manual_grade as number | null]));

    const studentGrades = new Map<string, number | null>();
    for (const st of students) {
      const manual = manualMap.get(st.id);
      if (manual != null) {
        studentGrades.set(st.id, manual);
        continue;
      }
      const catResults = periodCats.map((cat: any) => {
        const catEvals = (evals ?? []).filter((e: any) => e.category_id === cat.id);
        if (catEvals.length === 0) return { weight: cat.weight, avg: 0 };
        const sum = catEvals.reduce(
          (s: number, e: any) => s + ((scoreMap.get(e.id)?.get(st.id) ?? null) ?? 0),
          0,
        );
        return { weight: cat.weight, avg: sum / catEvals.length };
      });
      const hasAnyScore = scores.some((s) => s.student_id === st.id);
      const grade = hasAnyScore
        ? catResults.reduce((s, c) => s + c.avg * (c.weight / 100), 0)
        : null;
      studentGrades.set(st.id, grade);
    }
    periodGradeMap.set(period.id, studentGrades);
  }

  const rows: GradeRow[] = students.map((st) => {
    const periodRows = selectedPeriods.map((p: any) => ({
      periodId: p.id,
      periodName: p.name,
      orderNum: p.order_num,
      finalGrade: periodGradeMap.get(p.id)?.get(st.id) ?? null,
    }));

    const graded = periodRows.filter((r) => r.finalGrade !== null);
    const overallAvg =
      graded.length > 0
        ? graded.reduce((s, r) => s + r.finalGrade!, 0) / graded.length
        : null;

    return { studentId: st.id, studentName: st.full_name, periods: periodRows, overallAvg };
  });

  return { rows, categories };
}
