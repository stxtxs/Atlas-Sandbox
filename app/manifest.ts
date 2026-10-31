import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Atlas Tutorial by SportsTechX',
    short_name: 'Atlas Tutorial',
    description: 'A guided tour of Atlas Explore, Raise and Scout on sample data.',
    start_url: '/',
    display: 'standalone',
    background_color: '#060a17',
    theme_color: '#060a17',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
