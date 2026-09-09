const playground = document.querySelector<HTMLElement>('[data-bean-playground]');
let loading = false;

function observe() {
  if (!playground) return;
  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry.isIntersecting || loading) return;
    loading = true;
    try {
      const { mountFooterBeans } = await import('../lib/footer-beans');
      await mountFooterBeans(playground);
      observer.disconnect();
    } catch {
      // The static handful and all footer links remain usable on a failed load.
      playground.dataset.physicsState = 'unavailable';
      loading = false;
    }
  }, {rootMargin: '400px 0px'});
  observer.observe(playground);
}

if (document.documentElement.dataset.motionReady) observe();
else window.addEventListener('red:motion-ready', observe, {once:true});
export {};
