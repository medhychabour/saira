import type { Metadata } from "next";
import { BlogIndex } from "@/components/BlogIndex";
import { BlogNav } from "@/components/BlogNav";
import { SiteFooter } from "@/components/SiteFooter";
import { formatDate, getPosts } from "@/lib/blog";
import { openGraphBase, twitterBase } from "@/lib/meta";
import styles from "./blog.module.css";

const description = "Notes from Saira Labs on AI, Web3, and the products we build: Rewards, Warns and Waken.";

export const metadata: Metadata = {
  title: "Blog",
  description,
  alternates: { canonical: "/blog" },
  openGraph: { ...openGraphBase, type: "website", url: "/blog", title: "Blog | Saira Labs", description },
  twitter: { ...twitterBase, title: "Blog | Saira Labs", description },
};

export default function BlogPage() {
  const posts = getPosts().map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    topic: p.topic,
    date: formatDate(p.date),
    iso: p.date,
  }));

  return (
    <div className={styles.shell}>
      <main className={styles.page}>
        <BlogNav href="/" label="Back home" />
        <BlogIndex title="Blog" posts={posts} />
      </main>
      <SiteFooter className={styles.footer} />
    </div>
  );
}
