// Every product shown on the home page. Add an entry here to add a logo;
// its mark is drawn from the paths in components/Mark.tsx (a disc until one is added).

export type Detail =
  | { label: string; value: string }
  | { label: string; tags: string[] };

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
  name: "Saira Labs",
  description:
    "Saira Labs is an independent, product-driven research lab building at the intersection of AI and Web3.",
  intro: [
    "Saira Labs is an independent, product-driven research lab building at the intersection of AI and Web3. We turn emerging technologies into ambitious products, from autonomous agents to onchain infrastructure.",
    "Through Rewards, Waken, and Warns, we're exploring new frontiers, solving hard technical problems, and building the foundations for a more intelligent and programmable internet.",
    "We research, build, and ship what's next.",
  ],
  links: [
    { label: "X", href: "https://x.com/sairalabs" },
    { label: "Blog", href: "/blog" },
  ],
};
