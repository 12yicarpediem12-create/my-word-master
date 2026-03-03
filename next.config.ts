import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

export default withPWA({
  reactStrictMode: true,
  // 🌟 ここが重要！エラーメッセージが「書け」と言っている魔法の一行
  turbopack: {}, 
});