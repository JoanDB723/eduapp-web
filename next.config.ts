import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@supabase/supabase-js', '@supabase/realtime-js'],
};

export default nextConfig;
