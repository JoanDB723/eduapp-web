import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import AlumnoClient from './AlumnoClient';

export default async function AlumnoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: institution } = await supabase
    .from('institutions')
    .select('id, name')
    .eq('id', id)
    .single();

  if (!institution) notFound();

  const { data: grades } = await supabase
    .from('grades')
    .select('id, name, order_num, sections(id, name)')
    .eq('institution_id', id)
    .order('order_num');

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href={`/instituciones/${id}`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors mb-2 inline-block">
        ← Volver a {institution.name}
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestionar alumno</h1>
      <p className="text-gray-400 text-sm mb-8">Agrega un alumno nuevo o cambia su sección.</p>

      <AlumnoClient institutionId={id} grades={(grades ?? []) as any} />
    </div>
  );
}
