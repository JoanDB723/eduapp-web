'use client';

import * as XLSX from 'xlsx';

type CredRow = {
  id: string;
  full_name: string;
  role: string;
  email: string;
  password: string;
  grade_section: string | null;
  imported_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin:   'Admin',
  teacher: 'Profesor',
  support: 'Apoyo',
  parent:  'Familia',
};

function downloadExcel(rows: CredRow[], label: string) {
  const data = rows.map((c) => ({
    'Nombre completo': c.full_name,
    'Rol':             ROLE_LABELS[c.role] ?? c.role,
    'Email':           c.email,
    'Contraseña':      c.password,
    'Grado / Sección': c.grade_section ?? '—',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 34 }, { wch: 16 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Credenciales');
  XLSX.writeFile(wb, `credenciales_${label}.xlsx`);
}

export default function CredencialesClient({ groups }: { groups: { date: string; rows: CredRow[] }[] }) {
  if (groups.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-sm">No hay credenciales registradas aún.</p>
        <p className="text-xs mt-1">Se guardan automáticamente al hacer una importación.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((g) => {
        const label = g.date.replace(/\//g, '-');
        return (
          <div key={g.date} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">Importación del {g.date}</p>
                <p className="text-xs text-gray-400 mt-0.5">{g.rows.length} cuentas</p>
              </div>
              <button
                onClick={() => downloadExcel(g.rows, label)}
                className="shrink-0 bg-brand text-white px-4 py-2 rounded-xl text-sm font-semibold
                           hover:bg-brand-medium transition-colors"
              >
                ⬇ Descargar Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Nombre</th>
                    <th className="px-5 py-3 text-left">Rol</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Contraseña</th>
                    <th className="px-5 py-3 text-left">Sección</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {g.rows.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-3 text-gray-900">{c.full_name}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{ROLE_LABELS[c.role] ?? c.role}</td>
                      <td className="px-5 py-3 text-gray-600 font-mono text-xs">{c.email}</td>
                      <td className="px-5 py-3 text-gray-600 font-mono text-xs">{c.password}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{c.grade_section ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
