import Link from "next/link";

const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

/** The footer for public pages: the legal links, quiet and small. */
export function MarketingFooter() {
  return (
    <footer className="border-t border-hairline bg-canvas">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-body-sm text-muted tablet:flex-row tablet:items-center tablet:justify-between tablet:px-6 desktop:px-8">
        <p>Echo · Words worth coming back to.</p>
        <nav aria-label="Legal">
          <ul className="flex gap-4">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-sm underline-offset-4 hover:text-ink hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
