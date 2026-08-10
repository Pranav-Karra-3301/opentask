/**
 * Settings page registry — FROZEN by Task A (plan Step 5). Task L renders it in
 * SettingsLayout + SettingsSearch; Task I adds one palette command per entry.
 * Pages are lazy default exports under ./pages/.
 *
 * Phase 9 Task H owns the `import` entry below (route /settings/import).
 */
import {
  AlarmClock,
  Archive,
  ArrowDownToLine,
  Bell,
  Blocks,
  CircleUser,
  Info,
  type LucideIcon,
  Palette,
  PanelLeft,
  SlidersHorizontal,
  SquarePen,
  TrendingUp,
} from 'lucide-react'
import { type ComponentType, type LazyExoticComponent, lazy } from 'react'

export interface SettingsPageDef {
  key: string
  title: string
  /** Nav-rail glyph (Lucide) rendered before the label in SettingsSearch. */
  icon: LucideIcon
  keywords: string[]
  Component: LazyExoticComponent<ComponentType>
  /**
   * Hidden on a demo instance because the server refuses these writes anyway
   * (apps/server/src/demo.ts) — showing a page whose every control 403s is worse than
   * not showing it. Keep this list in step with the server's blocked surfaces.
   */
  demoBlocked?: true
}

/** The registry minus what a demo instance can't do. Identity when `demo` is false. */
export function visibleSettingsPages(pages: SettingsPageDef[], demo: boolean): SettingsPageDef[] {
  return demo ? pages.filter((page) => page.demoBlocked !== true) : pages
}
export const SETTINGS_PAGES: SettingsPageDef[] = [
  {
    key: 'account',
    title: 'Account',
    icon: CircleUser,
    keywords: [
      'password',
      'email',
      'name',
      'totp',
      '2fa',
      'two-factor',
      'oidc',
      'sso',
      'delete account',
      'danger',
    ],
    Component: lazy(() => import('./pages/AccountPage')),
    demoBlocked: true,
  },
  {
    key: 'general',
    title: 'General',
    icon: SlidersHorizontal,
    keywords: [
      'home view',
      'timezone',
      'date format',
      'time format',
      'week start',
      'next week',
      'weekend',
      'smart date',
      'language',
    ],
    Component: lazy(() => import('./pages/GeneralPage')),
  },
  {
    key: 'theme',
    title: 'Theme',
    icon: Palette,
    keywords: ['dark', 'appearance', 'color', 'kale', 'auto dark', 'sync theme'],
    Component: lazy(() => import('./pages/ThemePage')),
  },
  {
    key: 'sidebar',
    title: 'Sidebar',
    icon: PanelLeft,
    keywords: ['navigation', 'show', 'hide', 'counts', 'views'],
    Component: lazy(() => import('./pages/SidebarPage')),
  },
  {
    key: 'quick-add',
    title: 'Quick Add',
    icon: SquarePen,
    keywords: ['chips', 'buttons', 'reorder', 'icons', 'labels'],
    Component: lazy(() => import('./pages/QuickAddPage')),
  },
  {
    key: 'productivity',
    title: 'Productivity',
    icon: TrendingUp,
    keywords: ['goal', 'daily', 'weekly', 'streak', 'days off', 'vacation', 'karma'],
    Component: lazy(() => import('./pages/ProductivityPage')),
  },
  {
    key: 'reminders',
    title: 'Reminders',
    icon: AlarmClock,
    keywords: ['automatic', 'offset', 'before', 'test notification'],
    Component: lazy(() => import('./pages/RemindersPage')),
  },
  {
    key: 'notifications',
    title: 'Notifications',
    icon: Bell,
    keywords: ['push', 'ntfy', 'gotify', 'webhook', 'channels'],
    Component: lazy(() => import('./pages/NotificationsPage')),
    demoBlocked: true,
  },
  {
    key: 'backups',
    title: 'Backups',
    icon: Archive,
    keywords: ['backup', 'restore', 'download', 'retention'],
    Component: lazy(() => import('./pages/BackupsPage')),
    demoBlocked: true,
  },
  {
    key: 'import',
    title: 'Import',
    icon: ArrowDownToLine,
    // NB: no 'token' keyword — SettingsSearch.test.ts pins 'token' → only Integrations.
    keywords: ['import', 'todoist', 'migrate', 'csv', 'backup file', 'transfer'],
    Component: lazy(() => import('./pages/ImportPage')),
    demoBlocked: true,
  },
  {
    key: 'integrations',
    title: 'Integrations',
    icon: Blocks,
    keywords: [
      'api',
      'token',
      'developer',
      'openapi',
      'scalar',
      'calendar feed',
      'ical',
      'voice',
      'ramble',
      'speech',
      'stt',
      'transcription',
      'whisper',
      'deepgram',
      'elevenlabs',
      'llm',
      'ai',
      'extraction',
      'openai',
    ],
    Component: lazy(() => import('./pages/IntegrationsPage')),
    demoBlocked: true,
  },
  {
    key: 'about',
    title: 'About',
    icon: Info,
    keywords: ['version', 'changelog', "what's new", 'update', 'release'],
    Component: lazy(() => import('./pages/AboutPage')),
  },
]
