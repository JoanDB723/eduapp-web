'use server';

import { createAdminClient } from '@/lib/supabase/admin';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ParsedUser = {
  nombre_completo: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'support';
};

export type ParsedAlumno = {
  nombre_alumno: string;
  codigo: string;
  grado: number;
  seccion: string;
  email: string;
  password: string;
};

export type ParsedAsignacion = {
  nombre_profesor: string;
  nombre_curso: string;
  grado: number;
  seccion: string;
};

export type ImportPayload = {
  institutionId: string;
  cursos: { nombre: string }[];
  admin: ParsedUser[];
  profesores: ParsedUser[];
  apoyo: ParsedUser[];
  alumnos: ParsedAlumno[];
  asignaciones: ParsedAsignacion[];
};

export type Credential = {
  nombre:        string;
  role:          'admin' | 'teacher' | 'support' | 'parent';
  email:         string;
  password:      string;
  grade_section?: string;
};

export type ImportResult =
  | { ok: true;  credentials: Credential[] }
  | { ok: false; error: string };

// ─── Server Action ─────────────────────────────────────────────────────────────

export async function importarExcel(payload: ImportPayload): Promise<ImportResult> {
  const supabase = createAdminClient();
  const credentials: Credential[] = [];

  try {
    // ── 1. Pre-validar secciones contra la BD ─────────────────────────────────
    const { data: sectionsRaw, error: secErr } = await supabase
      .from('sections')
      .select('id, name, grades!inner(order_num)')
      .eq('institution_id', payload.institutionId);

    if (secErr) throw new Error(`Error al cargar secciones: ${secErr.message}`);

    const sectionMap = new Map<string, string>(); // `${grado}-${seccion}` → section_id
    (sectionsRaw ?? []).forEach((s: any) => {
      sectionMap.set(`${s.grades.order_num}-${s.name}`, s.id);
    });

    for (const a of payload.alumnos) {
      if (!sectionMap.has(`${a.grado}-${a.seccion}`))
        throw new Error(`Sección ${a.seccion} de ${a.grado}ro grado no existe en esta institución`);
    }
    for (const a of payload.asignaciones) {
      if (!sectionMap.has(`${a.grado}-${a.seccion}`))
        throw new Error(`Sección ${a.seccion} de ${a.grado}ro grado no existe en esta institución`);
    }

    // ── 2. Pre-validar códigos de alumnos duplicados en BD ────────────────────
    const codes = payload.alumnos.map((a) => a.codigo);
    if (codes.length > 0) {
      const { data: existing } = await supabase
        .from('students')
        .select('student_code')
        .eq('institution_id', payload.institutionId)
        .in('student_code', codes);

      if (existing && existing.length > 0) {
        const dupes = existing.map((s: any) => s.student_code).join(', ');
        throw new Error(`Códigos ya registrados en esta institución: ${dupes}`);
      }
    }

    // ── 3. Insertar cursos ────────────────────────────────────────────────────
    if (payload.cursos.length > 0) {
      const { error } = await supabase.from('courses').upsert(
        payload.cursos.map((c) => ({ institution_id: payload.institutionId, name: c.nombre })),
        { onConflict: 'institution_id,name', ignoreDuplicates: true },
      );
      if (error) throw new Error(`Cursos: ${error.message}`);
    }

    // Pre-cargar cursos para lookup
    const { data: coursesRaw } = await supabase
      .from('courses')
      .select('id, name')
      .eq('institution_id', payload.institutionId);

    const courseMap = new Map<string, string>(); // nombre → id
    (coursesRaw ?? []).forEach((c: any) => courseMap.set(c.name, c.id));

    // ── 4. Crear usuarios (admin, profesores, apoyo) ──────────────────────────
    const allUsers = [
      ...payload.admin.map((u) => ({ ...u, role: 'admin' as const })),
      ...payload.profesores.map((u) => ({ ...u, role: 'teacher' as const })),
      ...payload.apoyo.map((u) => ({ ...u, role: 'support' as const })),
    ];

    const emailToUserId = new Map<string, string>();

    for (const user of allUsers) {
      const { data: auth, error: authErr } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });
      if (authErr) throw new Error(`Usuario ${user.email}: ${authErr.message}`);

      const { error: profileErr } = await supabase.from('users').insert({
        id: auth.user.id,
        institution_id: payload.institutionId,
        full_name: user.nombre_completo,
        role: user.role,
      });
      if (profileErr) throw new Error(`Perfil ${user.email}: ${profileErr.message}`);

      emailToUserId.set(user.email, auth.user.id);
      credentials.push({ nombre: user.nombre_completo, role: user.role, email: user.email, password: user.password });
    }

    // ── 5. Crear alumnos + cuentas familiares ─────────────────────────────────
    for (const alumno of payload.alumnos) {
      const sectionId = sectionMap.get(`${alumno.grado}-${alumno.seccion}`)!;

      const { data: auth, error: authErr } = await supabase.auth.admin.createUser({
        email: alumno.email,
        password: alumno.password,
        email_confirm: true,
      });
      if (authErr) throw new Error(`Familia ${alumno.email}: ${authErr.message}`);

      const parentId = auth.user.id;

      const { error: profileErr } = await supabase.from('users').insert({
        id: parentId,
        institution_id: payload.institutionId,
        full_name: alumno.nombre_alumno,
        role: 'parent',
      });
      if (profileErr) throw new Error(`Perfil familiar ${alumno.email}: ${profileErr.message}`);

      const { data: student, error: studentErr } = await supabase
        .from('students')
        .insert({
          institution_id: payload.institutionId,
          full_name: alumno.nombre_alumno,
          section_id: sectionId,
          student_code: alumno.codigo,
        })
        .select('id')
        .single();
      if (studentErr) throw new Error(`Alumno ${alumno.nombre_alumno}: ${studentErr.message}`);

      const { error: linkErr } = await supabase.from('student_parents').insert({
        student_id: student.id,
        parent_user_id: parentId,
        relationship: 'apoderado',
      });
      if (linkErr) throw new Error(`Vínculo ${alumno.nombre_alumno}: ${linkErr.message}`);

      const gradeSection = `${alumno.grado}ro ${alumno.seccion}`;
      credentials.push({ nombre: alumno.nombre_alumno, role: 'parent', email: alumno.email, password: alumno.password, grade_section: gradeSection });
    }

    // ── 6. Crear asignaciones profesor → curso → sección ─────────────────────
    const profesorNameToEmail = new Map<string, string>();
    payload.profesores.forEach((p) => profesorNameToEmail.set(p.nombre_completo, p.email));

    const academicYear = new Date().getFullYear().toString();

    for (const asig of payload.asignaciones) {
      const email    = profesorNameToEmail.get(asig.nombre_profesor);
      const profId   = email ? emailToUserId.get(email) : undefined;
      const courseId = courseMap.get(asig.nombre_curso);
      const secId    = sectionMap.get(`${asig.grado}-${asig.seccion}`);

      if (!profId)   throw new Error(`Profesor "${asig.nombre_profesor}" no encontrado`);
      if (!courseId) throw new Error(`Curso "${asig.nombre_curso}" no encontrado`);
      if (!secId)    throw new Error(`Sección ${asig.seccion} de ${asig.grado}ro no encontrada`);

      const { error } = await supabase.from('teacher_sections').upsert(
        {
          institution_id: payload.institutionId,
          teacher_id:     profId,
          course_id:      courseId,
          section_id:     secId,
          academic_year:  academicYear,
        },
        { onConflict: 'teacher_id,course_id,section_id,academic_year', ignoreDuplicates: true },
      );
      if (error) throw new Error(`Asignación ${asig.nombre_profesor} → ${asig.nombre_curso}: ${error.message}`);
    }

    // ── 7. Guardar credenciales en el log ─────────────────────────────────────
    await supabase.from('import_credentials_log').insert(
      credentials.map((c) => ({
        institution_id: payload.institutionId,
        full_name:      c.nombre,
        role:           c.role,
        email:          c.email,
        password:       c.password,
        grade_section:  c.grade_section ?? null,
      })),
    );

    return { ok: true, credentials };

  } catch (e: any) {
    return { ok: false, error: e.message ?? 'Error desconocido' };
  }
}
