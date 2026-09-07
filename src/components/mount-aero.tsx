import { createRoot } from 'react-dom/client';
import AeroScene from './AeroScene';

export function mountAero(element: HTMLElement) {
  createRoot(element).render(<AeroScene />);
}
