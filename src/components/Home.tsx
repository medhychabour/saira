"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { products, studio, type Product } from "@/content/products";
import { play, setMuted, useMuted } from "@/lib/sfx";
import { MARKS, type MarkShape } from "./Mark";
import { MatrixLogo } from "./MatrixLogo";
import { SairaLogo } from "./SairaLogo";
import styles from "./Home.module.css";

const EASE = [0.19, 1, 0.22, 1] as const;
// How long the logos take to move and grow or shrink; the text stays hidden meanwhile.
const MOVE = { desktop: 0.9, mobile: 0.5 };
const INTRO_HIDDEN = { opacity: 0, filter: "blur(10px)", y: 6 };
const INTRO_SHOWN = { opacity: 1, filter: "blur(0px)", y: 0 };
const MOBILE = 920;
// Logos are drawn at their open size and scaled down at rest, so they stay sharp.
const SIZE = { desktop: 260, mobile: 190 };
const REST_SCALE = { desktop: 0.6, mobile: 0.5 };
// A product without a mark yet gets a plain disc.
const FALLBACK: MarkShape = { viewBox: "0 0 100 100", paths: ["M50 2a48 48 0 1 0 0.01 0Z"] };

// The logos sit a little below the middle to leave room for the intro above.
const logoOffset = (h: number, mobile: boolean) => (mobile ? h * 0.18 : Math.min(110, h * 0.11));

function subscribeResize(cb: () => void) {
  window.addEventListener("resize", cb);
  return () => window.removeEventListener("resize", cb);
}

function useViewport() {
  const w = useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 1440);
  const h = useSyncExternalStore(subscribeResize, () => window.innerHeight, () => 900);
  return { w, h, mobile: w <= MOBILE };
}

