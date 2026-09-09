// The page controls and the single WebGL renderer share one preparation state.
export const brewSession = {
  driver: { value: 0 },
  ready: false,
  failed: false,
  requested: false,
  handle: null as HTMLButtonElement | null,
  travel: 150,
  wake: () => {},
};
export function announceBrew(ready: boolean, failed = false) {
  if (brewSession.ready === ready && brewSession.failed === failed) return;
  brewSession.ready = ready; brewSession.failed = failed;
  window.dispatchEvent(new Event('red:brew-state'));
}
