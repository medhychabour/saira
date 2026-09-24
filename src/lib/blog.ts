import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

// Posts live in src/content/blog/<slug>.md with a small frontmatter block:
// ---
// title: ...
// date: 2026-09-24
// summary: ...
// ---

const DIR = path.join(process.cwd(), "src/content/blog");

export type Post = { slug: string; title: string; date: string; summary: string; body: string };

function parse(slug: string, raw: string): Post {
  const match = raw.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  for (const line of (match?.[1] ?? "").split("\n")) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { slug, title: meta.title ?? slug, date: meta.date ?? "", summary: meta.summary ?? "", body: match?.[2] ?? raw };
}

export function getPosts(): Post[] {
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => parse(f.replace(/\.md$/, ""), fs.readFileSync(path.join(DIR, f), "utf8")))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): (Post & { html: string }) | null {
  const file = path.join(DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const post = parse(slug, fs.readFileSync(file, "utf8"));
  return { ...post, html: marked.parse(post.body, { async: false }) };
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
