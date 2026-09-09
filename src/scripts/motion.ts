import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { journeyAtScroll, sceneAtScroll, scrollAtJourney } from '../lib/reading-pace.mjs';
import { initialPosition, rememberPosition, restorePosition, savedPosition, settleScroll } from '../lib/scroll-position';
import { heroEntrance } from './hero-entrance';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
const experience = document.querySelector<HTMLElement>('.experience')!;
const hero = document.getElementById('inicio')!;
const explore = document.getElementById('explora')!;
const header = document.querySelector<HTMLElement>('.site-header')!;
const teamSection = document.querySelector<HTMLElement>('.team-section')!;
const teamViewport = document.querySelector<HTMLElement>('.team-viewport')!;
const teamTrack = document.querySelector<HTMLElement>('.team-grid')!;
const teamCards = gsap.utils.toArray<HTMLElement>('.team-person');
const teamCounter = document.querySelector<HTMLElement>('[data-team-count]')!;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
document.documentElement.classList.add('motion-ready');
let media: gsap.MatchMedia | null = null;
let teamIndex = 0;

const announceFrame = (progress: number, sceneProgress = progress) => {
  experience.dataset.journeyProgress = String(progress);
  experience.dataset.sceneProgress = String(sceneProgress);
  window.dispatchEvent(new Event('red:journey'));
};
const setTeamIndex = (index: number) => {
  teamIndex = Math.max(0, Math.min(teamCards.length - 1, index));
  const text = `0${teamIndex + 1} / 04`;
  if (teamCounter.textContent !== text) teamCounter.textContent = text;
  document.querySelector<HTMLButtonElement>('[data-team-step="-1"]')!.disabled = teamIndex === 0;
  document.querySelector<HTMLButtonElement>('[data-team-step="1"]')!.disabled = teamIndex === teamCards.length - 1;
};

function journeyUI(progress: number, sceneProgress = progress) {
  announceFrame(progress, sceneProgress);
  const open = progress > .26;
  hero.inert = progress > .24;
  // The canvas remains active during the coastal introduction; only the controls wait.
  explore.querySelectorAll<HTMLElement>('.explore-chapters,.rotation-control').forEach(el => el.inert = !open);
  const index = progress < .44 ? 0 : progress < .61 ? 1 : progress < .8 ? 2 : 3;
  document.querySelectorAll('[data-journey]').forEach((button, i) => i === index ? button.setAttribute('aria-current', 'step') : button.removeAttribute('aria-current'));
}

