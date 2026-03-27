import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import CredencialesClient from './CredencialesClient';

export default async function CredencialesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: institution } = await supabase
    .from('institutions')
    .select('name')
    .eq('id', id)
    .single();

  if (!institution) notFound();

  const { data: rows } = await supabase
    .from('import_credentials_log')
    .select('id, full_name, role, email, password, grade_section, imported_at')
    .eq('institution_id', id)
    .order('imported_at', { ascending: false });

  // Agrupar por fecha (día) de importación
  const groupMap = new Map<string, typeof rows>();
  (rows ?? []).forEach((r) => {
    const date = new Date(r.imported_at).toLocaleDateString('es-PE', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    if (!groupMap.has(date)) groupMap.set(date, []);
    groupMap.get(date)!.push(r);
  });

  const groups = Array.from(groupMap.entries()).map(([date, rows]) => ({ date, rows: rows ?? [] }));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        href={`/instituciones/${id}`}
        className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block"
      >
        ← Volver
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Historial de credenciales</h1>
      <p className="text-gray-500 text-sm mb-8">
        {institution.name} — credenciales generadas en cada importación
      </p>

      <CredencialesClient groups={groups} />
    </div>
  );
}
