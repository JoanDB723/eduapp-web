'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function agregarAlumnoNuevo(data: {
  institutionId: string;
  sectionId: string;
  fullName: string;
  studentCode: string;
  email: string;
  password: string;
}) {
  const supabase = createAdminClient();

  // 1. Verificar que el código no esté en uso
  const { data: existing } = await supabase
    .from('students')
    .select('id')
    .eq('institution_id', data.institutionId)
    .eq('student_code', data.studentCode)
    .maybeSingle();

  if (existing) return { error: 'El código de alumno ya está registrado en esta institución.' };

  // 2. Crear cuenta en Auth
  const { data: auth, error: authErr } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });
  if (authErr) return { error: `Error al crear cuenta: ${authErr.message}` };

  const parentId = auth.user.id;

  // 3. Crear perfil en users
  const { error: profileErr } = await supabase.from('users').insert({
    id: parentId,
    institution_id: data.institutionId,
    full_name: data.fullName,
    role: 'parent',
  });
  if (profileErr) {
    await supabase.auth.admin.deleteUser(parentId);
    return { error: `Error al crear perfil: ${profileErr.message}` };
  }

  // 4. Crear registro de alumno
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .insert({
      institution_id: data.institutionId,
      full_name: data.fullName,
      section_id: data.sectionId,
      student_code: data.studentCode.toUpperCase(),
    })
    .select('id')
    .single();
  if (studentErr) {
    await supabase.auth.admin.deleteUser(parentId);
    return { error: `Error al crear alumno: ${studentErr.message}` };
  }

  // 5. Vincular alumno con apoderado
  const { error: linkErr } = await supabase.from('student_parents').insert({
    student_id: student.id,
    parent_user_id: parentId,
    relationship: 'apoderado',
  });
  if (linkErr) return { error: `Error al vincular: ${linkErr.message}` };

  revalidatePath(`/instituciones/${data.institutionId}`);
  return { ok: true, credentials: { email: data.email, password: data.password, name: data.fullName } };
}

export async function cambiarSeccionAlumno(data: {
  institutionId: string;
  studentId: string;
  newSectionId: string;
}) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('students')
    .update({ section_id: data.newSectionId })
    .eq('id', data.studentId)
    .eq('institution_id', data.institutionId);

  if (error) return { error: error.message };

  revalidatePath(`/instituciones/${data.institutionId}`);
  return { ok: true };
}

export async function getGradesWithSections(institutionId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('grades')
    .select('id, name, order_num, sections(id, name)')
    .eq('institution_id', institutionId)
    .order('order_num');
  if (error) return [];
  return data ?? [];
}

export async function searchStudents(institutionId: string, query: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('students')
    .select('id, full_name, student_code, sections(name, grades(name))')
    .eq('institution_id', institutionId)
    .or(`full_name.ilike.%${query}%,student_code.ilike.%${query}%`)
    .limit(10);
  if (error) return [];
  return data ?? [];
}
