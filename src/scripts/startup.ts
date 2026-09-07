import { gsap } from 'gsap';

const root = document.documentElement;
const preloader = document.querySelector<HTMLElement>('.preloader')!;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let revealing = false;

function complete() {
  gsap.killTweensOf(preloader.querySelectorAll('.preloader-content,.preloader-curtain'));
  preloader.hidden = true;
  preloader.classList.remove('is-leaving');
  root.dataset.preloader = 'complete';
  window.removeEventListener('keydown', skip);
  window.removeEventListener('wheel', skip);
  window.removeEventListener('touchmove', skip);
}

function reveal() {
  if (revealing || preloader.hidden) return;
  revealing = true;
  window.dispatchEvent(new Event('red:prepare-reveal'));
  root.dataset.siteReady = 'true';
  root.classList.remove('is-loading');
  root.dataset.preloader = 'revealing';
  preloader.classList.add('is-leaving');
  window.dispatchEvent(new Event('red:site-ready'));
  // Restored reading positions never wait for a cover animation or the 3D.
  if (reduced.matches || scrollY > 60 || (location.hash && location.hash !== '#inicio')) { complete(); return; }
  gsap.timeline({onComplete:complete})
    .to('.preloader-content', {opacity:0,y:-22,duration:.32,ease:'power2.in'}, 0)
    .to('.curtain-top', {yPercent:-101,duration:.85,ease:'power3.inOut'}, .06)
    .to('.curtain-bottom', {yPercent:101,duration:.85,ease:'power3.inOut'}, .10);
}

function skip() {
  if (!root.dataset.motionReady) return;
  if (!revealing) reveal();
  complete();
}
// Wait for the document layout, never for WebGL or an artificial loading timer.
if (root.dataset.motionReady) reveal();
else window.addEventListener('red:motion-ready', reveal, {once:true});
window.addEventListener('red:boot-timeout', complete, {once:true});
window.addEventListener('keydown', skip);
window.addEventListener('wheel', skip, {passive:true});
window.addEventListener('touchmove', skip, {passive:true});
export {};
