import { Component, useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Canvas, addAfterEffect, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { createBrewTable } from '../lib/brew-model';
import { createBrewBackdrop } from '../lib/brew-backdrop';
import { pourAmount, pressureFromDrag } from '../lib/brew-choreography.mjs';
import '../styles/brew.css';

export type BrewExperienceProps = { brandLogo: HTMLImageElement; onClose: () => void };
type Driver = { value: number };
type TableProps = {
  brandLogo: HTMLImageElement;
  driver: RefObject<Driver>;
  wake: RefObject<() => void>;
  handle: RefObject<HTMLButtonElement | null>;
  travel: RefObject<number>;
  onReady: () => void;
  onError: () => void;
  reduced: boolean;
};
class BrewBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function BrewTable({ brandLogo, driver, wake, handle, travel, onReady, onError, reduced }: TableProps) {
  const { gl, scene, camera, invalidate, size } = useThree();
  const [table] = useState(() => createBrewTable(brandLogo));
  const [backdrop] = useState(createBrewBackdrop);
  useEffect(()=>{backdrop.resize(gl.domElement);invalidate();},[backdrop,gl,size.width,size.height,invalidate]);
  const renderState = useRef({ until: 0, last: -1, displayed: 0, lastMotion: 0, painted: false, frames: 0 });
  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl), room = new RoomEnvironment();
    const environment = generator.fromScene(room, .04);
    scene.environment = environment.texture; scene.environmentIntensity = .8;
    room.dispose(); generator.dispose();
    wake.current = () => { renderState.current.until = performance.now() + 600; invalidate(); };
    let announced = false;
    const remove = addAfterEffect(() => { if (!announced && renderState.current.painted) { announced = true; onReady(); } });
    const lost = (event: Event) => { event.preventDefault(); onError(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    wake.current();
    return () => {
      wake.current = () => {}; remove(); scene.environment = null; environment.dispose(); table.dispose(); backdrop.dispose();
      gl.domElement.removeEventListener('webglcontextlost', lost);
    };
  }, [gl, scene, table, backdrop, invalidate, wake, onReady, onError]);
  useFrame(({ size, clock }, delta) => {
    const target = driver.current.value, now = performance.now();
    const directInput = (target>=2&&target<=3)||(target>=4&&target<=5);
    const p = renderState.current.displayed = directInput&&!reduced
      ? THREE.MathUtils.damp(renderState.current.displayed,target,22,Math.min(delta,.05)) : target;
    if (Math.abs(target - renderState.current.last) > .00001) renderState.current.lastMotion = now;
    // Keep streams continuous between input frames; the final demand frame clears them.
    const moving = now - renderState.current.lastMotion < 75;
    const activity = reduced ? 0 : 1 - THREE.MathUtils.smoothstep(now-renderState.current.lastMotion,75,550);
    const { pose, palm, rim, fluid, fluidActive } = table.update(p, moving, clock.elapsedTime,activity,reduced);
    const cameraZoom = Math.min(size.height / pose.viewHeight, size.width / 6.5) * (1 + pose.press * .1 + pose.serve * .2);
    (camera as THREE.OrthographicCamera).zoom = cameraZoom; camera.updateProjectionMatrix();
    const projected = palm.clone().project(camera), lower = rim.clone().project(camera);
    if (handle.current) {
      handle.current.style.left = `${(projected.x * .5 + .5) * size.width}px`;
      handle.current.style.top = `${(-projected.y * .5 + .5) * size.height}px`;
    }
    travel.current = Math.abs(lower.y - projected.y) * .5 * size.height;
    renderState.current.last = target; renderState.current.painted = true; renderState.current.frames++;
    if (performance.now() < renderState.current.until || fluidActive) invalidate();
    if (import.meta.env.DEV) {
      const bounds = new THREE.Box3().setFromObject(table.root);
      Object.assign(window, { __brewState: { progress: p, pose, fluid, frames: renderState.current.frames, bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() }, calls: gl.info.render.calls } });
    }
  });
  return <><ambientLight intensity={.85}/><directionalLight position={[-4,5,5]} intensity={4} color="#ffe1bb"/><directionalLight position={[4,2,-3]} intensity={4.5} color="#d6e4ee"/><primitive object={backdrop.mesh}/><primitive object={table.root}/></>;
}

