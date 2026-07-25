/**
 * Build-time Markdown pipeline for the docs and changelog pages.
 *
 * The content is NOT copied into this package — it is read straight from the repo's own
 * `docs/*.md` and `CHANGELOG.md` at build time. That is the whole reason the site lives in the
 * monorepo: there is no sync step to forget, and a docs edit ships with the next deploy.
 *
 * Two rewrites are non-negotiable, because the same files have to keep working on GitHub:
 *   1. Cross-links are written for GitHub as bare `install.md` / `faq.md#anchor`. On the site
 *      those must become `/docs/install` / `/docs/faq#anchor`.
 *   2. Asset references are repo-relative (`assets/brand/icon-green.svg`,
 *      `docs/screenshots/hero.png`). On the site they must resolve under `/`.
 * Absolute URLs and in-page anchors are left alone.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, posix } from 'node:path'
import type { Element, Root } from 'hast'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { REPO_BLOB } from './site'

/** Repo root, resolved from this package (apps/site/lib → ../../..). */
export const REPO_ROOT = join(process.cwd(), '..', '..')
export const DOCS_DIR = join(REPO_ROOT, 'docs')

/** Docs pages, in the order docs/README.md's table presents them. */
export const DOC_ORDER = [
  'install',
  'configuration',
  'import-todoist',
  'voice-ramble',
  'backups',
  'api',
  'cli',
  'faq',
] as const

export const DOC_TITLES: Record<string, string> = {
  install: 'Install & first run',
  configuration: 'Configuration',
  'import-todoist': 'Import from Todoist',
  'voice-ramble': 'Ramble — voice capture',
  backups: 'Backups & restore',
  api: 'REST API',
  cli: 'Command-line client',
  faq: 'FAQ',
}

/** Every `.md` in docs/ except the index, so a new page is a build error, not a silent omission. */
export async function listDocSlugs(): Promise<string[]> {
  const files = await readdir(DOCS_DIR)
  return files
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => f.replace(/\.md$/, ''))
}

/**
 * Rewrite GitHub-shaped links/images for the site. Runs on hast so it sees the final
 * attributes, including those GFM produced.
 *
 * `baseDir` is the rendered document's own directory relative to the repo root ('docs' for a
 * docs page, '' for CHANGELOG.md). Relative links are resolved against it before being turned
 * into GitHub URLs — a docs page writing `../deploy/demo/entrypoint.sh` means
 * `deploy/demo/entrypoint.sh`, and naively stripping `./` produced
 * `blob/main/../deploy/...`, which browsers normalise into a URL that has eaten the branch name.
 */
function rewriteRepoLinks(baseDir: string) {
  /** Resolve a repo-relative href against baseDir, collapsing `.` and `..`. */
  const fromRepoRoot = (href: string): string => posix.normalize(posix.join(baseDir, href))

  return () => (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName === 'a') {
        const href = node.properties?.href
        if (typeof href !== 'string') return
        if (/^([a-z]+:)?\/\//i.test(href) || href.startsWith('#') || href.startsWith('mailto:')) {
          return
        }
        // `install.md`, `./install.md`, `faq.md#reopening-registration` — a sibling docs page.
        const doc = href.match(/^\.?\/?([\w-]+)\.md(#.*)?$/)
        if (doc && baseDir === 'docs') {
          node.properties.href =
            doc[1] === 'README' ? `/docs${doc[2] ?? ''}` : `/docs/${doc[1]}${doc[2] ?? ''}`
          return
        }
        // Anything else repo-relative (LICENSE, deploy/…) has no site page — send it to the
        // file on GitHub rather than 404ing.
        node.properties.href = `${REPO_BLOB}/${fromRepoRoot(href)}`
        return
      }
      if (node.tagName === 'img') {
        const src = node.properties?.src
        if (typeof src !== 'string' || /^([a-z]+:)?\/\//i.test(src)) return
        // Resolved to a repo path first, then mapped into /public: `docs/screenshots/hero.png`
        // is served at `/screenshots/hero.png`, `assets/brand/icon.svg` at `/…` as copied.
        node.properties.src = `/${fromRepoRoot(src).replace(/^docs\//, '')}`
      }
    })
  }
}

/** Wrap tables so wide reference tables scroll instead of blowing out the page width. */
function wrapTables() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table' || parent === undefined || index === undefined) return
      const p = parent as Element
      if (p.tagName === 'div' && (p.properties?.className as string[])?.includes('table-scroll')) {
        return
      }
      p.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [node],
      } as Element
    })
  }
}

