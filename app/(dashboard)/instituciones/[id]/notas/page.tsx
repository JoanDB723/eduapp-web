import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import NotasClient from './NotasClient';

async function getData(institutionId: string) {
  const supabase = createAdminClient();

  const { data: institution } = await supabase
    .from('institutions')
    .select('id, name, current_academic_year')
    .eq('id', institutionId)
    .single();

  if (!institution) return null;

  const [{ data: grades }, { data: periods }] = await Promise.all([
    supabase
      .from('grades')
      .select('id, name, order_num, sections(id, name)')
      .eq('institution_id', institutionId)
      .order('order_num'),
    supabase
      .from('academic_periods')
      .select('id, name, order_num')
      .eq('institution_id', institutionId)
      .eq('academic_year', institution.current_academic_year)
      .order('order_num'),
  ]);
  return {
    institution,
    grades: (grades ?? []) as { id: string; name: string; sections: { id: string; name: string }[] }[],
    periods: (periods ?? []) as { id: string; name: string; order_num: number }[],
  };
}

export default async function NotasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();

  const { institution, grades, periods } = data;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        href={`/instituciones/${id}`}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-2 inline-block"
      >
        ← {institution.name}
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Notas</h1>
      <p className="text-sm text-gray-400 mb-8">
        Año académico {(institution as any).current_academic_year} · Solo lectura
      </p>

      {grades.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
          Esta institución no tiene grados configurados.
        </div>
      ) : (
        <NotasClient
          institutionId={id}
          grades={grades}
          periods={periods}
        />
      )}
    </div>
  );
}
