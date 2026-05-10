/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@garage-os/shared-types', '@garage-os/validation'],
  experimental: {
    optimizePackageImports: [
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/form',
      '@mantine/dates',
      '@mantine/notifications',
      '@mantine/modals',
      '@mantine/dropzone',
    ],
  },
};

export default nextConfig;
