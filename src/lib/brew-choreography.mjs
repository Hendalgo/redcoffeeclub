import { clamp, interval } from './choreography.mjs';

// One absolute path, driven by actions instead of scroll. The liquid in the
// chamber and the cup share the same extraction value so coffee is never lost.
export function brewAt(value) {
  const p = clamp(value, 0, 6);
  const assemble = interval(p, .3, .72);
  const dose = interval(p, 1.25, 1.8);
  const water = clamp(p - 2);
  const press = clamp(p - 4);
  const serve = interval(p, 5, 6);
  const serveLift = interval(p, 5, 5.42), serveAway = interval(p, 5.38, 6);
  const park = interval(p, 0, .8), returnPlunger = interval(p, 3.73, 3.93);
  return {
    progress: p,
    filter: -.87 - .78 * interval(p, 0, .3) + 1.65 * assemble,
    cap: -1.65 * (1 - assemble),
    capTurn: -2.4 * (1 - interval(p, .6, .78)),
    plunger: 2.58 - 1.03 * park + Math.sin(park * Math.PI) * .35 + Math.sin(returnPlunger * Math.PI) * .2 - .5 * interval(p, 3.94, 4) - 2.1 * press,
    plungerX: 2.15 * park * (1 - returnPlunger),
    dose, water, press, serve, serveAway,
    viewHeight: 8.9 + .9 * interval(p, 0, .45) - .4 * interval(p, .82, 1) - 1.25 * interval(p, 3.7, 4),
    chamberLiquid: water * (1 - press),
    cupLiquid: water * (.06 + .94 * press),
    toolPour: interval(p, 2, 2.08) * (1 - interval(p, 2.9, 3.13)),
    kettleIn: interval(p, 1.78, 2), kettleOut: interval(p, 3, 3.22),
    scoopIn: interval(p, 1, 1.18), scoopOut: interval(p, 1.82, 2),
    scoop: Math.sin(Math.PI * clamp(p - 1)),
    stirIn: interval(p, 3.12, 3.25), stirOut: interval(p, 3.52, 3.69),
    stirAngle: Math.PI * 6 * interval(p, 3.2, 3.59),
    coffeeStream: p > 4.01 && p < 4.99,
    bodyX: serveAway * 3.2,
    bodyY: .85 * interval(p, 0, .2) * (1 - interval(p, .84, 1)) + serveLift * 1.05 + serveAway * 1.55,
    cupX: -2.3 * (1 - interval(p, .62, .82)) - .25 * serve,
  };
}

// Pouring and pressing are irreversible within a cup; restarting creates a
// fresh session. Clamp elapsed time to avoid a jump after a backgrounded tab.
export function pourAmount(amount, seconds) {
  return clamp(amount + clamp(seconds, 0, .05) / 2.8);
}
export function pressureFromDrag(initial, pixels, travel) {
  return clamp(initial + pixels / Math.max(1, travel));
}
