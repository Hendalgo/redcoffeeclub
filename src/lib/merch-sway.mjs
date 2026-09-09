// Different weight, suspension and response for each garment. Seeded variation
// keeps repeated copies distinct without introducing random motion every frame.
const profiles = [
  { stiffness: 28, damping: 4.8, response: .035, gain: .62 },
  { stiffness: 44, damping: 6.5, response: .16, gain: .5 },
  { stiffness: 56, damping: 5.7, response: .055, gain: .56 },
];

/** @param {number} seed */
export function createMerchSway(seed) {
  const profile = profiles[((seed % profiles.length) + profiles.length) % profiles.length];
  const variation = Math.sin(seed * 12.9898 + 4.7);
  return {
    angle: 0, velocity: 0, drive: 0,
    stiffness: profile.stiffness * (1 + variation * .08),
    damping: profile.damping * (1 - variation * .07),
    response: profile.response * (1 + variation * .15),
    gain: profile.gain * (1 + variation * .08),
  };
}

/**
 * @param {ReturnType<typeof createMerchSway>} sway
 * @param {number} acceleration Horizontal acceleration at the hook.
 * @param {number} dt Fixed simulation step in seconds.
 */
export function stepMerchSway(sway, acceleration, dt) {
  // Fabric takes a little time to follow the hook. Different response times
  // separate both the initial movement and the rebound when the rail brakes.
  sway.drive += (acceleration - sway.drive) * (1 - Math.exp(-dt / sway.response));
  sway.velocity += (sway.drive * sway.gain - sway.angle * sway.stiffness - sway.velocity * sway.damping) * dt;
  sway.angle = Math.max(-.2, Math.min(.2, sway.angle + sway.velocity * dt));
}

/** @param {ReturnType<typeof createMerchSway>} sway */
export function merchSwayAtRest(sway) {
  return Math.abs(sway.angle) < .0003 && Math.abs(sway.velocity) < .001 && Math.abs(sway.drive) < .002;
}

/** @param {ReturnType<typeof createMerchSway>} sway */
export function resetMerchSway(sway) {
  sway.angle = 0; sway.velocity = 0; sway.drive = 0;
}