const steps = [
  { title: 'De piezas', accent: 'a ritual.', body: 'Coloca el filtro, cierra la base y prepara tu taza.', action: 'Armar AeroPress', chapter: 0 },
  { title: 'El aroma', accent: 'es el inicio.', body: 'Una medida de café molido. Aquí empieza tu receta.', action: 'Añadir café', chapter: 1 },
  { title: 'Vierte', accent: 'a tu ritmo.', body: 'Mantén pulsado para llenar. Suelta para pausar.', action: 'Mantén para verter', chapter: 2 },
  { title: 'Una vuelta.', accent: 'Todo cambia.', body: 'Mezcla la infusión y coloca el émbolo.', action: 'Remover y preparar', chapter: 3 },
  { title: 'Tu gesto.', accent: 'Tu café.', body: 'Arrastra el émbolo hacia abajo o usa el control.', action: '', chapter: 4 },
  { title: 'Ya casi.', accent: 'Es tu momento.', body: 'La extracción terminó. Retira el AeroPress para disfrutar tu café.', action: 'Servir mi café', chapter: 4 },
  { title: 'Hecho', accent: 'por ti.', body: 'Cada taza empieza con una buena idea. Esta es la tuya.', action: 'Preparar otro', chapter: 4 },
];
const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>;

export default function BrewExperience({ brandLogo, onClose }: BrewExperienceProps) {
  const dialog = useRef<HTMLDialogElement>(null), handle = useRef<HTMLButtonElement>(null);
  const driver = useRef({ value: 0 }), wake = useRef(() => {}), travel = useRef(150);
  const heldFrame = useRef(0), amountRef = useRef(0), drag = useRef<{ y: number; amount: number } | null>(null);
  const pourComplete = useRef(false);
  const closing = useRef(false);
  const [step, setStep] = useState(0), [amount, setAmount] = useState(0), [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const [reduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => { setFailed(true); setReady(false); }, []);
  const stopPour = useCallback(() => {
    cancelAnimationFrame(heldFrame.current); heldFrame.current = 0;
    if (pourComplete.current && !closing.current) {
      pourComplete.current = false; amountRef.current = 0; setAmount(0); setStep(3);
    }
  }, []);
  useEffect(() => {
    const element = dialog.current!, opener = document.activeElement as HTMLElement | null;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden'; document.documentElement.classList.add('brew-open');
    element.showModal();
    gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: reduced ? 0 : .45, ease: 'power2.out' });
    const hide = () => { if (document.hidden) stopPour(); };
    window.addEventListener('blur', stopPour); document.addEventListener('visibilitychange', hide);
    return () => {
      stopPour(); gsap.killTweensOf(driver.current); gsap.killTweensOf(element); gsap.killTweensOf(element.querySelector('.brew-scene'));
      element.close(); document.documentElement.style.overflow = overflow; document.documentElement.classList.remove('brew-open');
      window.removeEventListener('blur', stopPour); document.removeEventListener('visibilitychange', hide);
      opener?.focus({ preventScroll: true });
    };
  }, [reduced, stopPour]);
  useEffect(() => { if (failed) { stopPour(); gsap.killTweensOf(driver.current); } }, [failed, stopPour]);
  useEffect(() => {
    if (ready) dialog.current?.querySelector<HTMLElement>('.brew-pressure input,.brew-actions .button')?.focus({ preventScroll: true });
  }, [step, ready]);
  useEffect(() => {
    if(ready&&!reduced) gsap.fromTo(dialog.current!.querySelector('.brew-scene'),{opacity:0,y:26,scale:.94},{opacity:1,y:0,scale:1,duration:1.1,ease:'power3.out',clearProps:'transform,opacity'});
  },[ready,reduced]);

  function close() {
    if (closing.current) return;
    closing.current = true; stopPour(); setBusy(true); gsap.killTweensOf(driver.current);
    gsap.to(dialog.current, { opacity: 0, duration: reduced ? 0 : .25, onComplete: onClose });
  }
  function animateTo(value: number, next: number, duration: number) {
    if (busy || !ready || closing.current) return;
    stopPour(); setBusy(true);
    gsap.to(driver.current, { value, duration: reduced ? 0 : duration, ease: 'power2.inOut', onUpdate: () => wake.current(), onComplete: () => {
      wake.current(); amountRef.current = 0; setAmount(0); setStep(next); setBusy(false);
    } });
  }
  function action() {
    if (step === 0) animateTo(1,1,2.6);
    if (step === 1) animateTo(2,2,2.4);
    if (step === 3) animateTo(4,4,3.6);
    if (step === 5) animateTo(6,6,2.4);
    if (step === 6) {
      stopPour();setBusy(true);
      const scene=dialog.current!.querySelector('.brew-scene');
      gsap.to(scene,{opacity:0,y:16,duration:reduced?0:.28,ease:'power2.in',onComplete:()=>{
        driver.current.value = 0; amountRef.current = 0; setAmount(0); setStep(0); wake.current();
        gsap.to(scene,{opacity:1,y:0,duration:reduced?0:.65,ease:'power3.out',clearProps:'transform,opacity',onComplete:()=>setBusy(false)});
      }});
    }
  }
  function startPour() {
    if (step !== 2 || busy || !ready || heldFrame.current || closing.current) return;
    let previous = performance.now();
    const tick = (now: number) => {
      const next = pourAmount(amountRef.current, (now - previous) / 1000); previous = now;
      amountRef.current = next; setAmount(next); driver.current.value = 2 + next; wake.current();
      if (next === 1) { heldFrame.current = 0; pourComplete.current = true; }
      else heldFrame.current = requestAnimationFrame(tick);
    };
    heldFrame.current = requestAnimationFrame(tick);
  }
  function press(value: number) {
    if (step !== 4 || busy || !ready || closing.current) return;
    const next = Math.min(1, Math.max(amountRef.current, value));
    amountRef.current = next; setAmount(next); driver.current.value = 4 + next; wake.current();
    if (next === 1) { drag.current = null; setStep(5); }
  }
  const content = steps[step], disabled = busy || !ready || failed;
  return <dialog ref={dialog} className="brew-dialog" aria-labelledby="brew-title" aria-describedby="brew-description" data-step={step} data-ready={ready} data-busy={busy} onCancel={event => { event.preventDefault(); close(); }}>
    <div className="brew-header"><img src="/images/logo.png" alt="RED Coffee Club" width="700" height="584"/><span>El método, en tus manos.</span><button type="button" className="brew-close" onClick={close} aria-label="Volver al evento"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    <div className="brew-copy" aria-live="polite" aria-atomic="true"><div className="brew-copy-content" key={step}><p className="eyebrow">{step === 6 ? 'Tu primera taza en la RED' : `0${content.chapter+1} / Tu momento barista`}</p><h2 id="brew-title">{content.title}<em>{content.accent}</em></h2><p id="brew-description">{content.body}</p></div></div>
    <div className="brew-scene" aria-label="Mesa de preparación con AeroPress y taza de RED Coffee Club">
      {!failed && <BrewBoundary onError={onError}><Canvas orthographic camera={{ position: [0,3.6,12], zoom: 70, near: .1, far: 50 }} dpr={[1,1.5]} frameloop="demand" gl={{alpha:true,antialias:true,powerPreference:'low-power'}} onCreated={({camera,gl})=>{camera.lookAt(0,0,0);gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1;}}><BrewTable brandLogo={brandLogo} driver={driver} wake={wake} handle={handle} travel={travel} onReady={onReady} onError={onError} reduced={reduced}/></Canvas></BrewBoundary>}
      <button ref={handle} type="button" className="brew-handle" hidden={step!==4 || disabled} aria-label="Presionar el émbolo. Arrastra hacia abajo o pulsa para avanzar." onPointerDown={event=>{drag.current={y:event.clientY,amount:amountRef.current};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event=>{if(drag.current)press(pressureFromDrag(drag.current.amount,event.clientY-drag.current.y,travel.current));}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} onClick={event=>{if(event.detail===0)press(amountRef.current+.1);}}><svg className="inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v16m-6-6 6 6 6-6"/></svg></button>
      {!ready && !failed && <p className="brew-scene-message" role="status">Preparando tu mesa…</p>}
      {failed && <p className="brew-scene-message" role="alert">La vista 3D no está disponible.<br/>Puedes volver al evento y probar de nuevo.</p>}
    </div>
    <div className="brew-actions">
      {step===2 ? <><button type="button" className="button brew-pour" disabled={disabled} onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);startPour();}} onPointerUp={stopPour} onPointerCancel={stopPour} onBlur={stopPour} onKeyDown={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();if(!event.repeat)startPour();}}} onKeyUp={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();stopPour();}}}>{content.action}<svg className="inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6 18 18M6 18h12V6"/></svg></button><label className="brew-meter"><span>Agua <b>{Math.round(amount*100)}%</b></span><progress value={amount} max="1" aria-label="Agua vertida"/></label></>
      : step===4 ? <label className="brew-pressure"><span>Presión del émbolo <b>{Math.round(amount*100)}%</b></span><input type="range" min="0" max="100" step="1" value={Math.round(amount*100)} onChange={event=>press(Number(event.target.value)/100)} aria-label="Presión del émbolo"/><small>Desliza, arrastra el émbolo o usa las flechas del teclado.</small></label>
      : <button type="button" className="button" onClick={action} disabled={disabled}>{busy ? (['Montando las piezas…','Añadiendo café…','','Mezclando tu café…','','Sirviendo tu taza…','Preparando otra taza…'][step]||'Preparando la mesa…') : content.action}<Arrow/></button>}
      {step===6 && <button type="button" className="brew-return" onClick={close}>Volver al evento <Arrow/></button>}
    </div>
    <div className="brew-footer"><ol aria-label="Pasos de preparación">{['Monta','Añade','Vierte','Mezcla','Presiona'].map((name,index)=><li key={name} aria-current={index===content.chapter?'step':undefined} className={index<content.chapter||step===6?'is-done':''}><i aria-hidden="true">{index<content.chapter||step===6?<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12 4 4L19 6"/></svg>:`0${index+1}`}</i><span>{name}</span></li>)}</ol><span className="brew-caption">{step===6?'Una buena idea. Una buena taza.':'Una experiencia para explorar el método.'}</span></div>
  </dialog>;
}
