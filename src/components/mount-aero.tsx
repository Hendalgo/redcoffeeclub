import { createRoot } from 'react-dom/client';
import AeroScene from './AeroScene';

export function mountAero(element: HTMLElement) {
  element.dataset.sceneVisible = 'false';
  document.body.appendChild(element);
  element.classList.add('shared-canvas');
  createRoot(element).render(<AeroScene />);
}
