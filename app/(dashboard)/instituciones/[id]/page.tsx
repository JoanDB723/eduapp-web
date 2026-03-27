import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import EliminarInstitucion from './EliminarInstitucion';

async function getData(id: string) {
  const supabase = createAdminClient();

  const { data: institution } = await supabase
    .from('institutions')
    .select('id, name, created_at, current_academic_year')
    .eq('id', id)
    .single();

  if (!institution) return null;

  const [
    { data: grades },
    { count: teachers },
    { count: students },
    { count: parents },
    { data: periods },
  ] = await Promise.all([
    supabase
      .from('grades')
      .select('id, name, order_num, sections(id, name)')
      .eq('institution_id', id)
      .order('order_num'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('institution_id', id).eq('role', 'teacher'),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('institution_id', id).eq('is_active', true),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('institution_id', id).eq('role', 'parent'),
    supabase.from('academic_periods').select('id, name, start_date, end_date, order_num').eq('institution_id', id).order('order_num'),
  ]);

  return { institution, grades: grades ?? [], teachers: teachers ?? 0, students: students ?? 0, parents: parents ?? 0, periods: periods ?? [], currentYear: (institution as any).current_academic_year as string };
}

export default async function InstitucionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const data = await getData(id);

  if (!data) notFound();

  const { institution, grades, teachers, students, parents, periods, currentYear } = data;

  return (
    <div className="p-8 max-w-4xl mx-auto">

      {/* Banner de éxito */}
      {nuevo && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-xl px-5 py-4 flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="font-semibold text-sm">Institución creada correctamente</p>
            <p className="text-xs text-green-600 mt-0.5">
              Grados, secciones y períodos académicos configurados. Ahora puedes importar datos desde Excel.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-2 inline-block">
            ← Volver
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{institution.name}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Creada el {new Date(institution.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-sm mt-2">
            <span className="inline-flex items-center gap-1.5 bg-brand/8 text-brand border border-brand/15 rounded-lg px-2.5 py-1 text-xs font-semibold">
              📅 Año activo: {currentYear}
            </span>
          </p>
        </div>
        <Link
          href={`/instituciones/${id}/importar`}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl
                     text-sm font-semibold hover:bg-brand-medium transition-colors"
        >
          📥 Importar desde Excel
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon="👨‍🏫" label="Profesores" value={teachers} />
        <StatCard icon="🎒"   label="Alumnos"    value={students} />
        <StatCard icon="👪"   label="Padres"     value={parents}  />
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Grados y secciones */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Grados y secciones</h2>
          <div className="space-y-3">
            {grades.map((grade: any) => (
              <div key={grade.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{grade.name}</span>
                <div className="flex gap-1.5">
                  {grade.sections?.map((sec: any) => (
                    <span key={sec.id} className="px-2 py-0.5 bg-brand/8 text-brand text-xs font-semibold rounded-md border border-brand/15">
                      {sec.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Períodos */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Períodos académicos</h2>
          <div className="space-y-2">
            {periods.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{p.name}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(p.start_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                  {' — '}
                  {new Date(p.end_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href={`/instituciones/${id}/personas`}
          className="group bg-white border border-gray-200 rounded-2xl p-5
                     hover:border-brand/40 hover:shadow-md transition-all"
        >
          <p className="text-2xl mb-2">👥</p>
          <p className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
            Gestionar personas
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Editar usuarios, resetear contraseñas, cambiar secciones
          </p>
        </Link>
        <Link
          href={`/instituciones/${id}/importar`}
          className="group bg-white border border-gray-200 rounded-2xl p-5
                     hover:border-brand/40 hover:shadow-md transition-all"
        >
          <p className="text-2xl mb-2">📥</p>
          <p className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
            Importar desde Excel
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Carga masiva de alumnos, profesores y asignaciones
          </p>
        </Link>
        <Link
          href={`/instituciones/${id}/nuevo-anio`}
          className="group bg-white border border-gray-200 rounded-2xl p-5
                     hover:border-brand/40 hover:shadow-md transition-all"
        >
          <p className="text-2xl mb-2">📅</p>
          <p className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
            Nuevo año académico
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Crear bimestres y activar el año {Number(currentYear) + 1}
          </p>
        </Link>
        <Link
          href={`/instituciones/${id}/credenciales`}
          className="group bg-white border border-gray-200 rounded-2xl p-5
                     hover:border-brand/40 hover:shadow-md transition-all"
        >
          <p className="text-2xl mb-2">🔑</p>
          <p className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
            Historial de credenciales
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Re-descargar credenciales de importaciones anteriores
          </p>
        </Link>
      </div>

      {teachers === 0 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-semibold text-amber-800 text-sm mb-1">Próximo paso</h3>
          <p className="text-amber-700 text-sm">
            Esta institución aún no tiene usuarios cargados. Usa{' '}
            <strong>Importar desde Excel</strong> para cargar todo de una vez.
          </p>
        </div>
      )}

      {/* Zona peligrosa */}
      <div className="mt-8 border-t border-gray-100 pt-6 flex justify-end">
        <EliminarInstitucion institutionId={id} institutionName={institution.name} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-brand/8 flex items-center justify-center text-xl shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  );
}
