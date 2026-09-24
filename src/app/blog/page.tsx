import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getPosts } from "@/lib/blog";
import styles from "./blog.module.css";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  const posts = getPosts();
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/">saira</Link>
      </nav>
      <h1 className={styles.heading}>Blog</h1>
      <ul className={styles.list}>
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`}>
              <span className={styles.title}>{p.title}</span>
              {p.summary && <span className={styles.summary}>{p.summary}</span>}
              <time className={styles.date}>{formatDate(p.date)}</time>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
