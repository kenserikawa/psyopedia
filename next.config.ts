import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// next.config.ts no puede importar módulos TS locales (verificado con Next 16.2.1): repite el
// cálculo de BASE_PATH de src/lib/site.ts. test:export comprueba que los dos coinciden.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://psyopedia.org").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: new URL(SITE_URL).pathname.replace(/\/+$/, ""),
  images: { unoptimized: true },
  allowedDevOrigins: ["*.ngrok-free.app"],
};

export default withNextIntl(nextConfig);
