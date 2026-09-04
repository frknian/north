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
  title: { default: "CyberCoach", template: "%s · CyberCoach" },
  description: "Siber güvenlik kariyerin için AI destekli çalışma ve gelişim koçu.",
  applicationName: "CyberCoach",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CyberCoach" },
};

export const viewport: Viewport = { themeColor: "#0b0d10", width: "device-width", initialScale: 1 };

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
