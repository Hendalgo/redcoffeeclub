import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/** Keep native details semantics and animate only the answer's changing height. */
export function enhanceFaq() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finishers: Array<() => void> = [];
  let refreshFrame = 0;
  const refresh = () => {
    cancelAnimationFrame(refreshFrame);
    refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  document.querySelectorAll<HTMLDetailsElement>('.faq-list details').forEach(details => {
    const summary = details.querySelector<HTMLElement>('summary')!;
    const answer = details.querySelector<HTMLElement>('.faq-answer')!;
    const content = answer.querySelector<HTMLElement>('.faq-answer-content')!;
    let expanded = details.open;
    let animation: gsap.core.Timeline | null = null;
    const sync = () => {
      details.dataset.expanded = String(expanded);
      summary.setAttribute('aria-expanded', String(expanded));
    };
    const finish = () => {
      animation?.kill();
      animation = null;
      details.open = expanded;
      gsap.set([answer, content], { clearProps: 'height,opacity,transform' });
      sync();
      refresh();
    };
    finishers.push(finish);
    sync();

    summary.addEventListener('click', event => {
      event.preventDefault();
      const height = details.open ? answer.getBoundingClientRect().height : 0;
      const wasOpen = details.open;
      expanded = !expanded;
      animation?.kill();
      sync();
      if (reduced.matches) { finish(); return; }

      details.open = true;
      if (!wasOpen) gsap.set(content, { opacity: 0, y: 10 });
      gsap.set(answer, { height });
      animation = gsap.timeline({ onComplete: finish });
      animation.to(answer, { height: expanded ? content.offsetHeight : 0, duration: expanded ? .48 : .36, ease: 'power3.inOut' }, 0);
      animation.to(content, { opacity: expanded ? 1 : 0, y: expanded ? 0 : -6, duration: .3, ease: 'power2.out' }, expanded ? .08 : 0);
    });

    // Also reflect native opens, e.g. the browser revealing a find-in-page match.
    details.addEventListener('toggle', () => {
      if (animation) return;
      expanded = details.open;
      sync();
      refresh();
    });
  });

  reduced.addEventListener('change', () => finishers.forEach(finish => finish()));
}
