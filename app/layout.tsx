import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthGate from "./components/AuthGate";

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
      <body className="min-h-screen antialiased text-slate-900">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
