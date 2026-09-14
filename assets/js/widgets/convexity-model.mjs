export function quadraticValue(z, coefficients=[1,0,0]) {
  const [a,b,c]=coefficients;return (a*z+b)*z+c;
}
export function chordValues(x,y,t,coefficients=[1,0,0]) {
  const z=(1-t)*x+t*y;
  const A=quadraticValue(z,coefficients);
  const B=(1-t)*quadraticValue(x,coefficients)+t*quadraticValue(y,coefficients);
  return {z,A,B,gap:B-A};
}
