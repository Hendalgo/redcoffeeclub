const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
export const CUP_MAX_HEIGHT = 1.08;
const bottomRadius = .7, taper = .17 / 1.42;
export function cupVolume(height) {
  const h = clamp(height, 0, CUP_MAX_HEIGHT);
  return Math.PI * (bottomRadius ** 2 * h + bottomRadius * taper * h ** 2 + taper ** 2 * h ** 3 / 3);
}
export function cupLevel(fill) {
  const volume = clamp(fill) * cupVolume(CUP_MAX_HEIGHT);
  let h = clamp(fill) * CUP_MAX_HEIGHT;
  for (let i = 0; i < 5; i++) h = clamp(h - (cupVolume(h) - volume) / (Math.PI * (bottomRadius + taper * h) ** 2), 0, CUP_MAX_HEIGHT);
  return { height: h, radius: bottomRadius + taper * h };
}
// Gravity accelerates the jet, and continuity narrows its cross-section.
export function fallingJet(drop, flow, initialSpeed = .8, radius = .04) {
  const speed = Math.sqrt(initialSpeed ** 2 + 2 * 9.81 * Math.max(0, drop));
  return { speed, radius: radius * Math.sqrt(clamp(flow, 0, 2) * initialSpeed / speed), flight: (speed - initialSpeed) / 9.81 };
}
