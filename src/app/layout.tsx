import type { Metadata, Viewport } from "next";
import { Source_Serif_4, Sunshiney } from "next/font/google";
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

export const metadata: Metadata = {
  title: { default: "TODOctopus", template: "%s · TODOctopus" },
  description:
    "Every task is a tentacle. Finish it, slash it. Slash them all and defeat the octopus.",
  icons: { icon: "/icon.png" },
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
        {children}
      </body>
    </html>
  );
}
