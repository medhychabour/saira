import { Home } from "@/components/Home";
import { SITE_URL, products, studio } from "@/content/products";

// What search engines read about the studio: who it is, its logo, its products.
const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: studio.name,
  url: SITE_URL,
  logo: `${SITE_URL}/icon-512.png`,
  description: studio.description,
  // Public profiles only, not the email.
  sameAs: studio.links.filter((l) => l.href.startsWith("https://")).map((l) => l.href),
  brand: products.map((p) => ({ "@type": "Brand", name: p.name, url: p.links.site, description: p.bio })),
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} />
      <Home />
    </>
  );
}
