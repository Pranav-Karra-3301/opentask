import type { Metadata, Viewport } from 'next'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const description =
  'Self-hosted, single-user, keyboard-first task manager — an open Todoist alternative. One container, one volume, one account. Quick Add grammar, recurrence, filters, reminders, iCal, and a REST API.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'OpenTask — the self-hosted Todoist alternative',
    template: '%s | OpenTask',
  },
  description,
  keywords: [
    'todoist alternative',
    'self-hosted task manager',
    'open source todo app',
    'task manager',
    'selfhosted',
    'docker',
    'keyboard-first',
    'quick add',
    'recurring tasks',
  ],
  authors: [{ name: 'Pranav Karra', url: 'https://pranavkarra.me' }],
  creator: 'Pranav Karra',
  alternates: { canonical: '/' },
  icons: {
    icon: [{ url: '/icon-green.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'OpenTask',
    title: 'OpenTask — the self-hosted Todoist alternative',
    description,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'OpenTask' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenTask — the self-hosted Todoist alternative',
    description,
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1e1e1e' },
  ],
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': 'https://pranavkarra.me/#person',
      name: 'Pranav Karra',
      url: 'https://pranavkarra.me',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'OpenTask',
      description,
      publisher: { '@id': 'https://pranavkarra.me/#person' },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: 'OpenTask',
      description,
      url: SITE_URL,
      applicationCategory: 'ProductivityApplication',
      operatingSystem: 'Docker, Linux, macOS, Windows',
      license: 'https://www.gnu.org/licenses/agpl-3.0.html',
      author: { '@id': 'https://pranavkarra.me/#person' },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  ],
}

/**
 * Paint the stored theme before first paint so a dark-mode visitor never sees a white flash.
 * Mirrors the app's own pre-hydration head script (apps/web/index.html); the site's key is
 * `ot-site-theme` so it cannot collide with the app's `ot-appearance` on a shared origin.
 */
const themeScript = `(function(){try{
var s=localStorage.getItem('ot-site-theme');
var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
if(d)document.documentElement.setAttribute('data-theme','dark');
}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: pre-paint theme + JSON-LD, both static */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-bg text-text-primary antialiased">
        <a
          href="#main"
          className="sr-only rounded-sm bg-surface-raised px-4 py-2 font-medium text-text-primary shadow focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
