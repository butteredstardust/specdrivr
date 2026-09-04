import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Specdrivr',
    short_name: 'Specdrivr',
    description: 'AI-native orchestration platform',
    start_url: '/',
    display: 'standalone',
    // A web app manifest is JSON, so these cannot reference a CSS variable and
    // have to be literals. Kept in step with `--surface-base` in the dark theme.
    background_color: '#0b0d11',
    theme_color: '#0b0d11',
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
