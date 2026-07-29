import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Emit a self-contained server bundle for a minimal Docker image.
  output: "standalone",
  // Hide Next's dev-tools indicator: its badge overlaps the mobile nav's
  // "More" button and throws a pointer-capture error on tap. Dev-only; no
  // effect on production builds.
  devIndicators: false,
};

export default nextConfig;
