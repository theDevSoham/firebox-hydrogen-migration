// GSAP and its plugins, registered once, in the browser only: every animation runs in an effect,
// and the server (an Oxygen Worker, with no window or document) must not touch them.
// The registration is a side effect: package.json lists this file under "sideEffects" so the
// production build keeps it (without that, ScrollTrigger runs unregistered and throws).

import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import {useGSAP} from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

export {gsap, ScrollTrigger, SplitText, useGSAP};
