import { GoogleIcon } from "@/components/ui/icons";
import { signInWithGoogle } from "@/server/sign-in";

/**
 * "Continue with Google": the one sign-in action, a primary button whose Google mark sits on its
 * own white tile, as Google's brand rules ask.
 */
export function GoogleButton({ className }: { className?: string }) {
  return (
    <form action={signInWithGoogle} className={className}>
      <button
        type="submit"
        className="inline-flex h-13 w-full items-center justify-center gap-3 rounded-md bg-primary pr-5.5 pl-4.5 text-body-md font-semibold text-on-primary transition-[background-color,transform] duration-fast ease-standard hover:bg-primary-hover active:scale-98 active:bg-primary-active motion-reduce:active:scale-100"
      >
        <span
          aria-hidden
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-[#ffffff]" // audit-ignore: Google's mark needs a white tile in both themes
        >
          <GoogleIcon className="h-4 w-4" />
        </span>
        Continue with Google
      </button>
    </form>
  );
}
