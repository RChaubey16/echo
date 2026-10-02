#!/usr/bin/env python3
"""Check WCAG contrast ratios between Echo color tokens.

Reads the `colors:` block from DESIGN.md frontmatter, so results always reflect
the current source of truth. No dependencies.

Usage:
  python3 contrast.py                      # report Echo's standard pairs
  python3 contrast.py ink canvas           # one pair, by token name
  python3 contrast.py "#0e7c6b" canvas     # hex values work too
  python3 contrast.py --theme dark          # same pairs against the colors-dark block
  python3 contrast.py --design path/to/DESIGN.md
"""
import argparse
import re
import sys
from pathlib import Path

# (foreground, background, minimum ratio, what the pair is used for)
# Pairs in KNOWN_FAILURES are open decisions in SKILL.md: reported, but they do not fail the run.
STANDARD_PAIRS = [
    ("ink", "canvas", 4.5, "primary text"),
    ("body", "canvas", 4.5, "secondary running text"),
    ("muted", "canvas", 4.5, "metadata and labels"),
    ("muted", "surface-soft", 4.5, "metadata on soft fill"),
    ("muted", "tint-lagoon", 4.5, "metadata on featured panel"),
    ("muted", "tint-bronze", 4.5, "metadata on time panel"),
    ("muted", "tint-plum", 4.5, "metadata on memory panel"),
    ("primary", "tint-lagoon", 4.5, "links and icons on featured panel"),
    ("luxe", "tint-bronze", 3.0, "bronze icon chip"),
    ("plus", "tint-plum", 3.0, "plum icon chip"),
    ("muted-soft", "canvas", None, "disabled text (exempt)"),
    ("on-primary", "primary", 4.5, "primary button label"),
    ("on-primary", "primary-active", 4.5, "pressed button label"),
    ("primary", "canvas", 4.5, "inline links, saved heart"),
    ("on-primary", "primary-error-text", 4.5, "danger button label"),
    ("primary-error-text", "canvas", 4.5, "error text"),
    ("on-primary-disabled", "primary-disabled", 4.5, "disabled CTA label"),
    ("legal-link", "canvas", 4.5, "legal links"),
    ("canvas", "ink", 4.5, "selected chip text"),
    ("on-dark", "ink", 4.5, "toast text"),
    ("border-input", "canvas", 3.0, "input boundary (SC 1.4.11)"),
    ("border-input", "surface-soft", 3.0, "input boundary on app background"),
    ("ink", "surface-soft", 4.5, "text on app background"),
    ("muted", "surface-strong", 4.5, "metadata on strong fill"),
    ("hairline", "canvas", None, "decorative divider"),
]
KNOWN_FAILURES = {("legal-link", "canvas")}  # legal-link is unused in Echo; links use primary


def find_design_md(explicit):
    """Locate DESIGN.md.

    @param explicit - A path given on the command line, or None.
    @returns The Path to DESIGN.md.
    """
    if explicit:
        return Path(explicit)
    here = Path.cwd()
    for d in [here, *here.parents]:
        if (d / "DESIGN.md").exists():
            return d / "DESIGN.md"
    sys.exit("DESIGN.md not found; run from the project or pass --design.")


def load_colors(path, theme="light"):
    """Parse a color mapping from DESIGN.md frontmatter.

    @param path - Path to DESIGN.md.
    @param theme - "light" reads `colors:`; "dark" reads `colors:` overlaid with `colors-dark:`.
    @returns A dict of token name to lowercase hex string.
    """
    text = path.read_text(encoding="utf-8")
    colors = parse_block(text, "colors", path)
    if theme == "dark":
        colors.update(parse_block(text, "colors-dark", path))
    return colors


def parse_block(text, key, path):
    """Parse one `key:` block of `name: "#hex"` lines.

    @param text - The DESIGN.md contents.
    @param key - The block name, e.g. "colors" or "colors-dark".
    @param path - Path to DESIGN.md, for error messages.
    @returns A dict of token name to lowercase hex string.
    """
    m = re.search(r"^" + re.escape(key) + r":\s*\n((?:[ \t]+[\w-]+:.*\n)+)", text, re.M)
    if not m:
        sys.exit(f"No {key}: block found in {path}")
    colors = {}
    for line in m.group(1).splitlines():
        km = re.match(r'\s+([\w-]+):\s*"?(#[0-9a-fA-F]{6})"?', line)
        if km:
            colors[km.group(1)] = km.group(2).lower()
    return colors


def luminance(hex_color):
    """Compute WCAG relative luminance.

    @param hex_color - A color as #rrggbb.
    @returns Relative luminance between 0 and 1.
    """
    channels = [int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def ratio(a, b):
    """Compute the WCAG contrast ratio of two colors.

    @param a - First color as #rrggbb.
    @param b - Second color as #rrggbb.
    @returns The contrast ratio (1 to 21).
    """
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def resolve(value, colors):
    """Turn a token name or hex string into a hex color.

    @param value - A token name from DESIGN.md or a #rrggbb string.
    @param colors - The parsed token map.
    @returns The hex color.
    """
    if value.startswith("#"):
        return value.lower()
    if value not in colors:
        sys.exit(f"Unknown token '{value}'. Known: {', '.join(sorted(colors))}")
    return colors[value]


def main():
    """Run the report or a single-pair check.

    @returns Process exit code: 1 if any required pair fails, else 0.
    """
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("fg", nargs="?")
    p.add_argument("bg", nargs="?")
    p.add_argument("--design")
    p.add_argument("--theme", choices=["light", "dark"], default="light")
    args = p.parse_args()
    colors = load_colors(find_design_md(args.design), args.theme)

    if args.fg and args.bg:
        r = ratio(resolve(args.fg, colors), resolve(args.bg, colors))
        verdict = "AA text" if r >= 4.5 else "AA large/UI only" if r >= 3 else "fails"
        print(f"{args.fg} on {args.bg}: {r:.2f}:1 ({verdict})")
        return 0

    failed = False
    print(f"{'pair':60} {'ratio':>8}  result")
    for fg, bg, minimum, use in STANDARD_PAIRS:
        if fg not in colors or bg not in colors:
            continue
        r = ratio(colors[fg], colors[bg])
        if minimum is None:
            result = "info"
        elif r >= minimum:
            result = "pass"
        elif (fg, bg) in KNOWN_FAILURES:
            result = f"known fail (< {minimum}), open decision"
        else:
            result = f"FAIL (< {minimum})"
            failed = True
        print(f"{fg + ' on ' + bg + ' — ' + use:60.60} {r:7.2f}:1  {result}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
