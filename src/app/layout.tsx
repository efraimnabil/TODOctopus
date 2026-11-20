import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Source_Serif_4, Sunshiney } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const display = Sunshiney({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sunshiney",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

const DESCRIPTION =
  "Every task is a tentacle. Finish it, slash it. Slash them all and defeat the octopus.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "TODOctopus · A to-do list with a 3D octopus", template: "%s · TODOctopus" },
  description: DESCRIPTION,
  applicationName: "TODOctopus",
  icons: { icon: "/icon.png", apple: "/icon.png" },
  openGraph: {
    type: "website",
    siteName: "TODOctopus",
    title: "TODOctopus",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: "TODOctopus", description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#031322",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-abyss font-serif text-foam">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-abyss px-4 py-2 text-foam focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
