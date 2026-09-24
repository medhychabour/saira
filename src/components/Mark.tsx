/* eslint-disable @next/next/no-img-element */
import type { Product } from "@/content/products";

// Product marks, drawn in the text color. Sources: rewards-front brand kit,
// warns/apps/dashboard logo.tsx, waken/web/public/logo.svg.

// `cut` fills holes so the sticker die-cut follows the outer contour only.
export type MarkShape = { viewBox: string; paths: string[]; cut?: string };

export const MARKS: Record<string, MarkShape> = {
  rewards: {
    viewBox: "0 0 220 220",
    paths: [
      "M128.9,33.5V5.1c0-2-1.5-3.7-3.4-4C120.4.4,115.2,0,110,0s-10.4.4-15.4,1.1c-2,.3-3.4,2-3.4,4v28.5c0,2.2,1.8,4,4,4h29.7c2.2,0,4-1.8,4-4h0ZM214.9,129.1c2,0,3.7-1.5,4-3.4.7-5.1,1.1-10.4,1.1-15.7s-.4-10.2-1.1-15.2c-.3-2-2-3.5-4-3.5h-49.6c-3.6,0-5.4-4.3-2.8-6.9l35.2-35.2c1.4-1.4,1.6-3.7.4-5.2-6.2-8.3-13.6-15.6-21.8-21.9-1.6-1.2-3.8-1-5.3.4l-31.9,31.9c-6.5,6.5-10.2,15.4-10.2,24.6v45.7c0,2.2-1.8,4-4,4h-29.7c-2.2,0-4-1.8-4-4v-45.7c0-9.2-3.7-18.1-10.2-24.6l-31.9-31.9c-1.4-1.4-3.7-1.6-5.3-.4-8.3,6.2-15.6,13.6-21.8,21.9-1.2,1.6-1,3.8.4,5.2l35.2,35.2c2.5,2.5.7,6.9-2.8,6.9H5c-2,0-3.7,1.5-4,3.5-.7,5-1.1,10.1-1.1,15.2s.4,10.6,1.1,15.7c.3,2,2,3.4,4,3.4h49.6c3.6,0,5.4,4.3,2.8,6.9l-35,35c-1.4,1.4-1.6,3.7-.4,5.3,6.2,8.3,13.6,15.6,21.9,21.8,1.6,1.2,3.8,1,5.2-.4l35-35c2.5-2.5,6.9-.7,6.9,2.8v49.4c0,2,1.5,3.7,3.4,4,5,.7,10.2,1.1,15.4,1.1s10.4-.4,15.4-1.1c2-.3,3.4-2,3.4-4v-49.4c0-3.6,4.3-5.4,6.9-2.8l35,35c1.4,1.4,3.7,1.6,5.2.4,8.3-6.2,15.6-13.6,21.9-21.8,1.2-1.6,1-3.8-.4-5.3l-35-35c-2.5-2.5-.7-6.9,2.8-6.9h49.6Z",
    ],
  },
  warns: {
    viewBox: "0 0 7 7",
    cut: "<rect x='1' y='1' width='5' height='5'/>",
    paths: [
      "M2 0h1v1H2zM4 0h1v1H4zM3 1h1v1H3zM0 2h1v1H0zM6 2h1v1H6zM1 3h1v1H1zM5 3h1v1H5zM0 4h1v1H0zM6 4h1v1H6zM3 5h1v1H3zM2 6h1v1H2zM4 6h1v1H4z",
    ],
  },
  waken: {
    viewBox: "0 0 734 734",
    cut: "<circle cx='367' cy='367' r='367'/>",
    paths: [
      "M128 367C128 498.996 235.004 606 367 606C498.996 606 606 498.996 606 367C606 359.049 605.614 351.206 604.863 343.488L732.261 331.09C733.412 342.922 734 354.902 734 367C734 569.689 569.689 734 367 734C164.312 734 1.39533e-05 569.688 0 367C0 354.902 0.587749 342.922 1.73926 331.09L129.137 343.488C128.386 351.206 128 359.049 128 367Z",
      "M156.141 254.359C148.816 268.034 142.791 282.492 138.223 297.571L15.7217 260.457C22.7644 237.212 32.0453 214.949 43.3066 193.924L156.141 254.359Z",
      "M690.693 193.924C701.955 214.949 711.236 237.212 718.278 260.457L595.777 297.571C591.209 282.492 585.184 268.034 577.859 254.359L690.693 193.924Z",
      "M215.405 182.219C203.292 192.171 192.171 203.292 182.219 215.405L83.3193 134.146C98.5637 115.593 115.593 98.5637 134.146 83.3193L215.405 182.219Z",
      "M599.854 83.3193C618.407 98.5637 635.436 115.593 650.681 134.146L551.781 215.405C541.829 203.292 530.709 192.171 518.596 182.219L599.854 83.3193Z",
      "M297.571 138.223C282.492 142.791 268.034 148.816 254.359 156.141L193.924 43.3066C214.949 32.0453 237.212 22.7644 260.457 15.7217L297.571 138.223Z",
      "M473.543 15.7217C496.788 22.7644 519.051 32.0453 540.076 43.3066L479.641 156.141C465.966 148.816 451.508 142.791 436.429 138.223L473.543 15.7217Z",
      "M367 0C379.098 0 391.078 0.587749 402.91 1.73926L390.512 129.137C382.794 128.386 374.951 128 367 128C359.049 128 351.206 128.386 343.488 129.137L331.09 1.73926C342.922 0.587746 354.902 0 367 0Z",
    ],
  },
};

export function Mark({ product, size }: { product: Product; size: number }) {
  if (product.image) {
    return <img src={product.image} alt={product.name} width={size} height={size} draggable={false} />;
  }

  const mark = MARKS[product.slug];
  if (!mark) {
    // A product without a mark yet: its initial in a circle.
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={product.name}>
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" />
        <text x="50" y="50" dy="0.35em" textAnchor="middle" fontSize="44" fontWeight="500" fill="currentColor">
          {product.name[0]}
        </text>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox={mark.viewBox} fill="currentColor" role="img" aria-label={product.name} shapeRendering={product.slug === "warns" ? "crispEdges" : undefined}>
      {mark.paths.map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  );
}
