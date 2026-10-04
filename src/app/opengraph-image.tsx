import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_IMAGE } from "@/lib/site";

// The link preview shown when an Echo page is shared. Satori renders it outside the browser, so
// it can't read the Tailwind tokens: the colors below mirror DESIGN.md's light theme by hand.
const INK = "#222222"; // audit-ignore: mirrors ink
const MUTED = "#6a6a6a"; // audit-ignore: mirrors muted
const CANVAS = "#ffffff"; // audit-ignore: mirrors canvas
const PRIMARY = "#0e7c6b"; // audit-ignore: mirrors primary

export const alt = OG_IMAGE.alt;
export const size = { width: OG_IMAGE.width, height: OG_IMAGE.height };
export const contentType = "image/png";

const fontsDir = join(process.cwd(), "assets/fonts");
const [interRegular, interSemiBold, newsreader] = await Promise.all([
  readFile(join(fontsDir, "Inter-Regular.ttf")),
  readFile(join(fontsDir, "Inter-SemiBold.ttf")),
  readFile(join(fontsDir, "Newsreader-Regular.ttf")),
]);

/**
 * Renders Echo's Open Graph image: the logo, the tagline set like the landing page's hero, and
 * one line on what Echo is.
 *
 * @returns The 1200×630 PNG.
 */
export default function OpengraphImage(): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: CANVAS,
        color: INK,
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width="56" height="56" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="16" fill={PRIMARY} />
          <circle cx="11" cy="16" r="2.4" fill={CANVAS} />
          <path
            d="M16 11.5a6.5 6.5 0 0 1 0 9"
            fill="none"
            stroke={CANVAS}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M20 8.5a11 11 0 0 1 0 15"
            fill="none"
            stroke={CANVAS}
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity=".55"
          />
        </svg>
        <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: -0.4 }}>echo</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Broken by hand so the tagline never strands "to." on a line of its own. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontFamily: "Newsreader",
            fontSize: 104,
            lineHeight: 1.08,
            letterSpacing: -1.5,
          }}
        >
          <span>Words worth</span>
          <span>coming back to.</span>
        </div>
        <span style={{ fontSize: 32, lineHeight: 1.4, color: MUTED, maxWidth: 800 }}>
          A private library for the quotes that stay with you, and what they meant to you.
        </span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
        { name: "Newsreader", data: newsreader, weight: 400, style: "normal" },
      ],
    },
  );
}
