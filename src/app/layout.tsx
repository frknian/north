import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppFrame } from "@/components/layout/app-frame";
import { WorkspaceProvider } from "@/components/features/workspace-provider";
import { ServiceWorkerRegistration } from "@/components/features/service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://cybercoach.vercel.app"),
  title: { default: "North", template: "%s — North" },
  description: "Daha az karar, daha iyi odak. Hedeflerin, alanların ve gerçek ilerlemen için kişisel AI koçun.",
  applicationName: "North",
  icons: { icon:[{url:"/favicon.ico",sizes:"any"},{url:"/north-192.png",sizes:"192x192",type:"image/png"}], apple:[{url:"/north-180.png",sizes:"180x180",type:"image/png"}] },
  openGraph: { title:"North", description:"Daha az karar. Daha iyi odak.", siteName:"North", locale:"tr_TR", images:[{url:"/north-512.png",width:512,height:512,alt:"North"}] },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "North" },
};

export const viewport: Viewport = { themeColor: "#121315", width: "device-width", initialScale: 1, viewportFit:"cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${GeistSans.variable} ${GeistMono.variable} dark`} suppressHydrationWarning>
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
