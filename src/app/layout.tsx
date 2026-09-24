import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { DevFeedback } from "@/components/DevFeedback";
import { studio } from "@/content/products";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://saira.xyz"),
  title: { default: studio.name, template: `%s | ${studio.name}` },
  description: studio.description,
  openGraph: { title: studio.name, description: studio.description, url: "https://saira.xyz", siteName: "saira.xyz", type: "website" },
  twitter: { card: "summary_large_image", title: studio.name, description: studio.description },
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <DevFeedback />
      </body>
    </html>
  );
}
