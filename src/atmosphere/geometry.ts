// Bounded, deterministic artwork. Detail is a design parameter, not measured fractal dimension.
export function contourPaths(detail: number): string[] {
  const level = Math.max(1, Math.min(5, Math.round(detail) || 1));
  const count = 6 + level * 2;
  return Array.from({ length: count }, (_, line) => {
    const points: string[] = [];
    for (let sample = 0; sample <= 160; sample++) {
      const angle = sample / 160 * Math.PI * 2;
      const base = 24 + line * (128 / count);
      let variation = 0;
      for (let octave = 0; octave < level + 1; octave++) {
        const frequency = [2, 3, 5, 8, 13, 21][octave];
        variation += Math.sin(angle * frequency + octave * 1.73 + line * 0.14) * (10 / 1.9 ** octave);
      }
      const radius = base + variation;
      points.push(`${sample ? 'L' : 'M'}${(200 + Math.cos(angle) * radius * 1.05).toFixed(2)},${(183 + Math.sin(angle) * radius * .84).toFixed(2)}`);
    }
    return points.join(' ') + ' Z';
  });
}

export function driftParameters(motion: number) {
  const amount = Math.max(0, Math.min(50, Number.isFinite(motion) ? motion : 0));
  return { seconds: 220 - amount * 2, distance: 2 + amount * .12 };
}
