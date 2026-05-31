import type {NextConfig} from 'next';

// NOTE: O SWC apresenta bug de parsing com template literals contendo:
// - caracteres acentuados + interpolacao (ex: Infracao: ${x})
// - padrao (${...}) imediatamente apos abre-parentese
// - tags HTML dentro de template literals (ex: <div>${x}</div>)
// Todos esses casos foram convertidos para concatenacao de strings.

// ── Security Headers ────────────────────────────────────────────────────────
const SUPABASE_HOST = 'imprdimqcjbndqewioyt.supabase.co';

const securityHeaders = [
  // Bloqueia iframes externos (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Bloqueia MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Força HTTPS por 2 anos (HSTS)
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Controla o header Referer
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Bloqueia acesso a camera, microfone e geolocalizacao
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Impede XSS via deteccao do browser (legado)
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://picsum.photos https://lh3.googleusercontent.com https://*.googleusercontent.com https://i.postimg.cc https://*.postimg.cc",
      "connect-src 'self' https://" + SUPABASE_HOST + " wss://" + SUPABASE_HOST + " https://accounts.google.com https://oauth2.googleapis.com https://generativelanguage.googleapis.com",
      "frame-src 'self' https://accounts.google.com https://drive.google.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Adiciona headers de seguranca em todas as rotas
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
