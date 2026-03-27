/**
 * Genera email y contraseña automáticos a partir del nombre completo.
 *
 * Reglas:
 *   Email    → primer_nombre.primer_apellido@eduapp.pe
 *   Password → segundo_apellido + 3 dígitos random   (sin tildes, minúsculas)
 *
 * Ejemplos:
 *   "Juan Carlos Pérez García"  → juan.perez@eduapp.pe  /  garcia381
 *   "María López Torres"        → maria.lopez@eduapp.pe /  torres572
 *   "Carlos Mendoza"            → carlos.mendoza@eduapp.pe / mendoza194
 */
function clean(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')     // solo letras y números
    .trim();
}

export function generateCredentials(fullName: string): { email: string; password: string } {
  const parts = clean(fullName).split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    throw new Error(`"${fullName}" debe tener al menos nombre y un apellido`);
  }

  const firstName = parts[0];
  // Con 2 partes: ["juan", "perez"]          → email: juan.perez,  pass base: perez
  // Con 3 partes: ["juan", "perez", "garcia"] → email: juan.perez,  pass base: garcia
  // Con 4 partes: ["juan","carlos","perez","garcia"] → email: juan.perez, pass base: garcia
  const lastName1 = parts.length >= 3 ? parts[parts.length - 2] : parts[1];
  const lastName2 = parts[parts.length - 1];

  const randomNum = Math.floor(100 + Math.random() * 900);

  return {
    email:    `${firstName}.${lastName1}@eduapp.pe`,
    password: `${lastName2}${randomNum}`,
  };
}
