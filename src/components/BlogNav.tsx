import Link from "next/link";
import styles from "@/app/blog/blog.module.css";

// The way back, at the top of the blog pages: home from the list, the list
// from a post.
export function BlogNav({ href, label }: { href: string; label: string }) {
  return (
    <nav className={styles.nav}>
      <Link href={href} className={styles.back}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M10 3L5 8l5 5" />
        </svg>
        {label}
      </Link>
    </nav>
  );
}
