import { useEffect, type RefObject } from "react";

/**
 * Closes a popover, menu or listbox on a pointer press outside it or on Escape.
 *
 * Escape is stopped from reaching an enclosing `<dialog>`, so it closes only the popup. A control
 * inside the popup can claim Escape first by calling `preventDefault()` (React listens on the
 * document too, so stopping propagation alone isn't enough).
 *
 * @param open - Whether the popup is open.
 * @param refs - The elements that count as "inside" (the popup and its trigger).
 * @param onDismiss - Called with `true` for Escape (return focus to the trigger), `false` otherwise.
 * @returns Nothing.
 */
export function useDismiss(
  open: boolean,
  refs: ReadonlyArray<RefObject<HTMLElement | null>>,
  onDismiss: (byKeyboard: boolean) => void,
): void {
  useEffect(() => {
    if (!open) return;
    const inside = (target: EventTarget | null) =>
      target instanceof Node && refs.some((ref) => ref.current?.contains(target));
    const onPointerDown = (event: PointerEvent) => {
      if (!inside(event.target)) onDismiss(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      onDismiss(true);
    };
    document.addEventListener("pointerdown", onPointerDown);
    // Bubble phase still runs before the key's default action (cancelling a <dialog>).
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, refs, onDismiss]);
}
