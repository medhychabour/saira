"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { topics } from "@/content/products";
import styles from "@/app/blog/blog.module.css";

const EASE = [0.19, 1, 0.22, 1] as const;

export type PostCard = { slug: string; title: string; summary: string; topic: string; date: string; iso: string };

const topicName = (key: string) => topics.find((t) => t.key === key)?.name ?? key;

// The post list with one filter per topic: all, the studio, then each product.
// Only topics that have posts are offered, so a product's filter appears with
// its first post, and the filters only show once there are two topics to pick
// from. The chosen topic is kept in the address (?topic=warns).
export function BlogIndex({ title, posts }: { title: string; posts: PostCard[] }) {
  const [topic, setTopic] = useState<string>("all");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("topic");
    if (t && posts.some((p) => p.topic === t)) setTopic(t);
  }, []);

  const choose = (t: string) => {
    setTopic(t);
    const url = new URL(window.location.href);
    if (t === "all") url.searchParams.delete("topic");
    else url.searchParams.set("topic", t);
    window.history.replaceState(null, "", url);
  };

  const shown = topic === "all" ? posts : posts.filter((p) => p.topic === topic);
  const used = topics.filter((t) => posts.some((p) => p.topic === t.key));

  return (
    <>
      {/* The title on the left, the topics on the same line, to the right. */}
      <header className={styles.header}>
        <h1>{title}</h1>
        {used.length > 1 && (
          <div className={styles.topics} role="tablist" aria-label="Topics">
            {[{ key: "all", name: "All" }, ...used].map((t) => (
              <button key={t.key} role="tab" aria-selected={topic === t.key} onClick={() => choose(t.key)}>
                {t.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        <motion.ul
          key={topic}
          className={styles.list}
          initial="hidden"
          animate="shown"
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }}
        >
          {shown.map((p) => (
            <motion.li
              key={p.slug}
              variants={{
                hidden: { opacity: 0, filter: "blur(10px)", y: 6 },
                shown: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 1.1, ease: EASE } },
              }}
            >
              <Link href={`/blog/${p.slug}`}>
                <span className={styles.title}>{p.title}</span>
                <span className={styles.meta}>
                  <time dateTime={p.iso}>{p.date}</time>
                  <span aria-hidden>·</span>
                  <span>{topicName(p.topic)}</span>
                </span>
                {p.summary && <span className={styles.summary}>{p.summary}</span>}
                {/* The whole card is the link; this only shows the way in. */}
                <span className={styles.more}>Read more</span>
              </Link>
            </motion.li>
          ))}
          {shown.length === 0 && (
            <motion.li
              className={styles.empty}
              variants={{ hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: 0.4 } } }}
            >
              Nothing about {topicName(topic)} yet.
            </motion.li>
          )}
        </motion.ul>
      </AnimatePresence>
    </>
  );
}
