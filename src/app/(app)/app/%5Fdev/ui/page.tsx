import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { EchoRow } from "@/components/echo/echo-row";
import { QuoteCard, QuoteCardSkeleton } from "@/components/echo/quote-card";
import { QuoteText } from "@/components/echo/quote-text";
import { Button } from "@/components/ui/button";
import { Badge, chipClasses } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState, SectionError } from "@/components/ui/error-state";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import { HeartIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import type { EchoDto } from "@/types/echo";

export const metadata: Metadata = { title: "UI catalog" };

const NOW = "2026-10-04T09:00:00.000Z";

/**
 * Builds a sample Echo for the catalog; nothing here is saved.
 *
 * @param overrides - The fields that differ from the plain sample.
 * @returns A sample Echo.
 */
function sample(overrides: Partial<EchoDto>): EchoDto {
  return {
    id: "00000000-0000-4000-8000-000000000000",
    quote: "We are what we repeatedly do.",
    author: "Will Durant",
    source: "The Story of Philosophy",
    reflection: null,
    mood: null,
    isFavorite: false,
    favoritedAt: null,
    savedAt: "2025-11-02T09:00:00.000Z",
    updatedAt: NOW,
    tags: [],
    collections: [],
    ...overrides,
  };
}

const ECHOES: Array<{ label: string; echo: EchoDto }> = [
  {
    label: "Favorite, reflection and tags",
    echo: sample({
      isFavorite: true,
      reflection: "A reminder that small habits are the whole game.",
      tags: ["habits", "discipline", "craft", "patience", "focus", "work"].map((name, index) => ({
        id: `00000000-0000-4000-8000-00000000000${index}`,
        name,
      })),
    }),
  },
  { label: "No author or source", echo: sample({ author: null, source: null }) },
  {
    label: "Long quote (clamped)",
    echo: sample({ quote: "The words are the hero. ".repeat(40).trim() }),
  },
  {
    label: "Unbroken 60-character word",
    echo: sample({ quote: `Before ${"a".repeat(60)} after.` }),
  },
];

/** A titled block of examples. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-hairline py-8 first:border-t-0 first:pt-2">
      <h2 className="text-display-sm text-ink">{title}</h2>
      {children}
    </section>
  );
}

/** Dev-only visual QA for Echo's components; 404s in production builds. */
export default function UiCatalogPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const primitives = (
    <>
      <Group title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Save Echo</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="pill">Echo me something</Button>
          <Button variant="tertiary">Show more</Button>
          <Button variant="danger">Delete Echo</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button loading loadingLabel="Saving…">
            Save Echo
          </Button>
          <Button disabled>Save Echo</Button>
          <Button variant="secondary" disabled>
            Export
          </Button>
          <Button variant="secondary" size="sm">
            Small
          </Button>
        </div>
      </Group>
      <Group title="Chips and badges">
        <div className="flex flex-wrap items-center gap-2">
          <span className={chipClasses()}>courage</span>
          <span className={chipClasses(true)}>selected</span>
          <Badge>Revisit due</Badge>
          <Badge>
            <HeartIcon className="h-3 w-3" /> Favorite
          </Badge>
        </div>
      </Group>
      <Group title="Fields">
        <div className="grid grid-cols-1 gap-6 tablet:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="catalog-author">Author</Label>
            <Input id="catalog-author" placeholder="e.g. Mary Oliver" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="catalog-source">Source</Label>
            <Input id="catalog-source" invalid errorId="catalog-source-error" defaultValue="x" />
            <FieldError id="catalog-source-error">
              Source must be 1,000 characters or fewer.
            </FieldError>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="catalog-disabled">Disabled</Label>
            <Input id="catalog-disabled" disabled defaultValue="From Google" />
          </div>
          <Select
            label="Sort"
            options={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
            ]}
          />
          <div className="flex flex-col gap-1.5 tablet:col-span-2">
            <Label htmlFor="catalog-quote">Quote</Label>
            <Textarea id="catalog-quote" className="font-quote text-quote-card" />
          </div>
        </div>
      </Group>
    </>
  );

  const echoComponents = (
    <>
      <Group title="QuoteText">
        <QuoteText size="hero">Hero: the words are the hero.</QuoteText>
        <QuoteText size="card">Card: the words are the hero.</QuoteText>
        <QuoteText size="compact">Compact: the words are the hero.</QuoteText>
      </Group>
      <Group title="QuoteCard">
        <ul className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2 desktop:grid-cols-3">
          {ECHOES.map(({ label, echo }) => (
            <li key={label} className="flex min-w-0 flex-col gap-2">
              <p className="text-caption-sm text-muted">{label}</p>
              <QuoteCard echo={echo} showReflection showTags />
            </li>
          ))}
          <li className="flex min-w-0 flex-col gap-2">
            <p className="text-caption-sm text-muted">Compact</p>
            <QuoteCard echo={sample({})} compact />
          </li>
        </ul>
      </Group>
      <Group title="EchoRow">
        <ul className="grid grid-cols-1 rounded-md border border-hairline-soft bg-canvas px-6">
          {ECHOES.slice(0, 2).map(({ label, echo }) => (
            <li key={label} className="min-w-0">
              <EchoRow echo={echo} monogram />
            </li>
          ))}
        </ul>
      </Group>
    </>
  );

  const states = (
    <>
      <Group title="Empty">
        <EmptyState
          title="Your library is empty."
          body="Save the words that make you stop and think."
          action={<Button>Add your first Echo</Button>}
        />
      </Group>
      <Group title="Error">
        <ErrorState headingLevel="h2" errorId="3f2a9c1e" retryHref="/app/_dev/ui" />
        <SectionError what="your favorites" retryHref="/app/_dev/ui" />
      </Group>
      <Group title="Loading">
        <div className="grid grid-cols-1 items-start gap-4 tablet:grid-cols-2">
          <QuoteCardSkeleton />
          <div className="flex flex-col gap-3 p-6">
            <Skeleton className="h-7 w-11/12" />
            <Skeleton className="h-7 w-8/12" />
            <Skeleton className="mt-3 h-4 w-40" />
          </div>
        </div>
      </Group>
    </>
  );

  return (
    <div className="flex flex-col gap-6 py-8 tablet:py-12">
      <header>
        <h1 className="text-display-lg text-ink">UI catalog</h1>
        <p className="mt-1 text-body-md text-body">
          Dev only. Switch the theme in Settings to check both palettes.
        </p>
      </header>
      <Tabs
        label="Catalog sections"
        items={[
          { id: "primitives", label: "Primitives", content: primitives },
          { id: "echo", label: "Echo components", content: echoComponents },
          { id: "states", label: "States", content: states },
        ]}
      />
    </div>
  );
}
