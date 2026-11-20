/** The public address of the site, used for absolute URLs (sitemap, social cards). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://todoctopus.vercel.app")
).replace(/\/$/, "");
