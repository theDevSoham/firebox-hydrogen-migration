import {useEffect} from 'react';
import Lenis from 'lenis';
import {gsap, ScrollTrigger} from '~/lib/film/gsap';
import {motionSettled, setLenis} from '~/lib/film/motion';

// Lenis + ScrollTrigger (handoff/04-components.md · SmoothScroll). Lenis is driven by the GSAP
// ticker and feeds ScrollTrigger; touch stays native.

export function SmoothScroll() {
  useEffect(() => {
    ScrollTrigger.config({ignoreMobileResize: true});
    const lenis = new Lenis({lerp: 0.09, smoothWheel: true});
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(lenis);

    // Pins change the page height: measure again once every scene is set up and the images have landed.
    const refresh = () => ScrollTrigger.refresh();
    motionSettled().then(() => requestAnimationFrame(refresh));
    window.addEventListener('load', refresh);

    return () => {
      window.removeEventListener('load', refresh);
      gsap.ticker.remove(tick);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
