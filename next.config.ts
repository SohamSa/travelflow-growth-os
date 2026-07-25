import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the seeded SQLite snapshot is included in serverless bundles.
  outputFileTracingIncludes: {
    "/**": ["./prisma/demo.db", "./prisma/schema.prisma"],
  },
};

export default nextConfig;
