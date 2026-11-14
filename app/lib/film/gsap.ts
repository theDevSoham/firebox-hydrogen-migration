// GSAP and its plugins, registered once. Import gsap from here in client components only.

import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import {useGSAP} from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

export {gsap, ScrollTrigger, SplitText, useGSAP};