function buildMotion() {
  media?.revert();
  media = gsap.matchMedia();
  experience.classList.remove('is-enhanced'); teamSection.classList.remove('is-pinned');
  hero.inert = false;
  explore.querySelectorAll<HTMLElement>('[inert]').forEach(el => el.inert = false);
  if (reduced.matches) {
    announceFrame(1);
    ScrollTrigger.refresh(); return;
  }

  media.add({ desktop: '(min-width: 761px)', mobile: '(max-width: 760px)', compact: '(max-height: 550px) and (orientation: landscape)' }, context => {
    const mobile = !!context.conditions?.mobile || !!context.conditions?.compact;
    experience.classList.add('is-enhanced');
    const driver = { progress: 0 };
    const ui = '.hero-content,.hero-handwriting,.hero-scroll,.hero-values,.hero-image-credit';
    const journey = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    const scrollDriver = { progress: 0 };
    const renderJourney = (rawProgress: number) => {
      const progress = journeyAtScroll(rawProgress);
      journey.progress(progress);
      journeyUI(progress, sceneAtScroll(rawProgress));
    };
    const createJourneyScroll = () => gsap.fromTo(scrollDriver, { progress: 0 }, {
      progress: 1, ease: 'none', onUpdate: () => renderJourney(scrollDriver.progress),
      scrollTrigger: {
        id: 'red-journey', trigger: experience, pin: '.experience-stage', start: 'top top',
        end: () => `+=${innerHeight * (mobile ? 7.5 : 8.5)}`, scrub: .65, anticipatePin: 1, invalidateOnRefresh: true,
        onRefresh: self => {
          // Refresh can reset a paused timeline without changing its scroll
          // driver. Reconcile both the text and model before revealing the page.
          renderJourney(self.progress);
          if (import.meta.env.DEV) Object.assign(window, { __aeroScroll: { start: self.start, end: self.end } });
        },
      },
    });
    journey.to(driver, { progress: 1, duration: 1 }, 0);
    journey.fromTo('.hero-landscape', { scale: 1, yPercent: 0, opacity: 1 }, { scale: 1.35, yPercent: -8, duration: .33 }, 0);
    journey.to('.hero-landscape,.hero-shade', { opacity: 0, duration: .17 }, .13);
    journey.to(ui, { y: mobile ? -70 : -100, autoAlpha: 0, stagger: .005, duration: .15 }, .045);
    journey.to('.hero-product', { opacity: 0, scale: 1.12, duration: .14 }, .13);
    journey.fromTo('.explore-atmosphere', { autoAlpha: 0, scale: 1.2 }, { autoAlpha: 1, scale: 1, duration: .3 }, .19);
    journey.fromTo('.explore-giant', { xPercent: 15 }, { xPercent: -12, duration: .8 }, .2);
    journey.fromTo('.ring-two', { rotation: -40 }, { rotation: 80, duration: 1 }, 0);
    journey.fromTo('.explore-intro', { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .06 }, .255);
    journey.to('.explore-intro', { y: -55, autoAlpha: 0, duration: .055 }, .395);
    const scenes = [ { id: 1, start: .45, end: .575 }, { id: 2, start: .625, end: .76 }, { id: 3, start: .81, end: 1.2 } ];
    scenes.forEach(({ id, start, end }) => {
      const selector = `[data-story="${id}"]`;
      journey.fromTo(selector, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .045 }, start);
      if (end < 1) journey.to(selector, { y: -55, autoAlpha: 0, duration: .045 }, end);
    });
    journey.fromTo('.explore-chapters', { autoAlpha: 0, y: 25 }, { autoAlpha: 1, y: 0, duration: .035 }, .29);
    journey.fromTo('.rotation-control', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .08 }, .78);
    journey.fromTo(experience, { '--fallback-opacity': 0 }, { '--fallback-opacity': 1, duration: .14 }, .25);
    journeyUI(0);
    createJourneyScroll();
    if (import.meta.env.DEV) Object.assign(window, { __readingState: () => ({ raw: scrollDriver.progress, journey: journey.progress(), logical: driver.progress, trigger: ScrollTrigger.getById('red-journey')?.progress, animation: ScrollTrigger.getById('red-journey')?.animation?.progress() }) });

    // Counter-moving type gives the bridge its own rhythm without a third canvas.
    const manifesto = gsap.timeline({ scrollTrigger: { trigger: '.manifesto', start: 'top bottom', end: 'bottom top', scrub: .7 } });
    manifesto.fromTo('.tagline-first', { xPercent: mobile ? -1 : -2 }, { xPercent: mobile ? 1 : 2, duration: 1, ease: 'none' }, 0);
    manifesto.fromTo('.tagline-second', { xPercent: 1 }, { xPercent: -1, duration: 1, ease: 'none' }, 0);
    manifesto.fromTo('.manifesto-mark img', { rotation: -12, y: 12 }, { rotation: 12, y: -12, duration: 1, ease: 'none' }, 0);
    manifesto.fromTo('.manifesto-backdrop img', { yPercent: -4 }, { yPercent: 4, duration: 1, ease: 'none' }, 0);

    // Open the coastline as it enters the viewport, before the reading pin.
    // Its parent stays in document flow throughout pinning and refreshes.
    const islandEntrance = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
      id: 'red-island-entrance', trigger: '.story-grid', start: 'top bottom',
      end: mobile ? 'top 10%' : 'top -35%', scrub: .6, invalidateOnRefresh: true,
    } });
    islandEntrance.fromTo('.territory-visual', { clipPath: mobile ? 'inset(0% 4% 0% 4% round 100px)' : 'inset(0% 12% 0% 12% round 180px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1 }, 0);
    islandEntrance.fromTo('.territory-landscape', { scale: 1.16 }, { scale: 1, duration: 1 }, 0);
    islandEntrance.fromTo('.territory-heading', { y: mobile ? 24 : 45, scale: .94 }, { y: mobile ? 0 : -20, scale: 1, duration: 1 }, 0);

    const island = gsap.timeline({ scrollTrigger: {
      id: 'red-island', trigger: '.territory', start: mobile ? 'top 65%' : 'top top',
      end: mobile ? 'bottom 50%' : () => `+=${innerHeight * 1.9}`, pin: mobile ? false : '.territory', scrub: .55, invalidateOnRefresh: true,
    } });
    island.fromTo('.territory-handwriting', { y: 60, autoAlpha: 0, rotation: -20 }, { y: 0, autoAlpha: 1, rotation: -12, duration: .45 }, .15);
    island.fromTo('.territory-copy', { y: 45, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .45 }, mobile ? .18 : .35);
    // Use the actual path length; normalized dashes combined with non-scaling
    // strokes can leave broken contours in WebKit.
    const hiddenStroke = (path: SVGPathElement) => {
      const length = path.getTotalLength();
      return { attr: { 'stroke-dasharray': `${length} ${length}`, 'stroke-dashoffset': length }, autoAlpha: 0 };
    };
    const mapMotion = mobile ? gsap.timeline({ scrollTrigger: {
      id: 'red-island-map', trigger: '.island-map', start: 'top 85%', end: 'bottom 55%', scrub: .45,
    } }) : island;
    // Draw the closed coast first, then the clipped interior strokes.
    mapMotion.fromTo('.island-outline', hiddenStroke(document.querySelector<SVGPathElement>('.island-outline')!), { attr: { 'stroke-dashoffset': 0 }, autoAlpha: 1, duration: .55, ease: 'none' }, mobile ? 0 : .35);
    gsap.utils.toArray<SVGPathElement>('.island-interior path').forEach((path, index) => {
      mapMotion.fromTo(path, hiddenStroke(path), { attr: { 'stroke-dashoffset': 0 }, autoAlpha: 1, duration: .25, ease: 'none' }, (mobile ? .18 : .47) + index * .06);
    });
    mapMotion.fromTo('.island-location', { autoAlpha: 0 }, { autoAlpha: 1, duration: .12, ease: 'power1.out' }, mobile ? .6 : .78);
    // Natural mobile scroll must finish the drawing while the map is on screen.
    // Preserve time to read the copy independently of the entrance and strokes.
    if (mobile) island.to({}, { duration: .9 }, 0);
    else island.to({}, { duration: .6 });

    gsap.from('.event h2', { y: 70, rotateX: -8, autoAlpha: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.event', start: 'top 75%', toggleActions: 'play none none reverse' } });
    gsap.from('.event-facts>div', { y: 40, autoAlpha: 0, stagger: .1, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: '.event-facts', start: 'top 85%', toggleActions: 'play none none reverse' } });
    gsap.fromTo('.event-botanical', { y: 90, rotation: 10 }, { y: -55, rotation: -8, scrollTrigger: { trigger: '.event', start: 'top bottom', end: 'bottom top', scrub: 1 } });

    if (!mobile) {
      teamSection.classList.add('is-pinned'); teamViewport.scrollLeft = 0;
      const distance = () => Math.max(0, teamTrack.scrollWidth - teamViewport.clientWidth);
      gsap.to(teamTrack, { x: () => -distance(), ease: 'none', scrollTrigger: {
        id: 'red-team', trigger: teamSection, pin: '.team-stage', start: 'top top', end: () => `+=${distance() * 1.5 + innerHeight * 1.2}`, scrub: .45, invalidateOnRefresh: true,
        onUpdate: self => {
          setTeamIndex(Math.round(self.progress * (teamCards.length - 1)));
          gsap.set('.team-track-progress i', { scaleX: .25 + self.progress * .75 });
        },
      } });
    }
    gsap.to('.program-list', { '--program-progress': 1, ease: 'none', scrollTrigger: { trigger: '.program-list', start: 'top 65%', end: 'bottom 65%', scrub: .4 } });
    document.querySelectorAll('.program-list article').forEach(article => {
      gsap.from(article.querySelector('div'), { y: 20, scrollTrigger: { trigger: article, start: 'top 82%', end: 'top 45%', scrub: .5, toggleClass: 'is-active' } });
    });
    gsap.fromTo('.allies-banner>img', { yPercent: -5, scale: 1.15 }, { yPercent: 6, scale: 1, scrollTrigger: { trigger: '.allies-banner', start: 'top bottom', end: 'bottom top', scrub: .7 } });
    gsap.from('.allies-copy h2', { y: 90, clipPath: 'inset(100% 0% 0% 0%)', duration: 1.3, ease: 'power3.out', scrollTrigger: { trigger: '.allies-banner', start: 'top 65%', toggleActions: 'play none none reverse' } });
    gsap.from('.allies-handwriting', { y: 24, opacity: .2, duration: .9, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.allies-handwriting', start: 'top 90%', once: true } });

    // Entrances finish independently of scroll, leaving prices and answers still to read.
    gsap.from('.alliance-heading > *, .alliance-intro', { y: 26, opacity: .15, stagger: .09, duration: .8, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.alliance-heading', start: 'top 88%', once: true } });
    gsap.utils.toArray<HTMLElement>('.plan').forEach((plan, index) => {
      gsap.from(plan, { y: mobile ? 28 : 44, opacity: .12, delay: mobile ? 0 : (index % (innerWidth < 1200 ? 2 : 4)) * .1, duration: .85, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: plan, start: 'top 91%', once: true } });
    });
    gsap.from('.faq-heading > *', { y: 26, opacity: .15, stagger: .1, duration: .8, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.faq-heading', start: 'top 86%', once: true } });
    gsap.utils.toArray<HTMLElement>('.faq-list details').forEach(row => {
      gsap.from(row, { x: mobile ? 12 : 28, opacity: .15, duration: .7, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: row, start: 'top 92%', once: true } });
    });
    gsap.from('.footer-flower', { rotation: -90, scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: 1 } });
    gsap.from('.sponsors-heading>*', { y: 45, autoAlpha: 0, stagger: .12, duration: .85, ease: 'power3.out', scrollTrigger: { trigger: '.sponsors-section', start: 'top 80%', toggleActions: 'play none none reverse' } });
    gsap.from('.sponsor-mark', { y: 24, autoAlpha: 0, stagger: .035, duration: .65, ease: 'power3.out', scrollTrigger: { trigger: '.sponsors-grid', start: 'top 88%', toggleActions: 'play none none reverse' } });
    ScrollTrigger.refresh();
    return () => { experience.classList.remove('is-enhanced'); teamSection.classList.remove('is-pinned'); hero.inert = false; };
  });
}

function goTo(top: number) { window.scrollTo({ top, behavior: reduced.matches ? 'instant' : 'smooth' }); }
function targetPosition(hash: string) {
  const journey = ScrollTrigger.getById('red-journey');
  if (hash === '#inicio') return 0;
  if (hash === '#explora' && journey) return journey.start + (journey.end - journey.start) * scrollAtJourney(.33);
  const pin = hash === '#margarita' ? ScrollTrigger.getById('red-island') : hash === '#equipo' ? ScrollTrigger.getById('red-team') : null;
  if (pin && pin.pin) return pin.start;
  const element = document.querySelector<HTMLElement>(hash);
  return element ? element.getBoundingClientRect().top + scrollY - 90 : null;
}
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
  const target = targetPosition(link.hash);
  if (target === null) return;
  event.preventDefault(); rememberPosition(); history.pushState(null, '', link.hash); goTo(target);
}));
document.querySelectorAll<HTMLButtonElement>('[data-journey]').forEach(button => button.addEventListener('click', () => {
  const trigger = ScrollTrigger.getById('red-journey');
  if (trigger) goTo(trigger.start + (trigger.end - trigger.start) * scrollAtJourney(Number(button.dataset.journey)));
}));
function stepTeam(direction: number) {
  const index = Math.max(0, Math.min(teamCards.length - 1, teamIndex + direction));
  const trigger = ScrollTrigger.getById('red-team');
  if (trigger) goTo(trigger.start + (trigger.end - trigger.start) * index / (teamCards.length - 1));
  else teamViewport.scrollTo({ left: teamCards[index].offsetLeft - teamCards[0].offsetLeft, behavior: reduced.matches ? 'instant' : 'smooth' });
}
document.querySelectorAll<HTMLButtonElement>('[data-team-step]').forEach(button => button.addEventListener('click', () => stepTeam(Number(button.dataset.teamStep))));
teamViewport.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); stepTeam(event.key === 'ArrowLeft' ? -1 : 1); }
});
teamViewport.addEventListener('scroll', () => {
  if (teamSection.classList.contains('is-pinned')) return;
  const max = teamViewport.scrollWidth - teamViewport.clientWidth;
  const progress = max ? teamViewport.scrollLeft / max : 0;
  setTeamIndex(Math.round(progress * (teamCards.length - 1)));
  gsap.set('.team-track-progress i', { scaleX: .25 + progress * .75 });
}, { passive: true });
setTeamIndex(0);

