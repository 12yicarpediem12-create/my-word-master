import type { Metadata, Viewport } from "next";
import "./globals.css"; // 全体のデザイン（CSS）を読み込む

// 👇 新しく追加：画面の表示設定（ズーム防止やテーマカラー）
export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// 👇 新しく追加：PWAとしてのアプリ設計図（メタデータ）
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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}