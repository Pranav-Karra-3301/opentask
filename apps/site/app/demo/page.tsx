import type { Metadata } from 'next'
import Link from 'next/link'
import { CopyButton } from '@/components/copy-button'
import { Shot } from '@/components/shot'
import { DEMO_URL, DOCKER_RUN } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Live demo',
  description:
    'Try OpenTask in your browser. Sample data, no signup, and it wipes itself every 30 minutes.',
  alternates: { canonical: '/demo' },
}

const RULES = [
  {
    title: 'Nothing you do is saved',
    body: 'The instance wipes its database and re-seeds every 30 minutes. A banner in the app counts down to the next reset. Do not put anything real in it.',
  },
  {
    title: 'Everyone shares one instance',
    body: 'It is a single container, not a sandbox per visitor, so you may see edits someone else made a few minutes ago. That is the demo working, not breaking.',
  },
  {
    title: 'Some things are switched off',
    body: 'Backups, the Todoist importer, file attachments, API tokens, push and webhook channels, and account changes are all refused by the server. They are the parts that would let a stranger reach out of the box or lock you out.',
  },
  {
    title: 'Everything else is the real thing',
    body: 'Same code, same database engine, same API. Quick Add, recurrence, filters, search, boards, and productivity all behave exactly as they do on your own instance.',
  },
]

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-[var(--site-max)] px-5 py-14">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-medium text-[12.5px] text-accent uppercase tracking-[0.08em]">
          Live demo
        </p>
        <h1 className="mt-3 text-balance font-semibold text-[2.4rem] text-text-primary leading-[1.1] tracking-[-0.03em] sm:text-5xl">
          Try it before you host it
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-[16.5px] text-text-secondary leading-relaxed">
          A real OpenTask instance, pre-loaded with sample projects and tasks. No signup, no email,
          no cookie banner. One button and you are in.
        </p>
        <a
          href={DEMO_URL}
          className="mt-8 inline-block rounded-sm bg-accent px-6 py-3 font-medium text-[16px] text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Open the demo →
        </a>
        <p className="mt-3 text-[13px] text-text-tertiary">
          Log in with the button on the sign-in screen, or use{' '}
          <code className="font-mono text-[12.5px]">demo@opentask.local</code> /{' '}
          <code className="font-mono text-[12.5px]">opentask-demo</code>.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-4xl">
        <Shot name="hero" priority alt="The OpenTask Today view as it appears in the demo" />
      </div>

      <div className="mx-auto mt-16 max-w-3xl">
        <h2 className="font-semibold text-2xl text-text-primary tracking-[-0.02em]">
          How the demo works
        </h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {RULES.map((rule) => (
            <div key={rule.title} className="rounded-lg border border-border bg-surface p-5">
              <dt className="font-medium text-[15px] text-text-primary">{rule.title}</dt>
              <dd className="mt-2 text-[13.5px] text-text-secondary leading-relaxed">
                {rule.body}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mx-auto mt-16 max-w-3xl rounded-xl border border-border bg-surface px-6 py-10 text-center">
        <h2 className="text-balance font-semibold text-2xl text-text-primary tracking-[-0.02em]">
          Liked it? It is one command.
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-[15px] text-text-secondary">
          Your own instance keeps its data, does not reset, and has every feature the demo switches
          off.
        </p>
        <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 overflow-hidden rounded-lg border border-border bg-bg px-3 py-2.5">
          <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-left font-mono text-[12.5px] text-text-secondary">
            {DOCKER_RUN}
          </code>
          <CopyButton text={DOCKER_RUN} />
        </div>
        <Link
          href="/docs/install"
          className="mt-6 inline-block rounded-sm bg-accent px-5 py-2.5 font-medium text-[15px] text-on-accent transition-colors hover:bg-accent-hover"
        >
          Read the install guide
        </Link>
      </div>

      <p className="mx-auto mt-10 max-w-3xl text-center text-[13px] text-text-tertiary">
        Want a disposable instance of your own? Any OpenTask container started with{' '}
        <code className="font-mono text-[12.5px]">OPENTASK_DEMO_MODE=true</code> behaves exactly
        like this one. See{' '}
        <Link href="/docs/install" className="text-accent hover:underline">
          the install guide
        </Link>
        .
      </p>
    </div>
  )
}
