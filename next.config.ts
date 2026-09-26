import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy.
 *
 * Everything this site loads is same-origin: the fonts are self-hosted
 * Fontsource builds, the photography is served through Next's image optimizer
 * (which proxies any remote source from `/_next/image`, so remote hosts never
 * need to appear here), and there is no analytics or embed of any kind.
 *
 * The one concession is `'unsafe-inline'` on scripts and styles. Next.js inlines
 * its bootstrap and the streamed RSC payload, and Tailwind's runtime-injected
 * styles are inline as well; locking those down needs a per-request nonce,
 * which in turn forces every page into dynamic rendering. For a site that is
 * entirely static that trade is not worth it — so scripts stay restricted to
 * this origin, which still blocks injected third-party script, and the
 * directives below close off the framing, form and base-URI vectors outright.
 *
 * Dev additionally needs `'unsafe-eval'` for React Fast Refresh and a
 * websocket connection for HMR.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self'",
  "manifest-src 'self'",
  "frame-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Two years, with the subdomains and preload flags the HSTS preload list
  // requires. Browsers ignore this over plain http, so local dev is unaffected.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Superseded by frame-ancestors above, kept for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

// Note: the dev/start scripts pass `--dns-result-order=ipv4first` to Node. Some
// Windows/ISP setups resolve IPv6 first and stall for ~10s before falling back,
// which makes the image optimizer's upstream fetch time out.
/**
 * Caching for the files served straight out of `/public`.
 *
 * Next.js hashes everything it builds into `/_next/static` and serves it
 * `immutable` for a year, but files in `/public` are not hashed and default to
 * `max-age=0`, so every photograph on the site was being revalidated on every
 * visit. That is the single biggest caching gap here, because the photography
 * is nearly all of the page weight.
 *
 * Seven days fresh, then served stale for up to thirty while it refreshes in
 * the background. The filenames carry no content hash, so a long `immutable`
 * would strand a browser on an old photo when the chef swaps one in; a week
 * means the worst case corrects itself without needing a CDN purge, and the
 * `stale-while-revalidate` window keeps the swap invisible to visitors.
 *
 * This also governs the optimizer: the max-age on an optimized image is the
 * larger of `minimumCacheTTL` and the upstream file's own `Cache-Control`.
 */
const ASSET_CACHE_TTL = 60 * 60 * 24 * 7;
const ASSET_SWR = 60 * 60 * 24 * 30;
const assetCacheHeaders = [
  { key: "Cache-Control", value: `public, max-age=${ASSET_CACHE_TTL}, stale-while-revalidate=${ASSET_SWR}` },
];

const nextConfig: NextConfig = {
  // A stray package-lock.json in the user's home directory confuses workspace detection.
  turbopack: { root: __dirname },
  // Do not advertise the framework and its version to anyone scanning.
  poweredByHeader: false,
  images: {
    // No `remotePatterns`: every photograph is local now, under /public/images.
    // Leaving a host listed here would let anyone use /_next/image on this
    // domain as an open image proxy for that host, so the list stays empty
    // until a real remote source is actually needed.
    // WebP only: AVIF encoding is several times slower per image on first request.
    formats: ["image/webp"],
    qualities: [65, 72, 75, 78, 85],
    // Match the upstream max-age above rather than the 4-hour default. The
    // optimizer's cache has no invalidation hook, so this stays deliberately
    // short-lived rather than set to a year.
    minimumCacheTTL: ASSET_CACHE_TTL,
  },
  // Chef Amrit cooks only at Angel, so the private-experience pages and the
  // dashboard's bookings screens were removed. Old links — search results,
  // shared URLs, bookmarks — land somewhere useful instead of a 404.
  async redirects() {
    return [
      { source: "/experiences", destination: "/angel", permanent: true },
      { source: "/experiences/:path*", destination: "/angel", permanent: true },
      { source: "/admin/bookings", destination: "/admin", permanent: true },
      { source: "/admin/bookings/:path*", destination: "/admin", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // After the blanket rule above, so these win on the asset paths. Pages
      // are left alone: Next already sets their Cache-Control from the
      // rendering strategy, and every route here is static.
      { source: "/images/:path*", headers: assetCacheHeaders },
      { source: "/video/:path*", headers: assetCacheHeaders },
    ];
  },
};

export default nextConfig;
