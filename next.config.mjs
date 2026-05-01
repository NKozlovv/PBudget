/** @type {import('next').NextConfig} */

const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// CSP — start permissive enough to keep the legacy bundle working at
// /legacy (it inlines a lot of styles + uses CDNs). Tightened further in
// Chunk 11 once the legacy app is retired.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob:",
  "font-src 'self' https://fonts.gstatic.com data:",
  `connect-src 'self' ${SUPABASE_HOST} https://api.frankfurter.dev https://api.frankfurter.app`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
]
  .filter(Boolean)
  .join('; ');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: '/legacy', destination: '/legacy/index.html' },
      { source: '/legacy/', destination: '/legacy/index.html' },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
