"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { products, studio, type Product, type Surface } from "@/content/products";
import { play, setMuted, useMuted } from "@/lib/sfx";
import { Badge, TONES } from "./Badge";
import { DetailIcons } from "./DetailIcon";
import { MARKS, type MarkShape } from "./Mark";
import { MatrixLogo } from "./MatrixLogo";
import { SAIRA_MARK } from "./SairaLogo";
import { SiteFooter } from "./SiteFooter";
import styles from "./Home.module.css";

const EASE = [0.19, 1, 0.22, 1] as const;
// How long the logos take to move and grow or shrink; the text stays hidden meanwhile.
const MOVE = { desktop: 0.9, mobile: 0.5 };
const INTRO_HIDDEN = { opacity: 0, filter: "blur(10px)", y: 6 };
const INTRO_SHOWN = { opacity: 1, filter: "blur(0px)", y: 0 };
const MOBILE = 920;
// Colour of the product logos. "blue" was the previous choice, kept to switch back.
const LOGO_TONE = "white";
// When the footer logo starts its intro; the links follow once it is complete.
const LOGO_REVEAL = 0.6;
// Each surface keeps the same badge tone in every product.
const SURFACE_TONE: Record<Surface, string> = {
  API: TONES.green,
  App: TONES.blue,
  CLI: TONES.orange,
  MCP: TONES.cyan,
  SDK: TONES.pink,
};
// Logos are drawn at their open size and scaled down at rest, so they stay sharp.
const SIZE = { desktop: 260, mobile: 190 };
const REST_SCALE = 0.6;
// A product without a mark yet gets a plain disc.
const FALLBACK: MarkShape = { viewBox: "0 0 100 100", paths: ["M50 2a48 48 0 1 0 0.01 0Z"] };

// Until the intro is measured, the logos sit a little below the middle.
const logoOffset = (h: number, mobile: boolean) => (mobile ? h * 0.22 : Math.min(150, h * 0.16));
// Phones in landscape: little height, so everything tightens up.
const SHORT = 500;

// On phones the row of logos fills the width, up to a cap, and stays smaller
// in landscape where height is scarce. Returns the gap between centres and
// the size of each logo at rest, in pixels.
function phoneRow(w: number, h: number) {
  const spacing = Math.min(150, (w - 32) / products.length);
  return { spacing, logo: Math.min(h < SHORT ? 100 : 135, spacing * 0.95) };
}
// Below this height the logotype makes way for the text and logos.
const LOGOTYPE_MIN_H = { desktop: 680, mobile: 620 };

