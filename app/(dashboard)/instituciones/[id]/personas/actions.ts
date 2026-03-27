'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { generateCredentials } from '@/lib/credentials';
import { revalidatePath } from 'next/cache';

// ─── Editar nombre ─────────────────────────────────────────────────────────────

export async function editarNombre(userId: string, nombre: string, institutionId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('users')
    .update({ full_name: nombre.trim() })
    .eq('id', userId);

  if (error) return { error: error.message };
  revalidatePath(`/instituciones/${institutionId}/personas`);
  return { ok: true };
}

// ─── Toggle activo/inactivo ────────────────────────────────────────────────────

export async function toggleActivo(userId: string, isActive: boolean, institutionId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', userId);

  if (error) return { error: error.message };
  revalidatePath(`/instituciones/${institutionId}/personas`);
  return { ok: true };
}

// ─── Resetear contraseña ───────────────────────────────────────────────────────

export async function resetearPassword(userId: string, fullName: string) {
  const supabase = createAdminClient();
  const { password } = generateCredentials(fullName);

  const { error } = await supabase.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };

  return { ok: true, password };
}

// ─── Asignaciones (profesores) ─────────────────────────────────────────────────

export async function agregarAsignacion(
  teacherId: string,
  courseId: string,
  sectionId: string,
  institutionId: string,
) {
  const supabase = createAdminClient();
  const academicYear = new Date().getFullYear().toString();

  const { error } = await supabase.from('teacher_sections').insert({
    institution_id: institutionId,
    teacher_id:     teacherId,
    course_id:      courseId,
    section_id:     sectionId,
    academic_year:  academicYear,
  });

  if (error) return { error: error.message };
  revalidatePath(`/instituciones/${institutionId}/personas/${teacherId}`);
  return { ok: true };
}

export async function eliminarAsignacion(assignmentId: string, teacherId: string, institutionId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('teacher_sections').delete().eq('id', assignmentId);

  if (error) return { error: error.message };
  revalidatePath(`/instituciones/${institutionId}/personas/${teacherId}`);
  return { ok: true };
}

// ─── Cambiar sección del alumno ────────────────────────────────────────────────

export async function cambiarSeccion(studentId: string, sectionId: string, userId: string, institutionId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('students')
    .update({ section_id: sectionId })
    .eq('id', studentId);

  if (error) return { error: error.message };
  revalidatePath(`/instituciones/${institutionId}/personas/${userId}`);
  return { ok: true };
}

// ─── Crear persona nueva ───────────────────────────────────────────────────────

export async function crearPersona(data: {
  institutionId: string;
  nombre: string;
  role: 'admin' | 'teacher' | 'support' | 'parent';
  studentCodigo?: string;
  studentGrado?: number;
  studentSeccion?: string;
}) {
  const supabase = createAdminClient();

  const { email, password } = generateCredentials(data.nombre);

  const { data: auth, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (authError) return { error: authError.message };

  const { error: profileError } = await supabase.from('users').insert({
    id:             auth.user.id,
    institution_id: data.institutionId,
    full_name:      data.nombre,
    role:           data.role,
  });
  if (profileError) return { error: profileError.message };

  // Si es familia, crear también el alumno vinculado
  if (data.role === 'parent' && data.studentCodigo && data.studentGrado && data.studentSeccion) {
    const { data: sectionData } = await supabase
      .from('sections')
      .select('id, grades!inner(order_num)')
      .eq('institution_id', data.institutionId)
      .eq('name', data.studentSeccion.toUpperCase())
      .eq('grades.order_num', data.studentGrado)
      .single();

    if (!sectionData)
      return { error: `Sección ${data.studentSeccion} de ${data.studentGrado}ro grado no existe` };

    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        institution_id: data.institutionId,
        full_name:      data.nombre,
        section_id:     (sectionData as any).id,
        student_code:   data.studentCodigo,
      })
      .select('id')
      .single();

    if (studentError) return { error: studentError.message };

    const { error: linkError } = await supabase.from('student_parents').insert({
      student_id:     student.id,
      parent_user_id: auth.user.id,
      relationship:   'apoderado',
    });
    if (linkError) return { error: linkError.message };
  }

  revalidatePath(`/instituciones/${data.institutionId}/personas`);
  return { ok: true, email, password };
}
