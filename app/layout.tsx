import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AuthGate from "./components/AuthGate";

const uiFont = localFont({
  src: "./fonts/SFNS.ttf",
  variable: "--font-ui",
  display: "swap",
});

const displayFont = localFont({
  src: "./fonts/NewYork.ttf",
  variable: "--font-display",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "WordMaster",
  description: "Personal Language Learning App",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WordMaster",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${uiFont.variable} ${displayFont.variable} min-h-screen antialiased text-slate-900`}>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