// The intro and the logos below it are centred as one group between the top
// of the page and the footer logo, never starting under the sound toggle on
// phones. Returns where the intro starts and how far below the middle the
// logos sit.
function groupLayout(w: number, h: number, mobile: boolean, introH: number, footerH: number) {
  const short = mobile && h < SHORT;
  const footerTop = h - (short ? 16 : 32) - footerH;
  const logo = mobile ? phoneRow(w, h).logo : SIZE.desktop * REST_SCALE;
  const minTop = mobile ? (short ? 16 : 60) : 24;
  // Tight phone screens close up the space between the text and the logos.
  const gap = mobile && footerTop - 16 - minTop - introH - logo <= 120 ? 24 : 48;
  const start = Math.max(minTop, (footerTop - introH - gap - logo) / 2);
  return { introTop: start, logoY: start + introH + gap + logo / 2 - h / 2 };
}

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
  const { w, h, mobile } = useViewport();
  const open = active !== null;

  // The group is placed from the real heights of the intro and the footer.
  const mainRef = useRef<HTMLElement>(null);
  const introRef = useRef<HTMLElement>(null);
  const [heights, setHeights] = useState({ intro: 0, footer: 0 });
  useLayoutEffect(() => {
    const intro = introRef.current;
    const footer = mainRef.current?.querySelector("footer");
    if (!intro || !footer) return;
    const measure = () => setHeights({ intro: intro.offsetHeight, footer: footer.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(intro);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);
  const layout = heights.intro ? groupLayout(w, h, mobile, heights.intro, heights.footer) : null;
  const logoY = layout?.logoY ?? logoOffset(h, mobile);
  const showLogotype = h >= (mobile ? LOGOTYPE_MIN_H.mobile : LOGOTYPE_MIN_H.desktop);
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
    <main
      ref={mainRef}
      className={styles.main}
      data-open={open}
      data-closing={closing}
      style={{ "--logo-y": `${logoY}px`, "--intro-top": layout ? `${layout.introTop}px` : undefined } as React.CSSProperties}
    >
      <MuteButton />

      <section ref={introRef} className={styles.intro}>
        {/* The page title, for search engines and screen readers; the logos say it visually. */}
        <h1 className="sr-only">{studio.name}</h1>
        <div>
          {/* The Saira symbol, centred, in the same code style as the product logos. */}
          {showLogotype && (
            <motion.div
              className={styles.logotype}
              initial={INTRO_HIDDEN}
              animate={introShown ? INTRO_SHOWN : INTRO_HIDDEN}
              transition={introShown ? { duration: loaded.current ? 0.8 : 1.1, ease: EASE, delay: loaded.current ? 0 : 0.1 } : { duration: 0.25, ease: EASE }}
            >
              {/* Smaller on short screens, so the text never runs off the top. */}
              {mobile ? (
                <MatrixLogo key="phone" mark={SAIRA_MARK} size={120} tone={LOGO_TONE} grid={{ rows: 22, cols: 36 }} index={products.length} />
              ) : h < 800 ? (
                <MatrixLogo key="small" mark={SAIRA_MARK} size={72} tone={LOGO_TONE} grid={{ rows: 16, cols: 26 }} index={products.length} />
              ) : (
                <MatrixLogo key="large" mark={SAIRA_MARK} size={120} tone={LOGO_TONE} grid={{ rows: 22, cols: 36 }} index={products.length} />
              )}
            </motion.div>
          )}
          {studio.intro.map((p, i) => (
            <motion.p
              key={p.slice(0, 24)}
              initial={INTRO_HIDDEN}
              animate={introShown ? INTRO_SHOWN : INTRO_HIDDEN}
              transition={
                introShown
                  ? { duration: loaded.current ? 0.8 : 1.1, ease: EASE, delay: (loaded.current ? 0 : 0.15) + (i + 1) * (loaded.current ? 0.1 : 0.18) }
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
            <LogoItem key={p.slug} product={p} index={i} active={active} restY={logoY} onSelect={() => select(i)} />
          ))}
        </ul>
      </div>

      <SiteFooter className={styles.footer} reveal={LOGO_REVEAL} />

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
      <a key={i} href={product.links.site} target="_blank" rel="noopener noreferrer">
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
  restY,
  onSelect,
}: {
  product: Product;
  index: number;
  active: number | null;
  restY: number;
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
  const row = phoneRow(w, h);
  const rest = mobile ? row.logo / SIZE.mobile : REST_SCALE;

  // At rest: one centered row.
  const spacing = mobile ? row.spacing : Math.min(200, (w - 360) / Math.max(total - 1, 1));
  const home = { x: (index - (total - 1) / 2) * spacing, y: restY };
  // On phones the open row is centred in the room above the sheet (60% of the
  // height) and the chosen mark shrinks when that room is short, as in landscape.
  const above = h * 0.4 - 4;
  const openScale = mobile ? Math.min(1, (above - 32) / size) : 1;

  // Open: the chosen mark moves to the middle of the free space left of the
  // panel and grows; the others slide along the same line and fade.
  const panel = Math.max(416, Math.min(480, w * 0.34));
  const center = -(panel + 8) / 2;
  // Room between logos in the carousel, kept inside the free space left of the
  // panel. On phones the neighbours peek in from the edges.
  const gap = mobile ? Math.min(w * 0.55, size * openScale + 60) : Math.min(420, (w - panel) * 0.42);
  const move = mobile ? MOVE.mobile : MOVE.desktop;
  let position: { x: number; y: number; opacity: number };
  if (!open) position = { ...home, opacity: 1 };
  else position = {
    x: (mobile ? 0 : center) + gap * (index - active),
    y: mobile ? above / 2 - h / 2 : 0,
    opacity: selected ? 1 : 0.35,
  };

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
              animate={{ scale: selected ? openScale : rest }}
              transition={{ duration: swapping ? move * 0.85 : move, ease: EASE }}
            >
              <MatrixLogo mark={MARKS[product.slug] ?? FALLBACK} size={size} index={index} tone={LOGO_TONE} />
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

// Panel content comes in piece by piece: title, text, each detail row, then
// the links, each from a soft blur and a few pixels lower.
const REVEAL = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
};
const REVEAL_ITEM = {
  hidden: { opacity: 0, filter: "blur(8px)", y: 6 },
  shown: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.55, ease: EASE } },
};

const LINK_ICONS: Record<"site" | "docs" | "x" | "github", { label: string; icon: React.ReactNode }> = {
  site: {
    label: "Website",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
      </svg>
    ),
  },
  docs: {
    label: "Docs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
        <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
      </svg>
    ),
  },
  x: {
    label: "X",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.18l-4.84-6.33L5.44 21H2.37l7.17-8.2L2 3h6.33l4.37 5.78zm-1.08 16.2h1.7L7.4 4.72H5.58z" />
      </svg>
    ),
  },
  github: {
    label: "GitHub",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
      </svg>
    ),
  },
};

function Details({ product }: { product: Product }) {
  const links = (Object.keys(LINK_ICONS) as (keyof typeof LINK_ICONS)[]).filter((k) => product.links[k]);

  return (
    <motion.div className={styles.panelContent} variants={REVEAL} initial="hidden" animate="shown">
      <div className={styles.bio}>
        <motion.h1 variants={REVEAL_ITEM}>{product.name}</motion.h1>
        <motion.p variants={REVEAL_ITEM}>{product.bio}</motion.p>
      </div>

      <dl className={styles.details}>
        {product.details.map((d) => (
          <motion.div key={d.label} variants={REVEAL_ITEM}>
            <dt>{d.label}</dt>
            <dd>
              {"surfaces" in d ? (
                <ul className={styles.tags}>
                  {[...d.surfaces].sort().map((t) => (
                    <li key={t}>
                      <Badge tone={SURFACE_TONE[t]}>{t}</Badge>
                    </li>
                  ))}
                </ul>
              ) : "icons" in d ? (
                <DetailIcons icons={d.icons} />
              ) : (
                d.value
              )}
            </dd>
          </motion.div>
        ))}
      </dl>

      <motion.div className={styles.panelFooter} variants={REVEAL_ITEM}>
        <ul className={styles.panelLinks}>
          {links.map((k) => (
            <li key={k}>
              <a
                href={product.links[k]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={LINK_ICONS[k].label}
                title={LINK_ICONS[k].label}
              >
                {LINK_ICONS[k].icon}
              </a>
            </li>
          ))}
        </ul>
        {product.note && <p>{product.note}</p>}
      </motion.div>
    </motion.div>
  );
}

function MuteButton() {
  const muted = useMuted();
  return (
    <button
      className={styles.mute}
      onClick={() => {
        setMuted(!muted);
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
