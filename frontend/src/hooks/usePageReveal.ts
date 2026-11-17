import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function usePageReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const context = gsap.context(() => {
      gsap.from('[data-reveal]', {
        opacity: 0,
        y: 12,
        duration: 0.45,
        stagger: 0.055,
        ease: 'power2.out',
        clearProps: 'opacity,transform',
      });
    }, element);

    return () => context.revert();
  }, []);

  return ref;
}
