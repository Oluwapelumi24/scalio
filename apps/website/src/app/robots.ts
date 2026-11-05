import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    // Feedback links are private and belong to one customer's visit.
    rules: { userAgent: '*', allow: '/', disallow: '/feedback/' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
