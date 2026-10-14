/** Bind a range and numeric field without disrupting either field's focus. */
export function bindNumberPair(root, name, { min, max, integer = false, onChange }) {
  const range = root.querySelector(`[data-range="${name}"]`);
  const number = root.querySelector(`[data-number="${name}"]`);
  const error = root.querySelector(`[data-error="${name}"]`);
  function read(input, peer) {
    const value = input.value.trim() === '' ? NaN : Number(input.value);
    const valid = Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value));
    input.setCustomValidity(valid ? '' : `Enter ${integer ? 'an integer' : 'a number'} from ${min} to ${max}.`);
    input.setAttribute('aria-invalid', String(!valid));
    if (error) error.textContent = valid ? '' : `Enter ${integer ? 'an integer' : 'a number'} from ${min} to ${max}; the plot keeps its last valid state.`;
    if (!valid) return;
    peer.value = String(value);
    onChange(value);
  }
  range.addEventListener('input', () => read(range, number));
  number.addEventListener('input', () => read(number, range));
  return {
    set(value) {
      range.value = number.value = String(value);
      for (const input of [range, number]) { input.setCustomValidity(''); input.removeAttribute('aria-invalid'); }
      if (error) error.textContent = '';
    }
  };
}

export function bindSeed(root, onChange) {
  const input = root.querySelector('[data-seed]');
  const error = root.querySelector('[data-seed-error]');
  input.addEventListener('change', () => {
    const value = input.value.trim() === '' ? NaN : Number(input.value);
    const valid = Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
    input.setCustomValidity(valid ? '' : 'Enter an integer seed from 0 to 4294967295.');
    if (error) error.textContent = valid ? '' : 'Invalid seed. The previous sample is retained.';
    if (valid) onChange(value);
  });
  return { set(value) { input.value = String(value); input.setCustomValidity(''); if (error) error.textContent = ''; } };
}

export function svgElement(tag, attributes = {}, text = null) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
  if (text !== null) element.textContent = text;
  return element;
}
