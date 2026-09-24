import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getPost, getPosts } from "@/lib/blog";
import styles from "../blog.module.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  return post ? { title: post.title, description: post.summary } : {};
}

export default async function PostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();

  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Link href="/">saira</Link>
        <span>/</span>
        <Link href="/blog">Blog</Link>
      </nav>
      <article>
        <header className={styles.postHeader}>
          <time className={styles.date}>{formatDate(post.date)}</time>
          <h1>{post.title}</h1>
        </header>
        <div className={styles.prose} dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
    </main>
  );
}
