/**
 * A screenshot in a browser-ish frame, with the light and dark captures swapped by CSS so the
 * figure always matches the page's theme. Both sources ship in the HTML; `<picture>` cannot key
 * off our `data-theme` attribute, so the swap is done with two <img>s and `dark:` utilities.
 *
 * Sources come from `pnpm screenshots` (scripts/capture-screenshots.mjs → WebP at 1440/720).
 */
export function Shot({
  name,
  alt,
  priority = false,
  className = '',
}: {
  /** Base name in /public/screenshots, e.g. "hero" → hero-1440.webp + hero-dark-1440.webp */
  name: string
  alt: string
  priority?: boolean
  className?: string
}) {
  const common = 'w-full h-auto'
  const sizes = '(min-width: 1024px) 1024px, 100vw'
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-surface-raised shadow-[0_20px_60px_-25px_rgb(0_0_0/0.35)] ${className}`}
    >
      {/* Chrome bar — pure decoration, hidden from the a11y tree. */}
      <div
        aria-hidden="true"
        className="flex h-8 items-center gap-1.5 border-border border-b bg-surface px-3.5"
      >
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
      </div>
      <img
        src={`/screenshots/${name}-1440.webp`}
        srcSet={`/screenshots/${name}-720.webp 720w, /screenshots/${name}-1440.webp 1440w`}
        sizes={sizes}
        alt={alt}
        width={1440}
        height={900}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        className={`${common} dark:hidden`}
      />
      <img
        src={`/screenshots/${name}-dark-1440.webp`}
        srcSet={`/screenshots/${name}-dark-720.webp 720w, /screenshots/${name}-dark-1440.webp 1440w`}
        sizes={sizes}
        alt=""
        aria-hidden="true"
        width={1440}
        height={900}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`${common} hidden dark:block`}
      />
    </div>
  )
}
