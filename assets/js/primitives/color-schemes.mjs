/** Categorical values follow Okabe–Ito; the other two scales are original course examples. */
export const palettes = Object.freeze({
  categorical: { label: 'Categories: no numerical order', source: 'Okabe–Ito / Color Universal Design', colors: ['#0072B2', '#E69F00', '#009E73', '#CC79A7'], labels: ['Group A · circle', 'Group B · square', 'Group C · triangle', 'Group D · diamond'] },
  sequential: { label: 'Sequential: increasing magnitude', source: 'Original course example', colors: ['#edf4f5', '#bdd8df', '#75a9be', '#3e7395', '#173c62'], labels: ['0 · very low', '0.25 · low', '0.5 · middle', '0.75 · high', '1 · very high'] },
  diverging: { label: 'Diverging: signed deviation around zero', source: 'Original course example', colors: ['#1d716b', '#8fc7b8', '#f1eee5', '#e4b68c', '#ae5a20'], labels: ['−2', '−1', '0 · reference', '+1', '+2'] }
});

export function mountPalette(root) {
  const select = root.querySelector('select');
  const legend = root.querySelector('[data-legend]');
  function render() {
    const palette = palettes[select.value];
    legend.replaceChildren(...palette.colors.map((color, i) => {
      const item = document.createElement('li'), swatch = document.createElement('span'), label = document.createElement('span');
      swatch.className = 'swatch'; swatch.style.backgroundColor = color; swatch.setAttribute('aria-hidden', 'true');
      label.textContent = `${palette.labels[i]} (${color})`; item.append(swatch, label); return item;
    }));
    root.querySelector('[data-palette-description]').textContent = `${palette.label}. ${palette.source}. Labels remain readable without distinguishing the colors.`;
  }
  select.addEventListener('change', render); render();
}
