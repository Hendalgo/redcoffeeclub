import Matter from 'matter-js';
import type { Body as PhysicsBody, Constraint as PhysicsConstraint } from 'matter-js';
import {createCoffeeDust} from './footer-coffee-dust';
import {createBeanMotion} from './footer-bean-motion';

type Point = {x: number; y: number};
type Sample = Point & {time: number};
type Bean = {element: HTMLButtonElement; body: PhysicsBody; width: number; height: number; armedUntil:number};
type Grab = {bean: Bean; constraint: PhysicsConstraint; pointerId: number; origin: Point; bounds: DOMRect; scroll: number; samples: Sample[]; moved: boolean};
const {Engine, Bodies, Body, Composite, Constraint, Sleeping, Events} = Matter;
const STEP = 1000 / 120;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export async function mountFooterBeans(root: HTMLElement) {
  if (root.dataset.physicsReady) return;
  const stage = root.querySelector<HTMLElement>('[data-bean-stage]')!;
  const elements = Array.from(stage.querySelectorAll<HTMLButtonElement>('[data-bean]'));
  const shuffle = root.querySelector<HTMLButtonElement>('[data-bean-shuffle]')!;
  const reset = root.querySelector<HTMLButtonElement>('[data-bean-reset]')!;
  const status = root.querySelector<HTMLElement>('[data-bean-status]')!;
  const texture = new Image();
  texture.src = elements[0].querySelector('img')!.src;
  await texture.decode();

  const engine = Engine.create({enableSleeping:true, positionIterations:6, velocityIterations:4});
  engine.gravity.y = 1;
  engine.gravity.scale = .0014;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const groundsTexture=new Image();groundsTexture.src='/optimized/coffee-grounds-512.webp';
  await groundsTexture.decode().catch(()=>{});
  const dust = createCoffeeDust(stage,engine,groundsTexture.naturalWidth?groundsTexture:texture);
  const byBody = new Map<number,Bean>();
  const approach = new Map<number,Point>();
  const pendingCrush = new Map<Bean,{strength:number;velocity:Point}>();
  let groundCount=0,settling=false,ticking=false;
  let announceTimer: ReturnType<typeof setTimeout> | undefined;
  let beans: Bean[] = [];
  let width = 0, height = 0;
  let grab: Grab | null = null;
  let inView = false, pageActive = !document.hidden;
  let frame = 0, last = 0, accumulator = 0;
  let selected = 0;

  function paint() {
    for (const bean of beans) {
      const {x, y} = bean.body.position;
      bean.element.style.transform = `translate3d(${(x-bean.width/2).toFixed(2)}px,${(y-bean.height/2).toFixed(2)}px,0) rotate(${bean.body.angle.toFixed(4)}rad)`;
    }
  }

  function stop(state: string) {
    cancelAnimationFrame(frame);
    frame = 0; last = 0; accumulator = 0;
    root.dataset.physicsState = state;
  }

  function tick(now: number) {
    frame = 0;
    if (!inView || !pageActive) { stop('paused'); return; }
    ticking=true;
    accumulator += last ? Math.min(now-last, 50) : STEP*2;
    last = now;
    // A fixed 120 Hz step keeps throwing/collisions consistent at 60/120 Hz.
    while (accumulator >= STEP) {
      Engine.update(engine, STEP);
      for(const [bean,impact] of pendingCrush) grind(bean,impact.strength,impact.velocity);
      pendingCrush.clear();
      dust.update(STEP/1000);
      accumulator -= STEP;
    }
    paint();
    dust.paint();
    ticking=false;
    if (grab || dust.active || beans.some(bean => !bean.body.isSleeping)) {
      frame = requestAnimationFrame(tick);
    } else stop('sleeping');
  }

  function wake() {
    if (frame || ticking || !inView || !pageActive) return;
    last = 0;
    root.dataset.physicsState = 'running';
    frame = requestAnimationFrame(tick);
  }

  function select(index: number, focus = false) {
    if (!beans.length) {selected=0;if(focus)reset.focus({preventScroll:true});return;}
    selected = (index + beans.length) % beans.length;
    beans.forEach((bean, i) => { bean.element.tabIndex = i === selected ? 0 : -1; });
    if (focus) beans[selected].element.focus({preventScroll:true});
  }

  function throwBean(bean: Bean, x = (Math.random()-.5)*9, y = -10-Math.random()*4) {
    bean.armedUntil=engine.timing.timestamp+2400;
    Sleeping.set(bean.body, false);
    Body.setVelocity(bean.body, {x, y});
    Body.setAngularVelocity(bean.body, (Math.random()-.5)*.35);
    wake();
  }

  function release(fling = false, event?: PointerEvent) {
    if (!grab) return;
    const current = grab;
    if(fling)current.bean.armedUntil=engine.timing.timestamp+2400;
    grab = null;
    Composite.remove(engine.world, current.constraint);
    current.bean.element.classList.remove('is-grabbed');
    stage.classList.remove('is-dragging');
    if (current.bean.element.hasPointerCapture(current.pointerId)) current.bean.element.releasePointerCapture(current.pointerId);
    if (fling && !current.moved) throwBean(current.bean);
    else if (fling && event) {
      const points = current.samples.filter(sample => event.timeStamp-sample.time <= 90);
      const first = points[0], end = points.at(-1);
      const elapsed = first && end ? Math.max(event.timeStamp-first.time, 16) : 16;
      const moving = end && event.timeStamp-end.time < 70;
      Body.setVelocity(current.bean.body, {
        x: moving && first ? clamp((end.x-first.x)/elapsed*16.667, -24, 24) : 0,
        y: moving && first ? clamp((end.y-first.y)/elapsed*16.667, -24, 24) : 0,
      });
      Body.setAngularVelocity(current.bean.body, clamp(current.bean.body.angularVelocity, -.3, .3));
    } else Body.setVelocity(current.bean.body, {x:0, y:0});
    wake();
  }

  function restImmediately() {
    // Reduced motion gets a settled pile, with physics only after an action.
    settling=true;
    for (let i=0; i<240; i++) Engine.update(engine, STEP);
    settling=false;dust.finish();
    beans.forEach(bean => Sleeping.set(bean.body, true));
    paint();
    stop('sleeping');
  }

  function resize(force=false) {
    const nextWidth = stage.clientWidth, nextHeight = stage.clientHeight;
    if (!force && Math.abs(width-nextWidth)<1 && height===nextHeight) return;
    release(); stop('paused');
    width = nextWidth; height = nextHeight;
    Composite.clear(engine.world, false);
    Engine.clear(engine);
    byBody.clear();approach.clear();pendingCrush.clear();groundCount=0;clearTimeout(announceTimer);
    dust.reset(width,height);root.dataset.groundCount='0';status.textContent='';reset.disabled=true;shuffle.disabled=false;
    elements.forEach(element => { element.hidden=false;element.disabled = true; element.tabIndex = -1; });
    const visible = elements.filter(element => getComputedStyle(element).display !== 'none');
    const maxSize = Math.max(...visible.map(element => element.offsetHeight*.82));
    const rows = Math.max(1, Math.floor((height-16)/(maxSize+4)));
    const columns = Math.max(Math.ceil(visible.length/rows), Math.floor(width/(maxSize*1.3)));
    const rowCount = Math.ceil(visible.length/columns);
    beans = visible.map((element, index) => {
      const beanWidth = element.offsetWidth, beanHeight = element.offsetHeight;
      const x = width/columns*(index%columns+.5);
      const y = (height-16)/rowCount*(Math.floor(index/columns)+.5);
      const body = Bodies.polygon(x,y,14,1,{friction:.55,frictionStatic:.9,frictionAir:.018,restitution:.38,sleepThreshold:45});
      // Match the transparent sprite's oval silhouette, not its image rectangle.
      Body.scale(body, beanWidth*.84/2, beanHeight*.81/2);
      Body.setAngle(body, (index*2.39996)%(Math.PI*2));
      element.disabled = false;
      const bean={element, body, width:beanWidth, height:beanHeight,armedUntil:0};
      byBody.set(body.id,bean);return bean;
    });
    const wall = {isStatic:true, friction:.7, restitution:.25};
    Composite.add(engine.world, [
      Bodies.rectangle(width/2,height+48,width+192,96,wall),
      Bodies.rectangle(width/2,-48,width+192,96,wall),
      Bodies.rectangle(-48,height/2,96,height+192,wall),
      Bodies.rectangle(width+48,height/2,96,height+192,wall),
      ...beans.map(bean => bean.body),
    ]);
    root.dataset.physicsReady = 'true';
    root.dataset.beanCount = String(beans.length);
    select(Math.min(selected,beans.length-1));
    if (reduced.matches) restImmediately();
    else { paint(); wake(); }
  }

  function grind(bean:Bean,strength:number,velocity:Point) {
    const index=beans.indexOf(bean);if(index<0)return;
    const focused=document.activeElement===bean.element;
    const position={...bean.body.position};
    if(grab?.bean===bean)release();
    Composite.remove(engine.world,bean.body);byBody.delete(bean.body.id);
    beans.splice(index,1);bean.element.hidden=true;bean.element.disabled=true;bean.element.tabIndex=-1;
    dust.burst(position,velocity,bean.width*bean.height,strength,reduced.matches);
    groundCount++;root.dataset.groundCount=String(groundCount);reset.disabled=false;shuffle.disabled=!beans.length;
    select(Math.min(index,beans.length-1),focused);
    clearTimeout(announceTimer);
    announceTimer=setTimeout(()=>{status.textContent=beans.length?`${groundCount} ${groundCount===1?'grano molido':'granos molidos'}.`:'Todo molido. Pulsa Más granos para volver a jugar.';},350);
    wake();
  }
  Events.on(engine,'beforeSolve',()=>{
    approach.clear();
    if(!settling)for(const bean of beans)approach.set(bean.body.id,Body.getVelocity(bean.body));
  });
  function queueImpact(event: Matter.IEventCollision<Matter.Engine>) {
    if(settling)return;
    for(const pair of event.pairs){
      const a=byBody.get(pair.bodyA.id),b=byBody.get(pair.bodyB.id);
      if(![a,b].some(bean=>bean&&bean.armedUntil>engine.timing.timestamp))continue;
      // Existing contacts also receive new blows (a bean can start inside the
      // pile). collisionActive fires after resolution, so retain approach speed.
      const velocity=(body:PhysicsBody)=>event.name==='collisionActive'
        ? approach.get(body.id)??{x:0,y:0}:Body.getVelocity(body);
      const va=velocity(pair.bodyA),vb=velocity(pair.bodyB),normal=pair.collision.normal;
      // Matter's normal points from B to A: separating motion is not an impact.
      const strength=Math.max(0,-((va.x-vb.x)*normal.x+(va.y-vb.y)*normal.y));
      if(strength<21)continue;
      if(a)pendingCrush.set(a,{strength,velocity:va});
      if(b)pendingCrush.set(b,{strength,velocity:vb});
    }
  }
  Events.on(engine,'collisionStart',queueImpact);
  Events.on(engine,'collisionActive',queueImpact);
  const phone=createBeanMotion(root,strength=>{
    if(!inView||!pageActive||!beans.length)return;
    release();
    const targets=[...beans].sort(()=>Math.random()-.5).slice(0,strength>30?4:2);
    targets.forEach(bean=>grind(bean,strength,{x:0,y:-5}));
    beans.forEach(bean=>throwBean(bean,(Math.random()-.5)*14,-6-Math.random()*5));
  });

  function pointerPosition(event: PointerEvent, current: Grab): Point {
    return {
      x: clamp(event.clientX-current.bounds.left, 6, width-6),
      y: clamp(event.clientY-current.bounds.top+scrollY-current.scroll, 6, height-6),
    };
  }

  stage.addEventListener('pointerdown', event => {
    const element = (event.target as Element).closest<HTMLButtonElement>('[data-bean]');
    const bean = beans.find(item => item.element===element);
    if (!bean || grab || !event.isPrimary || event.button!==0) return;
    event.preventDefault();
    const bounds = stage.getBoundingClientRect();
    const point = {x:event.clientX-bounds.left, y:event.clientY-bounds.top};
    Sleeping.set(bean.body, false);
    bean.armedUntil=engine.timing.timestamp+2400;
    const constraint = Constraint.create({
      pointA:point, bodyB:bean.body,
      pointB:{x:point.x-bean.body.position.x,y:point.y-bean.body.position.y},
      length:0, stiffness:.2, damping:.12,
    });
    grab = {bean,constraint,pointerId:event.pointerId,origin:point,bounds,scroll:scrollY,samples:[{...point,time:event.timeStamp}],moved:false};
    Composite.add(engine.world,constraint);
    select(beans.indexOf(bean),true);
    bean.element.setPointerCapture(event.pointerId);
    bean.element.classList.add('is-grabbed');
    stage.classList.add('is-dragging');
    wake();
  });

  stage.addEventListener('pointermove', event => {
    if (!grab || grab.pointerId!==event.pointerId) return;
    const point = pointerPosition(event,grab);
    grab.constraint.pointA = point;
    grab.moved ||= Math.hypot(point.x-grab.origin.x,point.y-grab.origin.y)>8;
    grab.samples.push({...point,time:event.timeStamp});
    grab.samples = grab.samples.filter(sample => event.timeStamp-sample.time<100);
    Sleeping.set(grab.bean.body,false);
    grab.bean.armedUntil=engine.timing.timestamp+2400;
    wake();
  });
  stage.addEventListener('pointerup', event => { if (grab?.pointerId===event.pointerId) release(true,event); });
  stage.addEventListener('pointercancel', event => { if (grab?.pointerId===event.pointerId) release(); });
  stage.addEventListener('lostpointercapture', event => { if (grab?.pointerId===event.pointerId) release(); });
  stage.addEventListener('click', event => {
    if (event.detail!==0) return;
    const element = (event.target as Element).closest<HTMLButtonElement>('[data-bean]');
    const bean = beans.find(item => item.element===element);
    if (bean) {
      if(event.shiftKey)grind(bean,30,{x:0,y:-8});
      else throwBean(bean);
    }
  });
  stage.addEventListener('focusin', event => {
    const index = beans.findIndex(bean => bean.element === event.target);
    if (index >= 0) select(index);
  });
  stage.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key==='Home') select(0,true);
    else if (event.key==='End') select(beans.length-1,true);
    else select(selected+(event.key==='ArrowRight'?1:-1),true);
  });
  shuffle.addEventListener('click', () => {
    release();
    beans.forEach(bean => throwBean(bean,(Math.random()-.5)*18,-9-Math.random()*7));
  });
  reset.addEventListener('click',()=>{resize(true);status.textContent='Un nuevo puñado. A jugar.';});

  resize();
  shuffle.hidden = false;
  reset.hidden = false;
  root.querySelector<HTMLElement>('[data-bean-hint]')!.textContent = 'Agarra, lanza y muele.';
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    phone.setActive(inView&&pageActive);
    if (inView) wake();
    else { release(); stop('paused'); }
  });
  observer.observe(stage);
  new ResizeObserver(()=>resize()).observe(stage);
  document.addEventListener('visibilitychange', () => {
    pageActive = !document.hidden;
    phone.setActive(inView&&pageActive);
    if (pageActive) wake();
    else { release(); stop('paused'); }
  });
  window.addEventListener('blur', () => release());
  window.addEventListener('pagehide', () => { pageActive = false;phone.setActive(false); release(); stop('paused'); });
  window.addEventListener('pageshow', () => { pageActive = !document.hidden;phone.setActive(inView&&pageActive); wake(); });
  reduced.addEventListener('change', () => { if (reduced.matches) { release(); restImmediately(); } });
}
