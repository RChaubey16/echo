const BAR = "animate-skeleton rounded-xs bg-surface-strong motion-reduce:animate-none";

export default function EchoLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col py-8 tablet:py-12" aria-busy="true">
      <p className="sr-only" role="status">
        Loading Echo
      </p>
      <div className="flex h-11 items-center">
        <div className={`h-4 w-20 ${BAR}`} />
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <div className={`h-7 w-[90%] ${BAR}`} />
        <div className={`h-7 w-[70%] ${BAR}`} />
      </div>
      <div className={`mt-6 h-4 w-[30%] ${BAR}`} />
    </div>
  );
}
