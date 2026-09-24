"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { studio } from "@/content/products";
import { SairaLogo, logoRevealEnd } from "./SairaLogo";
import styles from "./SiteFooter.module.css";

const EASE = [0.19, 1, 0.22, 1] as const;

// The logo and the site links, shared by the home and the blog. With `reveal`,
// the logo plays its intro and the links come in once it is complete.
export function SiteFooter({ className = "", reveal }: { className?: string; reveal?: number }) {
  return (
    <footer className={`${styles.footer} ${className}`}>
      <div className={styles.wordmark}>
        <SairaLogo height={26} reveal={reveal} />
      </div>
      <motion.ul
        className={styles.links}
        initial={reveal === undefined ? false : { opacity: 0, filter: "blur(6px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: EASE, delay: reveal === undefined ? 0 : logoRevealEnd(reveal) - 0.15 }}
      >
        {studio.links.map((l) => (
          <li key={l.label}>
            {l.href.startsWith("/") ? (
              <Link href={l.href}>{l.label}</Link>
            ) : l.href.startsWith("mailto:") ? (
              <a href={l.href}>{l.label}</a>
            ) : (
              <a href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>
            )}
          </li>
        ))}
      </motion.ul>
    </footer>
  );
}
