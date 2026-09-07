import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { event, whatsapp } from '../data/event';
gsap.registerPlugin(ScrollTrigger);
const menuButton=document.querySelector<HTMLButtonElement>('.menu-toggle')!;
const menu=document.getElementById('mobile-menu')!;
const setMenu=(open:boolean)=>{menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');menu.classList.toggle('is-open',open);menu.inert=!open;document.body.classList.toggle('menu-is-open',open);document.body.classList.toggle('modal-open',open);document.querySelectorAll<HTMLElement>('main,.site-header').forEach(el=>el.inert=open);if(open)menu.querySelector<HTMLAnchorElement>('a')?.focus();};
menu.querySelector('.menu-close')?.addEventListener('click',()=>{setMenu(false);menuButton.focus();});
menuButton.addEventListener('click',()=>setMenu(menuButton.getAttribute('aria-expanded')!=='true'));
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',e=>{if(menuButton.getAttribute('aria-expanded')!=='true')return;if(e.key==='Escape'){setMenu(false);menuButton.focus();}if(e.key==='Tab'){const links=Array.from(menu.querySelectorAll<HTMLElement>('a,button'));const first=links[0],last=links.at(-1)!;if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
window.matchMedia('(min-width:1101px)').addEventListener('change',e=>{if(e.matches)setMenu(false);});
const dialog=document.querySelector<HTMLDialogElement>('#contact-dialog')!;
let opener:HTMLElement|null=null;
const modalAnimations = new WeakMap<HTMLDialogElement, gsap.core.Timeline>();
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function showModal(target:HTMLDialogElement,button:HTMLElement){
  opener=button;
  modalAnimations.get(target)?.kill();
  delete target.dataset.closing;
  target.showModal();
  document.body.classList.add('modal-open');
  const content = Array.from(target.children).filter(child => !child.matches('[data-close]'));
  gsap.set([target, ...content], { clearProps: 'opacity,transform,visibility' });
  if (reduceMotion()) { target.style.setProperty('--backdrop-opacity', '1'); return; }
  const animation = gsap.timeline();
  animation.fromTo(target, { y: 48, scale: .94, autoAlpha: 0, '--backdrop-opacity': 0 }, { y: 0, scale: 1, autoAlpha: 1, '--backdrop-opacity': 1, duration: .65, ease: 'power3.out' });
  animation.fromTo(content, { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: .055, duration: .5, ease: 'power3.out' }, .12);
  modalAnimations.set(target, animation);
}
function closeModal(target:HTMLDialogElement){
  if (!target.open || target.dataset.closing) return;
  target.dataset.closing = 'true';
  modalAnimations.get(target)?.kill();
  const close = () => { target.close(); delete target.dataset.closing; };
  if (reduceMotion()) { close(); return; }
  const animation = gsap.timeline({ onComplete: close });
  animation.to(target, { y: 28, scale: .97, autoAlpha: 0, '--backdrop-opacity': 0, duration: .28, ease: 'power2.in' });
  modalAnimations.set(target, animation);
}
document.querySelectorAll<HTMLElement>('[data-contact]').forEach(button=>button.addEventListener('click',()=>{
  const alliance=button.dataset.contact==='alianza',plan=button.dataset.plan;
  const message=alliance?'Hola, quisiera conversar sobre '+(plan?'la alianza '+plan:'las alianzas')+' con RED Coffee Club y confirmar las condiciones vigentes.':'Hola, quisiera información sobre las próximas convocatorias de AeroPress Margarita y cómo participar.';
  document.getElementById('contact-description')!.textContent=alliance?'Conversemos sobre '+(plan?'la modalidad '+plan:'cómo tu marca puede sumarse')+' y las condiciones vigentes.':'Consulta al equipo cómo participar en las próximas convocatorias.';
  (document.getElementById('contact-whatsapp') as HTMLAnchorElement).href=whatsapp(message);
  (document.getElementById('contact-email') as HTMLAnchorElement).href='mailto:'+event.email+'?subject='+encodeURIComponent(alliance?'Alianza con RED Coffee Club':'Participación en AeroPress Margarita')+'&body='+encodeURIComponent(message);
  showModal(dialog,button);
}));
document.querySelectorAll<HTMLElement>('[data-modal]').forEach(button=>button.addEventListener('click',()=>showModal(document.getElementById(button.dataset.modal!) as HTMLDialogElement,button)));
document.querySelectorAll<HTMLDialogElement>('dialog').forEach(modal=>{
  modal.querySelector('[data-close]')?.addEventListener('click',()=>closeModal(modal));
  modal.addEventListener('cancel',e=>{e.preventDefault();closeModal(modal);});
  modal.addEventListener('click',e=>{if(e.target!==modal)return;const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal(modal);});
  modal.addEventListener('close',()=>{modalAnimations.get(modal)?.kill();document.body.classList.remove('modal-open');opener?.focus({preventScroll:true});});
});
const navLinks=document.querySelectorAll<HTMLAnchorElement>('.desktop-nav a');
const sectionObserver=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){const id=entry.target.matches('.experience')?'inicio':entry.target.id;navLinks.forEach(a=>{if(a.hash==='#'+id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}}},{rootMargin:'-15% 0px -60% 0px'});
navLinks.forEach(a=>{const section=document.querySelector(a.hash==='#inicio'?'.experience':a.hash);if(section)sectionObserver.observe(section);});
document.fonts.ready.then(()=>ScrollTrigger.refresh());
document.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',()=>ScrollTrigger.refresh()));
