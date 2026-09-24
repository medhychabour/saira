import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogNav } from "@/components/BlogNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_URL, studio, topics } from "@/content/products";
import { formatDate, getPost, getPosts } from "@/lib/blog";
import { openGraphBase, twitterBase } from "@/lib/meta";
import styles from "../blog.module.css";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: { ...openGraphBase, type: "article", url, title: post.title, description: post.summary, publishedTime: post.date, authors: [studio.name] },
    twitter: { ...twitterBase, title: post.title, description: post.summary },
  };
}

export default async function PostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const topic = topics.find((t) => t.key === post.topic)?.name ?? post.topic;
  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    url: `${SITE_URL}/blog/${post.slug}`,
    author: { "@type": "Organization", name: studio.name, url: SITE_URL },
    publisher: { "@type": "Organization", name: studio.name, logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` } },
  };

  return (
    <div className={styles.shell}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replace(/</g, "\\u003c") }} />
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
