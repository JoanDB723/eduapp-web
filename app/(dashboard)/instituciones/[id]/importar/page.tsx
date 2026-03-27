import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import ImportClient from './ImportClient';

export default async function ImportarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: institution } = await supabase
    .from('institutions')
    .select('name')
    .eq('id', id)
    .single();

  if (!institution) notFound();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href={`/instituciones/${id}`} className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
        ← Volver a {institution.name}
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Importar desde Excel</h1>
      <p className="text-gray-500 text-sm mb-8">
        Descarga la plantilla, llénala con los datos del colegio y súbela aquí.
      </p>
      <ImportClient institutionId={id} />
    </div>
  );
}
