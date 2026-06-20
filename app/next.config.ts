import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin はネイティブ Node.js モジュールを含むため、バンドル対象から除外する
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
