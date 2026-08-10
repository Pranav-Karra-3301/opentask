import { describe, expect, it } from 'vitest'
import { SETTINGS_PAGES, type SettingsPageDef, visibleSettingsPages } from './registry'
import { filterSettingsPages, matchSettingsPage, splitHighlight } from './SettingsSearch'

function pageByKey(key: string): SettingsPageDef {
  const found = SETTINGS_PAGES.find((page) => page.key === key)
  if (!found) throw new Error(`missing settings page: ${key}`)
  return found
}

describe('matchSettingsPage', () => {
  const general = pageByKey('general')

  it('matches on the title, case-insensitively', () => {
    expect(matchSettingsPage(general, 'GEN')).toBe(true)
  })

  it('matches on a keyword the title never shows', () => {
    expect(matchSettingsPage(general, 'week')).toBe(true)
    expect(matchSettingsPage(general, 'timezone')).toBe(true)
  })

  it('does not match unrelated text', () => {
    expect(matchSettingsPage(general, 'zzz')).toBe(false)
  })

  it('treats a blank query as a match (whitespace trimmed)', () => {
    expect(matchSettingsPage(general, '   ')).toBe(true)
  })
})

describe('filterSettingsPages', () => {
  it('returns every page in registry order for a blank query', () => {
    const all = filterSettingsPages(SETTINGS_PAGES, '')
    expect(all).toHaveLength(SETTINGS_PAGES.length)
    expect(all[0]?.key).toBe('account')
    expect(all.at(-1)?.key).toBe('about')
  })

  it('surfaces General first for "week" (keyword match) and drops Account', () => {
    const keys = filterSettingsPages(SETTINGS_PAGES, 'week').map((page) => page.key)
    expect(keys[0]).toBe('general')
    expect(keys).toContain('productivity') // "weekly"
    expect(keys).not.toContain('account')
  })

  it('narrows to a single page for a distinctive keyword', () => {
    expect(filterSettingsPages(SETTINGS_PAGES, 'token').map((page) => page.key)).toEqual([
      'integrations',
    ])
  })

  it('returns nothing for an unmatched query', () => {
    expect(filterSettingsPages(SETTINGS_PAGES, 'xyzzy')).toEqual([])
  })
})

describe('visibleSettingsPages', () => {
  it('is the identity on a normal instance', () => {
    expect(visibleSettingsPages(SETTINGS_PAGES, false)).toEqual(SETTINGS_PAGES)
  })

  it('drops exactly the pages whose writes the server refuses in demo mode', () => {
    const keys = visibleSettingsPages(SETTINGS_PAGES, true).map((page) => page.key)
    for (const hidden of ['account', 'notifications', 'backups', 'import', 'integrations']) {
      expect(keys, hidden).not.toContain(hidden)
    }
    // The pages worth showing off must survive — a demo with no Theme page is a bad demo.
    for (const shown of ['general', 'theme', 'sidebar', 'quick-add', 'productivity', 'about']) {
      expect(keys, shown).toContain(shown)
    }
  })

  it('leaves a usable first page, since that is the demo fallback target', () => {
    // SettingsLayout and the command palette both navigate to pages[0] when the requested
    // page is missing — an empty list there would loop the redirect.
    expect(visibleSettingsPages(SETTINGS_PAGES, true)[0]?.key).toBe('general')
  })
})

describe('splitHighlight', () => {
  it('marks the matched run, case-insensitively', () => {
    expect(splitHighlight('General', 'gen')).toEqual([
      { text: 'Gen', hit: true, start: 0 },
      { text: 'eral', hit: false, start: 3 },
    ])
  })

  it('returns a single plain segment when the query is absent from the title', () => {
    expect(splitHighlight('General', 'week')).toEqual([{ text: 'General', hit: false, start: 0 }])
  })

  it('returns a single plain segment for a blank query', () => {
    expect(splitHighlight('General', '   ')).toEqual([{ text: 'General', hit: false, start: 0 }])
  })

  it('marks every occurrence with stable, distinct start offsets', () => {
    expect(splitHighlight('anagram', 'a')).toEqual([
      { text: 'a', hit: true, start: 0 },
      { text: 'n', hit: false, start: 1 },
      { text: 'a', hit: true, start: 2 },
      { text: 'gr', hit: false, start: 3 },
      { text: 'a', hit: true, start: 5 },
      { text: 'm', hit: false, start: 6 },
    ])
  })
})
