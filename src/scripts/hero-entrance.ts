import { gsap } from 'gsap';

export function heroEntrance(restoredY = 0) {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || restoredY > 60 || scrollY > 60 || (location.hash && location.hash !== '#inicio')) {
    root.dataset.heroReveal = '1'; root.dataset.heroEntrance = 'skipped'; return;
  }
  const reveal = { value: 0 };
  const sync = () => { root.dataset.heroReveal = String(reveal.value); window.dispatchEvent(new Event('red:hero-reveal')); };
  sync(); root.dataset.heroEntrance = 'waiting';
  const done = () => {
    root.dataset.heroEntrance = 'complete';
    window.removeEventListener('scroll', interrupt); reduced.removeEventListener('change', settle);
  };
  const timeline = gsap.timeline({ paused: true, onComplete: done });
  // Entrance owns inner layers; ScrollTrigger retains the outer scene transforms.
  timeline.from('.hero-landscape-reveal', { scale: 1.12, yPercent: 3, duration: 2.8, ease: 'power3.out' }, 0)
    .from('.hero-product .product-fallback', {yPercent:16,rotation:-9,scale:1.08,duration:2.4,ease:'power3.out'}, .18)
    .to(reveal, { value: 1, duration: 2.2, ease: 'power3.out', onUpdate: sync }, .18)
    .from('.hero-horizon>span,.hero-content>.eyebrow', { y: 18, autoAlpha:0, stagger: .07, duration: .9, ease: 'power3.out' }, .32)
    .from('.hero-horizon>i', { scaleX: 0, transformOrigin: 'left', duration: 1.3, ease: 'power3.inOut' }, .5)
    .from('.title-line>span', { yPercent: 38, rotationX: -16, rotationZ: -1.2, transformOrigin: '0% 100%', stagger: .15, duration: 1.65, ease: 'power4.out' }, .38)
    .from('.hero-subtitle,.hero-date,.hero-content>.button', { y: 26, autoAlpha:0, stagger: .10, duration: 1.05, ease: 'power3.out' }, .75)
    .from('.hero-handwriting>span', { y: 26, autoAlpha:0, rotation: 9, duration: 1.3, ease: 'power3.out' }, .95)
    .from('.hero-scroll-inner', { y: 24, autoAlpha:0, duration: 1, ease: 'power3.out' }, 1.2);
  const play = () => { root.dataset.heroEntrance = 'playing'; timeline.play(); };
  function settle() { timeline.progress(1); timeline.kill(); reveal.value = 1; sync(); done(); }
  function interrupt() { if (scrollY > 8) settle(); }
  window.addEventListener('scroll', interrupt, { passive: true });
  reduced.addEventListener('change', settle);
  if (root.dataset.siteReady === 'true') play();
  else window.addEventListener('red:site-ready', play, { once: true });
}
