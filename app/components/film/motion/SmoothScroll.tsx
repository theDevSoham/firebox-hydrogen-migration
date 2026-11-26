import {useEffect} from 'react';
import Lenis from 'lenis';
import {gsap, ScrollTrigger} from '~/lib/film/gsap';
import {liteOn, motionSettled, setLenis} from '~/lib/film/motion';

// Lenis + ScrollTrigger (handoff/04-components.md · SmoothScroll). Lenis is driven by the GSAP
// ticker and feeds ScrollTrigger; touch stays native. A device that travels light (liteOn) scrolls
// natively throughout: ScrollTrigger follows the browser's own scroll, and nothing runs per frame.

export function SmoothScroll() {
  useEffect(() => {
    ScrollTrigger.config({ignoreMobileResize: true});
    let stopLenis = () => {};
    if (!liteOn()) {
      const lenis = new Lenis({lerp: 0.09, smoothWheel: true});
      const tick = (time: number) => lenis.raf(time * 1000);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      setLenis(lenis);
      stopLenis = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
        setLenis(null);
      };
    }

    // Pins change the page height: measure again once every scene is set up and the images have landed.
    const refresh = () => ScrollTrigger.refresh();
    void motionSettled().then(() => requestAnimationFrame(refresh));
    window.addEventListener('load', refresh);

    return () => {
      window.removeEventListener('load', refresh);
      stopLenis();
    };
  }, []);

  return null;
}
