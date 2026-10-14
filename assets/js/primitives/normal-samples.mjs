import { normalSequence, nextSeed } from './random.mjs';
import { bindNumberPair, bindSeed, svgElement as svg } from './controls.mjs';

export function sampleSummary({ seed = 709, n = 100, mu = 0, sigma = 1, domain = [-4, 4] } = {}) {
  if (!Number.isInteger(n) || n < 1 || n > 1000 || !Number.isFinite(mu) || !Number.isFinite(sigma) || sigma <= 0) throw new RangeError('Invalid normal-sample parameters.');
  if (domain.length !== 2 || !domain.every(Number.isFinite) || domain[0] >= domain[1]) throw new RangeError('Domain must be an increasing finite pair.');
  const values = normalSequence(seed, n).map(z => mu + sigma * z);
  const width = (domain[1] - domain[0]) / 20;
  const counts = Array(20).fill(0);
  let excluded = 0;
  for (const value of values) {
    if (value < domain[0] || value > domain[1]) { excluded++; continue; }
    counts[Math.min(19, Math.floor((value - domain[0]) / width))]++;
  }
  return { values, mean: values.reduce((a, b) => a + b, 0) / n, excluded, binWidth: width, counts, heights: counts.map(c => c / (n * width)) };
}

/** Gallery adapter. Deliberately not a complete distribution-samples contract certification. */
export function mountNormalSamples(root, initial = {}) {
  const defaults = { seed: 709, n: 100, mu: 0, sigma: 1, domain: [-4, 4], densityMax: .6, histogram: false, ...initial };
  let state = { ...defaults, domain: [...defaults.domain] };
  const drawing = root.querySelector('[data-plot]');
  const readout = root.querySelector('[data-readout]');
  const announce = root.querySelector('[data-status]');
  const controls = {};
  for (const [name, min, max, integer] of [['n', 1, 1000, true], ['mu', -5, 5, false], ['sigma', .1, 5, false]]) {
    controls[name] = bindNumberPair(root, name, { min, max, integer, onChange(value) { state[name] = value; render(); } });
    controls[name].set(state[name]);
  }
  const seedControl = bindSeed(root, value => { state.seed = value; render(); announce.textContent = `Sample seed ${value}.`; });
  seedControl.set(state.seed);
  const histogram = root.querySelector('[data-histogram]');
  histogram.checked = state.histogram;
  histogram.addEventListener('change', () => { state.histogram = histogram.checked; render(); });
  root.querySelector('[data-new-sample]').addEventListener('click', () => { state.seed = nextSeed(state.seed); seedControl.set(state.seed); render(); announce.textContent = `New sample, seed ${state.seed}.`; });
  root.querySelector('[data-fit]').addEventListener('click', () => {
    const { values } = sampleSummary(state);
    state.domain = [Math.min(state.mu - 4 * state.sigma, ...values), Math.max(state.mu + 4 * state.sigma, ...values)];
    const summary = sampleSummary(state);
    state.densityMax = Math.max(1 / (state.sigma * Math.sqrt(2 * Math.PI)), ...(state.histogram ? summary.heights : [])) * 1.15;
    render(); announce.textContent = 'Axes now include all observations, mean plus or minus four standard deviations, and the full density and enabled histogram heights.';
  });
  root.querySelector('[data-reset]').addEventListener('click', () => {
    state = { ...defaults, domain: [...defaults.domain] };
    Object.entries(controls).forEach(([name, control]) => control.set(state[name]));
    seedControl.set(state.seed); histogram.checked = state.histogram; render(); announce.textContent = 'Sample, parameters, axes, and histogram reset.';
  });
  function render() {
    const summary = sampleSummary(state);
    const [lo, hi] = state.domain;
    const left = 62, right = 720, baseline = 237, top = 24, strip = 295;
    const x = value => left + (value - lo) / (hi - lo) * (right - left);
    // A fixed vertical density scale makes changes in sigma comparable.
    const densityMax = state.densityMax;
    const y = value => baseline - value / densityMax * (baseline - top);
    drawing.replaceChildren(svg('title', {}, 'Normal density and a fixed-prefix normal sample'), svg('desc', {}, `Population mean ${state.mu}; standard deviation ${state.sigma}; ${state.n} points. ${summary.excluded} observations are outside the displayed horizontal domain. Detailed values follow the figure.`));
    drawing.append(svg('line', { x1: left, y1: baseline, x2: right, y2: baseline, class: 'axis' }), svg('line', { x1: left, y1: top, x2: left, y2: baseline, class: 'axis' }));
    for (let i = 0; i <= 3; i++) {
      const tick = i * densityMax / 3;
      drawing.append(svg('text', { x: left - 10, y: y(tick) + 4, 'text-anchor': 'end', class: 'tick' }, tick.toFixed(2)), svg('line', { x1: left, x2: right, y1: y(tick), y2: y(tick), class: 'grid' }));
    }
    if (state.histogram) summary.heights.forEach((height, i) => drawing.append(svg('rect', { x: x(lo + i * summary.binWidth), y: y(Math.min(height, densityMax)), width: (right - left) / 20 - 1, height: baseline - y(Math.min(height, densityMax)), fill: '#73b5ac', opacity: .65 })));
    const path = Array.from({ length: 401 }, (_, i) => { const value = lo + (hi - lo) * i / 400; const density = Math.exp(-.5 * ((value - state.mu) / state.sigma) ** 2) / (state.sigma * Math.sqrt(2 * Math.PI)); return `${i ? 'L' : 'M'}${x(value)},${y(density)}`; }).join(' ');
    const defs = svg('defs'), clip = svg('clipPath', { id: `${root.id}-density-clip` });
    clip.append(svg('rect', { x: left, y: top, width: right - left, height: baseline - top })); defs.append(clip); drawing.append(defs);
    drawing.append(svg('path', { d: path, fill: 'none', stroke: '#213e64', 'stroke-width': 3, 'clip-path': `url(#${root.id}-density-clip)` }));
    for (let i = 0; i <= 8; i++) {
      const value = lo + (hi - lo) * i / 8;
      drawing.append(svg('text', { x: x(value), y: baseline + 21, 'text-anchor': 'middle', class: 'tick' }, value.toFixed(1)));
    }
    drawing.append(svg('text', { x: left, y: 16, class: 'axis-label' }, 'Density (fixed vertical scale)'), svg('text', { x: left, y: strip - 12, class: 'axis-label' }, 'Sample points (vertical offset separates overlaps)'), svg('line', { x1: left, y1: strip + 12, x2: right, y2: strip + 12, class: 'axis' }));
    summary.values.forEach((value, i) => { if (value >= lo && value <= hi) drawing.append(svg('circle', { cx: x(value), cy: strip + 3 + (i % 5) * 5, r: 2.6, fill: '#0072b2', opacity: .7 })); });
    if (state.mu >= lo && state.mu <= hi) drawing.append(svg('line', { x1: x(state.mu), x2: x(state.mu), y1: top, y2: strip + 29, stroke: '#b35619', 'stroke-dasharray': '6 5', 'stroke-width': 2 }));
    const tallBins = state.histogram ? summary.heights.filter(h => h > densityMax).length : 0;
    const highDensity = 1 / (state.sigma * Math.sqrt(2 * Math.PI)) > densityMax;
    readout.textContent = `n = ${state.n}; sample mean = ${summary.mean.toFixed(4)}; population mean = ${state.mu}; SD = ${state.sigma}; seed = ${state.seed}. Outside horizontal view: ${summary.excluded}/${state.n}. Histogram area before vertical clipping: ${((state.n - summary.excluded) / state.n).toFixed(3)}.${tallBins ? ` ${tallBins} histogram bar(s) exceed the fixed vertical scale; heights are clipped in the drawing.` : ''}${highDensity ? ' The density peak exceeds the fixed vertical scale. Use Fit axes to see its full height.' : ''}`;
    root.querySelector('[data-values]').textContent = summary.values.slice(0, 10).map(v => v.toFixed(5)).join(', ');
    root.dataset.samplePrefix = JSON.stringify(summary.values.slice(0, 20));
    root.dataset.sampleMean = String(summary.mean);
  }
  render();
  return { getState: () => ({ ...state, domain: [...state.domain] }), render };
}
