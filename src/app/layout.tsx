import type { Metadata, Viewport } from "next";
import { EB_Garamond, Hanken_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import "./globals.css";

const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
// Quotes only.
const quote = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  applicationName: SITE_NAME,
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f2" }, // audit-ignore: mirrors canvas
    { media: "(prefers-color-scheme: dark)", color: "#221e1a" }, // audit-ignore: mirrors dark canvas
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // A saved choice is rendered on the server so the page never flashes the wrong theme.
  // No cookie means System: the prefers-color-scheme tokens apply.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="en" data-theme={theme} className={`${sans.variable} ${quote.variable}`}>
      <body>{children}</body>
    </html>
  );
}
