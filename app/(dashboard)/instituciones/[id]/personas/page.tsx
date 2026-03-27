import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import PersonasFilter from './PersonasFilter';
import { Suspense } from 'react';

const ROLE_LABELS: Record<string, string> = {
  admin:   'Admin',
  teacher: 'Profesor',
  support: 'Apoyo',
  parent:  'Familia',
};

const ROLE_COLORS: Record<string, string> = {
  admin:   'bg-purple-100 text-purple-700',
  teacher: 'bg-blue-100 text-blue-700',
  support: 'bg-green-100 text-green-700',
  parent:  'bg-orange-100 text-orange-700',
};

export default async function PersonasPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ rol?: string }>;
}) {
  const { id }  = await params;
  const { rol } = await searchParams;
  const supabase = createAdminClient();

  // Usuarios con info de alumno (para familias)
  let query = supabase
    .from('users')
    .select(`
      id, full_name, role, is_active,
      student_parents(
        students(
          full_name, student_code,
          sections(name, grades(name, order_num))
        )
      )
    `)
    .eq('institution_id', id)
    .order('full_name');

  if (rol && rol !== '') query = (query as any).eq('role', rol);

  const { data: users } = await query;

  // Emails desde Auth
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map(authUsers.map((u) => [u.id, u.email ?? '']));

  const activeFilter = rol ?? '';

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link href={`/instituciones/${id}`} className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
        ← Volver a la institución
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personas</h1>
          <p className="text-gray-500 text-sm mt-1">{users?.length ?? 0} persona{users?.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href={`/instituciones/${id}/personas/nuevo`}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl
                     text-sm font-semibold hover:bg-brand-medium transition-colors"
        >
          + Agregar persona
        </Link>
      </div>

      <div className="mb-5">
        <Suspense>
          <PersonasFilter active={activeFilter} />
        </Suspense>
      </div>

      {!users || users.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 text-sm">No hay personas con este filtro.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Nombre</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Rol</th>
                <th className="px-5 py-3 text-left">Sección / Alumno</th>
                <th className="px-5 py-3 text-left">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(users as any[]).map((u) => {
                const student = u.student_parents?.[0]?.students;
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{emailMap.get(u.id) ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {student
                        ? `${student.sections?.grades?.name} — ${student.sections?.name} · ${student.full_name}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                        ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/instituciones/${id}/personas/${u.id}`}
                        className="text-xs font-semibold text-brand hover:text-brand-medium transition-colors"
                      >
                        Editar →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
