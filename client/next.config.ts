import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static generation errors for pages that need runtime env vars
  experimental: {
    // Force dynamic rendering for pages using Supabase
  },
  // Allow env vars to be optional at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
};

export default nextConfig;
