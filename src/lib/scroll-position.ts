import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Position = { href: string; y: number; section: string; offset: number; pin?: { id: string; progress: number } };
const sectionIds = ['inicio', 'prepara-cafe', 'comunidad', 'margarita', 'evento', 'equipo', 'programa', 'patrocinadores', 'aliados', 'faq', 'contacto'];
const pinSections: Record<string, string> = { 'red-journey': 'inicio', 'red-island': 'margarita', 'red-team': 'equipo' };

export function savedPosition(): Position | null {
  const value = history.state?.redScroll as Position | undefined;
  if (!value || value.href !== location.href || !sectionIds.includes(value.section) || !Number.isFinite(value.y) || !Number.isFinite(value.offset)) return null;
  return value;
}
const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
export const initialPosition = navigation?.type === 'reload' || navigation?.type === 'back_forward' ? savedPosition() : null;

export function rememberPosition() {
  if (document.documentElement.dataset.siteReady !== 'true') return;
  const pin = Object.keys(pinSections).map(id => ScrollTrigger.getById(id)).find(trigger => trigger?.pin && scrollY >= trigger.start && scrollY < trigger.end);
  let section = 'inicio', offset = scrollY;
  if (pin) {
    section = pinSections[pin.vars.id!]; offset = 0;
  } else {
    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (!element || getComputedStyle(element).display === 'contents') continue;
      const top = element.getBoundingClientRect().top;
      if (top <= innerHeight * .25) { section = id; offset = -top; }
    }
  }
  const position: Position = { href: location.href, y: scrollY, section, offset };
  if (pin) position.pin = { id: pin.vars.id!, progress: Math.max(0, Math.min(1, (scrollY - pin.start) / (pin.end - pin.start))) };
  history.replaceState({ ...history.state, redScroll: position }, '');
}

export function settleScroll() {
  ScrollTrigger.update();
  // Restore the actual scene immediately instead of playing the scrub from zero.
  ScrollTrigger.getAll().forEach(trigger => {
    if (!trigger.vars.scrub) return;
    trigger.getTween()?.progress(1);
    trigger.animation?.totalProgress(trigger.progress, false);
  });
}

export function restorePosition(position: Position) {
  const pin = position.pin && Object.hasOwn(pinSections, position.pin.id) ? ScrollTrigger.getById(position.pin.id) : null;
  const element = document.getElementById(position.section);
  const top = pin?.pin && position.pin && Number.isFinite(position.pin.progress)
    ? pin.start + (pin.end - pin.start) * Math.max(0, Math.min(1, position.pin.progress))
    : element ? element.getBoundingClientRect().top + scrollY + position.offset : position.y;
  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
  settleScroll();
}
