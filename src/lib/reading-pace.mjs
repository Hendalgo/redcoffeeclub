import { clamp, interval } from './choreography.mjs';

// Scroll space includes a full reading beat at each finished chapter.
const stops = [
  [0, 0], [.08, 0], [.21, .33], [.34, .33],
  [.41, .5], [.54, .5], [.61, .69], [.74, .69],
  [.82, .94], [.96, .94], [1, 1],
];

// The model travels through the chapter centers without inheriting the text's
// reading plateaus. A monotone cubic keeps velocity continuous at each center.
const sceneStops = [[0, 0], [.08, 0], [.275, .33], [.475, .5], [.675, .69], [.89, .94], [1, 1]];
const widths = sceneStops.slice(1).map((stop, i) => stop[0] - sceneStops[i][0]);
const slopes = sceneStops.slice(1).map((stop, i) => (stop[1] - sceneStops[i][1]) / widths[i]);
const tangents = sceneStops.map((_, i) => {
  if (i === 0 || i === sceneStops.length - 1 || slopes[i - 1] * slopes[i] <= 0) return 0;
  const before = 2 * widths[i] + widths[i - 1], after = widths[i] + 2 * widths[i - 1];
  return (before + after) / (before / slopes[i - 1] + after / slopes[i]);
});
export function sceneAtScroll(scroll) {
  const value = clamp(scroll);
  for (let i = 0; i < sceneStops.length - 1; i++) {
    const [start, from] = sceneStops[i], [end, to] = sceneStops[i + 1];
    if (value > end) continue;
    const t = (value - start) / widths[i], t2 = t * t, t3 = t2 * t;
    return clamp((2 * t3 - 3 * t2 + 1) * from + (t3 - 2 * t2 + t) * widths[i] * tangents[i]
      + (-2 * t3 + 3 * t2) * to + (t3 - t2) * widths[i] * tangents[i + 1]);
  }
  return 1;
}

export function journeyAtScroll(scroll) {
  const value = clamp(scroll);
  for (let i = 1; i < stops.length; i++) {
    const [start, from] = stops[i - 1], [end, to] = stops[i];
    if (value <= end) return from + (to - from) * interval(value, start, end);
  }
  return 1;
}
export function scrollAtJourney(progress) {
  const value = clamp(progress);
  if (value === 0 || value === 1) return value;
  // Chapter links land in the middle of a reading beat, not at its exit.
  for (let i = 1; i < stops.length; i++) {
    if (stops[i - 1][1] === value && stops[i][1] === value) return (stops[i - 1][0] + stops[i][0]) / 2;
  }
  let low = 0, high = 1;
  for (let i = 0; i < 30; i++) {
    const middle = (low + high) / 2;
    if (journeyAtScroll(middle) < value) low = middle; else high = middle;
  }
  return (low + high) / 2;
}
