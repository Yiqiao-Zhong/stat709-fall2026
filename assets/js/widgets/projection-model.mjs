import { normalSequence } from '../primitives/random.mjs';

export function covarianceFactor(matrix) {
  if (!Array.isArray(matrix) || matrix.length !== 2 || matrix.some(row => !Array.isArray(row) || row.length !== 2 || row.some(x => !Number.isFinite(x)))) throw new RangeError('A finite 2 by 2 covariance is required.');
  const [[a, b], [b2, c]] = matrix;
  if (b !== b2 || a < 0 || c < 0 || (a === 0 && b !== 0)) throw new RangeError('Covariance must be symmetric and positive semidefinite.');
  const l11 = Math.sqrt(a), l21 = a === 0 ? 0 : b / l11;
  const remainder = c - l21 * l21;
  if (!Number.isFinite(l21) || !Number.isFinite(remainder) || remainder < -8 * Number.EPSILON * Math.max(c, l21 * l21)) throw new RangeError('Covariance must be positive semidefinite.');
  return [l11, l21, Math.sqrt(Math.max(0, remainder))];
}

export function gaussianSample(mean, covariance, seed, count) {
  if (mean.length !== 2 || mean.some(x => !Number.isFinite(x))) throw new RangeError('A finite two-dimensional mean is required.');
  const [a, b, c] = covarianceFactor(covariance);
  const z = normalSequence(seed, 2 * count);
  return Array.from({length: count}, (_, i) => [mean[0] + a * z[2*i], mean[1] + b * z[2*i] + c * z[2*i+1]]);
}

export function projectedParameters(mean, covariance, degrees) {
  covarianceFactor(covariance);
  if (!Number.isFinite(degrees)) throw new RangeError('Angle must be finite.');
  const clean = x => Math.abs(x) < 1e-15 ? 0 : x;
  const u = [clean(Math.cos(degrees * Math.PI / 180)), clean(Math.sin(degrees * Math.PI / 180))];
  const variance = Math.max(0, u[0]**2 * covariance[0][0] + 2*u[0]*u[1]*covariance[0][1] + u[1]**2 * covariance[1][1]);
  return {u, mean: u[0]*mean[0] + u[1]*mean[1], variance, sd: Math.sqrt(variance)};
}

// Compare entered decimals exactly at an inclusive tolerance boundary. Binary
// subtraction alone can reject 2.251 even though its decimal error is 0.001.
function decimalParts(text) {
  const [mantissa, exponent = '0'] = text.toLowerCase().split('e');
  const fractional = (mantissa.split('.')[1] || '').length;
  return [BigInt(mantissa.replace('.', '').replace(/^\+/, '')), Number(exponent) - fractional];
}
export function checkNumericValue(text, settings) {
  const value = text.trim();
  if (value.length > 256 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value) || !Number.isFinite(Number(value))) return 'invalid';
  if (value.startsWith('-') && /[1-9]/.test(value.split(/e/i)[0])) return 'domain';
  // Limit pathological exponents without treating an underflowed nonzero value as zero.
  if (Math.abs(Number(value.split(/e/i)[1] || 0)) > 1000) return 'invalid';
  const tolerance = Math.max(settings.absoluteTolerance, settings.relativeTolerance * Math.abs(settings.expected));
  const parts = [value, String(settings.expected), String(tolerance)].map(decimalParts);
  const scale = Math.min(...parts.map(p => p[1]));
  const [entered, expected, allowed] = parts.map(([n, e]) => n * 10n ** BigInt(e-scale));
  const error = entered >= expected ? entered-expected : expected-entered;
  return error <= allowed ? 'correct' : 'incorrect';
}
