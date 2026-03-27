'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function eliminarInstitucion(institutionId: string) {
  const supabase = createAdminClient();

  try {
    // 1. Obtener todos los IDs de usuarios de esta institución
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('institution_id', institutionId);

    const userIds = (users ?? []).map((u: any) => u.id);

    // 2. Obtener teacher_sections de esta institución
    const { data: tSections } = await supabase
      .from('teacher_sections')
      .select('id')
      .eq('institution_id', institutionId);

    const tsIds = (tSections ?? []).map((ts: any) => ts.id);

    // 3. Obtener students de esta institución
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('institution_id', institutionId);

    const studentIds = (students ?? []).map((s: any) => s.id);

    // 4. Obtener wellbeing_cases de esta institución
    const { data: cases } = await supabase
      .from('wellbeing_cases')
      .select('id')
      .eq('institution_id', institutionId);

    const caseIds = (cases ?? []).map((c: any) => c.id);

    // 5. Eliminar wellbeing (appointments y messages en cascade)
    if (caseIds.length > 0) {
      await supabase.from('wellbeing_appointments').delete().in('case_id', caseIds);
      await supabase.from('wellbeing_messages').delete().in('case_id', caseIds);
    }
    await supabase.from('wellbeing_cases').delete().eq('institution_id', institutionId);

    // 6. Eliminar emprendimiento (ideas en cascade al eliminar challenges)
    await supabase.from('entrepreneurship_challenges').delete().eq('institution_id', institutionId);

    // 7. Eliminar registros de teacher_sections (reads en cascade)
    if (tsIds.length > 0) {
      await supabase.from('grade_records').delete().in('teacher_section_id', tsIds);
      await supabase.from('attendance_records').delete().in('teacher_section_id', tsIds);
      await supabase.from('reinforcements').delete().in('teacher_section_id', tsIds);
      await supabase.from('announcements').delete().in('teacher_section_id', tsIds);
      await supabase.from('tasks').delete().in('teacher_section_id', tsIds);
    }

    // 8. Eliminar reuniones (reads en cascade)
    await supabase.from('meetings').delete().eq('institution_id', institutionId);

    // 9. Eliminar teacher_sections (schedules en cascade)
    await supabase.from('teacher_sections').delete().eq('institution_id', institutionId);

    // 10. Eliminar períodos, eventos, notificaciones
    await supabase.from('academic_periods').delete().eq('institution_id', institutionId);
    await supabase.from('calendar_events').delete().eq('institution_id', institutionId);
    await supabase.from('notifications').delete().eq('institution_id', institutionId);

    // 11. Eliminar alumnos (student_parents en cascade)
    await supabase.from('students').delete().eq('institution_id', institutionId);

    // 12. Eliminar estructura
    await supabase.from('sections').delete().eq('institution_id', institutionId);
    await supabase.from('grades').delete().eq('institution_id', institutionId);
    await supabase.from('courses').delete().eq('institution_id', institutionId);

    // 13. Eliminar soporte y credenciales
    await supabase.from('support_messages').delete().eq('institution_id', institutionId);
    await supabase.from('import_credentials_log').delete().eq('institution_id', institutionId);

    // 14. Eliminar usuarios de auth (users y push_tokens en cascade)
    for (const userId of userIds) {
      await supabase.auth.admin.deleteUser(userId);
    }

    // 15. Eliminar la institución
    await supabase.from('institutions').delete().eq('id', institutionId);

  } catch (e: any) {
    return { error: e.message ?? 'Error desconocido al eliminar la institución' };
  }

  redirect('/');
}
