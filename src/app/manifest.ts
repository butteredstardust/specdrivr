import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Specdrivr',
    short_name: 'Specdrivr',
    description: 'AI-native orchestration platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#12131C',
    theme_color: '#12131C',
    icons: [
      {
        src: '/brand/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
