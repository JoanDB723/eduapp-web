import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduApp — Panel de Implementación',
  description: 'Panel administrativo para implementar EduApp en instituciones educativas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
