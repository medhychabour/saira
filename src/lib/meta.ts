import { studio } from "@/content/products";

// A page that sets its own openGraph or twitter replaces the layout's instead of
// merging with it, so the shared image and site name are spread in again here.
const image = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "Saira Labs, an independent, product-driven research lab at the intersection of AI and Web3.",
};

export const openGraphBase = { siteName: studio.name, locale: "en_US", images: [image] };
export const twitterBase = { card: "summary_large_image" as const, images: [image] };
