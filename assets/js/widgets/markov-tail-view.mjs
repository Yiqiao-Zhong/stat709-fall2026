// Exact finite-support illustration of the source's general area proof.
const fmt=n=>Number(n.toFixed(4)).toString();
export function markovValues(a) {
 if(!Number.isFinite(a)||a<.1||a>16)throw new RangeError('Threshold must lie in [0.1,16].');
 const survival=1-Math.sqrt(a)/4;
 return {a,survival,rectangle:a*survival,expectation:16/3,bound:16/(3*a)};
}
export function markovDrawing(a) {
 const v=markovValues(a),left=48,right=370,top=48,bottom=230;
 const X=t=>left+t*(right-left)/16,Y=s=>bottom-s*(bottom-top);
 // Parameterize by sqrt(t) to resolve the steep curve near zero.
 const curve=Array.from({length:257},(_,i)=>{const u=4*i/256;return [u*u,1-u/4];});
 curve.push([a,v.survival]);curve.sort((p,q)=>p[0]-q[0]);
 const points=curve.map(([t,s])=>`${X(t)},${Y(s)}`).join(' ');
 const text=(x,y,t,fill='#173753',anchor='middle',size=17)=>`<text x="${x}" y="${y}" fill="${fill}" text-anchor="${anchor}" font-size="${size}">${t}</text>`;
 const line=(x1,y1,x2,y2,color,width=1)=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}"/>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 290" role="img" aria-label="Survival curve for Y=X squared, where X is uniform on [0,4]. Total area is 16/3. At a=${fmt(a)}, the outlined rectangle has width ${fmt(a)}, height ${fmt(v.survival)}, and area ${fmt(v.rectangle)}, at most 16/3."><g font-family="Arial, sans-serif">${text(200,23,'S(t) = P(Y > t)')}
 <polygon points="${left},${bottom} ${points} ${right},${bottom}" fill="#dbeaf0"/>
 <rect data-markov-rectangle="true" x="${left}" y="${Y(v.survival)}" width="${X(a)-left}" height="${bottom-Y(v.survival)}" fill="#f1d598" stroke="#94651c" stroke-width="2.5"/>
 <polyline points="${points}" fill="none" stroke="#0b626b" stroke-width="3"/>${line(left,top-6,left,bottom,'#74808a')}${line(left,bottom,right+7,bottom,'#74808a')}
 ${[0,.5,1].map(t=>text(left-10,Y(t)+6,String(t),'#173753','end',16)).join('')}${[0,4,8,12,16].map(t=>text(X(t),bottom+23,String(t),'#173753','middle',16)).join('')}${text(392,bottom+23,'t')}
 <circle cx="${X(a)}" cy="${Y(v.survival)}" r="5" fill="#94651c" stroke="#fffdf8" stroke-width="1.5"/>
 ${line(left,267,X(a),267,'#94651c',2)}${line(left,262,left,272,'#94651c',2)}${line(X(a),262,X(a),272,'#94651c',2)}${text(209,287,`width a = ${fmt(a)}`,'#795015','middle',17)}
 </g></svg>`;
}
export function markovReadout(a) {
 const v=markovValues(a);
 return `<dl class="markov-readout"><div><dt><span class="markov-area-key" aria-hidden="true"></span>Whole area · E Y</dt><dd>16/3 ≈ <span data-markov-value="expectation">${fmt(v.expectation)}</span></dd></div><div><dt><span class="markov-rectangle-key" aria-hidden="true"></span>Rectangle · a × P(Y &gt; a)</dt><dd><span data-markov-value="a">${fmt(a)}</span> × <span data-markov-value="survival">${fmt(v.survival)}</span> = <span data-markov-value="rectangle">${fmt(v.rectangle)}</span> ≤ 16/3</dd></div><div><dt>Divide by a · Markov’s bound</dt><dd><span data-markov-value="probability">${fmt(v.survival)}</span> ≤ 16/(3a) ≈ <span data-markov-value="bound">${fmt(v.bound)}</span></dd></div></dl>`;
}
export function markovMarkup(instance) {
 const {instanceId:id,settings:{threshold:t},source:s}=instance;
 const graph=markovDrawing(t.value),readout=markovReadout(t.value);
 return `<section class="interactive-card markov-explorer" id="${id}" data-component="markov-tail-rectangle" aria-labelledby="${id}-title"><h3 id="${id}-title">Markov: a rectangle inside the expectation</h3><p class="control-note">Y = X², with X uniform on [0, 4]. Move the threshold a. <a href="#${s.promptLabel}">Picture question</a> · <a href="#${s.explanationLabel}">Area proof</a></p><div class="markov-static">${graph}${readout}<p class="control-note">Static view: a = 4.</p></div><div class="markov-live requires-js"><div class="markov-drawing">${graph}</div><div class="markov-controls"><label for="${id}-threshold">Threshold a</label><input type="range" id="${id}-threshold" data-markov-threshold min="${t.min}" max="${t.max}" step="${t.step}" value="${t.value}" aria-describedby="${id}-height"><label class="sr-only" for="${id}-number">Threshold a, number</label><input type="number" id="${id}-number" data-markov-threshold min="${t.min}" max="${t.max}" step="any" value="${t.value}" aria-describedby="${id}-error"><p id="${id}-height" class="control-note">The rectangle’s width is a; its height is P(Y &gt; a).</p><p id="${id}-error" class="markov-error" role="status"></p><button type="button" class="reset-button" data-markov-reset>Reset</button></div><div data-markov-readout aria-live="polite" aria-atomic="true">${readout}</div></div></section>`;
}
