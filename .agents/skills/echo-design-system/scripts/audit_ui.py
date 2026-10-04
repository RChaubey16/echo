#!/usr/bin/env python3
"""Scan Echo UI code for design-system drift and common accessibility slips.

Heuristic and fast: it flags lines worth a second look, and it does not prove
anything is correct. No dependencies.

Usage:
  python3 audit_ui.py                 # scan src/ (default)
  python3 audit_ui.py src/components  # scan a sub-tree or a single file
  python3 audit_ui.py --strict        # exit 1 on warnings too, not just errors

Allowed token-definition file (raw colors are fine there): src/app/globals.css
"""
import argparse
import re
import sys
from pathlib import Path

TOKEN_FILES = {"globals.css"}
EXTS = {".tsx", ".ts", ".jsx", ".js", ".css", ".mdx"}

# (severity, rule id, regex, message)
RULES = [
    ("error", "raw-color", re.compile(r"#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\("),
     "Raw color literal. Use a DESIGN.md token utility (bg-primary, text-muted, ...)."),
    ("error", "arbitrary-color", re.compile(r"\b(?:bg|text|border|ring|outline|fill|stroke|from|to|via|shadow)-\[(?:#|rgb|hsl)"),
     "Arbitrary color value in a class. Use a token."),
    ("error", "default-palette", re.compile(r"\b(?:bg|text|border|ring|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?\b"),
     "Tailwind default palette. Echo resets it; use Echo tokens (canvas, ink, muted, ...)."),
    ("error", "default-shadow", re.compile(r"\bshadow-(?:xs|sm|md|lg|xl|2xl|inner)\b"),
     "Default Tailwind shadow. Echo has one tier: shadow-float."),
    ("error", "default-breakpoint", re.compile(r"(?<![\w-])(?:sm|md|lg|xl|2xl):(?=[\w\[-])"),
     "Default breakpoint prefix. Echo uses tablet:, desktop:, wide:."),
    ("error", "unsafe-html", re.compile(r"dangerouslySetInnerHTML"),
     "Never render user content as HTML."),
    ("error", "transition-all", re.compile(r"\btransition-all\b|transition:\s*all\b"),
     "transition-all animates unintended properties. List them: transition-[background-color,transform]."),
    ("warn", "outline-removed", re.compile(r"\b(?:focus:)?outline-none\b"),
     "Focus outline removed. Make sure a focus-visible replacement exists on this element."),
    ("warn", "arbitrary-size", re.compile(r"\b(?:text|rounded|p[trblxy]?|m[trblxy]?|gap|space-[xy])-\[\d+(?:\.\d+)?(?:px|rem)\]"),
     "Arbitrary size. Use the type, radius and spacing scale unless DESIGN.md specifies this exact value."),
    ("warn", "off-scale-spacing", re.compile(r"(?<![\w-])-?(?:p[trblxy]?|m[trblxy]?|gap(?:-[xy])?|space-[xy])-(?:9|11|18|22|28)\b"),
     "Spacing step not in the DESIGN.md scale (0.5,1,2,3,4,6,7,8,10,12,14,16,20,24; 2.5, 3.5, 4.5 and 5 for fine alignment)."),
    ("warn", "click-on-div", re.compile(r"<(?:div|span|li)\b[^>]*\bonClick="),
     "onClick on a non-interactive element. Use <button> or <Link>."),
    ("warn", "img-no-alt", re.compile(r"<(?:img|Image)\b(?![^>]*\balt=)[^>]*>"),
     "Image without alt. Use alt=\"\" for decorative images."),
    ("warn", "animate-no-reduce", re.compile(r"\banimate-(?!none)[\w-]+"),
     "Animation found. Confirm a motion-reduce: variant exists on this element."),
    ("warn", "spinner-content", re.compile(r"\banimate-spin\b"),
     "Spinner found. Spinners are for buttons only; content loading uses skeletons."),
]


def iter_files(target):
    """Yield the source files to scan.

    @param target - A file or directory path.
    @returns An iterator of Paths.
    """
    if target.is_file():
        yield target
        return
    for path in sorted(target.rglob("*")):
        if path.suffix in EXTS and "node_modules" not in path.parts and ".next" not in path.parts:
            yield path


def audit_file(path):
    """Apply every rule to each line of one file.

    @param path - The file to scan.
    @returns A list of (severity, rule, line number, message, line text) findings.
    """
    findings = []
    is_token_file = path.name in TOKEN_FILES
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except UnicodeDecodeError:
        return findings
    for n, line in enumerate(lines, 1):
        if "audit-ignore" in line:
            continue
        for severity, rule, rx, msg in RULES:
            if is_token_file and rule in {"raw-color", "transition-all"}:
                continue
            if rule == "animate-no-reduce" and "motion-reduce:" in line:
                continue
            if rule == "outline-removed" and "focus-visible:" in line:
                continue
            if rule == "default-breakpoint" and path.suffix == ".css":
                continue
            if rx.search(line):
                findings.append((severity, rule, n, msg, line.strip()[:120]))
    return findings


def main():
    """Scan the target and print findings grouped by file.

    @returns Process exit code: 1 if errors (or warnings with --strict) were found.
    """
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("target", nargs="?", default="src")
    p.add_argument("--strict", action="store_true")
    args = p.parse_args()
    target = Path(args.target)
    if not target.exists():
        sys.exit(f"{target} does not exist. Run from the project root or pass a path.")

    errors = warns = 0
    for path in iter_files(target):
        found = audit_file(path)
        if not found:
            continue
        print(f"\n{path}")
        for severity, rule, n, msg, text in found:
            print(f"  {n:>4}  {severity.upper():5} {rule:20} {msg}\n        {text}")
            errors += severity == "error"
            warns += severity == "warn"
    print(f"\n{errors} error(s), {warns} warning(s). Add `audit-ignore` in a line comment to accept a deliberate exception.")
    return 1 if errors or (args.strict and warns) else 0


if __name__ == "__main__":
    sys.exit(main())
