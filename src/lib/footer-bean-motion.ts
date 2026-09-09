import {createShakeDetector} from './bean-shake.mjs';

export function createBeanMotion(root: HTMLElement, shake: (strength: number) => void) {
  const button = root.querySelector<HTMLButtonElement>('[data-bean-motion]')!;
  const label = button.querySelector('span')!;
  const status = root.querySelector<HTMLElement>('[data-bean-status]')!;
  const detector = createShakeDetector();
  const motion = window.DeviceMotionEvent as typeof DeviceMotionEvent & {
    requestPermission?: () => Promise<'granted' | 'denied'>;
  };
  let enabled = false, active = false, listening = false;
  let gravity: {x:number;y:number;z:number} | null = null;
  const touch = navigator.maxTouchPoints > 0 || matchMedia('(pointer:coarse)').matches;
  button.hidden = !touch;
  if (!touch) return {setActive(_active: boolean) {}};
  if (!motion || !isSecureContext) {
    button.disabled = true;label.textContent = 'Agitado no disponible';
    root.dataset.shakeState = 'unavailable';
    return {setActive(_active: boolean) {}};
  }
  root.dataset.shakeState = 'off';
  function onMotion(event: DeviceMotionEvent) {
    const acceleration = event.acceleration;
    let x: number, y: number, z: number;
    if (acceleration && [acceleration.x,acceleration.y,acceleration.z].every(v => typeof v==='number'&&Number.isFinite(v))) {
      ({x,y,z} = acceleration as {x:number;y:number;z:number});
    } else {
      const value = event.accelerationIncludingGravity;
      if (!value || ![value.x,value.y,value.z].every(v => typeof v==='number'&&Number.isFinite(v))) return;
      const raw = value as {x:number;y:number;z:number};
      if (!gravity) { gravity = {...raw}; return; }
      // Remove the slow-changing gravity vector on browsers without linear data.
      gravity.x += (raw.x-gravity.x)*.12;gravity.y += (raw.y-gravity.y)*.12;gravity.z += (raw.z-gravity.z)*.12;
      x=raw.x-gravity.x;y=raw.y-gravity.y;z=raw.z-gravity.z;
    }
    const strength = detector.sample(x,y,z,performance.now());
    if (strength) shake(strength);
  }
  function sync() {
    const next = enabled && active;
    if (next === listening) return;
    listening = next;detector.reset();gravity = null;
    if (next) window.addEventListener('devicemotion',onMotion,{passive:true});
    else window.removeEventListener('devicemotion',onMotion);
  }
  button.addEventListener('click',async () => {
    if (enabled) {
      enabled=false;button.setAttribute('aria-pressed','false');label.textContent='Activar agitado';
      root.dataset.shakeState='off';status.textContent='Agitado desactivado.';sync();return;
    }
    button.disabled=true;root.dataset.shakeState='requesting';
    try {
      // Safari requires this call directly inside a user gesture.
      const permission = motion.requestPermission ? await motion.requestPermission() : 'granted';
      if (permission !== 'granted') {
        root.dataset.shakeState='denied';status.textContent='No se activó el movimiento. Puedes moler lanzando los granos.';return;
      }
      enabled=true;button.setAttribute('aria-pressed','true');label.textContent='Agitado activo';
      root.dataset.shakeState='on';status.textContent='Agita el teléfono para moler algunos granos.';sync();
    } catch {
      root.dataset.shakeState='unavailable';status.textContent='El movimiento no está disponible aquí. Puedes lanzar los granos.';
    } finally {button.disabled=false;}
  });
  return {setActive(value: boolean) { active=value;sync(); }};
}
