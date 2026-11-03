/**
 * Shared SVG clip paths for the site's signature shapes: an arch (hump on top,
 * dip at the bottom) and a ribbon with wavy sides. Used via .mask-arch and
 * .mask-ribbon in globals.css. Rendered once in the root layout.
 */
export function ShapeDefs() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" className="absolute">
      <defs>
        <clipPath id="veno-arch" clipPathUnits="objectBoundingBox">
          <path d="M0 0.16 C0.25 -0.05 0.75 -0.05 1 0.16 L1 1 C0.75 0.86 0.25 0.86 0 1 Z" />
        </clipPath>
        <clipPath id="veno-ribbon" clipPathUnits="objectBoundingBox">
          <path d="M0.04 0 L1 0 C0.9 0.2 1 0.4 0.96 0.6 C0.92 0.8 1 0.9 0.98 1 L0.06 1 C0.12 0.85 0.02 0.7 0.08 0.5 C0.14 0.3 0 0.15 0.04 0 Z" />
        </clipPath>
      </defs>
    </svg>
  )
}
