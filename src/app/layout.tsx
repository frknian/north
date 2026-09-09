import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Sora } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppFrame } from "@/components/layout/app-frame";
import { WorkspaceProvider } from "@/components/features/workspace-provider";
import { ServiceWorkerRegistration } from "@/components/features/service-worker-registration";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://cybercoach.vercel.app"),
  title: { default: "Planorth", template: "%s — Planorth" },
  description: "Daha az karar, daha iyi odak. Hedeflerin, alanların ve gerçek ilerlemen için kişisel AI koçun.",
  applicationName: "Planorth",
  icons: {
    icon: [
      { url: "/favicon.ico?v=4", sizes: "any" },
      { url: "/icon.svg?v=4", type: "image/svg+xml" },
      { url: "/favicon-32x32.png?v=4", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png?v=4", sizes: "16x16", type: "image/png" },
      { url: "/planorth-192.png?v=4", sizes: "192x192", type: "image/png" },
      { url: "/planorth-512.png?v=4", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=4", sizes: "180x180", type: "image/png" },
      { url: "/planorth-180.png?v=4", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=4",
  },
  openGraph: {
    title: "Planorth",
    description: "Daha az karar. Daha iyi odak.",
    siteName: "Planorth",
    locale: "tr_TR",
    images: [{ url: "/planorth-og.png?v=4", width: 1200, height: 630, alt: "Planorth" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Planorth",
    description: "Daha az karar. Daha iyi odak.",
    images: ["/planorth-og.png?v=4"],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Planorth" },
};

export const viewport: Viewport = { themeColor: "#121315", width: "device-width", initialScale: 1, viewportFit:"cover" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="tr" className={`${GeistSans.variable} ${GeistMono.variable} ${sora.variable} dark`} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=4" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=4" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=4" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=4" />
        <link rel="shortcut icon" href="/favicon.ico?v=4" />
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("north_theme");if(t==="light"){document.documentElement.classList.remove("dark")}else{document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-background font-sans antialiased">
        <TooltipProvider>
          <WorkspaceProvider><AppFrame>{children}</AppFrame></WorkspaceProvider>
        </TooltipProvider>
        <Toaster theme="dark" richColors position="top-center" />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
