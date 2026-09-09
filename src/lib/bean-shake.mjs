// Require two opposing, strong impulses; tilting, walking and isolated bumps
// should not grind coffee. Values are acceleration in m/s², without gravity.
export function createShakeDetector() {
  let previous = null, lastShake = -Infinity;
  return {
    reset() { previous = null; lastShake = -Infinity; },
    sample(x, y, z, time) {
      if (![x,y,z,time].every(Number.isFinite)) return 0;
      const strength = Math.hypot(x,y,z);
      if (strength < 18 || time-lastShake < 1000) return 0;
      const before = previous;
      if (before && time-before.time < 85) return 0;
      previous = {x,y,z,time,strength};
      if (!before || time-before.time > 550) return 0;
      const direction = (x*before.x+y*before.y+z*before.z)/(strength*before.strength);
      if (direction > -.3) return 0;
      previous = null; lastShake = time;
      return Math.min(45, (strength+before.strength)/2);
    },
  };
}
