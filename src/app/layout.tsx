import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "Echo", template: "%s · Echo" },
  description: "Words worth coming back to.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" }, // audit-ignore: mirrors canvas
    { media: "(prefers-color-scheme: dark)", color: "#1b1f1e" }, // audit-ignore: mirrors dark canvas
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // A saved choice is rendered on the server so the page never flashes the wrong theme.
  // No cookie means System: the prefers-color-scheme tokens apply.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="en" data-theme={theme} className={`${inter.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  );
}
