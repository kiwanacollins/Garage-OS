import type { Metadata } from "next";
import {
  ColorSchemeScript,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { AuthProvider } from "@/components/AuthProvider";
import { PwaRegister } from "@/components/PwaRegister";
import { garageTheme } from "@/theme";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dropzone/styles.css";
import "./globals.css";
import { BRAND_NAME, LOGO_PATHS } from "@/lib/branding";

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: "Professional garage management system",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: LOGO_PATHS.favicon,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MantineProvider theme={garageTheme}>
          <ModalsProvider>
            <Notifications />
            <AuthProvider>
              {children}
            </AuthProvider>
            <PwaRegister />
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
