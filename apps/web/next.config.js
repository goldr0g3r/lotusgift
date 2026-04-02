/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui"],
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
