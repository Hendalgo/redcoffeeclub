const experience = document.querySelector<HTMLElement>('.experience')!;
const mount = document.getElementById('aero-mount')!;
const loadingStatus = document.querySelector<HTMLElement>('.scene-loading')!;
const exploreSlot = document.querySelector<HTMLElement>('.explore-product')!;
const brewSlot = document.querySelector<HTMLElement>('.brew-scene')!;
let loading: Promise<void> | undefined;
let navigatingAway = !!location.hash && !['#inicio', '#explora'].includes(location.hash);
let posterFrame = 0;

// Before WebGL is ready, the two SSR images are alternatives for one product.
// Choose the slot with more visible height, including restored/unpinned layouts.
function syncPoster() {
  posterFrame = 0;
  if (document.documentElement.dataset.sceneReady === 'webgl'
    && !document.querySelector('.brew-workbench[data-failed="true"]')) return;
  const visibleHeight = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
  };
  document.documentElement.dataset.scenePoster = visibleHeight(brewSlot) > visibleHeight(exploreSlot) ? 'brew' : 'explore';
}
function schedulePoster() {
  if (!posterFrame) posterFrame = requestAnimationFrame(syncPoster);
}
for (const event of ['scroll', 'resize', 'pageshow', 'red:motion-ready', 'red:journey', 'red:scene-ready', 'red:brew-state']) {
  window.addEventListener(event, schedulePoster, {passive:true});
}
syncPoster();

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
window.addEventListener('red:brew-request', () => void loadScene());

document.querySelector('.hero-scroll')?.addEventListener('click', () => void loadScene());
document.querySelector<HTMLElement>('.hero-product')?.addEventListener('pointerenter', event => {
  if (!navigatingAway && event.pointerType === 'mouse' && matchMedia('(hover: hover)').matches) void loadScene();
});
document.querySelectorAll('[data-journey],[data-rotate],#product-rotation').forEach(control => {
  control.addEventListener('pointerdown', () => void loadScene(), {once:true});
  control.addEventListener('focus', () => void loadScene(), {once:true});
});
export {};
