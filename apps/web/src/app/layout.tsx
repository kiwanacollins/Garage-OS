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

export const metadata: Metadata = {
  title: "GarageOS",
  description: "Garage operations platform",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <MantineProvider theme={garageTheme} defaultColorScheme="light">
          <ModalsProvider>
            <Notifications position="top-right" />
            <PwaRegister />
            <AuthProvider>{children}</AuthProvider>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
