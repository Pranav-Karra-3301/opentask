import Link from 'next/link'
import { CopyButton } from '@/components/copy-button'
import { Shot } from '@/components/shot'
import { DEMO_URL, DOCKER_RUN, REPO_URL } from '@/lib/site'

/** The README's own feature taxonomy, one section per verb. */
const SECTIONS = [
  {
    kicker: 'Capture',
    title: 'Type it the way you say it',
    body: 'The full Todoist Quick Add grammar: natural-language dates like “tom 4pm” or “mid january”, #project, /section, @label, p1 to p4, {deadlines}, !reminders, “for 45min” durations, and // descriptions. Tokens highlight as you type and land as structured fields.',
    shot: 'quick-add',
    alt: 'Quick Add parsing “Prepare launch notes tomorrow 9am p2 #Work @deep-work” into chips',
    link: { href: '/docs/install', label: 'Get started' },
  },
  {
    kicker: 'Organize',
    title: 'Projects, sections, labels, filters',
    body: 'Nested projects with sections and a 20-colour palette. The Todoist filter language is here in full: & | ! ( ), date and deadline operators, @label wildcards, ##Project with descendants, search:, subtask. Every view can be a list or a kanban board.',
    shot: 'board',
    alt: 'A project rendered as a kanban board with Admin and Meetings columns',
    reversed: true,
    link: { href: '/docs/faq', label: 'What it does and does not do' },
  },
  {
    kicker: 'Plan',
    title: 'Today, Upcoming, and a keyboard for everything',
    body: 'Overdue rolls up with one-tap reschedule. Upcoming is a week strip you can drag tasks between. ⌘K opens a fuzzy palette over every view, project, and action, and every destructive edit has a 10-second undo.',
    shot: 'upcoming',
    alt: 'The Upcoming view showing a week strip with tasks grouped by day',
    link: { href: '/docs/cli', label: 'Also: a CLI' },
  },
  {
    kicker: 'Measure',
    title: 'Goals, streaks, and unlimited history',
    body: 'Daily and weekly goals, karma, vacation mode, and an activity feed that never truncates, because the database is yours and nobody is upselling you a history add-on.',
    shot: 'reporting',
    alt: 'The Reporting view showing daily completion counts and streaks',
    reversed: true,
  },
]

const CARDS = [
  {
    title: 'Reminders that arrive',
    body: 'Web Push on desktop and mobile (iOS 16.4+ after Add to Home Screen), plus ntfy, Gotify, and webhook channels.',
    href: '/docs/configuration',
  },
  {
    title: 'A real REST API',
    body: 'Every route zod-typed into OpenAPI, cursor pagination, SSE live updates, and scoped ot_… tokens.',
    href: '/api',
  },
  {
    title: 'Calendar feed',
    body: 'A read-only tokenized webcal:// feed your phone’s calendar can subscribe to.',
    href: '/docs/faq',
  },
]

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-[var(--site-max)] px-5 pt-14 pb-12 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <a
            href={`${REPO_URL}/releases`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[12.5px] text-text-secondary transition-colors hover:text-text-primary"
          >
            <span className="size-1.5 rounded-full bg-accent" />
            v0.5.0: board layout, desktop app, audio cues
          </a>
          <h1 className="mt-5 text-balance font-semibold text-[2.6rem] text-text-primary leading-[1.08] tracking-[-0.03em] sm:text-6xl">
            The task manager you actually own
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[17px] text-text-secondary leading-relaxed">
            OpenTask speaks the Todoist workflow you already know: the Quick Add grammar, the filter
            language, the keyboard map. Without the cloud, the subscription, or the second user you
            never wanted.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={DEMO_URL}
              className="rounded-full bg-accent px-5 py-2.5 font-medium text-[15px] text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Try the live demo
            </a>
            <Link
              href="/docs/install"
              className="rounded-full border border-border px-5 py-2.5 font-medium text-[15px] text-text-primary transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Install it
            </Link>
          </div>
          <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 overflow-hidden rounded-full border border-border py-2 pr-2 pl-4">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-left font-mono text-[12.5px] text-text-secondary">
              {DOCKER_RUN}
            </code>
            <CopyButton text={DOCKER_RUN} />
          </div>
        </div>

        <div className="mt-14">
          <Shot
            name="hero"
            priority
            alt="The OpenTask Today view: an overdue section with one-tap reschedule, priority colours, and the project sidebar"
          />
        </div>
      </section>

      {/* Feature sections */}
      {SECTIONS.map((section) => (
        <section key={section.kicker} className="mx-auto max-w-[var(--site-max)] px-5 py-14">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className={section.reversed ? 'lg:order-2' : undefined}>
              <p className="font-medium text-[12.5px] text-accent uppercase tracking-[0.08em]">
                {section.kicker}
              </p>
              <h2 className="mt-3 text-balance font-semibold text-3xl text-text-primary tracking-[-0.02em]">
                {section.title}
              </h2>
              <p className="mt-4 text-pretty text-[15.5px] text-text-secondary leading-relaxed">
                {section.body}
              </p>
              {section.link && (
                <Link
                  href={section.link.href}
                  className="mt-5 inline-block font-medium text-[14px] text-accent hover:underline"
                >
                  {section.link.label} →
                </Link>
              )}
            </div>
            <Shot
              name={section.shot}
              alt={section.alt}
              className={section.reversed ? 'lg:order-1' : undefined}
            />
          </div>
        </section>
      ))}

      {/* Own your data */}
      <section className="mx-auto max-w-[var(--site-max)] px-5 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-medium text-[12.5px] text-accent uppercase tracking-[0.08em]">
            Own your data
          </p>
          <h2 className="mt-3 text-balance font-semibold text-3xl text-text-primary tracking-[-0.02em]">
            Easy to move in. Easy to leave.
          </h2>
          <p className="mt-4 text-pretty text-[15.5px] text-text-secondary leading-relaxed">
            Import from Todoist with a backup ZIP or a live API token. Export a full JSON snapshot
            or per-project CSV whenever you like. Nightly{' '}
            <code className="font-mono text-[13px]">VACUUM INTO</code> snapshots with retention and
            one-click restore. It is one SQLite file, so the exit is always open, which is the only
            reason to trust the entrance.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          {CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="rounded-xl border border-border p-5 transition-colors hover:border-accent"
            >
              <h3 className="font-medium text-[15px] text-text-primary">{card.title}</h3>
              <p className="mt-2 text-[13.5px] text-text-secondary leading-relaxed">{card.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Close */}
      <section className="mx-auto max-w-[var(--site-max)] px-5 pb-4">
        <div className="mx-auto max-w-2xl px-6 py-10 text-center">
          <h2 className="text-balance font-semibold text-3xl text-text-primary tracking-[-0.02em]">
            Run it in about a minute
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] text-text-secondary">
            One container, one <code className="font-mono text-[13px]">/data</code> volume, port
            7968. Then open it and create your account. Registration locks itself after the first
            user.
          </p>
          <div className="mx-auto mt-6 flex max-w-xl items-center gap-2 overflow-hidden rounded-full border border-border py-2 pr-2 pl-4">
            <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-left font-mono text-[12.5px] text-text-secondary">
              {DOCKER_RUN}
            </code>
            <CopyButton text={DOCKER_RUN} />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/install"
              className="rounded-full bg-accent px-5 py-2.5 font-medium text-[15px] text-on-accent transition-colors hover:bg-accent-hover"
            >
              Read the install guide
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border px-5 py-2.5 font-medium text-[15px] text-text-primary transition-colors hover:bg-hover"
            >
              Star it on GitHub
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
