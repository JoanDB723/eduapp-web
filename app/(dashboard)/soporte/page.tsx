import { createAdminClient } from '@/lib/supabase/admin';
import { eliminarMensaje } from './actions';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  teacher: { label: 'Profesor',  color: 'bg-blue-100 text-blue-700' },
  parent:  { label: 'Familia',   color: 'bg-green-100 text-green-700' },
  support: { label: 'Apoyo',     color: 'bg-purple-100 text-purple-700' },
  admin:   { label: 'Admin',     color: 'bg-amber-100 text-amber-700' },
};

export default async function SoportePage() {
  const supabase = createAdminClient();

  const { data: messages } = await supabase
    .from('support_messages')
    .select(`
      id, message, role, created_at,
      users!user_id ( full_name ),
      institutions!institution_id ( name )
    `)
    .order('created_at', { ascending: false });

  const items = (messages ?? []) as any[];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Soporte</h1>
          <p className="text-gray-500 text-sm mt-1">
            {items.length === 0
              ? 'Sin mensajes pendientes'
              : `${items.length} mensaje${items.length !== 1 ? 's' : ''} recibido${items.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">No hay mensajes de soporte por ahora.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((msg) => {
            const roleInfo = ROLE_LABELS[msg.role] ?? { label: msg.role, color: 'bg-gray-100 text-gray-600' };
            const date = new Date(msg.created_at).toLocaleString('es-PE', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            });

            return (
              <div key={msg.id} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-gray-900 text-sm">
                      {msg.users?.full_name ?? 'Usuario desconocido'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {msg.institutions?.name ?? '—'} · {date}
                    </p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                </div>

                {/* Mensaje */}
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {msg.message}
                </p>

                {/* Acción */}
                <div className="flex justify-end pt-1">
                  <form action={async () => { 'use server'; await eliminarMensaje(msg.id); }}>
                    <button
                      type="submit"
                      className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
