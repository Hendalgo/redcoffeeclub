import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, addAfterEffect, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { gsap } from 'gsap';
import { createAeroPress, disposeModel } from '../lib/aeropress-model';
import { brewSession, announceBrew } from '../lib/brew-session';
import type { createSharedBrewScene } from '../lib/shared-brew-scene';
import { journeyAt, poseAt } from '../lib/choreography.mjs';

type ProductProps = { brandLogo: HTMLImageElement; onReady: () => void; onError: () => void };

function sceneIntersectsViewport(experience: DOMRect, brew: DOMRect) {
  return [experience, brew].some(rect => rect.width > 0 && rect.height > 0
    && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth);
}

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Product({ brandLogo, onReady, onError }: ProductProps) {
  const { gl, scene, camera, invalidate } = useThree();
  const [product] = useState(() => createAeroPress(brandLogo));
  const [fitBounds] = useState(() => ({
    parts: [product.chamber, product.plunger, product.filter, product.cap].map(node => ({node, box:new THREE.Box3().setFromObject(node)})),
    world: new THREE.Box3(), part: new THREE.Box3(), point: new THREE.Vector3(), up:new THREE.Vector3(),
  }));
  const stage = useRef<THREE.Group>(null!);
  const dragGroup = useRef<THREE.Group>(null!);
  const state = useRef({ progress: 0, yaw: 0, pointerX: 0, pointerY: 0, enhanced: false, activeUntil: 0 });
  const metrics = useRef({ frames: 0, lastTime: 0, intervals: [] as number[] });
  const frameReady = useRef(false);
  const environmentReady = useRef(false);
  const brewing = useRef<ReturnType<typeof createSharedBrewScene> | null>(null);
  const brewPainted = useRef(false);
  useEffect(() => {
    let alive = true, pending = false;
    const warm = () => {
      const progress = Number(document.querySelector<HTMLElement>('.experience')?.dataset.sceneProgress ?? 0);
      if (pending || brewing.current || (!brewSession.requested && progress < .33)) return;
      pending = true;
      import('../lib/shared-brew-scene').then(async ({createSharedBrewScene}) => {
        if (!alive) return;
        const prepared = createSharedBrewScene(brandLogo, product, scene);
        try { await prepared.prepare(gl, camera); }
        catch (error) { prepared.dispose(); throw error; }
        if (!alive) { prepared.dispose(); return; }
        brewing.current = prepared;
        document.querySelector<HTMLElement>('.brew-section')!.dataset.modelId = product.root.uuid;
        document.querySelector<HTMLElement>('.brew-section')!.dataset.prepared = 'true';
        state.current.activeUntil = performance.now() + 600; invalidate();
      }).catch(() => { pending = false; announceBrew(false, true); });
    };
    document.getElementById('aero-mount')!.dataset.modelId = product.root.uuid;
    brewSession.wake = () => { state.current.activeUntil = performance.now() + 600; invalidate(); };
    window.addEventListener('red:brew-request', warm); window.addEventListener('red:journey', warm); warm();
    return () => { alive = false; window.removeEventListener('red:brew-request', warm); window.removeEventListener('red:journey', warm); brewing.current?.dispose(); brewSession.wake = () => {}; };
  }, [brandLogo, product, scene, gl, camera, invalidate]);

  useEffect(() => {
    frameReady.current = false;
    const generator = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const target = generator.fromScene(room, .04);
    scene.environment = target.texture;
    scene.environmentIntensity = .85;
    environmentReady.current = true;
    room.dispose(); generator.dispose();
    const lost = (e: Event) => { e.preventDefault(); onError(); };
    gl.domElement.addEventListener('webglcontextlost', lost);
    // The first visible frame must include both the environment and current pose.
    let announced = false;
    const removeAfterEffect = addAfterEffect(() => {
      if (!announced && frameReady.current) { announced = true; onReady(); }
      if(frameReady.current && !brewSession.failed) announceBrew(brewPainted.current);
    });
    invalidate();
    return () => {
      environmentReady.current = false;
      frameReady.current = false;
      scene.environment = null; target.dispose(); disposeModel(product);
      gl.domElement.removeEventListener('webglcontextlost', lost);
      removeAfterEffect();
    };
  }, [gl, scene, product, onReady, onError, invalidate]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.experience')!;
    const range = document.querySelector<HTMLInputElement>('#product-rotation')!;
    const requestMotionFrame = () => {
      const a = root.getBoundingClientRect(), b = document.querySelector('.brew-section')!.getBoundingClientRect();
      const visible = sceneIntersectsViewport(a, b);
      // Hide immediately on jumps; only a newly positioned frame may show it again.
      if (!visible) {
        document.getElementById('aero-mount')!.dataset.sceneVisible = 'false';
        state.current.activeUntil = 0;
      }
      if (visible) { state.current.activeUntil = performance.now() + 100; invalidate(); }
    };
    const sync = () => {
      const progress = Number(root.dataset.sceneProgress ?? root.dataset.journeyProgress ?? 0);
      const enhanced = root.classList.contains('is-enhanced');
      if (progress === state.current.progress && enhanced === state.current.enhanced) return;
      state.current.progress = progress;
      state.current.enhanced = enhanced;
      requestMotionFrame();
    };
    const rotate = () => { state.current.yaw = Number(range.value) * Math.PI / 180; requestMotionFrame(); };
    const step = (amount: number) => () => {
      range.value = String(Math.max(-180, Math.min(180, Number(range.value) + amount))); rotate();
    };
    const left = step(-30), right = step(30);
    const previous = document.querySelector('[data-rotate="left"]');
    const next = document.querySelector('[data-rotate="right"]');
    range.addEventListener('input', rotate);
    previous?.addEventListener('click', left); next?.addEventListener('click', right);
    window.addEventListener('red:journey', sync);
    window.addEventListener('scroll', requestMotionFrame, {passive:true});
    window.addEventListener('red:hero-reveal', requestMotionFrame);
    window.addEventListener('pageshow', requestMotionFrame);
    window.addEventListener('resize', requestMotionFrame, {passive:true});
    document.addEventListener('visibilitychange', requestMotionFrame);
    let dragging = false, originX = 0, originYaw = 0;
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || state.current.progress < .28 || (e.target as Element).closest('button,a,input')) return;
      dragging = true; originX = e.clientX; originYaw = state.current.yaw;
      root.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      state.current.yaw = Math.max(-Math.PI, Math.min(Math.PI, originYaw + (e.clientX - originX) * .008));
      range.value = String(Math.round(state.current.yaw * 180 / Math.PI)); requestMotionFrame();
    };
    const up = () => { dragging = false; };
    root.addEventListener('pointerdown', down); root.addEventListener('pointermove', move);
    root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
    const xTo = gsap.quickTo(state.current, 'pointerX', { duration: .8, ease: 'power3.out', onUpdate: requestMotionFrame });
    const yTo = gsap.quickTo(state.current, 'pointerY', { duration: .8, ease: 'power3.out', onUpdate: requestMotionFrame });
    const parallax = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || !state.current.enhanced || state.current.progress > .26) return;
      xTo((e.clientX / innerWidth - .5) * .18); yTo((e.clientY / innerHeight - .5) * .1);
    };
    const leave = () => { xTo(0); yTo(0); };
    root.addEventListener('pointermove', parallax); root.addEventListener('pointerleave', leave);
    const observer = new ResizeObserver(requestMotionFrame); observer.observe(root);
    observer.observe(document.querySelector('.brew-section')!);
    sync(); requestMotionFrame();
    return () => {
      window.removeEventListener('red:journey', sync); window.removeEventListener('scroll', requestMotionFrame); observer.disconnect();
      window.removeEventListener('red:hero-reveal', requestMotionFrame);
      window.removeEventListener('pageshow', requestMotionFrame);
      window.removeEventListener('resize', requestMotionFrame);
      document.removeEventListener('visibilitychange', requestMotionFrame);
      range.removeEventListener('input', rotate); previous?.removeEventListener('click', left); next?.removeEventListener('click', right);
      root.removeEventListener('pointerdown', down); root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerup', up); root.removeEventListener('pointercancel', up);
      root.removeEventListener('pointermove', parallax); root.removeEventListener('pointerleave', leave);
      xTo.tween.kill(); yTo.tween.kill();
    };
  }, [gl, invalidate]);

  useFrame(({ size: viewport, clock }, delta) => {
    const root = document.querySelector<HTMLElement>('.experience')!;
    const sectionRect = document.querySelector('.brew-section')!.getBoundingClientRect();
    const host = document.getElementById('aero-mount')!;
    if (!sceneIntersectsViewport(root.getBoundingClientRect(), sectionRect)) {
      host.dataset.sceneVisible = 'false';
      state.current.activeUntil = 0;
      brewPainted.current = false;
      return;
    }
    const exploreRect = document.querySelector('.explore-product')!.getBoundingClientRect();
    const brewRect = document.querySelector('.brew-scene')!.getBoundingClientRect();
    const size = {width:exploreRect.width,height:exploreRect.height};
    const rawBlend = THREE.MathUtils.clamp((viewport.height-sectionRect.top)/(viewport.height-112),0,1);
    const blend = THREE.MathUtils.smoothstep(rawBlend,0,1);
    if (blend > 0 && !brewing.current && !frameReady.current) return;
    if (product.root.parent !== dragGroup.current) dragGroup.current.add(product.root);
    product.root.position.set(0,0,0); product.root.rotation.set(0,0,0); product.root.scale.setScalar(1);
    product.plunger.position.x=0; product.plunger.position.z=0;
    camera.position.set(0,1.7,12); camera.lookAt(0,0,0);
    const baseCamera=camera as THREE.OrthographicCamera;
    baseCamera.left=-viewport.width/2; baseCamera.right=viewport.width/2;
    baseCamera.top=viewport.height/2; baseCamera.bottom=-viewport.height/2;
    // Effects and hydration can run after the first frame. Read the current layout
    // before calculating any pose so a coastal frame cannot use exploded offsets.
    state.current.progress = Number(root?.dataset.sceneProgress ?? root?.dataset.journeyProgress ?? 0);
    state.current.enhanced = root?.classList.contains('is-enhanced') ?? false;
    if (!environmentReady.current || !size.width || !size.height) return;
    const { progress, enhanced, yaw, pointerX, pointerY } = state.current;
    const motion = journeyAt(enhanced ? progress : 1);
    const parts = enhanced ? motion : poseAt(1);
    const landscape = window.innerWidth > window.innerHeight && window.innerHeight <= 550;
    const mobile = window.innerWidth <= 760 && !landscape;
    let zoom: number, offsetX = 0, offsetY = 0;
    if (enhanced) {
      const compact = Math.max(0, Math.min(1, (740 - size.height) / 172));
      const heroZoom = mobile ? Math.min(size.height * (.085 - compact * .02), size.width * .205) : Math.min(size.height * .132, size.width * .125);
      const exploreZoom = mobile ? Math.min(size.height * (.067 - compact * .017), size.width * .22) : Math.min(size.height * (landscape ? .085 : .141), size.width * .115);
      zoom = (heroZoom + (exploreZoom - heroZoom) * motion.transition) * motion.zoom * motion.scale;
      offsetX = size.width * (mobile ? motion.mobileX + .04 * (1 - motion.transition) : motion.desktopX) / zoom;
      // Short portrait screens keep a separate band for the expanded type.
      offsetY = mobile ? -size.height * (.2 + .055 * compact * (1 - motion.transition) - (.085 - .018 * compact) * motion.transition) / zoom : 0;
      if (landscape) offsetY = -size.height * .08 * motion.transition / zoom;
    } else zoom = Math.min(size.height / 6.1, size.width / 3.7) * parts.zoom;
    (camera as THREE.OrthographicCamera).zoom = zoom;
    camera.updateProjectionMatrix();
    product.plunger.position.y = parts.plunger;
    product.filter.position.y = parts.filter;
    product.cap.position.y = parts.cap;
    product.cap.rotation.y = parts.capTurn;
    const intro = enhanced ? (1 - Number(document.documentElement.dataset.heroReveal ?? 1)) * (1 - motion.transition) : 0;
    stage.current.position.set(offsetX, parts.center + offsetY - intro * .45, 0);
    stage.current.scale.setScalar(1 - intro * .09);
    const parallaxWeight = enhanced ? 1 - motion.transition : 0;
    stage.current.rotation.set(motion.pitch + pointerY * parallaxWeight, motion.turn + pointerX * parallaxWeight - intro * .3, motion.tilt + intro * .04);
    dragGroup.current.rotation.y = yaw;
    stage.current.updateMatrixWorld(true);
    if (enhanced && mobile && motion.transition > 0 && blend < 1) {
      // Fit the same moving model between the reading block and the controls.
      // Cached part bounds avoid traversing geometry on each mobile frame.
      const readingBlocks=Array.from(document.querySelectorAll<HTMLElement>('.explore-intro,.explore-story'));
      const bandTop=Math.max(...readingBlocks.map(el=>el.offsetTop+el.offsetHeight))+24;
      const bandBottom=Math.min(document.querySelector('.rotation-control')!.getBoundingClientRect().top,document.querySelector('.explore-chapters')!.getBoundingClientRect().top)-exploreRect.top-24;
      const screenBounds=() => {
        fitBounds.world.makeEmpty();
        for(const part of fitBounds.parts) fitBounds.world.union(fitBounds.part.copy(part.box).applyMatrix4(part.node.matrixWorld));
        let top=Infinity,bottom=-Infinity;
        for(const x of [fitBounds.world.min.x,fitBounds.world.max.x])for(const y of [fitBounds.world.min.y,fitBounds.world.max.y])for(const z of [fitBounds.world.min.z,fitBounds.world.max.z]){
          fitBounds.point.set(x,y,z).project(camera);
          const pixel=(-fitBounds.point.y*.5+.5)*viewport.height;
          top=Math.min(top,pixel);bottom=Math.max(bottom,pixel);
        }
        return {top,bottom};
      };
      camera.updateMatrixWorld(true);
      const initial=screenBounds(), weight=motion.transition;
      const fit=Math.min(1,Math.max(96,bandBottom-bandTop)/(initial.bottom-initial.top));
      stage.current.scale.multiplyScalar(THREE.MathUtils.lerp(1,fit,weight));
      stage.current.updateMatrixWorld(true);
      const fitted=screenBounds();
      fitBounds.up.set(0,1,0).applyQuaternion(camera.quaternion);
      stage.current.position.addScaledVector(fitBounds.up,((fitted.top+fitted.bottom-bandTop-bandBottom)/2)/zoom*weight);
      stage.current.updateMatrixWorld(true);
    }
    const result = brewing.current?.update(blend, delta, clock.elapsedTime, matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (result) {
      const brewZoom = Math.min(brewRect.height/result.pose.viewHeight,brewRect.width/6.5)*(1+result.pose.press*.1+result.pose.serve*.2);
      (camera as THREE.OrthographicCamera).zoom = THREE.MathUtils.lerp(zoom,brewZoom,blend);
      camera.position.set(0,THREE.MathUtils.lerp(1.7,3.6,blend),12); camera.lookAt(0,0,0);
      if (result.fluidActive) invalidate();
    }
    const centerX=THREE.MathUtils.lerp(exploreRect.left+size.width/2,brewRect.left+brewRect.width/2,blend);
    const centerY=THREE.MathUtils.lerp((blend>0 ? 0 : exploreRect.top)+size.height/2,brewRect.top+brewRect.height/2,blend);
    const orthographic=camera as THREE.OrthographicCamera;
    const viewX=(viewport.width/2-centerX)/orthographic.zoom, viewY=(centerY-viewport.height/2)/orthographic.zoom;
    orthographic.left=-viewport.width/2+viewX; orthographic.right=viewport.width/2+viewX;
    orthographic.top=viewport.height/2+viewY; orthographic.bottom=-viewport.height/2+viewY;
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    if(result) brewing.current!.project(camera,gl.domElement,brewRect,document.querySelector('.brew-workbench')!.getBoundingClientRect());
    const clip=blend>=1?brewRect:blend>0?{top:0,left:0,right:viewport.width,bottom:viewport.height}:exploreRect;
    host.style.clipPath=`inset(${Math.max(0,clip.top)}px ${Math.max(0,viewport.width-clip.right)}px ${Math.max(0,viewport.height-clip.bottom)}px ${Math.max(0,clip.left)}px)`;
    host.style.opacity=blend>=1?getComputedStyle(document.querySelector('.brew-scene')!).opacity:'1';
    host.dataset.sceneVisible = 'true';
    const brewSection=document.querySelector<HTMLElement>('.brew-section')!;
    brewSection.classList.toggle('is-connected',blend>0&&!!result);
    brewSection.style.setProperty('--brew-copy-reveal',String(THREE.MathUtils.smoothstep(blend,.68,.86)));
    host.dataset.bridge=String(blend);
    brewPainted.current=blend>=.7&&!!result;
    frameReady.current = true;
    // Keep the demand loop alive through input bursts. Restarting two independent
    // RAF loops for every event otherwise skips alternating display frames.
    if (performance.now() < state.current.activeUntil) invalidate();

    for (const [name, anchor] of Object.entries(product.anchors)) {
      const label = document.querySelector<HTMLElement>(`[data-part="${name}"]`);
      if (!label) continue;
      const axis = new THREE.Vector3(0, anchor.position.y, 0).applyMatrix4(anchor.parent!.matrixWorld).project(camera);
      const axisX = (axis.x * .5 + .5) * viewport.width-exploreRect.left;
      const radius = { plunger: .85, chamber: .99, filter: .6, cap: .74 }[name as 'plunger' | 'chamber' | 'filter' | 'cap'];
      const labelZoom=zoom*stage.current.scale.x;
      let onRight = ['plunger', 'filter'].includes(name);
      if (mobile) {
        const needed = radius * labelZoom + 24 + (window.innerWidth <= 380 ? 76 : 96);
        if (onRight && axisX + needed > size.width - 8) onRight = false;
        if (!onRight && axisX - needed < 8) onRight = true;
      }
      const direction = new THREE.Vector3(onRight ? 1 : -1, 0, 0).applyQuaternion(camera.quaternion).applyQuaternion(anchor.parent!.getWorldQuaternion(new THREE.Quaternion()).invert());
      direction.y = 0; direction.normalize().multiplyScalar(Math.abs(anchor.position.x)); direction.y = anchor.position.y;
      const point = direction.applyMatrix4(anchor.parent!.matrixWorld).project(camera);
      const anchorX = (point.x * .5 + .5) * viewport.width - exploreRect.left;
      const gap = Math.max(mobile ? 18 : 40, radius * labelZoom + 12 - Math.abs(anchorX - axisX));
      label.classList.toggle('annotation-right', onRight); label.classList.toggle('annotation-left', !onRight);
      label.style.setProperty('--label-gap', `${gap}px`);
      label.style.setProperty('--anchor-x', `${anchorX}px`);
      label.style.setProperty('--anchor-y', `${(-point.y * .5 + .5) * viewport.height-exploreRect.top}px`);
      label.style.setProperty('--label-opacity', String(parts.labels*(1-THREE.MathUtils.smoothstep(blend,0,.3))));
    }
    if (import.meta.env.DEV) {
      const box = new THREE.Box3().setFromObject(stage.current);
      const corners = [box.min.x, box.max.x].flatMap(x => [box.min.y, box.max.y].flatMap(y => [box.min.z, box.max.z].map(z => new THREE.Vector3(x, y, z).project(camera))));
      const bounds = { left: Math.min(...corners.map(p => (p.x * .5 + .5) * size.width)), right: Math.max(...corners.map(p => (p.x * .5 + .5) * size.width)), top: Math.min(...corners.map(p => (-p.y * .5 + .5) * size.height)), bottom: Math.max(...corners.map(p => (-p.y * .5 + .5) * size.height)) };
      const now = performance.now();
      if (metrics.current.lastTime) metrics.current.intervals.push(now - metrics.current.lastTime);
      metrics.current.frames++; metrics.current.lastTime = now;
      if (metrics.current.intervals.length > 1200) metrics.current.intervals.shift();
      Object.assign(window, { __aeroState: { progress, pose: parts, enhanced, zoom, viewport: size, position: stage.current.position.toArray(), bounds, drawCalls: gl.info.render.calls, triangles: gl.info.render.triangles }, __aeroFrames: metrics.current });
    }
  });

  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { __exportAeroPress: async () => {
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
      const clone = product.root.clone(true); clone.scale.setScalar(.05);
      clone.children.forEach(c => { c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); });
      return Array.from(new Uint8Array(await new GLTFExporter().parseAsync(clone, { binary: true }) as ArrayBuffer));
    } });
  }, [product]);
  return <><ambientLight intensity={.7} color="#eee1cf" /><directionalLight position={[-3, 4, 5]} intensity={3.6} color="#ffdab1" /><directionalLight position={[4, 1, -2]} intensity={4.5} color="#dae5ef" /><directionalLight position={[-2, -1, 2]} intensity={.5} /><group ref={stage}><group ref={dragGroup}><primitive object={product.root} /></group></group></>;
}

