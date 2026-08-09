import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prompt Studio is a self-contained workshop application.  It has no server
  // routes or per-request data, so exporting it as static files lets Netlify
  // serve it directly from its CDN.
  output: "export",
};

export default nextConfig;
