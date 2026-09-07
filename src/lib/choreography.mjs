export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export function interval(progress, start, end) {
  const t = clamp((progress - start) / (end - start));
  return t * t * (3 - 2 * t);
}
// Pure, absolute poses: reversing scroll cannot accumulate translation or rotation.
export function poseAt(progress) {
  const p = clamp(progress);
  return {
    plunger: 2.58 * interval(p, .15, .35),
    filter: -.87 * interval(p, .38, .57),
    cap: -1.65 * interval(p, .35, .64),
    capTurn: -.7 * interval(p, .35, .45),
    tilt: -.07 - .1 * interval(p, .55, .75),
    turn: .12 + .18 * interval(p, .55, .75),
    center: -.63 - .49 * interval(p, .15, .75),
    zoom: 1 - .36 * interval(p, .15, .75),
    labels: interval(p, .73, .87),
  };
}

// Absolute model poses; reading-pace maps the model and HTML independently.
// Every value is absolute, so jumps, resize and reverse scrolling are deterministic.
export function journeyAt(progress) {
  const p = clamp(progress);
  const transition = interval(p, .06, .32);
  const disassembly = clamp((p - .34) / .58);
  const parts = poseAt(disassembly);
  return {
    ...parts,
    disassembly,
    transition,
    turn: .14 + Math.sin(transition * Math.PI) * 1.25 + .2 * transition,
    tilt: -.14 + .35 * Math.sin(transition * Math.PI) - .04 * transition,
    pitch: .035 + .16 * Math.sin(transition * Math.PI),
    scale: 1 + .1 * Math.sin(transition * Math.PI),
    desktopX: .235 - .07 * transition,
    mobileX: .15 * (1 - transition),
  };
}
