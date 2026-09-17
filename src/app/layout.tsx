import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/site/theme-provider";
import { MotionConfigProvider } from "@/components/site/motion-config";
import { getSettings } from "@/lib/settings";
import { getBaseUrl } from "@/lib/base-url";

const playfair = Playfair_Display({
  variable: "--font-serif-display",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans-body",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  // Origine publique réelle de la requête : sans elle, Next.js résout les
  // images Open Graph relatives contre « http://localhost:3000 », invisible
  // des crawlers (Facebook montrait alors le logo au lieu de l'article).
  const baseUrl = await getBaseUrl();
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: settings.seo_default_title || settings.site_name,
      template: `%s — ${settings.site_name}`,
    },
    description: settings.seo_default_description,
    icons: {
      icon: [
        { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/brand/favicon-48.png', sizes: '48x48', type: 'image/png' },
      ],
      apple: '/brand/apple-touch-icon.png',
    },
    openGraph: {
      title: settings.seo_default_title,
      description: settings.seo_default_description,
      siteName: settings.site_name,
      type: "website",
      locale: "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seo_default_title,
      description: settings.seo_default_description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const headScripts = settings.custom_head_scripts || "";

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Couleur d'accent personnalisée depuis le dashboard (§6.9) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--brand:${settings.accent_color || "#E02310"};--brand-green:#01B458;--brand-gold:#EDB405;}`,
          }}
        />
        {headScripts ? (
          <div
            id="custom-head-scripts"
            dangerouslySetInnerHTML={{ __html: headScripts }}
          />
        ) : null}
        {/* Filet de sécurité : sans JS, le contenu animé par Reveal doit rester visible */}
        <noscript>
          <style>{`[data-reveal]{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} antialiased bg-background text-foreground font-body`}
      >
        <ThemeProvider>
          <MotionConfigProvider>
            {children}
            <Toaster position="top-center" richColors />
          </MotionConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
