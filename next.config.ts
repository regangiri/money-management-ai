import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Emit a self-contained server bundle for a minimal Docker image.
  output: "standalone",
};

export default nextConfig;
