import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';

type Institution = {
  id: string;
  name: string;
  created_at: string;
  teachers: number;
  students: number;
  parents: number;
};

async function getInstitutions(): Promise<Institution[]> {
  const supabase = createAdminClient();

  const { data: institutions, error } = await supabase
    .from('institutions')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });

  if (error || !institutions) return [];

  // Estadísticas por institución
  const results = await Promise.all(
    institutions.map(async (inst) => {
      const [{ count: teachers }, { count: students }, { count: parents }] = await Promise.all([
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('institution_id', inst.id)
          .eq('role', 'teacher'),
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('institution_id', inst.id)
          .eq('is_active', true),
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('institution_id', inst.id)
          .eq('role', 'parent'),
      ]);

      return {
        ...inst,
        teachers: teachers ?? 0,
        students: students ?? 0,
        parents: parents ?? 0,
      };
    }),
  );

  return results;
}

export default async function InstitutionsPage() {
  const institutions = await getInstitutions();

  const supabase = createAdminClient();
  const { count: pendingSupport } = await supabase
    .from('support_messages')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="p-8 max-w-5xl mx-auto">

      {/* Soporte banner */}
      {(pendingSupport ?? 0) > 0 && (
        <Link
          href="/soporte"
          className="flex items-center justify-between bg-amber-50 border border-amber-200
                     rounded-2xl px-5 py-3.5 mb-6 hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📩</span>
            <p className="text-sm font-semibold text-amber-800">
              {pendingSupport} mensaje{(pendingSupport ?? 0) !== 1 ? 's' : ''} de soporte pendiente{(pendingSupport ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>
          <span className="text-amber-500 text-lg">›</span>
        </Link>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instituciones</h1>
          <p className="text-gray-500 text-sm mt-1">
            {institutions.length === 0
              ? 'Aún no has implementado ningún colegio.'
              : `${institutions.length} colegio${institutions.length !== 1 ? 's' : ''} implementado${institutions.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/instituciones/nueva"
          className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl
                     text-sm font-semibold hover:bg-brand-medium transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Nueva institución
        </Link>
      </div>

      {/* Lista */}
      {institutions.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="text-5xl mb-4">🏫</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Sin instituciones aún</h2>
          <p className="text-gray-400 text-sm mb-6">
            Cuando implementes un colegio aparecerá aquí.
          </p>
          <Link
            href="/instituciones/nueva"
            className="inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5
                       rounded-xl text-sm font-semibold hover:bg-brand-medium transition-colors"
          >
            Implementar primer colegio
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {institutions.map((inst) => (
            <Link
              key={inst.id}
              href={`/instituciones/${inst.id}`}
              className="group flex items-center justify-between bg-white border border-gray-200
                         rounded-2xl p-5 hover:border-brand/40 hover:shadow-md transition-all"
            >
              {/* Icono + nombre */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-brand/8 border border-brand/15
                                flex items-center justify-center shrink-0">
                  <span className="text-xl">🏫</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 group-hover:text-brand transition-colors">
                    {inst.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Implementado el{' '}
                    {new Date(inst.created_at).toLocaleDateString('es-PE', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mr-2">
                <Stat label="Profesores" value={inst.teachers} icon="👨‍🏫" />
                <Stat label="Alumnos"    value={inst.students}  icon="🎒" />
                <Stat label="Padres"     value={inst.parents}   icon="👪" />
              </div>

              <span className="text-gray-300 group-hover:text-brand transition-colors text-lg">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="text-center min-w-[60px]">
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{icon} {label}</p>
    </div>
  );
}
