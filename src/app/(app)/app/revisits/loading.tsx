const SKELETON = "animate-skeleton rounded-xs bg-surface-strong motion-reduce:animate-none";

/** The Revisits page in gray: the title, then the Due now and Upcoming panels. */
export default function RevisitsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-8 py-8 tablet:py-12" aria-busy="true">
      <p className="sr-only" role="status">
        Loading your Revisits
      </p>
      <div aria-hidden>
        <div className={`h-7 w-40 ${SKELETON}`} />
        <div className={`mt-2 h-4 w-72 max-w-full ${SKELETON}`} />
      </div>
      <div aria-hidden className="grid items-start gap-8 desktop:grid-cols-2">
        {["bg-tint-bronze", "border border-hairline-soft bg-canvas"].map((panel) => (
          <div key={panel} className={`rounded-md p-6 ${panel}`}>
            <div className={`h-5 w-32 ${SKELETON}`} />
            {[0, 1, 2].map((row) => (
              <div key={row} className="py-4">
                <div className={`h-4 w-10/12 ${SKELETON}`} />
                <div className={`mt-2 h-3 w-4/12 ${SKELETON}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
