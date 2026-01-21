import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import QueryProvider from "@/components/providers/QueryProvider";
import SessionProvider from "@/components/providers/SessionProvider";
import PWAProvider from "@/components/providers/PWAProvider";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Hooligans | Artisan Coffee & Cuisine",
  description: "Experience artisanal coffee and handcrafted cuisine in a warm, sophisticated atmosphere",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo/Hooligans-Hero-Logo-2.png",
    apple: "/logo/Hooligans-Hero-Logo-2.png",
    shortcut: "/logo/Hooligans-Hero-Logo-2.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hooligans",
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    title: "Hooligans",
    description: "Experience artisanal coffee and handcrafted cuisine",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#14b8a6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/logo/Hooligans-Hero-Logo-2.png" />
        <link rel="icon" href="/logo/Hooligans-Hero-Logo-2.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${dmSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <SessionProvider>
          <QueryProvider>
            <PWAProvider>
              <div className="min-h-screen bg-white flex flex-col">
                <Navigation />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </PWAProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