// Pointer interactions are bounded and stop updating when the pointer leaves.
const banner = document.querySelector<HTMLElement>('.allies-banner')!;
banner.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || reduced.matches) return;
  const rect = banner.getBoundingClientRect();
  banner.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
  banner.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  banner.style.setProperty('--spot-opacity', '1');
});
banner.addEventListener('pointerleave', () => banner.style.setProperty('--spot-opacity', '0'));
let ticking = false;
const updateHeader = () => {
  header.classList.toggle('is-scrolled', scrollY > 60);
  const max = document.documentElement.scrollHeight - innerHeight;
  document.querySelector<HTMLElement>('.reading-progress')!.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  ticking = false;
};
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateHeader); } }, { passive: true });
reduced.addEventListener('change', buildMotion);
buildMotion(); updateHeader();
heroEntrance(initialPosition?.y);
let initialPositionApplied = false;
function restoreInitialPosition() {
  ScrollTrigger.refresh();
  if (!initialPositionApplied) {
    initialPositionApplied = true;
    if (initialPosition) restorePosition(initialPosition);
    else if (location.hash) { const position = targetPosition(location.hash); if (position !== null) window.scrollTo({ top: position, behavior: 'instant' }); }
  }
  settleScroll(); updateHeader();
}
document.fonts.ready.then(() => {
  restoreInitialPosition();
  document.documentElement.dataset.motionReady = 'true';
  window.dispatchEvent(new Event('red:motion-ready'));
});
window.addEventListener('red:prepare-reveal', restoreInitialPosition);
// Browsers may snapshot history before pagehide; keep the active entry current
// while reading, with a bounded write rate rather than writing on every frame.
let positionTimer = 0;
window.addEventListener('scroll', () => {
  if (positionTimer) return;
  positionTimer = window.setTimeout(() => { positionTimer = 0; rememberPosition(); }, 450);
}, { passive: true });
window.addEventListener('red:site-ready', rememberPosition);
window.addEventListener('pagehide', rememberPosition);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') rememberPosition(); });
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  ScrollTrigger.refresh();
  const position = savedPosition(); if (position) restorePosition(position); else settleScroll();
  updateHeader();
});
window.addEventListener('popstate', () => {
  const position = savedPosition();
  if (position) restorePosition(position);
  else { const top = targetPosition(location.hash || '#inicio'); if (top !== null) window.scrollTo({ top, behavior: 'instant' }); settleScroll(); }
  updateHeader();
});