/** Concatenated text of a hast subtree — the plain-text form of a heading. */
function textOf(node: Element): string {
  let out = ''
  visit(node, 'text', (child: { value: string }) => {
    out += child.value
  })
  return out.trim()
}

/**
 * Add a `#` anchor to each h2/h3 (rehype-slug has already assigned the ids) and collect the h2s
 * for the on-page TOC.
 *
 * The TOC is gathered HERE, from the tree, rather than by regexing the rendered HTML: rehype
 * escapes `&` in text nodes as `&#x26;`, so a scrape of the output string put a literal
 * "speech-to-text &#x26; LLM" in the sidebar. Reading the tree sidesteps entity decoding
 * altogether.
 */
function headingAnchors(collect: { id: string; text: string }[]) {
  return () => (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'h2' && node.tagName !== 'h3') return
      const id = node.properties?.id
      if (typeof id !== 'string') return
      if (node.tagName === 'h2') {
        const text = textOf(node)
        if (text) collect.push({ id, text })
      }
      node.children.push({
        type: 'element',
        tagName: 'a',
        properties: { href: `#${id}`, className: ['heading-anchor'], 'aria-hidden': 'true' },
        children: [{ type: 'text', value: '#' }],
      } as Element)
    })
  }
}

/**
 * A processor is built per render because the heading collector is per-document state; sharing
 * one instance across pages would accumulate another page's headings into this page's TOC.
 */
function buildProcessor(collect: { id: string; text: string }[], baseDir: string) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(headingAnchors(collect))
    .use(rewriteRepoLinks(baseDir))
    .use(wrapTables)
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
}

/** Render Markdown, also returning the h2 outline for the on-page TOC. */
export async function renderMarkdownWithToc(
  source: string,
  baseDir: string,
): Promise<{ html: string; toc: { id: string; text: string }[] }> {
  const toc: { id: string; text: string }[] = []
  const file = await buildProcessor(toc, baseDir).process(source)
  return { html: String(file), toc }
}

/** `baseDir` = the document's directory relative to the repo root ('docs', or '' for the root). */
export async function renderMarkdown(source: string, baseDir: string): Promise<string> {
  return (await renderMarkdownWithToc(source, baseDir)).html
}

export interface RenderedDoc {
  slug: string
  title: string
  html: string
  /** h2 headings, for the on-page table of contents. */
  toc: { id: string; text: string }[]
}

/** The document's first `# heading`, which the site renders as the page title instead. */
function extractTitle(markdown: string, fallback: string): { title: string; body: string } {
  const match = markdown.match(/^#\s+(.+)$/m)
  const heading = match?.[1]?.trim()
  if (!match || match.index === undefined || !heading) return { title: fallback, body: markdown }
  const body = markdown.slice(0, match.index) + markdown.slice(match.index + match[0].length)
  return { title: heading, body }
}

export async function loadDoc(slug: string): Promise<RenderedDoc> {
  const raw = await readFile(join(DOCS_DIR, `${slug}.md`), 'utf8')
  const { title, body } = extractTitle(raw, DOC_TITLES[slug] ?? slug)
  const { html, toc } = await renderMarkdownWithToc(body, 'docs')
  return { slug, title, html, toc }
}

export interface ChangelogRelease {
  version: string
  date: string | null
  html: string
}

/**
 * Split CHANGELOG.md into releases. git-cliff writes `## [0.5.0] - 2026-07-23` headings
 * (see cliff.toml), so each release becomes its own card rather than one endless page.
 */
export async function loadChangelog(): Promise<ChangelogRelease[]> {
  const raw = await readFile(join(REPO_ROOT, 'CHANGELOG.md'), 'utf8')
  const releases: ChangelogRelease[] = []
  const re = /^##\s+\[?([^\]\s]+)\]?(?:\s+-\s+(\S+))?\s*$/gm
  const matches = [...raw.matchAll(re)]
  for (const [i, m] of matches.entries()) {
    const start = (m.index ?? 0) + m[0].length
    const end = i + 1 < matches.length ? (matches[i + 1]?.index ?? raw.length) : raw.length
    // Demote the release's own h3s so the page's heading order stays h1 → h2 → h3.
    const body = raw.slice(start, end).trim()
    releases.push({
      version: m[1] ?? '',
      date: m[2] ?? null,
      html: await renderMarkdown(body, ''),
    })
  }
  return releases
}
