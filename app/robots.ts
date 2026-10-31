import type { MetadataRoute } from 'next';

/** Only the tier chooser is worth indexing; the tour pages are sample data. */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/$', disallow: '/' }] };
}
