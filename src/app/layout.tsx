import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";
import { DevFeedback } from "@/components/DevFeedback";
import { SITE_URL, studio } from "@/content/products";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Site-wide metadata. Favicons, the Apple icon and the share images come from
// the file conventions in this folder (icon.svg, favicon.ico, apple-icon.png,
// opengraph-image.png, twitter-image.png); the web manifest from manifest.ts.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: studio.name, template: `%s | ${studio.name}` },
  description: studio.description,
  applicationName: studio.name,
  creator: studio.name,
  publisher: studio.name,
  keywords: ["Saira Labs", "AI", "Web3", "AI agents", "onchain infrastructure", "agentic payments", "Rewards", "Warns", "Waken"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: studio.name,
    title: studio.name,
    description: studio.description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", site: "@sairalabs", creator: "@sairalabs", title: studio.name, description: studio.description },
  robots: { index: true, follow: true },
  formatDetection: { email: false, address: false, telephone: false },
};

export const viewport: Viewport = { themeColor: "#000000", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <Analytics />
        <DevFeedback />
      </body>
    </html>
  );
}
