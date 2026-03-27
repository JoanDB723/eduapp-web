import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import PersonaDetail from './PersonaDetail';

export default async function PersonaPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const { id: institutionId, userId } = await params;
  const supabase = createAdminClient();

  const [
    { data: user },
    { data: { user: authUser } },
    { data: courses },
    { data: sectionsRaw },
  ] = await Promise.all([
    supabase
      .from('users')
      .select(`
        id, full_name, role, is_active,
        student_parents(
          students(
            id, full_name, student_code,
            sections(id, name, grades(id, name, order_num))
          )
        )
      `)
      .eq('id', userId)
      .single(),
    supabase.auth.admin.getUserById(userId),
    supabase.from('courses').select('id, name').eq('institution_id', institutionId).order('name'),
    supabase
      .from('sections')
      .select('id, name, grades!inner(id, name, order_num)')
      .eq('institution_id', institutionId),
  ]);

  if (!user) notFound();

  // Asignaciones del profesor
  let assignments: any[] = [];
  if ((user as any).role === 'teacher') {
    const { data } = await supabase
      .from('teacher_sections')
      .select(`
        id, academic_year,
        courses(id, name),
        sections(id, name, grades(name, order_num))
      `)
      .eq('teacher_id', userId)
      .eq('institution_id', institutionId)
      .order('academic_year', { ascending: false });

    assignments = data ?? [];
  }

  const sections = (sectionsRaw ?? []).map((s: any) => ({
    id:             s.id,
    name:           s.name,
    gradeOrderNum:  s.grades.order_num,
    gradeName:      s.grades.name,
  }));

  const u = user as any;
  const student = u.student_parents?.[0]?.students ?? null;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link
        href={`/instituciones/${institutionId}/personas`}
        className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block"
      >
        ← Volver a personas
      </Link>
      <PersonaDetail
        user={{
          id:        u.id,
          full_name: u.full_name,
          role:      u.role,
          is_active: u.is_active,
          email:     authUser?.email ?? '',
          student:   student
            ? {
                id:           student.id,
                full_name:    student.full_name,
                student_code: student.student_code,
                sections: {
                  id:   student.sections?.id,
                  name: student.sections?.name,
                  grades: {
                    id:        student.sections?.grades?.id,
                    name:      student.sections?.grades?.name,
                    order_num: student.sections?.grades?.order_num,
                  },
                },
              }
            : null,
        }}
        assignments={assignments}
        courses={courses ?? []}
        sections={sections}
        institutionId={institutionId}
      />
    </div>
  );
}
