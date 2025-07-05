import { useEffect } from "react";

/**
 * Bloquea el scroll chaining (bubbling) en un contenedor.
 * Uso: useLockScrollBubbling(ref);
 */
export function useLockScrollBubbling(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const delta = e.deltaY;
      if (
        (delta < 0 && scrollTop === 0) || // scroll up at top
        (delta > 0 && scrollTop + clientHeight >= scrollHeight) // scroll down at bottom
      ) {
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [ref]);
}
