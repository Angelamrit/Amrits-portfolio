import type { NextConfig } from "next";

// Note: the dev/start scripts pass `--dns-result-order=ipv4first` to Node. Some
// Windows/ISP setups resolve IPv6 first and stall for ~10s before falling back,
// which makes the image optimizer's upstream fetch time out.
const nextConfig: NextConfig = {
  // A stray package-lock.json in the user's home directory confuses workspace detection.
  turbopack: { root: __dirname },
  images: {
    remotePatterns: [
      // Placeholder photography. Swap for /public/images once real photos arrive.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    // WebP only: AVIF encoding is several times slower per image on first request.
    formats: ["image/webp"],
    qualities: [65, 72, 75, 78, 85],
  },
};

export default nextConfig;
