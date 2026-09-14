// Exact finite enumeration; no sampling and no external dependencies.
export function validateInverseImage(settings) {
  if (!settings || !Array.isArray(settings.outcomes) || settings.outcomes.length<2 || settings.outcomes.length>8) throw new Error('Use 2–8 finite outcomes.');
  if (new Set(settings.outcomes.map(o=>o.id)).size!==settings.outcomes.length) throw new Error('Outcome IDs must be unique.');
  let sum=0;
  for (const o of settings.outcomes) {
    if (!/^[a-z]$/.test(o.id) || !Number.isInteger(o.value) || !Number.isFinite(o.probability) || o.probability<0 || o.probability>1) throw new Error('Invalid outcome, value, or probability.');
    sum+=o.probability;
  }
  const {min,max}=settings.domain;
  if (!Number.isInteger(min)||!Number.isInteger(max)||min>=max||min< -10||max>10 || settings.outcomes.some(o=>o.value<min||o.value>max)) throw new Error('Invalid fixed integer domain.');
  if (Math.abs(sum-1)>1e-12)throw new Error('Probabilities must sum to one.');
  if (settings.endpointConvention!=='closed')throw new Error('This explorer uses closed intervals.');
  return settings;
}
export function inverseImage(settings, lower, upper) {
  validateInverseImage(settings);
  if (!Number.isInteger(lower)||!Number.isInteger(upper)||lower<settings.domain.min||upper>settings.domain.max||lower>upper) throw new Error(`Use integer endpoints with ${settings.domain.min} ≤ left ≤ right ≤ ${settings.domain.max}.`);
  const selected=settings.outcomes.filter(o=>lower<=o.value&&o.value<=upper);
  return {lower,upper,outcomes:selected.map(o=>o.id),probability:selected.reduce((sum,o)=>sum+o.probability,0)};
}
export function inverseImageReadout(state) {
  return `B = [${state.lower}, ${state.upper}]; X⁻¹(B) = ${state.outcomes.length?'{'+state.outcomes.join(', ')+'}':'∅'}; P_X(B) = ${Number(state.probability.toPrecision(12))}.`;
}
export function inverseImageSvg(settings,state,compact=false) {
  const height=Math.max(320,80+settings.outcomes.length*46),width=compact?360:620;
  const left=compact?72:110,right=compact?260:480;
  const values=[...new Set(settings.outcomes.map(o=>o.value))].sort((a,b)=>a-b);
  const valueY=v=>65+(v-settings.domain.min)/(settings.domain.max-settings.domain.min)*(height-105);
  const nodes=settings.outcomes.map((o,i)=>{
    const selected=state.outcomes.includes(o.id),y=65+i*46;
    return `<g class="${selected?'inverse-selected':'inverse-unselected'}"><path d="M${left+16} ${y} L${right-17} ${valueY(o.value)}" class="inverse-edge"/><circle cx="${left}" cy="${y}" r="17"/><text class="inverse-node-label" x="${left}" y="${y+5}" text-anchor="middle">${o.id}</text><text class="inverse-membership" x="${compact?25:35}" y="${y+5}" text-anchor="middle">${selected?'✓':'·'}</text></g>`;
  }).join('');
  const targets=values.map(v=>`<g class="${state.lower<=v&&v<=state.upper?'inverse-selected':'inverse-unselected'}"><circle cx="${right}" cy="${valueY(v)}" r="17"/><text class="inverse-node-label" x="${right}" y="${valueY(v)+5}" text-anchor="middle">${v}</text></g>`).join('');
  const low=valueY(state.lower),high=valueY(state.upper);
  return `<svg class="inverse-svg-${compact?'compact':'wide'}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${inverseImageReadout(state)}"><text x="${compact?25:75}" y="25">Outcomes in Ω</text><text x="${right-48}" y="25">Values of X</text><rect x="${right-27}" y="${low-22}" width="54" height="${high-low+44}" rx="12" class="inverse-interval"/><text x="${right+50}" y="${(low+high)/2+5}">B</text>${nodes}${targets}</svg>`;
}
export function inverseImageDrawing(settings,state) {
  return inverseImageSvg(settings,state)+inverseImageSvg(settings,state,true)+'<p class="inverse-legend">✓ marks an outcome in the inverse image.</p>';
}
