import { hydrateRoot } from 'react-dom/client';
import BrewExperience from './BrewExperience';

export function mountBrew(element: HTMLElement) {
  hydrateRoot(element, <BrewExperience />);
}
