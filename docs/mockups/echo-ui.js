/*
  Shared building blocks for the Echo HTML mockup (dashboard.html).
  They mirror the components in .claude/skills/echo-design-system/references/components.md:
  Sidebar, BottomTabBar, QuoteCard, FavoriteButton, Toast and the skeleton card.
  Sample data only. In the app these come from the API.

  Every class string uses Echo token utilities. Each page defines the tokens in its own
  <style type="text/tailwindcss"> @theme block, which is copied from references/tokens.md.
*/
(function (global) {
  "use strict";

  var TODAY = new Date(2026, 9, 1); /* fixed so the mockups read the same every day */

  var ECHOES = [
    { id: "e1", quote: "Be patient toward all that is unsolved in your heart and try to love the questions themselves.", author: "Rainer Maria Rilke", source: "Letters to a Young Poet", saved: "2025-10-28", updated: "2026-03-04", reflection: "Saved the week I left the job. I still don't have the answer, and that's starting to feel fine.", fav: true, tags: ["patience", "change"], collections: ["Books", "For Difficult Days"] },
    { id: "e2", quote: "Begin anywhere.", author: "John Cage", source: "", saved: "2026-09-29", updated: "2026-09-29", reflection: "Stop waiting for the perfect first sentence.", fav: false, tags: ["starting over"], collections: ["Courage"] },
    { id: "e3", quote: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", source: "Meditations", saved: "2024-02-11", updated: "2024-02-11", reflection: "", fav: true, tags: ["courage", "stoicism"], collections: ["Books", "Courage"] },
    { id: "e4", quote: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott", source: "", saved: "2026-09-21", updated: "2026-09-22", reflection: "Read this on a Sunday when I couldn't stop checking my phone.", fav: false, tags: ["rest"], collections: ["For Difficult Days"] },
    { id: "e5", quote: "If there's a book that you want to read, but it hasn't been written yet, then you must write it.", author: "Toni Morrison", source: "", saved: "2026-09-14", updated: "2026-09-14", reflection: "", fav: false, tags: ["writing", "courage"], collections: ["Courage"] },
    { id: "e6", quote: "There is a crack in everything.\nThat's how the light gets in.", author: "Leonard Cohen", source: "Anthem", saved: "2025-03-02", updated: "2025-08-17", reflection: "For difficult days.", fav: true, tags: ["for difficult days"], collections: ["For Difficult Days"] },
    { id: "e7", quote: "You don't have to see the whole staircase, just take the first step.", author: "", source: "Heard at a friend's wedding", saved: "2025-06-19", updated: "2025-06-19", reflection: "No idea who said it first. It doesn't matter.", fav: false, tags: ["starting over"], collections: ["Things I Want to Remember"] },
    { id: "e8", quote: "We do not remember days, we remember moments. The richness of life lies in memories we have forgotten, and in the small, accidental things that come back to us years later when we least expect them, unbidden and complete, like a song from another room.", author: "", source: "", saved: "2025-10-03", updated: "2025-10-03", reflection: "Wrote this down from a podcast and never found where it came from.", fav: false, tags: ["memory"], collections: ["Things I Want to Remember"] },
    { id: "e9", quote: "Not all those who wander are lost.", author: "J. R. R. Tolkien", source: "The Fellowship of the Ring", saved: "2023-07-08", updated: "2023-07-08", reflection: "", fav: false, tags: ["travel"], collections: ["Books"] },
    { id: "e10", quote: "The best way out is always through.", author: "Robert Frost", source: "A Servant to Servants", saved: "2024-11-30", updated: "2025-01-12", reflection: "Taped to my monitor during the thesis.", fav: true, tags: ["courage", "work"], collections: ["Courage", "For Difficult Days"] },
    { id: "e11", quote: "I am not afraid of storms, for I am learning how to sail my ship.", author: "Louisa May Alcott", source: "Little Women", saved: "2024-05-17", updated: "2024-05-17", reflection: "", fav: false, tags: ["courage"], collections: ["Books", "Courage"] },
    { id: "e12", quote: "Hope is the thing with feathers\nthat perches in the soul.", author: "Emily Dickinson", source: "", saved: "2025-01-26", updated: "2025-01-26", reflection: "Mum's favorite. Read it at her birthday.", fav: true, tags: ["hope", "family"], collections: ["Things I Want to Remember"] },
    { id: "e13", quote: "While we wait for life, life passes.", author: "Seneca", source: "Letters from a Stoic", saved: "2026-02-03", updated: "2026-02-03", reflection: "", fav: false, tags: ["stoicism", "time"], collections: ["Books"] },
    { id: "e14", quote: "I took a deep breath and listened to the old brag of my heart. I am, I am, I am.", author: "Sylvia Plath", source: "The Bell Jar", saved: "2026-05-11", updated: "2026-05-11", reflection: "", fav: false, tags: ["self"], collections: ["Books"] },
    { id: "e15", quote: "Rest is not idleness.", author: "John Lubbock", source: "The Use of Life", saved: "2026-08-02", updated: "2026-08-02", reflection: "Permission slip.", fav: false, tags: ["rest"], collections: [] },
    { id: "e16", quote: "You must do the thing you think you cannot do.", author: "Eleanor Roosevelt", source: "You Learn by Living", saved: "2025-09-09", updated: "2025-09-09", reflection: "", fav: false, tags: ["courage"], collections: ["Courage"] },
    { id: "e17", quote: "Nothing is so painful to the human mind as a great and sudden change.", author: "Mary Shelley", source: "Frankenstein", saved: "2026-06-23", updated: "2026-06-23", reflection: "The move. All of it.", fav: false, tags: ["change"], collections: ["Books", "For Difficult Days"] },
    { id: "e18", quote: "The cure for anything is salt water: sweat, tears or the sea.", author: "Isak Dinesen", source: "", saved: "2024-08-14", updated: "2024-08-14", reflection: "", fav: true, tags: ["for difficult days"], collections: ["For Difficult Days"] },
    { id: "e19", quote: "And now that you don't have to be perfect, you can be good.", author: "John Steinbeck", source: "East of Eden", saved: "2025-12-01", updated: "2025-12-01", reflection: "The whole reason I finally shipped the side project.", fav: true, tags: ["work", "self"], collections: ["Books"] },
    { id: "e20", quote: "Call it a clan, call it a network, call it a tribe, call it a family: whatever you call it, whoever you are, you need one.", author: "Jane Howard", source: "Families", saved: "2026-04-19", updated: "2026-04-19", reflection: "", fav: false, tags: ["family", "friends"], collections: ["Things I Want to Remember"] },
    { id: "e21", quote: "Eat the cake while it's warm.", author: "", source: "Grandma, every birthday", saved: "2023-12-24", updated: "2023-12-24", reflection: "She meant cake. She also didn't.", fav: true, tags: ["family"], collections: ["Things I Want to Remember"] },
    { id: "e22", quote: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde", source: "Lady Windermere's Fan", saved: "2024-03-29", updated: "2024-03-29", reflection: "", fav: false, tags: ["hope"], collections: ["Books"] },
    { id: "e23", quote: "To pay attention, this is our endless and proper work.", author: "Mary Oliver", source: "Yes! No!", saved: "2026-07-07", updated: "2026-07-30", reflection: "Phone in the other room this week.", fav: false, tags: ["attention", "work"], collections: [] },
    { id: "e24", quote: "Be where your feet are.", author: "", source: "Coach Ellis, junior year", saved: "2022-10-15", updated: "2022-10-15", reflection: "", fav: false, tags: ["attention"], collections: ["Things I Want to Remember"] },
    { id: "e25", quote: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt", source: "", saved: "2025-04-04", updated: "2025-04-04", reflection: "", fav: false, tags: ["work"], collections: ["Courage"] },
    { id: "e26", quote: "What we achieve inwardly will change outer reality.", author: "Plutarch", source: "", saved: "2023-03-12", updated: "2023-03-12", reflection: "", fav: false, tags: ["self", "change"], collections: [] }
  ];

  var COLLECTIONS = [
    { name: "For Difficult Days", desc: "Words I reach for when the week is heavy.", accent: "plum" },
    { name: "Things I Want to Remember", desc: "", accent: "bronze" },
    { name: "Courage", desc: "Small pushes, mostly from people who were scared too.", accent: "lagoon" },
    { name: "Books", desc: "Lines I underlined, collected from margins and notes apps over the years.", accent: "neutral" }
  ];

  /* Collection accents (DESIGN.md › Tints): a dot or an icon chip, always shown next to the collection's name. */
  var ACCENT = {
    lagoon: { dot: "bg-primary", chip: "bg-tint-lagoon text-primary" },
    bronze: { dot: "bg-luxe", chip: "bg-tint-bronze text-luxe" },
    plum: { dot: "bg-plus", chip: "bg-tint-plum text-plus" },
    neutral: { dot: "bg-muted-soft", chip: "bg-surface-strong text-ink" }
  };

  /**
   * Picks the accent for an Echo from its first collection.
   * @param e - The Echo.
   * @returns An ACCENT entry (neutral when the Echo is in no collection).
   */
  function accentFor(e) {
    var name = e.collections[0];
    for (var i = 0; i < COLLECTIONS.length; i++) if (COLLECTIONS[i].name === name) return ACCENT[COLLECTIONS[i].accent];
    return ACCENT.neutral;
  }

  /* Shared class strings: the component specs from components.md, in one place. */
  var CLS = {
    chip: "inline-flex h-10 items-center gap-1.5 rounded-full border border-hairline bg-canvas px-4 text-button-sm text-ink transition-colors duration-fast ease-standard hover:border-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-canvas aria-checked:border-ink aria-checked:bg-ink aria-checked:text-canvas",
    tagChip: "inline-flex h-8 items-center rounded-full border border-hairline px-3 text-button-sm text-ink transition-colors duration-fast ease-standard hover:border-ink",
    btnPrimary: "inline-flex h-12 items-center justify-center rounded-sm bg-primary px-6 text-button-md text-on-primary transition-[background-color,transform] duration-fast ease-standard hover:bg-primary-active active:scale-98 motion-reduce:active:scale-100",
    btnSecondary: "inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-ink bg-canvas px-6 text-button-md text-ink transition-colors duration-fast ease-standard hover:bg-surface-soft active:bg-surface-strong disabled:cursor-not-allowed disabled:border-hairline disabled:bg-canvas disabled:text-muted-soft",
    btnTertiary: "text-button-md text-ink underline-offset-4 hover:underline",
    card: "relative flex flex-col rounded-md border border-hairline-soft bg-surface-card transition-shadow duration-base ease-standard hover:border-transparent hover:shadow-float has-[.card-link:focus-visible]:outline-2 has-[.card-link:focus-visible]:outline-offset-2 has-[.card-link:focus-visible]:outline-ink",
    skeleton: "rounded-xs bg-surface-strong animate-skeleton motion-reduce:animate-none",
    stateChip: "inline-flex h-8 items-center rounded-full border border-hairline bg-canvas px-3 text-button-sm text-ink transition-colors duration-fast ease-standard hover:border-ink aria-checked:border-ink aria-checked:bg-ink aria-checked:text-canvas",
    tabItem: "flex h-16 flex-col items-center justify-center gap-1 text-caption-sm transition-colors duration-fast ease-standard"
  };

  var ICON = {
    heart: '<svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    check: '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
  };

  /**
   * Finds an Echo in the sample library by id.
   * @param id - The Echo id.
   * @returns The Echo, or null when it doesn't exist.
   */
  function byId(id) {
    for (var i = 0; i < ECHOES.length; i++) if (ECHOES[i].id === id) return ECHOES[i];
    return null;
  }

  /**
   * Creates an element with classes and optional text, never parsing user content as HTML.
   * @param tag - The element name.
   * @param cls - Space-separated class names, or "".
   * @param text - Text content to set, if any.
   * @returns The new element.
   */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /**
   * Formats a saved date the way Echo shows it: relative when recent, month and year when older.
   * @param iso - The date as YYYY-MM-DD.
   * @returns An object with the display label and the full date for the title attribute.
   */
  function savedLabel(iso) {
    var d = new Date(iso + "T12:00:00");
    var days = Math.round((TODAY - d) / 86400000);
    var full = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    var label, n;
    if (days <= 0) label = "Saved today";
    else if (days === 1) label = "Saved yesterday";
    else if (days < 7) label = "Saved " + days + " days ago";
    else if (days < 30) { n = Math.round(days / 7); label = "Saved " + n + (n === 1 ? " week ago" : " weeks ago"); }
    else if (days < 365) { n = Math.round(days / 30.4); label = "Saved " + n + (n === 1 ? " month ago" : " months ago"); }
    else label = "Saved " + d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return { label: label, full: full };
  }

  /**
   * Builds a <time> element for a saved date.
   * @param iso - The saved date as YYYY-MM-DD.
   * @param cls - Classes for the element.
   * @returns The time element.
   */
  function savedTime(iso, cls) {
    var s = savedLabel(iso);
    var t = el("time", cls, s.label);
    t.dateTime = iso;
    t.title = s.full;
    return t;
  }

  /**
   * Joins author and source into Echo's attribution line.
   * @param e - The Echo.
   * @returns The attribution text, or "" when both are missing.
   */
  function attribution(e) {
    var parts = [e.author, e.source].filter(Boolean);
    return parts.length ? "— " + parts.join(", ") : "";
  }

  /**
   * Builds a FavoriteButton. Toggling is optimistic and keeps every button for the same Echo in sync.
   * @param e - The Echo.
   * @param position - Positioning classes, e.g. "absolute right-3 top-3". Defaults to "relative".
   * @param onChange - Optional callback after the state flips, given the Echo.
   * @returns The button element.
   */
  function favoriteButton(e, position, onChange) {
    var b = el("button", "fav-btn " + (position || "relative") + " z-10 flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-fast ease-standard");
    b.type = "button";
    b.dataset.echo = e.id;
    b.innerHTML = ICON.heart; /* static icon markup, not user content */
    paintFavorite(b, e.fav, false);
    b.addEventListener("click", function () {
      e.fav = !e.fav;
      document.querySelectorAll('.fav-btn[data-echo="' + e.id + '"]').forEach(function (x) { paintFavorite(x, e.fav, x === b); });
      toast(e.fav ? "Added to Favorites" : "Removed from Favorites");
      if (onChange) onChange(e);
    });
    return b;
  }

  /**
   * Applies the saved or unsaved look and label to a FavoriteButton.
   * @param b - The button.
   * @param on - Whether the Echo is a favorite.
   * @param animate - Whether to play the heart pop (only when saving).
   * @returns Nothing.
   */
  function paintFavorite(b, on, animate) {
    b.setAttribute("aria-pressed", String(on));
    b.setAttribute("aria-label", on ? "Remove from favorites" : "Add to favorites");
    b.classList.toggle("text-primary", on);
    b.classList.toggle("text-muted", !on);
    b.classList.toggle("hover:text-ink", !on);
    var svg = b.querySelector("svg");
    svg.setAttribute("fill", on ? "currentColor" : "none");
    svg.classList.remove("animate-heart-pop");
    if (on && animate) { void svg.getBoundingClientRect(); svg.classList.add("animate-heart-pop", "motion-reduce:animate-none"); }
  }

  /**
   * Builds a QuoteCard list item.
   * @param e - The Echo to show.
   * @param opts - { compact, showReflection, showTags, badge, action, onTag, onFavorite }.
   * @returns The <li> containing the card.
   */
  function quoteCard(e, opts) {
    opts = opts || {};
    var li = el("li", "min-w-0");
    var card = el("article", CLS.card + (opts.compact ? " p-4" : " p-6"));
    card.appendChild(favoriteButton(e, opts.compact ? "absolute right-1 top-1" : "absolute right-3 top-3", opts.onFavorite));

    if (opts.badge) card.appendChild(el("span", "mb-3 inline-flex w-fit items-center rounded-full bg-surface-soft px-2.5 py-1 text-badge text-ink", opts.badge));

    var fig = el("figure", "min-w-0");
    var bq = el("blockquote");
    var link = el("a", "card-link whitespace-pre-wrap pr-8 text-ink text-pretty [overflow-wrap:anywhere] focus-visible:outline-none after:absolute after:inset-0 " +
      (opts.compact ? "font-quote text-quote-compact line-clamp-3" : "font-quote text-quote-card line-clamp-6"), e.quote);
    link.href = "#";
    bq.appendChild(link);
    fig.appendChild(bq);
    var attr = attribution(e);
    if (attr) fig.appendChild(el("figcaption", "mt-3 text-body-sm text-muted", attr));
    card.appendChild(fig);

    if (opts.showReflection && e.reflection) {
      var r = el("p", "mt-4 border-t border-hairline-soft pt-4 text-body-sm text-body line-clamp-3 [overflow-wrap:anywhere]");
      r.appendChild(el("span", "sr-only", "Your reflection: "));
      r.appendChild(document.createTextNode(e.reflection));
      card.appendChild(r);
    }

    if (opts.showTags && e.tags.length) {
      var tags = el("ul", "relative z-10 mt-4 flex flex-wrap gap-1");
      tags.setAttribute("aria-label", "Tags");
      e.tags.slice(0, 4).forEach(function (t) {
        var tli = el("li");
        var a = el("a", CLS.tagChip, t);
        a.href = "#";
        a.setAttribute("aria-label", "Show Echoes tagged " + t);
        if (opts.onTag) a.addEventListener("click", function (ev) { ev.preventDefault(); opts.onTag(t); });
        tli.appendChild(a);
        tags.appendChild(tli);
      });
      card.appendChild(tags);
    }

    var foot = el("div", "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-4");
    foot.appendChild(savedTime(e.saved, "whitespace-nowrap text-body-sm text-muted"));
    if (opts.action) foot.appendChild(opts.action);
    card.appendChild(foot);

    li.appendChild(card);
    return li;
  }

  /**
   * Builds a skeleton shaped like a QuoteCard.
   * @param compact - Whether to match the compact card.
   * @returns The <li> skeleton.
   */
  function skeletonCard(compact) {
    var li = el("li", "rounded-md border border-hairline " + (compact ? "p-4" : "p-6"));
    ["w-full", "w-10/12", "w-7/12"].forEach(function (w, j) { li.appendChild(el("div", "h-4 " + CLS.skeleton + " " + w + (j ? " mt-2" : ""))); });
    li.appendChild(el("div", "mt-6 h-3 w-4/12 " + CLS.skeleton));
    return li;
  }

  var toastTimer;

  /**
   * Shows a short confirmation toast for 4 seconds.
   * @param msg - The message, in past tense ("Added to Favorites").
   * @returns Nothing.
   */
  function toast(msg) {
    var t = document.getElementById("toast");
    if (!t) return;
    t.hidden = true;
    void t.offsetWidth;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 4000);
  }

  var NAV = [
    { id: "home", label: "Home", href: "dashboard.html", icon: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>' },
    { id: "library", label: "Library", href: "#", icon: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>' },
    { id: "collections", label: "Collections", href: "#", icon: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>' },
    { id: "favorites", label: "Favorites", href: "#" },
    { id: "search", label: "Search", href: "#", icon: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>' },
    { id: "revisits", label: "Revisits", href: "#", icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>' },
    { id: "settings", label: "Settings", href: "#", icon: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>' }
  ];
  NAV[3].icon = '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>';

  var LOGO = '<svg viewBox="0 0 32 32" class="h-8 w-8 shrink-0 text-primary" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="currentColor"/><circle cx="11" cy="16" r="2.4" class="fill-canvas"/><path d="M16 11.5a6.5 6.5 0 0 1 0 9" fill="none" class="stroke-canvas" stroke-width="2.2" stroke-linecap="round"/><path d="M20 8.5a11 11 0 0 1 0 15" fill="none" class="stroke-canvas" stroke-width="2.2" stroke-linecap="round" opacity=".55"/></svg>';
  var PLUS = '<svg viewBox="0 0 24 24" class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var USER = '<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';

  /**
   * Looks up a nav entry by id.
   * @param id - The nav id.
   * @returns The nav entry.
   */
  function navItem(id) { return NAV.filter(function (x) { return x.id === id; })[0]; }

  /**
   * Builds the skip link and the mockup state bar markup (static, no user content).
   * @returns An HTML string.
   */
  function topChromeHtml() {
    return '<a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-4 focus:py-3 focus:text-on-dark">Skip to content</a>' +
      '<div class="border-b border-hairline bg-surface-soft"><div id="state-bar" class="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2 tablet:px-6 desktop:px-8" role="radiogroup" aria-label="Mockup state"><span class="text-caption-sm text-muted">Mockup state · sample data</span></div></div>';
  }

  /**
   * Builds the mobile BottomTabBar and the toast region markup (static, no user content).
   * @param active - The active nav id.
   * @returns An HTML string.
   */
  function bottomChromeHtml(active) {
    var mobileNav = ["home", "library", "add", "search", "collections"].map(function (id) {
      if (id === "add") {
        return '<li class="flex items-start justify-center"><a href="#" data-add class="-mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary shadow-float transition-[background-color,transform] duration-fast ease-standard active:scale-95 motion-reduce:active:scale-100" aria-label="Add Echo">' + PLUS + "</a></li>";
      }
      var n = navItem(id);
      var on = id === active;
      return '<li><a href="' + n.href + '"' + (on ? ' aria-current="page"' : "") + ' class="' + CLS.tabItem + " " + (on ? "text-ink" : "text-muted") + '"><svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + n.icon + "</svg>" + n.label + "</a></li>";
    }).join("");
    return '<nav aria-label="Main" class="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-canvas pb-[env(safe-area-inset-bottom)] tablet:hidden"><ul class="mx-auto grid h-16 max-w-md grid-cols-5">' + mobileNav + "</ul></nav>" +
      '<div aria-live="polite" class="pointer-events-none fixed inset-x-0 bottom-20 z-40 flex justify-center px-4 tablet:bottom-6"><div id="toast" hidden class="pointer-events-auto rounded-sm bg-ink px-4 py-3 text-body-sm text-on-dark shadow-float animate-rise-in motion-reduce:animate-fade-in"></div></div>';
  }

  /**
   * Inserts HTML before an element, or at the end of <body> when no element is given.
   * @param html - Static markup.
   * @param before - The element to insert before, or null.
   * @returns Nothing.
   */
  function insertHtml(html, before) {
    var tmp = document.createElement("div");
    tmp.innerHTML = html;
    while (tmp.firstChild) {
      if (before) before.parentNode.insertBefore(tmp.firstChild, before);
      else document.body.appendChild(tmp.firstChild);
    }
  }

  /**
   * Wires what every layout shares: mockup state chips, Add actions and the n and / shortcuts.
   * @param opts - { states: [{ id, label }], onState: function(stateId) }.
   * @returns Nothing.
   */
  function wireCommon(opts) {
    var bar = document.getElementById("state-bar");
    var themeBar = el("div", "flex items-center gap-2 tablet:ml-auto");
    themeBar.setAttribute("role", "radiogroup");
    themeBar.setAttribute("aria-label", "Theme");
    themeBar.appendChild(el("span", "text-caption-sm text-muted", "Theme"));
    var saved = "system";
    try { saved = localStorage.getItem("echo.theme") || "system"; } catch (e) { /* storage blocked */ }
    function applyTheme(t) {
      if (t === "system") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
      themeBar.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.theme === t)); });
      try { localStorage.setItem("echo.theme", t); } catch (e) { /* storage blocked */ }
    }
    ["system", "light", "dark"].forEach(function (t) {
      var b = el("button", CLS.stateChip, t.charAt(0).toUpperCase() + t.slice(1));
      b.type = "button";
      b.setAttribute("role", "radio");
      b.dataset.theme = t;
      b.addEventListener("click", function () { applyTheme(t); });
      themeBar.appendChild(b);
    });
    (opts.states || []).forEach(function (st) {
      var b = el("button", CLS.stateChip, st.label);
      b.type = "button";
      b.setAttribute("role", "radio");
      b.dataset.state = st.id;
      b.addEventListener("click", function () { selectState(st.id); opts.onState(st.id); });
      bar.appendChild(b);
    });
    bar.appendChild(themeBar);
    applyTheme(saved);
    document.querySelectorAll("[data-add]").forEach(function (a) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); openQuickCapture(a, opts.onCapture); });
    });
    document.addEventListener("keydown", function (ev) {
      var t = ev.target;
      var typing = t.closest && t.closest("input, textarea, select, [contenteditable='true']");
      if (typing || ev.metaKey || ev.ctrlKey || ev.altKey) {
        if (ev.key === "Escape" && t.id === "header-search") { t.value = ""; t.blur(); }
        if (t.closest && t.closest("dialog")) return;
        return;
      }
      if (ev.key === "n") { ev.preventDefault(); openQuickCapture(document.activeElement, opts.onCapture); }
      if (ev.key === "/") {
        var sf = document.getElementById("header-search");
        if (sf && sf.offsetParent) { ev.preventDefault(); sf.focus(); }
      }
    });
  }

  /**
   * Renders the sidebar app shell: an expanded sidebar at desktop (collapsible to a rail), a rail at tablet,
   * and a compact header with the BottomTabBar on mobile. Markup is static; collection names are set as text.
   * @param opts - { active: nav id, states, onState, collections: [{ name, count, href }] }.
   * @returns Nothing.
   */
  function mountSidebarShell(opts) {
    var main = document.getElementById("main");
    var shell = document.getElementById("shell") || main; /* the wrapper that clears the fixed sidebar */
    /* An item stacks icon over label in the rail and becomes a row when the sidebar is expanded. */
    var ITEM = "flex h-16 w-full flex-col items-center justify-center gap-1 rounded-sm text-caption-sm text-muted transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink " +
      "aria-[current=page]:bg-surface-soft aria-[current=page]:text-ink aria-[current=page]:font-semibold " +
      "group-data-[expanded=true]/side:h-10 group-data-[expanded=true]/side:flex-row group-data-[expanded=true]/side:justify-start group-data-[expanded=true]/side:gap-3 group-data-[expanded=true]/side:px-3 group-data-[expanded=true]/side:text-body-md group-data-[expanded=true]/side:text-body";
    var item = function (id) {
      var n = navItem(id), on = id === opts.active;
      return '<li><a href="' + n.href + '"' + (on ? ' aria-current="page"' : "") + ' class="' + ITEM + '"><svg viewBox="0 0 24 24" class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + n.icon + "</svg><span>" + n.label + "</span></a></li>";
    };
    var showWhenExpanded = "hidden group-data-[expanded=true]/side:block";
    var showFlexWhenExpanded = "hidden group-data-[expanded=true]/side:flex"; /* for flex children, so `block` doesn't break their layout */
    var showWhenRail = "group-data-[expanded=true]/side:hidden";

    insertHtml(topChromeHtml() +
      /* Mobile header */
      '<header class="sticky top-0 z-30 border-b border-hairline bg-canvas tablet:hidden"><div class="flex h-16 items-center justify-between px-4">' +
        '<a href="dashboard.html" class="flex items-center gap-2 rounded-sm text-ink" aria-label="Echo home">' + LOGO + '<span class="text-display-sm">echo</span></a>' +
        '<button type="button" class="flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-canvas text-ink" aria-label="Account menu" aria-haspopup="menu">' + USER + "</button>" +
      "</div></header>" +
      /* Sidebar (tablet and up) */
      '<aside id="sidebar" data-expanded="false" aria-label="Sidebar" class="group/side fixed bottom-0 left-0 top-0 z-30 hidden w-24 flex-col border-r border-hairline bg-canvas tablet:flex data-[expanded=true]:w-64">' +
        '<div class="flex h-20 items-center justify-center px-4 group-data-[expanded=true]/side:justify-between">' +
          '<a href="dashboard.html" class="flex items-center gap-2 rounded-sm text-ink" aria-label="Echo home">' + LOGO + '<span class="text-display-sm ' + showWhenExpanded + '">echo</span></a>' +
          '<button type="button" id="side-toggle" class="hidden h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink desktop:group-data-[expanded=true]/side:flex" aria-label="Collapse sidebar" aria-controls="sidebar" aria-expanded="true">' +
            '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 10l-2 2 2 2"/></svg></button>' +
        "</div>" +
        '<div class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden px-3 pb-4 pt-2 [scrollbar-width:thin] [&>*]:shrink-0">' +
          /* Primary action: full button when expanded, orb in the rail */
          '<a href="#" data-add aria-keyshortcuts="n" class="' + showFlexWhenExpanded + ' ' + CLS.btnPrimary.replace("inline-flex ", "") + ' w-full gap-2">' + PLUS + "<span>Add Echo</span></a>" +
          '<a href="#" data-add aria-label="Add Echo" class="' + showWhenRail + ' mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-on-primary transition-[background-color,transform] duration-fast ease-standard hover:bg-primary-active active:scale-95 motion-reduce:active:scale-100">' + PLUS + "</a>" +
          /* Search: field when expanded, nav item in the rail */
          '<form role="search" class="' + showWhenExpanded + '" onsubmit="event.preventDefault()"><label for="header-search" class="sr-only">Search your Echoes</label><div class="flex h-10 items-center gap-2 rounded-full border border-border-input bg-canvas pl-3 pr-2 transition-shadow duration-base ease-standard focus-within:border-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink"><svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0 text-muted" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="header-search" type="search" placeholder="Search" class="min-w-0 flex-1 bg-transparent text-body-sm text-ink placeholder:text-muted focus-visible:outline-none"><kbd class="rounded-xs border border-hairline px-1.5 text-caption-sm text-muted" aria-hidden="true">/</kbd></div></form>' +
          '<nav aria-label="Main"><ul class="grid grid-cols-1 gap-1">' + item("home") + item("library") + item("favorites") + item("collections") + item("revisits") +
            '<li class="' + showWhenRail + '">' + item("search").slice(4, -5) + "</li></ul></nav>" +
          /* Collections list, expanded only */
          '<section aria-labelledby="side-col-h" class="' + showWhenExpanded + '">' +
            '<div class="flex items-center justify-between px-3"><h2 id="side-col-h" class="text-caption text-muted">Collections</h2>' +
            '<button type="button" id="side-new-col" class="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink" aria-label="New collection"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></div>' +
            '<ul id="side-collections" class="mt-1 grid grid-cols-1 gap-0.5"></ul>' +
          "</section>" +
        "</div>" +
        '<div class="border-t border-hairline p-3"><ul class="grid gap-1">' + item("settings") + "</ul>" +
          '<button type="button" class="mt-1 flex w-full items-center justify-center gap-3 rounded-sm p-2 text-left transition-colors duration-fast ease-standard hover:bg-surface-soft group-data-[expanded=true]/side:justify-start" aria-label="Account menu" aria-haspopup="menu">' +
            '<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-strong text-ink">' + USER + "</span>" +
            '<span class="' + showWhenExpanded + ' min-w-0 text-left"><span class="block truncate text-title-sm text-ink">Your account</span><span class="block text-caption-sm text-muted">Private library</span></span>' +
          "</button></div>" +
      "</aside>", main);
    insertHtml(bottomChromeHtml(opts.active === "favorites" || opts.active === "revisits" ? "home" : opts.active), null);

    var list = document.getElementById("side-collections");
    (opts.collections || []).slice(0, 5).forEach(function (c) {
      var li = el("li");
      var a = el("a", "flex h-9 items-center gap-3 rounded-sm px-3 text-body-sm text-body transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink");
      a.href = c.href;
      var dot = el("span", "h-2 w-2 shrink-0 rounded-full " + ACCENT[c.accent || "neutral"].dot);
      dot.setAttribute("aria-hidden", "true");
      a.appendChild(dot);
      a.appendChild(el("span", "min-w-0 flex-1 truncate", c.name));
      a.appendChild(el("span", "text-caption-sm text-muted tabular-nums", String(c.count)));
      li.appendChild(a);
      list.appendChild(li);
    });
    var allLi = el("li");
    var all = el("a", "flex h-9 items-center gap-2 rounded-sm px-3 text-body-sm font-medium text-ink transition-colors duration-fast ease-standard hover:bg-surface-soft", "All collections");
    all.href = "#";
    all.appendChild(el("span", "text-muted", "→"));
    allLi.appendChild(all);
    list.appendChild(allLi);
    document.getElementById("side-new-col").addEventListener("click", function () { toast("This opens New collection"); });

    /* Expanded = desktop width and not collapsed by the user. The choice is remembered per browser. */
    var side = document.getElementById("sidebar");
    var toggle = document.getElementById("side-toggle");
    var desktop = window.matchMedia("(min-width: 1128px)");
    var collapsed = false;
    try { collapsed = localStorage.getItem("echo.sidebar") === "collapsed"; } catch (e) { /* storage blocked */ }
    function sync() {
      var expanded = desktop.matches && !collapsed;
      side.dataset.expanded = String(expanded);
      shell.classList.toggle("desktop:pl-64", expanded);
      toggle.setAttribute("aria-expanded", String(expanded));
      railExpand.hidden = !desktop.matches || expanded;
    }
    /* In the rail at desktop width, an Expand button takes the toggle's place at the bottom of the nav. */
    var railExpand = el("button", "mx-auto mt-2 flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink");
    railExpand.type = "button";
    railExpand.setAttribute("aria-label", "Expand sidebar");
    railExpand.setAttribute("aria-controls", "sidebar");
    railExpand.innerHTML = '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M13 10l2 2-2 2"/></svg>';
    side.querySelector("nav").appendChild(railExpand);
    function setCollapsed(v, focusEl) {
      collapsed = v;
      try { localStorage.setItem("echo.sidebar", v ? "collapsed" : "expanded"); } catch (e) { /* storage blocked */ }
      sync();
      if (focusEl) focusEl.focus();
    }
    toggle.addEventListener("click", function () { setCollapsed(true, railExpand); });
    railExpand.addEventListener("click", function () { setCollapsed(false, toggle); });
    desktop.addEventListener("change", sync);
    shell.classList.add("tablet:pl-24"); /* audit-ignore: offset equals the rail width (w-24), not a spacing step */
    sync();
    wireCommon(opts);
  }

  /**
   * Marks one mockup state chip as selected.
   * @param id - The state id.
   * @returns Nothing.
   */
  function selectState(id) {
    document.querySelectorAll("#state-bar [data-state]").forEach(function (c) {
      var on = c.dataset.state === id;
      c.setAttribute("aria-checked", String(on));
      c.tabIndex = on ? 0 : -1;
    });
  }

  /**
   * Builds an EchoRow: a compact, single-line-height list row for dense panels (dashboard lists).
   * @param e - The Echo.
   * @param opts - { action: an optional trailing element, badge: optional text, monogram: show the author-initial circle, onTint: the row sits on a tinted panel }.
   * @returns The <li> row.
   */
  function echoRow(e, opts) {
    opts = opts || {};
    var li = el("li", "relative -mx-3 flex items-start gap-4 rounded-sm px-3 py-4 transition-colors duration-fast ease-standard has-[.card-link:focus-visible]:outline-2 has-[.card-link:focus-visible]:outline-offset-2 has-[.card-link:focus-visible]:outline-ink " +
      (opts.onTint ? "hover:bg-canvas/60" : "hover:bg-surface-soft"));
    if (opts.monogram) {
      /* Decorative: the author's initial (or a quote mark) on the Echo's collection tint. */
      var m = el("span", "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-title-sm " + accentFor(e).chip, e.author ? e.author.charAt(0) : "\u201C");
      m.setAttribute("aria-hidden", "true");
      li.appendChild(m);
    }
    var body = el("div", "min-w-0 flex-1");
    if (opts.badge) body.appendChild(el("span", "mb-2 inline-flex items-center rounded-full bg-surface-soft px-2.5 py-1 text-badge text-ink", opts.badge));
    var link = el("a", "card-link block whitespace-pre-wrap font-quote text-quote-compact text-ink line-clamp-2 [overflow-wrap:anywhere] focus-visible:outline-none after:absolute after:inset-0", e.quote);
    link.href = "#";
    body.appendChild(link);
    var meta = el("p", "mt-1 flex flex-wrap items-center gap-x-2 text-body-sm text-muted");
    var attr = attribution(e);
    if (attr) {
      meta.appendChild(el("span", "", attr));
      var sep = el("span", "", "·");
      sep.setAttribute("aria-hidden", "true");
      meta.appendChild(sep);
    }
    meta.appendChild(savedTime(e.saved, "whitespace-nowrap"));
    body.appendChild(meta);
    if (opts.action) { opts.action.classList.add("relative", "z-10", "mt-2"); body.appendChild(opts.action); }
    li.appendChild(body);
    li.appendChild(favoriteButton(e, "relative -mr-2 -mt-2 shrink-0"));
    return li;
  }

  /**
   * Builds the "where this came from" line: collection dot and name, then when it was saved.
   * @param e - The Echo.
   * @returns A <span> with the context line.
   */
  function contextLine(e) {
    var wrap = el("span", "inline-flex flex-wrap items-center gap-x-2");
    var col = e.collections[0];
    if (col) {
      var dot = el("span", "h-2 w-2 shrink-0 rounded-full " + accentFor(e).dot);
      dot.setAttribute("aria-hidden", "true");
      wrap.appendChild(dot);
    }
    wrap.appendChild(el("span", "", col ? "From " + col : "From your library"));
    var sep = el("span", "", "·");
    sep.setAttribute("aria-hidden", "true");
    wrap.appendChild(sep);
    var t = savedTime(e.saved, "");
    t.textContent = t.textContent.replace(/^Saved/, "saved");
    wrap.appendChild(t);
    return wrap;
  }

  /**
   * Builds Today's Echo (the screen's single loud moment) with the Echo me something swap wired in.
   * @param startId - The Echo shown first.
   * @param opts - { framed: draw it as a bordered panel (dashboard) instead of open space (home) }.
   * @returns The <section> element.
   */
  function todaysEcho(startId, opts) {
    opts = opts || {};
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var current = byId(startId), shown = [startId];
    var sec = el("section", opts.framed ? "rounded-md bg-tint-lagoon p-6 tablet:p-8" : "py-12 tablet:py-16");
    sec.setAttribute("aria-labelledby", "today-h");
    var h = el("h2", "text-caption text-muted");
    h.id = "today-h";
    if (opts.framed) h.className = "text-caption text-primary";
    h.appendChild(document.createTextNode("Today's Echo · "));
    var t = el("time", "", TODAY.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }));
    t.dateTime = "2026-10-01";
    h.appendChild(t);
    sec.appendChild(h);

    var region = el("div", "mt-6");
    if (opts.framed) {
      /* A small opening quote mark above the quote: decorative, in flow, so it never sits under the words. */
      var glyph = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      glyph.setAttribute("viewBox", "0 0 48 48");
      glyph.setAttribute("aria-hidden", "true");
      glyph.setAttribute("class", "mb-3 h-8 w-8 text-primary opacity-40");
      glyph.innerHTML = '<path fill="currentColor" d="M20 10C11 13 6 20 6 29v9h14V24h-7c0-5 3-8 8-10zm22 0c-9 3-14 10-14 19v9h14V24h-7c0-5 3-8 8-10z"/>';
      region.appendChild(glyph);
    }
    var fig = el("figure");
    var bq = el("blockquote");
    var qp = el("p", "whitespace-pre-wrap font-quote text-quote-card text-pretty text-ink [overflow-wrap:anywhere] tablet:text-quote-hero");
    bq.appendChild(qp); fig.appendChild(bq);
    var cap = el("figcaption", "mt-4 text-body-md text-body");
    fig.appendChild(cap); region.appendChild(fig);
    var savedP = el("p", "mt-2 text-body-sm text-muted");
    region.appendChild(savedP);
    var refWrap = el("div", opts.framed ? "mt-8 rounded-sm bg-canvas p-4 tablet:p-6" : "mt-8 border-t border-hairline-soft pt-6");
    refWrap.appendChild(el("p", "text-caption text-muted", "You wrote:"));
    var refP = el("p", "mt-2 whitespace-pre-wrap text-body-md text-body [overflow-wrap:anywhere]");
    refWrap.appendChild(refP); region.appendChild(refWrap);
    sec.appendChild(region);

    var actions = el("div", "mt-8 flex flex-col gap-4 tablet:flex-row tablet:items-center");
    var btn = el("button", "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-button-sm text-on-primary transition-[background-color,transform] duration-fast ease-standard hover:bg-primary-active active:scale-98 motion-reduce:active:scale-100 disabled:cursor-not-allowed");
    btn.type = "button";
    btn.innerHTML = '<svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>Echo me something';
    actions.appendChild(btn);
    /* Mobile: Echo me something is full width; Open Echo and the heart share the next row. */
    var secondary = el("div", "flex flex-1 items-center justify-between gap-4");
    var open = el("a", CLS.btnTertiary, "Open Echo");
    open.href = "#";
    secondary.appendChild(open);
    var favSlot = el("span", "");
    secondary.appendChild(favSlot);
    actions.appendChild(secondary);
    sec.appendChild(actions);
    var status = el("p", "sr-only");
    status.setAttribute("role", "status");
    status.setAttribute("aria-atomic", "true");
    sec.appendChild(status);

    function paint(e) {
      qp.textContent = e.quote;
      var a = attribution(e);
      cap.textContent = a; cap.hidden = !a;
      savedP.replaceChildren(contextLine(e));
      refWrap.hidden = !e.reflection;
      refP.textContent = e.reflection;
      favSlot.replaceChildren(favoriteButton(e));
    }
    btn.addEventListener("click", function () {
      var pool = ECHOES.filter(function (x) { return shown.indexOf(x.id) === -1; });
      if (!pool.length) { shown = [current.id]; pool = ECHOES.filter(function (x) { return x.id !== current.id; }); }
      var next = pool[Math.floor(Math.random() * pool.length)];
      shown.push(next.id); if (shown.length > 5) shown.shift();
      current = next;
      var announce = function () {
        status.textContent = "Now showing an Echo" + (next.author ? " by " + next.author : "") + (next.collections[0] ? ", from " + next.collections[0] : "") + ", " + savedLabel(next.saved).label.replace(/^Saved/, "saved") + ".";
      };
      if (reduce.matches) { paint(next); announce(); return; }
      /* Keep the region's height while swapping so nothing below jumps; fade out fast, rise in slow. */
      btn.disabled = true;
      region.style.minHeight = region.offsetHeight + "px";
      region.classList.remove("animate-rise-in");
      region.classList.add("transition-opacity", "duration-fast", "ease-in-soft", "opacity-0");
      setTimeout(function () {
        paint(next);
        region.classList.remove("transition-opacity", "duration-fast", "ease-in-soft", "opacity-0");
        void region.offsetWidth;
        region.classList.add("animate-rise-in");
        region.style.minHeight = "";
        btn.disabled = false;
        announce();
      }, 120);
    });
    paint(current);
    return sec;
  }

  var INPUT = "w-full rounded-sm border border-border-input bg-canvas px-3 text-body-md text-ink placeholder:text-muted transition-colors duration-fast ease-standard focus:border-ink focus:outline-1 focus:outline-ink focus:-outline-offset-2";

  /**
   * Builds the QuickCapture dialog once and returns it.
   * @returns The <dialog> element.
   */
  function quickCaptureDialog() {
    var existing = document.getElementById("qc");
    if (existing) return existing;
    var d = document.createElement("dialog");
    d.id = "qc";
    d.setAttribute("aria-labelledby", "qc-title");
    d.className = "mb-0 mt-auto w-full max-w-none rounded-t-xl bg-canvas p-0 text-ink shadow-float backdrop:bg-scrim/50 backdrop:animate-fade-in open:animate-rise-in motion-reduce:open:animate-fade-in tablet:m-auto tablet:max-w-lg tablet:rounded-md";
    var colOptions = COLLECTIONS.map(function (c) { return '<option>' + c.name.replace(/[<>&"]/g, "") + "</option>"; }).join("");
    d.innerHTML = /* static markup; user input is only ever read from .value */
      '<form id="qc-form" method="dialog" novalidate class="grid gap-6 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">' +
        '<div class="flex items-center justify-between gap-4"><h2 id="qc-title" class="text-display-sm">Add an Echo</h2>' +
        '<button type="button" data-qc-cancel class="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors duration-fast ease-standard hover:bg-surface-soft hover:text-ink" aria-label="Close">' + ICON.close.replace("h-3.5 w-3.5", "h-4 w-4") + "</button></div>" +
        '<div class="grid gap-1.5"><label for="qc-quote" class="text-caption text-muted">Quote</label>' +
        '<textarea id="qc-quote" rows="4" required aria-describedby="qc-err" placeholder="Paste or type the words you want to keep" class="' + INPUT + ' min-h-32 resize-y py-3 font-quote text-quote-card"></textarea>' +
        '<p id="qc-err" hidden class="flex items-center gap-1.5 text-body-sm text-primary-error-text"><svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>Add the quote you want to save.</p></div>' +
        '<div><button type="button" id="qc-more" aria-expanded="false" aria-controls="qc-details" class="inline-flex items-center gap-1.5 text-button-sm text-ink underline-offset-4 hover:underline">More details <span data-chev class="inline-flex transition-transform duration-base ease-standard motion-reduce:transition-none">' + ICON.chevron + "</span></button>" +
        '<div id="qc-details" hidden class="mt-4 grid gap-4 animate-fade-in motion-reduce:animate-none tablet:grid-cols-2">' +
          '<div class="grid gap-1.5"><label for="qc-author" class="text-caption text-muted">Author</label><input id="qc-author" class="' + INPUT + ' h-12" autocomplete="off"></div>' +
          '<div class="grid gap-1.5"><label for="qc-source" class="text-caption text-muted">Source</label><input id="qc-source" class="' + INPUT + ' h-12" autocomplete="off"></div>' +
          '<div class="grid gap-1.5 tablet:col-span-2"><label for="qc-reflection" class="text-caption text-muted">Why does this matter to you?</label><textarea id="qc-reflection" rows="2" class="' + INPUT + ' resize-y py-3"></textarea></div>' +
          '<div class="grid gap-1.5 tablet:col-span-2"><label for="qc-collection" class="text-caption text-muted">Collection</label><select id="qc-collection" class="' + INPUT + ' h-12"><option value="">None</option>' + colOptions + "</select></div>" +
        "</div></div>" +
        '<div id="qc-discard" hidden role="alert" class="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-surface-soft p-4"><p class="text-body-sm text-ink">Discard this quote?</p><div class="flex gap-3"><button type="button" id="qc-keep" class="' + CLS.btnTertiary + ' text-button-sm">Keep editing</button><button type="button" id="qc-discard-yes" class="text-button-sm font-semibold text-primary-error-text underline-offset-4 hover:underline">Discard</button></div></div>' +
        '<div class="flex flex-col-reverse gap-3 tablet:flex-row tablet:items-center tablet:justify-between">' +
          '<a href="#" class="text-center text-body-sm text-muted underline-offset-4 hover:text-ink hover:underline">Open full form</a>' +
          '<div class="flex flex-col-reverse gap-3 tablet:flex-row"><button type="button" data-qc-cancel class="' + CLS.btnSecondary + '">Cancel</button>' +
          '<button type="submit" id="qc-save" aria-keyshortcuts="Control+Enter Meta+Enter" class="' + CLS.btnPrimary + ' disabled:cursor-not-allowed disabled:bg-primary-disabled disabled:text-on-primary-disabled">Save Echo</button></div>' +
        "</div>" +
      "</form>";
    document.body.appendChild(d);

    var quote = d.querySelector("#qc-quote"), err = d.querySelector("#qc-err"), more = d.querySelector("#qc-more"),
        details = d.querySelector("#qc-details"), discard = d.querySelector("#qc-discard"), save = d.querySelector("#qc-save");
    more.addEventListener("click", function () {
      var open = details.hidden;
      details.hidden = !open;
      more.setAttribute("aria-expanded", String(open));
      more.querySelector("[data-chev]").classList.toggle("rotate-180", open);
      if (open) d.querySelector("#qc-author").focus();
    });
    quote.addEventListener("input", function () { if (quote.value.trim()) { err.hidden = true; quote.removeAttribute("aria-invalid"); quote.classList.remove("border-primary-error-text"); } });
    function requestClose() {
      if (quote.value.trim() || d.querySelector("#qc-reflection").value.trim()) { discard.hidden = false; d.querySelector("#qc-keep").focus(); return; }
      close();
    }
    function close() { d.close(); }
    d.querySelectorAll("[data-qc-cancel]").forEach(function (b) { b.addEventListener("click", requestClose); });
    d.addEventListener("cancel", function (ev) { ev.preventDefault(); if (!discard.hidden) { discard.hidden = true; quote.focus(); } else requestClose(); });
    d.querySelector("#qc-keep").addEventListener("click", function () { discard.hidden = true; quote.focus(); });
    d.querySelector("#qc-discard-yes").addEventListener("click", close);
    d.addEventListener("click", function (ev) { if (ev.target === d) requestClose(); }); /* backdrop click */
    d.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && (ev.metaKey || ev.ctrlKey)) { ev.preventDefault(); d.querySelector("#qc-form").requestSubmit(); } });
    d.querySelector("#qc-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!quote.value.trim()) {
        err.hidden = false;
        quote.setAttribute("aria-invalid", "true");
        quote.classList.add("border-primary-error-text");
        quote.focus();
        return;
      }
      save.disabled = true;
      save.textContent = "Saving…";
      setTimeout(function () { /* stands in for POST /api/echoes */
        var col = d.querySelector("#qc-collection").value;
        var e = { id: "n" + Date.now(), quote: quote.value.trim(), author: d.querySelector("#qc-author").value.trim(), source: d.querySelector("#qc-source").value.trim(),
          saved: "2026-10-01", updated: "2026-10-01", reflection: d.querySelector("#qc-reflection").value.trim(), fav: false, tags: [], collections: col ? [col] : [] };
        ECHOES.unshift(e);
        close();
        toast("Echo saved");
        if (d._onSave) d._onSave(e);
      }, 600);
    });
    d.addEventListener("close", function () {
      if (d._trigger && d._trigger.focus) d._trigger.focus();
    });
    return d;
  }

  /**
   * Opens QuickCapture with a fresh form.
   * @param trigger - The element to return focus to when the dialog closes.
   * @param onSave - Called with the new Echo after it is saved.
   * @returns Nothing.
   */
  function openQuickCapture(trigger, onSave) {
    var d = quickCaptureDialog();
    if (d.open) return;
    d.querySelector("#qc-form").reset();
    ["#qc-err", "#qc-details", "#qc-discard"].forEach(function (sel) { d.querySelector(sel).hidden = true; });
    d.querySelector("#qc-more").setAttribute("aria-expanded", "false");
    d.querySelector("[data-chev]").classList.remove("rotate-180");
    var q = d.querySelector("#qc-quote");
    q.removeAttribute("aria-invalid");
    q.classList.remove("border-primary-error-text");
    var save = d.querySelector("#qc-save");
    save.disabled = false;
    save.textContent = "Save Echo";
    d._trigger = trigger;
    d._onSave = onSave;
    d.showModal();
    q.focus();
  }

  global.EchoUI = {
    TODAY: TODAY, ECHOES: ECHOES, COLLECTIONS: COLLECTIONS, ACCENT: ACCENT, accentFor: accentFor, CLS: CLS, ICON: ICON,
    byId: byId, el: el, savedLabel: savedLabel, savedTime: savedTime, attribution: attribution,
    favoriteButton: favoriteButton, quoteCard: quoteCard, echoRow: echoRow, todaysEcho: todaysEcho, skeletonCard: skeletonCard, toast: toast,
    mountSidebarShell: mountSidebarShell, openQuickCapture: openQuickCapture, selectState: selectState
  };
})(window);
