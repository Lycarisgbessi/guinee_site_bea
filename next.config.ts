import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Passerelle de prévisualisation : elle redirige /dashboard → /dashboard/
  // (307) tandis que Next.js fait l'inverse (308) — d'où une boucle
  // ERR_TOO_MANY_REDIRECTS sur /dashboard. En désactivant la normalisation
  // du slash final, /dashboard/ est servi directement : plus aucune boucle,
  // quel que soit le sens de redirection choisi par l'hébergeur.
  skipTrailingSlashRedirect: true,
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
