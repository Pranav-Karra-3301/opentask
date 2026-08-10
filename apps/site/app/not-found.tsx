import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-[var(--site-max)] flex-col items-center px-5 py-32 text-center">
      <p className="font-mono text-[13px] text-text-tertiary">404</p>
      <h1 className="mt-3 font-semibold text-3xl text-text-primary tracking-[-0.02em]">
        That page does not exist
      </h1>
      <p className="mt-3 max-w-md text-[15px] text-text-secondary">
        It may have moved, or it may never have been here. The documentation index is a good place
        to pick the thread back up.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-sm bg-accent px-5 py-2.5 font-medium text-[15px] text-on-accent transition-colors hover:bg-accent-hover"
        >
          Back home
        </Link>
        <Link
          href="/docs"
          className="rounded-sm border border-border bg-surface-raised px-5 py-2.5 font-medium text-[15px] text-text-primary transition-colors hover:bg-hover"
        >
          Read the docs
        </Link>
      </div>
    </div>
  )
}
