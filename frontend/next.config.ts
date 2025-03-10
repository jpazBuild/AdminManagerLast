import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  env:{
    URL_API_INTEGRATION: "https://blossom-integrations-hub-development.blossomdev.com/dev/v2/automation/flow/",
    TOKEN_API: "eyJwcm92aWRlciI6IkhPTUVfQ1UiLCJ0b2tlbiI6ImFUVlRhR1pwZERkclZrNVVWak5vT2xGRE1GVXlRVXhFV2pCQmJWZE1Sblp4WW0xUyJ9"
  }
};

export default nextConfig;