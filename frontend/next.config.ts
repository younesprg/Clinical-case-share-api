import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Explicitly set the Turbopack root to the frontend directory.
    // This prevents Turbopack from traversing up to the parent .git directory
    // and scanning the massive Python venv, which causes memory exhaustion.
    root: process.cwd(),
  },
};

export default nextConfig;
