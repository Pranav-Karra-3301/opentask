import manifest from '@/public/screenshots/manifest.json'

/**
 * A screenshot in a browser-ish frame, with the light and dark captures swapped by CSS so the
 * figure always matches the page's theme. Both sources ship in the HTML; `<picture>` cannot key
 * off our `data-theme` attribute, so the swap is done with two <img>s and `dark:` utilities.
 *
 * Sources and dimensions both come from `pnpm screenshots`
 * (scripts/capture-screenshots.mjs → WebP at 1440/720 + manifest.json). Every desktop capture is
 * cropped to a different zoom level but the same 16:10 box, so the figures share one shape; the
 * phone shot is portrait. Dimensions are still read per image, so a shot that later changes shape
 * cannot silently reintroduce layout shift.
 */
const sizes: Record<string, { width: number; height: number }> = manifest

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
  const light = sizes[name] ?? { width: 1440, height: 900 }
  const dark = sizes[`${name}-dark`] ?? light
  const common = 'w-full h-auto'
  const sizesAttr = '(min-width: 1024px) 1024px, 100vw'

  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-surface-raised shadow-[0_18px_50px_-30px_rgb(0_0_0/0.45)] ${className}`}
    >
      {/* Chrome bar, pure decoration and hidden from the a11y tree. */}
      <div
        aria-hidden="true"
        className="flex h-8 items-center gap-1.5 border-border/70 border-b px-3.5"
      >
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
      </div>
      <img
        src={`/screenshots/${name}-1440.webp`}
        srcSet={`/screenshots/${name}-720.webp 720w, /screenshots/${name}-1440.webp 1440w`}
        sizes={sizesAttr}
        alt={alt}
        width={light.width}
        height={light.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        className={`${common} dark:hidden`}
      />
      <img
        src={`/screenshots/${name}-dark-1440.webp`}
        srcSet={`/screenshots/${name}-dark-720.webp 720w, /screenshots/${name}-dark-1440.webp 1440w`}
        sizes={sizesAttr}
        alt=""
        aria-hidden="true"
        width={dark.width}
        height={dark.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`${common} hidden dark:block`}
      />
    </div>
  )
}
