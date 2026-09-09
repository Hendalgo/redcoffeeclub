import { whatsapp } from './event';

// Provisional concepts, not a confirmed catalogue. Final transparent mockups
// should keep the hook at the same anchor point (50% x, 5% y).
export const merch = [
  { name: 'Club tee', color: 'Crudo', image: '/images/merch/tee-ecru.webp', ink: 'dark' },
  { name: 'Club tee', color: 'Carbón', image: '/images/merch/tee-charcoal.webp', ink: 'light' },
  { name: 'Club tee', color: 'Café', image: '/images/merch/tee-coffee.webp', ink: 'light' },
] as const;

export const merchInquiry = (item: typeof merch[number]) => whatsapp(
  `Hola, me interesa la franela ${item.name} en color ${item.color} de RED Coffee Club. ¿Me pueden informar sobre su disponibilidad, tallas y precio?`,
);
