import type { Metadata } from "next";
import { BlogIndex } from "@/components/BlogIndex";
import { BlogNav } from "@/components/BlogNav";
import { SiteFooter } from "@/components/SiteFooter";
import { formatDate, getPosts } from "@/lib/blog";
import styles from "./blog.module.css";

export const metadata: Metadata = { title: "Blog" };

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
