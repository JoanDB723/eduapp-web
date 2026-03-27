'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function cambiarAnioAcademico(
  institutionId: string,
  nuevoAnio: string,
  periodos: { name: string; start_date: string; end_date: string; order_num: number }[],
) {
  const supabase = createAdminClient();

  // Verificar que no existan ya períodos para ese año
  const { count } = await supabase
    .from('academic_periods')
    .select('*', { count: 'exact', head: true })
    .eq('institution_id', institutionId)
    .eq('academic_year', nuevoAnio);

  if (count && count > 0) {
    return { error: `Ya existen períodos académicos para el año ${nuevoAnio}.` };
  }

  // Insertar los nuevos períodos
  const { error: periodError } = await supabase.from('academic_periods').insert(
    periodos.map((p) => ({
      institution_id: institutionId,
      name: p.name,
      start_date: p.start_date,
      end_date: p.end_date,
      order_num: p.order_num,
      academic_year: nuevoAnio,
    })),
  );

  if (periodError) return { error: periodError.message };

  // Actualizar el año activo de la institución
  const { error: instError } = await supabase
    .from('institutions')
    .update({ current_academic_year: nuevoAnio })
    .eq('id', institutionId);

  if (instError) return { error: instError.message };

  revalidatePath(`/instituciones/${institutionId}`);
  return { ok: true };
}
