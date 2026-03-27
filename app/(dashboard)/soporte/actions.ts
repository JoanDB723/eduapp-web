'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function eliminarMensaje(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from('support_messages').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/soporte');
  return { ok: true };
}
