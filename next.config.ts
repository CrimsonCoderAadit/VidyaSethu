import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Render <title>/<meta> in <head> for every client, not streamed after the body. Metadata here
  // is static, so this costs nothing and keeps link previews (WhatsApp shares) and audits correct.
  htmlLimitedBots: /.*/,
};

export default nextConfig;
