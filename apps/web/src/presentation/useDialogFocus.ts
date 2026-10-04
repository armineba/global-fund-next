import { useEffect, useRef } from "react";

let locks = 0;
let previousOverflow = "";

/** Focus et défilement communs aux scènes HTML, sans effet sur le moteur. */
export function useDialogFocus(onClose?: () => void) {
  const ref = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    if (locks++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    const dialog = ref.current;
    dialog?.focus();
    const keydown = (event: KeyboardEvent) => {
      const modals = Array.from(
        document.querySelectorAll('[aria-modal="true"]'),
      );
      if (modals.at(-1) !== dialog?.closest('[aria-modal="true"]')) return;
      if (event.key === "Escape" && close.current) {
        event.preventDefault();
        close.current();
      }
      if (event.key !== "Tab") return;
      const items = Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button,[href],input,select,textarea,[tabindex="0"]',
        ) ?? [],
      ).filter(
        (item) =>
          !item.hasAttribute("disabled") && item.getClientRects().length > 0,
      );
      const first = items[0],
        last = items.at(-1);
      if (!first) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialog?.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      if (--locks === 0) document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);
  return ref;
}
