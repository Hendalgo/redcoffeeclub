import { merch, merchInquiry } from '../data/merch';
import { createMerchSway, stepMerchSway, merchSwayAtRest, resetMerchSway } from '../lib/merch-sway.mjs';

const section = document.querySelector<HTMLElement>('[data-merch]');
if (section) mountMerch(section);

function mountMerch(root: HTMLElement) {
  const rack = root.querySelector<HTMLElement>('[data-merch-rack]')!;
  const status = root.querySelector<HTMLElement>('[data-merch-status]')!;
  const play = root.querySelector<HTMLButtonElement>('[data-merch-play]')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mod = (value: number, length = merch.length) => ((value % length) + length) % length;
  const originals = Array.from(rack.querySelectorAll<HTMLElement>('[data-merch-item]'));
  // A fixed seven-item pool recycles only beyond the visible edges.
  const slots = Array.from({ length: 7 }, (_, i) => {
    const virtual = i - 3;
    const product = mod(virtual);
    const el = originals[product].cloneNode(true) as HTMLElement;
    el.setAttribute('aria-hidden', 'true');
    return { el, garment: el.querySelector<HTMLElement>('.merch-garment')!, shirt: el.querySelector<HTMLImageElement>('.merch-shirt')!, print: el.querySelector<HTMLElement>('.merch-print')!, link: el.querySelector<HTMLAnchorElement>('[data-merch-product]')!, virtual, product, sway: createMerchSway(virtual) };
  });
  rack.replaceChildren(...slots.map(slot => slot.el));
  root.classList.add('merch-enhanced');
  root.querySelectorAll<HTMLElement>('[data-merch-controls]').forEach(el => el.hidden = false);

  let position = 0, target = 0, velocity = 0, pitch = 1, shirtWidth = 1, rackWidth = 1;
  let frame = 0, lastTime = 0, carry = 0, timer = 0;
  let visible = false, hovered = false, focused = false, paused = reduced.matches;
  let active = -1;
  let suppressProductClick = false;
  let drag: { id: number; x: number; y: number; start: number; horizontal: boolean } | null = null;
  const canAnimate = () => visible && !document.hidden;

  function clearAutoplay() { window.clearTimeout(timer); timer = 0; }
  function scheduleAutoplay() {
    clearAutoplay();
    if (!canAnimate() || paused || reduced.matches || hovered || focused || drag || frame) return;
    timer = window.setTimeout(() => move(1, false), 5500);
  }
  function updatePlay() {
    play.hidden = reduced.matches;
    play.setAttribute('aria-pressed', String(paused));
    play.setAttribute('aria-label', paused ? 'Activar carrusel automático' : 'Pausar carrusel automático');
  }
  function render() {
    for (const slot of slots) {
      while (slot.virtual - position > 3.5) slot.virtual -= slots.length;
      while (slot.virtual - position < -3.5) slot.virtual += slots.length;
      const product = mod(slot.virtual);
      if (product !== slot.product) {
        slot.product = product;
        slot.sway = createMerchSway(slot.virtual);
        slot.shirt.src = merch[product].image;
        slot.shirt.alt = `Franela ${merch[product].color.toLowerCase()}, concepto provisional de RED Coffee Club`;
        slot.print.classList.toggle('merch-print-dark', merch[product].ink === 'dark');
        slot.el.dataset.product = String(product);
        slot.link.href = merchInquiry(merch[product]);
        slot.link.dataset.ink = merch[product].ink;
        slot.link.setAttribute('aria-label', `Ver producto ${merch[product].name}, color ${merch[product].color}: lo quiero por WhatsApp`);
      }
      const distance = slot.virtual - position;
      slot.el.style.transform = `translate3d(${(distance * pitch).toFixed(3)}px,0,0)`;
      slot.el.style.opacity = String(1 - Math.min(Math.abs(distance), 1.7) * .22);
      slot.el.style.zIndex = String(10 - Math.round(Math.abs(distance)));
      slot.garment.style.transform = `rotate(${slot.sway.angle.toFixed(5)}rad)`;
      slot.el.dataset.active = String(Math.abs(distance) < .5);
      slot.el.setAttribute('aria-hidden', String(Math.abs(distance * pitch) > (rackWidth + shirtWidth) / 2));
      slot.link.tabIndex = Math.abs(distance) < .5 ? 0 : -1;
    }
    const current = mod(Math.round(position));
    if (current !== active) {
      active = current;
      root.querySelector<HTMLElement>('[data-merch-name]')!.textContent = merch[current].name;
      root.querySelector<HTMLElement>('[data-merch-color]')!.textContent = merch[current].color;
      root.querySelector<HTMLElement>('[data-merch-count]')!.textContent = String(current + 1).padStart(2, '0');
      root.dataset.merchIndex = String(current);
    }
  }
  function settle() {
    position = target; velocity = 0; carry = 0;
    for (const slot of slots) resetMerchSway(slot.sway);
    render(); root.dataset.merchState = canAnimate() ? 'idle' : 'paused';
  }
  function stop() {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0; carry = 0;
    clearAutoplay(); root.dataset.merchState = 'paused';
  }
  function tick(time: number) {
    frame = 0;
    if (!canAnimate()) { stop(); return; }
    if (reduced.matches) { settle(); scheduleAutoplay(); return; }
    carry += Math.min(lastTime ? (time - lastTime) / 1000 : 1 / 60, .05);
    lastTime = time;
    // Fixed steps keep the damped rail and pendulums stable across frame rates.
    const dt = 1 / 120;
    while (carry >= dt) {
      const acceleration = (target - position) * 155 - velocity * 25;
      velocity += acceleration * dt;
      position += velocity * dt;
      for (const slot of slots) {
        // Horizontal acceleration of the hook drives the fabric's inertia.
        const forcing = acceleration * pitch / (shirtWidth * 1.2);
        stepMerchSway(slot.sway, forcing, dt);
      }
      carry -= dt;
    }
    render();
    const atRest = !drag && Math.abs(target - position) < .0003 && Math.abs(velocity) < .001 && slots.every(s => merchSwayAtRest(s.sway));
    if (atRest) { settle(); lastTime = 0; scheduleAutoplay(); return; }
    root.dataset.merchState = 'moving';
    frame = requestAnimationFrame(tick);
  }
  function wake() {
    clearAutoplay();
    if (reduced.matches) { settle(); scheduleAutoplay(); return; }
    if (!frame && canAnimate()) { lastTime = 0; frame = requestAnimationFrame(tick); }
  }
  function move(step: number, manual = true) {
    status.setAttribute('aria-live', manual ? 'polite' : 'off');
    // Bound rapid input so the rail never races through a long queued animation.
    target = Math.max(Math.round(position) - 2, Math.min(Math.round(position) + 2, Math.round(target) + step));
    wake();
  }
  function measure() {
    rackWidth = rack.getBoundingClientRect().width;
    shirtWidth = slots[0].el.getBoundingClientRect().width;
    pitch = shirtWidth * Number(getComputedStyle(root).getPropertyValue('--merch-pitch'));
    render();
  }
  function endDrag(event?: PointerEvent, cancelled = false) {
    if (!drag || (event && event.pointerId !== drag.id)) return;
    const previous = drag;
    drag = null;
    suppressProductClick = previous.horizontal;
    delete root.dataset.merchDragging;
    if (rack.hasPointerCapture(previous.id)) rack.releasePointerCapture(previous.id);
    if (previous.horizontal && !cancelled && event) {
      const distance = (previous.x - event.clientX) / pitch;
      target = Math.round(previous.start) + (Math.abs(distance) > .16 ? Math.sign(distance) * Math.max(1, Math.round(Math.abs(distance))) : 0);
    } else target = Math.round(position);
    wake();
  }

  root.querySelectorAll<HTMLButtonElement>('[data-merch-step]').forEach(button => button.addEventListener('click', () => move(Number(button.dataset.merchStep))));
  rack.addEventListener('keydown', event => {
    delete rack.dataset.pointerFocus;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    if (document.activeElement !== rack) rack.focus({ preventScroll: true });
    if (event.key === 'Home' || event.key === 'End') { target = Math.round(position) - mod(Math.round(position)) + (event.key === 'End' ? merch.length - 1 : 0); status.setAttribute('aria-live', 'polite'); wake(); }
    else move(event.key === 'ArrowRight' ? 1 : -1);
  });
  play.addEventListener('click', () => {
    paused = !paused;
    // Explicit Play may resume while the Play button retains keyboard focus.
    if (!paused) focused = false;
    updatePlay(); scheduleAutoplay();
  });
  root.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = true; clearAutoplay(); } });
  root.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovered = false; scheduleAutoplay(); } });
  root.addEventListener('focusin', () => { focused = true; clearAutoplay(); });
  root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget as Node | null)) { focused = false; scheduleAutoplay(); } });
  // A selected parent can start native HTML drag even with draggable=false on
  // every image. Keep the browser's selection/drag ghost out of this gesture.
  rack.addEventListener('dragstart', event => event.preventDefault(), { capture: true });
  rack.addEventListener('selectstart', event => event.preventDefault());
  // Releasing a drag over a product must not turn it into a purchase click.
  rack.addEventListener('click', event => {
    if (!suppressProductClick || event.detail === 0 || !(event.target as Element).closest('[data-merch-product]')) return;
    event.preventDefault(); event.stopPropagation(); suppressProductClick = false;
  }, { capture: true });
  rack.addEventListener('blur', () => { delete rack.dataset.pointerFocus; });
  rack.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressProductClick = false;
    rack.dataset.pointerFocus = 'true';
    if (event.pointerType === 'mouse') {
      event.preventDefault();
      const link = (event.target as Element).closest<HTMLAnchorElement>('[data-merch-product]');
      (link ?? rack).focus({ preventScroll: true });
    }
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: position, horizontal: false };
    clearAutoplay();
  });
  rack.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.horizontal) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { endDrag(event, true); return; }
      if (Math.abs(dx) < 8) return;
      drag.horizontal = true; rack.setPointerCapture(event.pointerId);
      root.dataset.merchDragging = 'true';
      if (event.pointerType === 'mouse') {
        rack.dataset.pointerFocus = 'true';
        rack.focus({ preventScroll: true });
      }
      status.setAttribute('aria-live', 'polite');
    }
    target = drag.start - Math.max(-2, Math.min(2, dx / pitch));
    wake();
  });
  rack.addEventListener('pointerup', event => endDrag(event));
  rack.addEventListener('pointercancel', event => endDrag(event, true));
  rack.addEventListener('lostpointercapture', event => endDrag(event, true));
  rack.addEventListener('pointerleave', event => { if (drag && !drag.horizontal) endDrag(event, true); });
  window.addEventListener('blur', () => endDrag(undefined, true));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { endDrag(undefined, true); stop(); }
    else { wake(); scheduleAutoplay(); }
  });
  reduced.addEventListener('change', () => {
    paused = reduced.matches; updatePlay(); endDrag(undefined, true); stop(); settle();
    scheduleAutoplay();
  });
  new ResizeObserver(measure).observe(rack);
  // Start only when the rack itself is visible, not the surrounding section.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) { endDrag(undefined, true); stop(); }
    else { wake(); scheduleAutoplay(); }
  }, { threshold: .15 }).observe(rack);
  updatePlay(); measure(); settle();
}
