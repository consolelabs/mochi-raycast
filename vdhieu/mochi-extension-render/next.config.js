const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(cfg) {
    cfg.resolve.alias.canvas = path.resolve(
      __dirname,
      "node_modules",
      "@napi-rs",
      "canvas",
    );

    return cfg;
  },
};

module.exports = nextConfig;
