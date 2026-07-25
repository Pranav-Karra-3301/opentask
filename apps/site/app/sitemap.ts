import type { MetadataRoute } from 'next'
import { listDocSlugs } from '@/lib/markdown'
import { SITE_URL } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listDocSlugs()
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/demo`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/docs`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/changelog`, changeFrequency: 'weekly', priority: 0.6 },
  ]
  return [
    ...staticRoutes,
    ...slugs.map((slug) => ({
      url: `${SITE_URL}/docs/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
