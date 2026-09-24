// Every product shown on the home page. Add an entry here to add a logo;
// its mark is drawn from the paths in components/Mark.tsx (a disc until one is added).

// Surfaces share one colour each across products (see components/Home.module.css).
export type Surface = "API" | "App" | "CLI" | "MCP" | "SDK";

// Small round icons, shown overlapping with their name on hover (see components/DetailIcon.tsx).
export type IconKey = "base" | "somnia" | "claude-code" | "codex" | "cursor" | "openclaw" | "hermes" | "zeroclaw";

export type Detail =
  | { label: string; value: string }
  | { label: string; surfaces: Surface[] }
  | { label: string; icons: IconKey[] };

export type Product = {
  slug: string;
  name: string;
  bio: string;
  details: Detail[];
  note?: string;
  links: { site?: string; x?: string; github?: string; docs?: string };
};

export const products: Product[] = [
  {
    slug: "rewards",
    name: "Rewards",
    bio: "Programmable loyalty infrastructure for Web3. Turn onchain activity into actionable user intelligence, automated incentives and personalized rewards that drive retention.",
    details: [
      { label: "Surfaces", surfaces: ["API", "App", "MCP"] },
      { label: "Industry", value: "Web3 loyalty" },
      { label: "Since", value: "2026" },
      { label: "Chains", icons: ["somnia", "base"] },
      { label: "Status", value: "Active" },
    ],
    links: { site: "https://rewards.so" },
  },
  {
    slug: "warns",
    name: "Warns",
    bio: "The security layer for agentic payments. Enforce programmable spending policies, assess transaction risk and secure autonomous financial operations before anything is signed.",
    details: [
      { label: "Surfaces", surfaces: ["API", "App", "SDK"] },
      { label: "Industry", value: "Agentic payments" },
      { label: "Since", value: "2026" },
      { label: "Chains", icons: ["base"] },
      { label: "Status", value: "Private beta" },
    ],
    links: { site: "https://warns.xyz" },
  },
  {
    slug: "waken",
    name: "Waken",
    bio: "Cloud infrastructure purpose-built for autonomous AI agents. Deploy persistent agents in isolated sandboxes with dedicated compute, durable memory and scalable execution.",
    details: [
      { label: "Surfaces", surfaces: ["App", "CLI"] },
      { label: "Industry", value: "AI infrastructure" },
      { label: "Since", value: "2026" },
      { label: "Runs", icons: ["claude-code", "codex", "cursor", "openclaw", "hermes", "zeroclaw"] },
      { label: "Status", value: "Private beta" },
    ],
    links: { site: "https://waken.sh" },
  },
];

export const SITE_URL = "https://saira.xyz";

export const studio = {
  name: "Saira Labs",
  description:
    "Saira is an independent, product-driven research lab building at the intersection of AI and Web3.",
  intro: [
    "Saira is an independent, product-driven research lab building at the intersection of AI and Web3. We turn emerging technologies into ambitious products, from autonomous agents to onchain infrastructure.",
    "Through Rewards, Waken, and Warns, we're exploring new frontiers, solving hard technical problems, and building the foundations for a more intelligent and programmable internet.",
  ],
  links: [
    // Placeholder until the real X account is ready: kept out of search data.
    { label: "X", href: "https://x.com/sairalabs", placeholder: true },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/saira-labs/" },
    { label: "Contact", href: "mailto:hello@saira.xyz" },
    { label: "Blog", href: "/blog" },
  ],
};

// Blog topics: the studio itself, then one per product, in the same order.
export const topics = [{ key: "saira", name: "Saira" }, ...products.map((p) => ({ key: p.slug, name: p.name }))];
