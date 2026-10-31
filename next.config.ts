import type { NextConfig } from 'next';

/**
 * The Atlas tutorial. There is no backend and no API: every `/api/*` call the
 * product code makes is answered in the browser by lib/sandbox/mock-api.ts
 * from made-up sample data, so there is no proxy and no BACKEND_URL.
 */
const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.trycloudflare.com'],
};

export default nextConfig;
