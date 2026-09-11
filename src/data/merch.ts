import { whatsapp } from './event';

// Each pair comes from the supplied artwork. Keep AP and APx as separate models.
export const merch = [
  { name: 'Coffee Club RCx', color: 'Blanco', front: '/images/merch/white-rcx-front.webp', back: '/images/merch/white-rcx-back.webp', ink: 'dark' },
  { name: 'Coffee Club RCx', color: 'Negro', front: '/images/merch/black-rcx-front.webp', back: '/images/merch/black-rcx-back.webp', ink: 'light' },
  { name: 'Coffee Club RCx', color: 'Azul', front: '/images/merch/blue-rcx-front.webp', back: '/images/merch/blue-rcx-back.webp', ink: 'light' },
  { name: 'AeroPress AP', color: 'Beige', front: '/images/merch/beige-ap-front.webp', back: '/images/merch/beige-ap-back.webp', ink: 'dark' },
  { name: 'AeroPress APx', color: 'Beige', front: '/images/merch/beige-apx-front.webp', back: '/images/merch/beige-apx-back.webp', ink: 'dark' },
  { name: 'AeroPress APx', color: 'Rojo', front: '/images/merch/red-apx-front.webp', back: '/images/merch/red-apx-back.webp', ink: 'light' },
] as const;

export const merchInquiry = (item: typeof merch[number]) => whatsapp(
  `Hola, me interesa la franela ${item.name} en color ${item.color} de RED Coffee Club. ¿Me pueden informar sobre su disponibilidad, tallas y precio?`,
);