export function Home() {
  const [active, setActive] = useState<number | null>(null);
  const { h, mobile } = useViewport();
  const open = active !== null;
  // True while the logos travel back after closing, so the text only comes
  // back once they are nearly home and nothing overlaps.
  const [closing, setClosing] = useState(false);
  const closingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const select = useCallback((i: number) => {
    play("open");
    clearTimeout(closingTimer.current);
    setClosing(false);
    setActive(i);
  }, []);

  const close = useCallback(() => {
    play("close");
    // Drop focus from the logo that opened, or its hover state would linger.
    (document.activeElement as HTMLElement | null)?.blur();
    setActive(null);
    setClosing(true);
    clearTimeout(closingTimer.current);
    // The ease-out puts the logos ~75% home by 20% of the move: bring the text back then.
    closingTimer.current = setTimeout(() => setClosing(false), (mobile ? MOVE.mobile : MOVE.desktop) * 200);
  }, [mobile]);

  useEffect(() => () => clearTimeout(closingTimer.current), []);

  // The intro paragraphs come in from a soft blur, one after the other: on
  // load, and again each time a product closes. They leave all at once.
  const introShown = !open && !closing;
  const loaded = useRef(false);
  useEffect(() => {
    loaded.current = true;
  }, []);

  const next = useCallback(() => {
    play("forward");
    setActive((i) => ((i ?? -1) + 1) % products.length);
  }, []);

  const prev = useCallback(() => {
    play("back");
    setActive((i) => ((i ?? 0) - 1 + products.length) % products.length);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, next, prev]);

  return (
    <main className={styles.main} data-open={open} data-closing={closing} style={{ "--logo-y": `${logoOffset(h, mobile)}px` } as React.CSSProperties}>
      <MuteButton />

      <section className={styles.intro}>
        <div>
          {studio.intro.map((p, i) => (
            <motion.p
              key={p.slice(0, 24)}
              initial={INTRO_HIDDEN}
              animate={introShown ? INTRO_SHOWN : INTRO_HIDDEN}
              transition={
                introShown
                  ? { duration: loaded.current ? 0.8 : 1.1, ease: EASE, delay: (loaded.current ? 0 : 0.15) + i * (loaded.current ? 0.1 : 0.18) }
                  : { duration: 0.25, ease: EASE }
              }
            >
              {highlight(p)}
            </motion.p>
          ))}
        </div>
      </section>

      <div className={styles.stage}>
        <ul>
          {products.map((p, i) => (
            <LogoItem key={p.slug} product={p} index={i} active={active} onSelect={() => select(i)} />
          ))}
        </ul>
      </div>

      <footer className={styles.footer}>
        <motion.div
          className={styles.wordmark}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.6 }}
        >
          <SairaLogo height={26} />
        </motion.div>
        <ul className={styles.links}>
          {studio.links.map((l) => (
            <li key={l.label}>
              {l.href.startsWith("/") ? (
                <Link href={l.href} onClick={() => play("click")}>
                  {l.label}
                </Link>
              ) : (
                <a href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => play("click")}>
                  {l.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </footer>

      <Panel product={active === null ? null : products[active]} onClose={close} />

      <AnimatePresence>
        {open && (
          <motion.div
            key="pager"
            className={styles.pager}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
          >
            <button onClick={prev} aria-label="Previous product">
              <Chevron flip />
            </button>
            <button onClick={next} aria-label="Next product">
              <Chevron />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// Product names in the intro stand out in white and link to their site.
function highlight(text: string) {
  const names = products.map((p) => p.name).join("|");
  return text.split(new RegExp(`(${names})`)).map((part, i) => {
    const product = products.find((p) => p.name === part);
    if (!product) return part;
    return product.links.site ? (
      <a key={i} href={product.links.site} target="_blank" rel="noopener noreferrer" onClick={() => play("click")}>
        {part}
      </a>
    ) : (
      <strong key={i}>{part}</strong>
    );
  });
}

function LogoItem({
  product,
  index,
  active,
  onSelect,
}: {
  product: Product;
  index: number;
  active: number | null;
  onSelect: () => void;
}) {
  const { w, h, mobile } = useViewport();
  const total = products.length;
  const open = active !== null;
  const selected = active === index;
  // Moving from one open product to another is a little quicker than opening
  // or closing. All logos glide together and keep their order, so none cross.
  const history = useRef({ prev: null as number | null, cur: active });
  if (history.current.cur !== active) history.current = { prev: history.current.cur, cur: active };
  const swapping = history.current.prev !== null && active !== null;
  const size = mobile ? SIZE.mobile : SIZE.desktop;
  const rest = mobile ? REST_SCALE.mobile : REST_SCALE.desktop;

  // At rest: one centered row.
  const spacing = mobile
    ? Math.min(112, (w - 100) / Math.max(total - 1, 1))
    : Math.min(200, (w - 360) / Math.max(total - 1, 1));
  const home = { x: (index - (total - 1) / 2) * spacing, y: logoOffset(h, mobile) };

  // Open: the chosen mark moves to the middle of the free space left of the
  // panel and grows; the others slide along the same line and fade.
  const panel = Math.max(416, Math.min(480, w * 0.34));
  const center = -(panel + 8) / 2;
  // Room between logos in the carousel, kept inside the free space left of the panel.
  const gap = Math.min(420, (w - panel) * 0.42);
  const move = mobile ? MOVE.mobile : MOVE.desktop;
  let position: { x: number; y: number; opacity: number };
  if (!open) position = { ...home, opacity: 1 };
  else if (mobile) position = selected ? { x: 0, y: -h * 0.27, opacity: 1 } : { ...home, opacity: 0 };
  else position = { x: center + gap * (index - active), y: 0, opacity: selected ? 1 : 0.35 };

  return (
    <li style={{ zIndex: selected ? 2 : 1 }}>
      <motion.div
        className={styles.anchor}
        initial={false}
        animate={position}
        transition={{ duration: swapping ? move * 0.85 : move, ease: EASE, opacity: { duration: 0.5, ease: EASE } }}
      >
        <button
          className={styles.logo}
          aria-label={`Open ${product.name}`}
          disabled={open && !selected}
          tabIndex={open ? -1 : 0}
          onClick={() => {
            if (!open) onSelect();
          }}
        >
          <motion.span
            className={styles.mark}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + 0.08 * index, duration: 0.9, ease: EASE }}
          >
            <motion.span
              className={styles.mark}
              initial={false}
              animate={{ scale: selected ? 1 : rest }}
              transition={{ duration: swapping ? move * 0.85 : move, ease: EASE }}
            >
              <MatrixLogo mark={MARKS[product.slug] ?? FALLBACK} size={size} index={index} />
            </motion.span>
          </motion.span>
          <span className={styles.name}>{product.name}</span>
        </button>
      </motion.div>
    </li>
  );
}

function Panel({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { mobile } = useViewport();
  // A fresh key on every change. Keyed by slug alone, going back to a product
  // whose content was still fading out revived that exiting copy, which then
  // stayed stuck at opacity 0 and left the panel blank.
  const version = useRef({ slug: product?.slug, n: 0 });
  if (version.current.slug !== product?.slug) version.current = { slug: product?.slug, n: version.current.n + 1 };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="panel"
          className={styles.overlay}
          initial={mobile ? { y: "100%" } : { opacity: 0, scale: 0.95 }}
          animate={mobile ? { y: 0 } : { opacity: 1, scale: 1 }}
          exit={
            mobile
              ? { y: "100%", transition: { duration: 0.4, ease: "easeInOut" } }
              : { opacity: 0, scale: 0.95, transition: { duration: 0.1 } }
          }
          transition={mobile ? { duration: 0.6, ease: EASE } : { duration: 0.15 }}
          onClick={onClose}
        >
          <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.close}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Close"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.8">
                <path d="M2 18L18 2M2 2l16 16" />
              </svg>
            </button>

            <AnimatePresence mode="popLayout">
              <motion.div
                key={`${product.slug}-${version.current.n}`}
                className={styles.panelInner}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Details product={product} />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Details({ product }: { product: Product }) {
  const { links } = product;
  const linkList = [
    links.site && { label: "Website", href: links.site },
    links.docs && { label: "Docs", href: links.docs },
    links.x && { label: "X", href: links.x },
    links.github && { label: "GitHub", href: links.github },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <>
      <motion.div
        className={styles.bio}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <h1>{product.name}</h1>
        <p>{product.bio}</p>
      </motion.div>

      <motion.dl
        className={styles.details}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        {product.details.map((d) => (
          <div key={d.label}>
            <dt>{d.label}</dt>
            <dd>
              {"tags" in d ? (
                <ul className={styles.tags}>
                  {d.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : (
                d.value
              )}
            </dd>
          </div>
        ))}
      </motion.dl>

      <motion.div
        className={styles.panelFooter}
        initial={{ opacity: 0, y: "-0.5rem" }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.3 }}
      >
        <ul className={styles.panelLinks}>
          {linkList.map((l) => (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" onClick={() => play("click")}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        {product.note && <p>{product.note}</p>}
      </motion.div>
    </>
  );
}

function MuteButton() {
  const muted = useMuted();
  return (
    <button
      className={styles.mute}
      onClick={() => {
        setMuted(!muted);
        if (muted) setTimeout(() => play("click"), 0);
      }}
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
        <AnimatePresence initial={false}>
          {muted ? (
            <motion.g key="off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <path d="M16 9.5l5 5M21 9.5l-5 5" />
            </motion.g>
          ) : (
            <motion.g key="on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
              <motion.path d="M18 7a7 7 0 0 1 0 10" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.08 }} />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </button>
  );
}

function Chevron({ flip }: { flip?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}
