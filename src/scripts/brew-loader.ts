const mount = document.getElementById('brew-mount')!;
const initialMarkup = mount.innerHTML;
let retrying = false;
let loading = false;
let timer: ReturnType<typeof setTimeout> | undefined;

// Observe only after scroll pins/restoration settle. Brief passes during menu
// navigation should not download or initialize another WebGL scene.
function observe() {
  const observer = new IntersectionObserver(([entry]) => {
    clearTimeout(timer);
    if (!entry.isIntersecting || loading) return;
    timer = setTimeout(async () => {
      loading = true;
      try {
        const { mountBrew } = await import('../components/mount-brew');
        if (retrying) mount.innerHTML = initialMarkup;
        mountBrew(mount); observer.disconnect();
      } catch {
        loading = false; retrying = true;
        const status = mount.querySelector('.brew-scene-message');
        if (status) status.textContent = 'No pudimos cargar la mesa. Puedes seguir explorando o reintentar.';
        const retry = mount.querySelector<HTMLButtonElement>('.brew-actions button');
        if (retry) {
          retry.disabled = false; retry.textContent = 'Reintentar';
          retry.addEventListener('click', () => { observer.disconnect(); observe(); }, { once: true });
        }
      }
    }, 350);
  }, { rootMargin: '160px 0px' });
  observer.observe(mount);
}
if (document.documentElement.dataset.motionReady) observe();
else window.addEventListener('red:motion-ready', observe, { once: true });
export {};
