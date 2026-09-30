import { useEffect, useRef, useState, type RefObject } from "react";

/* One scroll reveal, used below the hero only. Threshold .3, fires once, and
   then stops observing. Reduced motion is handled in CSS by rendering the
   elements in their end state, so a section that is never scrolled into view
   still shows. */
export function useInView<T extends Element>(threshold = 0.3): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
}
