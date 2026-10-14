import { normalPoints3D, nextSeed } from './random.mjs';
import { bindNumberPair, bindSeed } from './controls.mjs';

export function cameraFromAngles(azimuth, elevation, radius = 2.2) {
  const a = azimuth * Math.PI / 180, e = elevation * Math.PI / 180;
  return { eye: { x: radius * Math.cos(e) * Math.cos(a), y: radius * Math.cos(e) * Math.sin(a), z: radius * Math.sin(e) }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } };
}

/** Plotly adapter for a 3D capability example; no PCA or Gaussian-projection contract claim. */
export async function mountScatter3D(root, Plotly, initial = {}) {
  const fallback = root.querySelector('[data-fallback]');
  if (!Plotly) { root.querySelector('[data-status]').textContent = 'The local 3D renderer is unavailable. The static figure and coordinate table remain usable.'; return null; }
  const defaults = { n: 150, seed: 709, azimuth: 45, elevation: 25, domain: 4, cameraRadius: 2.2, camera: null, ...initial };
  let state = { ...defaults };
  const canvas = root.querySelector('[data-plot3d]');
  const controls = {};
  let ready = false, updating = false, queued = false;
  const notify = text => { root.querySelector('[data-status]').textContent = text; };
  const colorScale = [[0, '#173c62'], [.5, '#a1c6d2'], [1, '#f2f4df']];
  async function render() {
    if (updating) { queued = true; return; }
    const points = normalPoints3D(state.seed, state.n);
    const excluded = points.filter(p => p.some(value => Math.abs(value) > state.domain)).length;
    const data = [{ type: 'scatter3d', mode: 'markers', x: points.map(p => p[0]), y: points.map(p => p[1]), z: points.map(p => p[2]), marker: { size: 3, opacity: .8, color: points.map(p => p[2]), colorscale: colorScale, cmin: -4, cmax: 4, showscale: true, colorbar: { title: { text: 'z value' }, thickness: 14, len: .7 } }, hovertemplate: 'x: %{x:.3f}<br>y: %{y:.3f}<br>z: %{z:.3f}<extra>Sample point</extra>' }];
    const axis = name => ({ title: { text: name }, range: [-state.domain, state.domain], autorange: false, gridcolor: '#d7dedf', zerolinecolor: '#8a989c', backgroundcolor: '#f8faf9' });
    const layout = { autosize: true, margin: { l: 5, r: 5, b: 5, t: 10 }, paper_bgcolor: '#fffdfa', font: { family: 'system-ui, sans-serif', color: '#243344' }, scene: { xaxis: axis('x'), yaxis: axis('y'), zaxis: axis('z'), aspectmode: 'cube', camera: state.camera ?? cameraFromAngles(state.azimuth, state.elevation, state.cameraRadius) }, showlegend: false, uirevision: `${state.azimuth}-${state.elevation}` };
    const config = { responsive: true, scrollZoom: false, displaylogo: false, modeBarButtonsToRemove: ['toImage'] };
    updating = true;
    try { if (!ready) { await Plotly.newPlot(canvas, data, layout, config); ready = true; } else { await Plotly.react(canvas, data, layout, config); } }
    finally { updating = false; }
    root.querySelector('[data-readout]').textContent = `${state.n} independent standard-normal triples; seed ${state.seed}. View: azimuth ${state.azimuth.toFixed(1)}°, elevation ${state.elevation.toFixed(1)}°. Equal coordinate scales, fixed limits ±${state.domain.toFixed(2)}. ${excluded} points have a coordinate outside these limits. Color encodes z with fixed limits −4 to 4; values outside that color range use the endpoint color.`;
    root.querySelector('[data-coordinates]').textContent = points.slice(0, 5).map((p, i) => `${i + 1}: (${p.map(v => v.toFixed(4)).join(', ')})`).join('\n');
    root.dataset.samplePrefix = JSON.stringify(points.slice(0, 20));
    fallback.hidden = true;
    if (queued) { queued = false; await render(); }
  }
  for (const [name, min, max, integer] of [['n', 1, 1000, true], ['azimuth', 0, 360, false], ['elevation', -80, 80, false]]) {
    controls[name] = bindNumberPair(root, name, { min, max, integer, onChange(value) { state[name] = value; if (name !== 'n') state.camera = { ...(state.camera ?? cameraFromAngles(state.azimuth, state.elevation)), eye: cameraFromAngles(state.azimuth, state.elevation, state.cameraRadius).eye }; render().catch(failure); } });
    controls[name].set(state[name]);
  }
  const seedControl = bindSeed(root, value => { state.seed = value; render().catch(failure); });
  seedControl.set(state.seed);
  function failure(error) { notify(`3D rendering could not complete: ${error.message}. Use the static fallback below.`); fallback.hidden = false; }
  root.querySelector('[data-new-sample]').addEventListener('click', () => { state.seed = nextSeed(state.seed); seedControl.set(state.seed); render().catch(failure); notify(`New sample, seed ${state.seed}.`); });
  root.querySelector('[data-camera-reset]').addEventListener('click', () => { state.azimuth = defaults.azimuth; state.elevation = defaults.elevation; state.cameraRadius = defaults.cameraRadius; state.camera = defaults.camera; controls.azimuth.set(state.azimuth); controls.elevation.set(state.elevation); render().catch(failure); notify('View restored; the sample is unchanged.'); });
  root.querySelector('[data-fit]').addEventListener('click', () => { state.domain = Math.max(4, ...normalPoints3D(state.seed, state.n).flat().map(Math.abs)) * 1.05; render().catch(failure); notify('All three axes fitted together, preserving equal coordinate scales.'); });
  root.querySelector('[data-reset]').addEventListener('click', () => { state = { ...defaults }; for (const [name, control] of Object.entries(controls)) control.set(state[name]); seedControl.set(state.seed); render().catch(failure); notify('Sample, camera, and axes restored.'); });
  try {
    await render();
    // Pointer orbit updates the equivalent numeric controls; no mouse-only camera state.
    canvas.on('plotly_relayout', event => {
      if (updating || !event['scene.camera']?.eye) return;
      state.camera = structuredClone(event['scene.camera']);
      const { x, y, z } = event['scene.camera'].eye;
      state.cameraRadius = Math.hypot(x, y, z);
      state.azimuth = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
      state.elevation = Math.max(-80, Math.min(80, Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI));
      controls.azimuth.set(state.azimuth); controls.elevation.set(state.elevation);
      root.querySelector('[data-readout]').textContent = `Camera changed by pointer: azimuth ${state.azimuth.toFixed(1)}°, elevation ${state.elevation.toFixed(1)}°. Sample unchanged (${state.n} points, seed ${state.seed}). Use the numeric camera controls for a reproducible view.`;
      if (Math.abs(Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI) > 80) { state.camera.eye = cameraFromAngles(state.azimuth, state.elevation, state.cameraRadius).eye; render().catch(failure); }
    });
  } catch (error) { failure(error); }
  return { getState: () => ({ ...state }), render };
}
