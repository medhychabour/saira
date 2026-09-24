// Every product shown on the home page. Add an entry here to add a logo.
// Each product shows its mark (see components/Mark.tsx); set `image` (a file in /public/logos)
// to use an image instead.

export type Detail =
  | { label: string; value: string }
  | { label: string; tags: string[] };

export type Product = {
  slug: string;
  name: string;
  image?: string;
  bio: string;
  details: Detail[];
  note?: string;
  links: { site?: string; x?: string; github?: string; docs?: string };
};

export const products: Product[] = [
  {
    slug: "rewards",
    name: "Rewards",
    bio: "Onchain loyalty for Web3 products. Points, badges, leaderboards and claimable rewards, all driven by what wallets actually do.",
    details: [
      { label: "Surfaces", tags: ["App", "API", "MCP"] },
      { label: "Industry", value: "Loyalty" },
      { label: "Chains", tags: ["Somnia", "Base"] },
      { label: "Status", value: "Live" },
    ],
    note: "Includes Rewards Score, a reputation token that follows a wallet across apps.",
    links: { site: "https://rewards.so" },
  },
  {
    slug: "warns",
    name: "Warns",
    bio: "A security layer for agent payments. Warns checks every payment an AI agent is about to make, before anything is signed.",
    details: [
      { label: "Surfaces", tags: ["API", "SDK", "App"] },
      { label: "Industry", value: "Security" },
      { label: "Chains", tags: ["Base"] },
      { label: "Status", value: "Live" },
    ],
    note: "Point your x402 agent at our traps and see what it pays.",
    links: { site: "https://warns.xyz" },
  },
  {
    slug: "waken",
    name: "Waken",
    bio: "Persistent agents hosted in the cloud. Every agent gets its own machine and a memory that never resets. Sleeping agents are free.",
    details: [
      { label: "Surfaces", tags: ["App", "CLI"] },
      { label: "Industry", value: "AI infrastructure" },
      { label: "Runs", tags: ["Claude Code", "Codex", "Cursor"] },
      { label: "Status", value: "Invite only" },
    ],
    links: { site: "https://waken.sh" },
  },
];

export const studio = {
  name: "Saira",
  description:
    "Saira builds products for the onchain and agent economy: loyalty, payment security and infrastructure for AI agents.",
  links: [
    { label: "X", href: "https://x.com/sairalabs" },
    { label: "Blog", href: "/blog" },
  ],
};
