import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from '@/components/AuthProvider';
import { garageTheme } from '@/theme';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'GarageOS',
  description: 'Garage operations platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <MantineProvider theme={garageTheme} defaultColorScheme="light">
          <ModalsProvider>
            <Notifications position="top-right" />
            <AuthProvider>{children}</AuthProvider>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
