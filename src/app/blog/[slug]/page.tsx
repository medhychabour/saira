import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogNav } from "@/components/BlogNav";
import { SiteFooter } from "@/components/SiteFooter";
import { topics } from "@/content/products";
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
  const topic = topics.find((t) => t.key === post.topic)?.name ?? post.topic;

  return (
    <div className={styles.shell}>
      <main className={styles.page}>
        <BlogNav href="/blog" label="Blog" />
        <article>
          <header className={styles.postHeader}>
            <h1>{post.title}</h1>
            <span className={styles.meta}>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span>{topic}</span>
            </span>
          </header>
          <div className={styles.prose} dangerouslySetInnerHTML={{ __html: post.html }} />
        </article>
      </main>
      <SiteFooter className={styles.footer} />
    </div>
  );
}
