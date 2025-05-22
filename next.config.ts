import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['blossom-automation-screenshots-dev.s3.us-east-2.amazonaws.com'],
  },
  env:{
    URL_API_INTEGRATION: process.env.URL_API_INTEGRATION,
    TOKEN_API: process.env.TOKEN_API,
    URL_API_AUTOMATION:process.env.URL_API_AUTOMATION,
    X_API_KEY: process.env.X_API_KEY,
    URL_API_RUNNER: process.env.URL_API_RUNNER
  }
};

export default nextConfig;