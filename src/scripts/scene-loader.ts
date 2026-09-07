const experience = document.querySelector<HTMLElement>('.experience')!;
const mount = document.getElementById('aero-mount')!;
const loadingStatus = document.querySelector<HTMLElement>('.scene-loading')!;
let loading: Promise<void> | undefined;
let navigatingAway = !!location.hash && !['#inicio', '#explora'].includes(location.hash);
// A menu jump traverses the hero but is not intent to explore the product.
document.addEventListener('click', event => {
  const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
  if (anchor) navigatingAway = !['#inicio', '#explora'].includes(anchor.hash);
}, {capture:true});
const resumeExploration = () => { navigatingAway = false; };
window.addEventListener('wheel', resumeExploration, {passive:true});
window.addEventListener('touchmove', resumeExploration, {passive:true});
window.addEventListener('keydown', event => {
  if (['PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(event.key)) resumeExploration();
});

// WebGL is requested by a gesture or a restored exploration. The poster stays
// useful on slow connections and without JavaScript.
function loadScene() {
  if (loading) return loading;
  loadingStatus.hidden = false;
  loadingStatus.textContent = 'Preparando la vista 3D…';
  loading = import('../components/mount-aero').then(module => { module.mountAero(mount); }).catch(() => {
    loading = undefined;
    document.querySelectorAll('[data-brew-start]').forEach(button => button.removeAttribute('aria-busy'));
    loadingStatus.textContent = 'Vista 3D no disponible. Pulsa Explora para reintentar.';
  });
  return loading;
}
function onScroll() {
  if (navigatingAway) return;
  const bounds = experience.getBoundingClientRect();
  if (scrollY > 12 && bounds.bottom > 0 && bounds.top < innerHeight) void loadScene();
}
window.addEventListener('scroll', onScroll, {passive:true});
window.addEventListener('red:motion-ready', onScroll, {once:true});
window.addEventListener('red:scene-ready', () => {
  loadingStatus.hidden = true;
  experience.classList.remove('has-poster');
  window.removeEventListener('scroll', onScroll);
}, {once:true});
document.querySelector('.hero-scroll')?.addEventListener('click', () => void loadScene());
document.querySelector<HTMLElement>('.hero-product')?.addEventListener('pointerenter', event => {
  if (!navigatingAway && event.pointerType === 'mouse' && matchMedia('(hover: hover)').matches) void loadScene();
});
document.querySelectorAll('[data-journey],[data-rotate],#product-rotation').forEach(control => {
  control.addEventListener('pointerdown', () => void loadScene(), {once:true});
  control.addEventListener('focus', () => void loadScene(), {once:true});
});
document.querySelectorAll<HTMLButtonElement>('[data-brew-start]').forEach(button => {
  button.addEventListener('click', () => {
    if (document.documentElement.dataset.sceneReady) return;
    button.setAttribute('aria-busy','true');
    window.addEventListener('red:scene-ready', () => {
      button.removeAttribute('aria-busy');
      if (document.documentElement.dataset.sceneReady === 'webgl') requestAnimationFrame(() => button.click());
    }, {once:true});
    void loadScene();
  });
});

export {};