export default function AeroScene() {
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false), [supported, setSupported] = useState(false);
  const [brandLogo, setBrandLogo] = useState<HTMLImageElement | null>(null);
  const readyFn = useRef(() => setReady(true));
  const errorFn = useRef(() => { setFailed(true); setReady(false); announceBrew(false,true); });
  useEffect(() => {
    const logo = new Image();
    logo.onload = () => setBrandLogo(logo);
    logo.onerror = () => errorFn.current();
    logo.src = '/images/logo.png';
    return () => { logo.onload = null; logo.onerror = null; };
  }, []);
  useEffect(() => {
    try {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) { errorFn.current(); return; }
      probe.getExtension('WEBGL_lose_context')?.loseContext(); setSupported(true);
    } catch { errorFn.current(); }
  }, []);
  useEffect(() => {
    const experience = document.querySelector('.experience');
    experience?.classList.toggle('has-webgl', ready);
    experience?.classList.toggle('has-fallback', failed);
    document.getElementById('explora')?.classList.toggle('is-static', failed);
    if (ready || failed) {
      document.documentElement.dataset.sceneReady = ready ? 'webgl' : 'fallback';
      window.dispatchEvent(new Event('red:scene-ready'));
    }
  }, [ready, failed]);
  return <><div className={`product-canvas ${ready ? 'is-ready' : ''} ${failed ? 'is-failed' : ''}`} data-scene="explore">
    {supported && brandLogo && !failed && <SceneBoundary onError={errorFn.current}><Canvas orthographic camera={{ position: [0, 1.7, 12], zoom: 100, near: .1, far: 50 }} dpr={[1, 1.6]} frameloop="demand" gl={{ alpha: true, antialias: true, powerPreference: 'low-power', preserveDrawingBuffer: import.meta.env.DEV }} onCreated={({ camera, gl }) => { Object.assign(camera,{manual:true}); camera.lookAt(0, 0, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = .95; }}><Product brandLogo={brandLogo} onReady={readyFn.current} onError={errorFn.current} /></Canvas></SceneBoundary>}
    {failed && <span className="webgl-note">Vista estática del producto</span>}
  </div></>;
}
