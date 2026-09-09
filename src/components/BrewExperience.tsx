import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { brewSession } from '../lib/brew-session';
import { pourAmount, pressureFromDrag } from '../lib/brew-choreography.mjs';

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

export default function BrewExperience() {
  const workbench = useRef<HTMLDivElement>(null), handle = useRef<HTMLButtonElement>(null);
  const active = useRef(true), focusNext = useRef(false), advancePointer = useRef(false);
  const driver = useRef(brewSession.driver), wake = useRef(() => brewSession.wake());
  const heldFrame = useRef(0), amountRef = useRef(0), drag = useRef<{ y: number; amount: number } | null>(null);
  const pourComplete = useRef(false);
  const [step, setStep] = useState(0), [amount, setAmount] = useState(0), [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const [reduced, setReduced] = useState(false);
  const goToStep = useCallback((next: number) => {
    focusNext.current = !!workbench.current?.contains(document.activeElement);
    advancePointer.current = false;
    setStep(next);
  }, []);
  const stopPour = useCallback(() => {
    cancelAnimationFrame(heldFrame.current); heldFrame.current = 0;
    if (pourComplete.current) {
      pourComplete.current = false; amountRef.current = 0; setAmount(0); goToStep(3);
    }
  }, [goToStep]);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(preference.matches);
    update(); preference.addEventListener('change', update);
    const sync = () => { setReady(brewSession.ready); setFailed(brewSession.failed); };
    brewSession.handle = handle.current; brewSession.requested = true;
    window.addEventListener('red:brew-state', sync); sync();
    window.dispatchEvent(new Event('red:brew-request'));
    return () => { preference.removeEventListener('change', update); window.removeEventListener('red:brew-state', sync); brewSession.handle = null; };
  }, []);
  useEffect(() => {
    const element = workbench.current!, scene = element.querySelector('.brew-scene')!;
    let visible = true;
    const sync = () => {
      active.current = visible && !document.hidden;
      if (!active.current) { stopPour(); drag.current = null; }
      gsap.getTweensOf([driver.current, scene]).forEach(tween => tween.paused(!active.current));
      if (active.current) wake.current();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(element);
    const hide = () => sync();
    window.addEventListener('blur', stopPour); document.addEventListener('visibilitychange', hide);
    return () => {
      observer.disconnect(); stopPour(); gsap.killTweensOf(driver.current); gsap.killTweensOf(scene);
      window.removeEventListener('blur', stopPour); document.removeEventListener('visibilitychange', hide);
    };
  }, [stopPour]);
  useEffect(() => { if (failed) { stopPour(); gsap.killTweensOf(driver.current); } }, [failed, stopPour]);
  useEffect(() => {
    // Only move focus after an action inside the workbench, never on scroll/hydration.
    if (ready && active.current && focusNext.current) workbench.current?.querySelector<HTMLElement>('.brew-pressure input,.brew-actions .button')?.focus({ preventScroll: true });
    focusNext.current = false;
  }, [step, ready]);

  function animateTo(value: number, next: number, duration: number) {
    if (busy || !ready || !active.current) return;
    stopPour(); setBusy(true);
    gsap.to(driver.current, { value, duration: reduced ? 0 : duration, ease: 'power2.inOut', onUpdate: () => wake.current(), onComplete: () => {
      wake.current(); amountRef.current = 0; setAmount(0); goToStep(next); setBusy(false);
    } });
  }
  function action() {
    if (step === 0) animateTo(1,1,2.6);
    if (step === 1) animateTo(2,2,2.4);
    if (step === 3) animateTo(4,4,3.6);
    if (step === 5) animateTo(6,6,2.4);
    if (step === 6) {
      stopPour();setBusy(true);
      const scene=workbench.current!.querySelector('.brew-scene');
      gsap.to(scene,{opacity:0,y:16,duration:reduced?0:.28,ease:'power2.in',onUpdate:()=>wake.current(),onComplete:()=>{
        driver.current.value = 0; amountRef.current = 0; setAmount(0); goToStep(0); wake.current();
        gsap.to(scene,{opacity:1,y:0,duration:reduced?0:.65,ease:'power3.out',onUpdate:()=>wake.current(),clearProps:'transform,opacity',onComplete:()=>setBusy(false)});
      }});
    }
  }
  function startPour() {
    if (step !== 2 || busy || !ready || heldFrame.current || !active.current) return;
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
    if (step !== 4 || busy || !ready || !active.current) return;
    const next = Math.min(1, Math.max(amountRef.current, value));
    amountRef.current = next; setAmount(next); driver.current.value = 4 + next; wake.current();
    if (next === 1) { drag.current = null; goToStep(5); }
  }
  const content = steps[step], disabled = busy || !ready || failed;
  return <div ref={workbench} className="brew-workbench" data-step={step} data-ready={ready} data-busy={busy} data-failed={failed}>
    <div className="brew-header"><p className="eyebrow" id="brew-section-title">Prepara tu café</p><span>El método, en tus manos.</span></div>
    <div className="brew-copy" aria-live="polite" aria-atomic="true"><div className="brew-copy-content" key={step}><p className="eyebrow">{step === 6 ? 'Tu primera taza en la RED' : 'Tu momento barista'}</p><h2 id="brew-title">{content.title}<em>{content.accent}</em></h2><p id="brew-description">{content.body}</p></div></div>
    <div className="brew-scene" aria-label="Mesa de preparación con AeroPress y taza de RED Coffee Club">
      <button ref={handle} type="button" className="brew-handle" hidden={step!==4 || disabled} aria-label="Presionar el émbolo. Arrastra hacia abajo o pulsa para avanzar." onPointerDown={event=>{drag.current={y:event.clientY,amount:amountRef.current};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event=>{if(drag.current)press(pressureFromDrag(drag.current.amount,event.clientY-drag.current.y,brewSession.travel));}} onPointerUp={()=>drag.current=null} onPointerCancel={()=>drag.current=null} onClick={event=>{if(event.detail===0)press(amountRef.current+.1);}}><svg className="inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 4v16m-6-6 6 6 6-6"/></svg></button>
      <img className="brew-poster" src="/optimized/aeropress-exploded-540.webp" alt="Émbolo, cámara, filtro y tapa del AeroPress, listos para ensamblar" loading="lazy" width="720" height="1000"/>
      {!ready && !failed && <p className="brew-scene-message" role="status">Preparando tu mesa…</p>}
      {failed && <p className="brew-scene-message" role="alert">La vista 3D no está disponible en este momento. Puedes seguir explorando el evento.</p>}
    </div>
    {/* A new step needs its own pointer-down; a synthetic touch click cannot advance it. */}
    <div className="brew-actions">
      {step===2 ? <><button key="pour" type="button" className="button brew-pour" disabled={disabled} onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);startPour();}} onPointerUp={event=>{event.preventDefault();stopPour();}} onPointerCancel={stopPour} onBlur={stopPour} onKeyDown={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();if(!event.repeat)startPour();}}} onKeyUp={event=>{if([' ','Enter'].includes(event.key)){event.preventDefault();stopPour();}}}>{content.action}<svg className="inline-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6 18 18M6 18h12V6"/></svg></button><label className="brew-meter"><span>Agua <b>{Math.round(amount*100)}%</b></span><progress value={amount} max="1" aria-label="Agua vertida"/></label></>
      : step===4 ? <label className="brew-pressure"><span>Presión del émbolo <b>{Math.round(amount*100)}%</b></span><input type="range" min="0" max="100" step="1" value={Math.round(amount*100)} onChange={event=>press(Number(event.target.value)/100)} aria-label="Presión del émbolo"/><small>Desliza, arrastra el émbolo o usa las flechas del teclado.</small></label>
      : <button key="advance" type="button" className="button" onPointerDown={()=>{advancePointer.current=true;}} onPointerCancel={()=>{advancePointer.current=false;}} onClick={event=>{const intentional=event.detail===0||advancePointer.current;advancePointer.current=false;if(intentional)action();}} disabled={disabled}>{busy ? (['Montando las piezas…','Añadiendo café…','','Mezclando tu café…','','Sirviendo tu taza…','Preparando otra taza…'][step]||'Preparando la mesa…') : content.action}<Arrow/></button>}
      {step===6 && <a className="brew-return" href="#comunidad">Sigue conociendo la RED <Arrow/></a>}
    </div>
    <div className="brew-footer"><ol aria-label="Pasos de preparación">{['Monta','Añade','Vierte','Mezcla','Presiona'].map((name,index)=><li key={name} aria-current={index===content.chapter?'step':undefined} className={index<content.chapter||step===6?'is-done':''}><i aria-hidden="true">{index<content.chapter||step===6?<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12 4 4L19 6"/></svg>:`0${index+1}`}</i><span>{name}</span></li>)}</ol><span className="brew-caption">{step===6?'Una buena idea. Una buena taza.':'Una experiencia para explorar el método.'}</span></div>
  </div>;
}
