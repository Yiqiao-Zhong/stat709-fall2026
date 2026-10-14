/** Authored annotations and constrained checks only; this module does not verify arbitrary proofs. */
export function mountProofSteps(root) {
  const steps = [...root.querySelectorAll('[data-proof-step]')];
  const output = root.querySelector('[data-proof-position]');
  let focused = -1;
  function update() {
    steps.forEach((step, i) => { step.classList.toggle('focused-step', i === focused); if (i === focused) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current'); });
    output.textContent = focused < 0 ? 'Complete proof: all three steps remain visible.' : `Focus on step ${focused + 1} of ${steps.length}: ${steps[focused].dataset.reason}. The complete proof remains visible.`;
    root.querySelector('[data-proof-prev]').disabled = focused <= 0;
    root.querySelector('[data-proof-next]').disabled = focused === steps.length - 1;
  }
  root.querySelector('[data-proof-next]').addEventListener('click', () => { focused = Math.min(steps.length - 1, focused + 1); update(); });
  root.querySelector('[data-proof-prev]').addEventListener('click', () => { focused = Math.max(0, focused - 1); update(); });
  root.querySelector('[data-proof-all]').addEventListener('click', () => { focused = -1; update(); });
  update();
}

export function checkDecimal(input, expected, { absTol = .005, relTol = 0 } = {}) {
  const text = input.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return { valid: false, correct: false, message: 'Enter a decimal or scientific notation, for example 0.5 or 5e-1. Fractions and formulas are not evaluated.' };
  const value = Number(text);
  if (!Number.isFinite(value)) return { valid: false, correct: false, message: 'Enter a finite number.' };
  const correct = Math.abs(value - expected) <= Math.max(absTol, relTol * Math.abs(expected));
  return { valid: true, correct, message: correct ? 'Correct within the stated tolerance. You can still inspect the complete solution.' : 'Try substituting the mean and threshold into the stated inequality. The complete solution is available below.' };
}

export function mountNumericCheck(root, expected, tolerance) {
  const field = root.querySelector('input');
  const result = root.querySelector('[data-feedback]');
  root.querySelector('[data-check]').addEventListener('click', () => {
    const response = checkDecimal(field.value, expected, tolerance);
    result.textContent = response.message;
    field.setAttribute('aria-invalid', String(!response.valid));
  });
  root.querySelector('[data-clear]').addEventListener('click', () => { field.value = ''; field.removeAttribute('aria-invalid'); result.textContent = ''; });
}
