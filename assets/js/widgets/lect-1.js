import { quadraticValue, chordValues } from './convexity-model.mjs';
import {
  binaryEntropy,
  clamp,
  clear,
  createCard,
  createSvg,
  drawAxes,
  format,
  linePath,
  logChoose,
  mulberry32,
  normalTail,
  range,
  scaleLinear,
  setupTabs,
  standardNormal,
  svgEl,
} from "./common.js";

export const lectureTopics = [
  {
    id: "sets-topology-and-compactness",
    short: "Topology & existence",
    priority: "mid",
    reappears: "Ensures estimators and optimizers actually exist.",
  },
  {
    id: "limits-and-asymptotic-notation",
    short: "Asymptotic notation",
    priority: "high",
    reappears: "Keeps limits, approximations, and uniformity precise.",
  },
  {
    id: "gaussian-calculations",
    short: "Gaussian calculations",
    priority: "high",
    reappears: "Drives likelihoods, limit theory, and concentration.",
  },
  {
    id: "combinatorics-stirlings-formula-and-entropy",
    short: "Stirling & entropy",
    priority: "mid",
    reappears: "Approximates discrete probabilities and model counts.",
  },
  {
    id: "linear-algebra-for-statistics",
    short: "Spectral methods & PCA",
    priority: "high",
    reappears: "Organizes covariance, dimension reduction, and perturbation.",
  },
  {
    id: "vector-norms-inequalities-and-duality",
    short: "Norms & duality",
    priority: "mid",
    reappears: "Pairs estimation error with noise and regularization.",
  },
  {
    id: "convexity-and-optimality",
    short: "Convexity & optimality",
    priority: "high",
    reappears: "Turns estimators into solvable optimization problems.",
  },
];

function topologyWidget() {
  const { card, body, reset } = createCard(
    "Existence lives in the domain",
    "Move the point and ε-ball, then compare three domains where a continuous objective may or may not attain its infimum.",
  );
  body.innerHTML = `
    <div class="tab-list" role="tablist" aria-label="Topology visualization">
      <button class="tab-button" role="tab" aria-selected="true" aria-controls="topology-ball-panel" id="topology-ball-tab">ε-ball</button>
      <button class="tab-button" role="tab" aria-selected="false" aria-controls="topology-existence-panel" id="topology-existence-tab" tabindex="-1">Minimum attained?</button>
    </div>
    <div class="tab-panel" role="tabpanel" id="topology-ball-panel" aria-labelledby="topology-ball-tab">
      <div class="widget-grid">
        <div class="plot-panel" data-ball-plot></div>
        <div class="widget-controls">
          <div class="control-row"><label for="topology-x">Point x-coordinate</label><input id="topology-x" type="range" min="-1.45" max="1.45" step="0.05" value="0.35"><output data-x-output></output></div>
          <div class="control-row"><label for="topology-y">Point y-coordinate</label><input id="topology-y" type="range" min="-1.45" max="1.45" step="0.05" value="0.2"><output data-y-output></output></div>
          <div class="control-row"><label for="topology-epsilon">ε radius</label><input id="topology-epsilon" type="range" min="0.05" max="0.9" step="0.05" value="0.35"><output data-epsilon-output></output></div>
          <div class="readout" data-ball-status aria-live="polite"></div>
          <p class="control-note">The blue point is draggable. Focus it and use the arrow keys for keyboard control.</p>
        </div>
      </div>
    </div>
    <div class="tab-panel" role="tabpanel" id="topology-existence-panel" aria-labelledby="topology-existence-tab" hidden>
      <div class="widget-grid">
        <div class="plot-panel" data-domain-plot></div>
        <div class="widget-controls">
          <div class="control-row">
            <label for="topology-domain">Domain and objective</label>
            <select id="topology-domain">
              <option value="open">(0,1), f(x)=x</option>
              <option value="compact">[0,1], f(x)=x</option>
              <option value="unbounded">[0,∞), f(x)=e⁻ˣ</option>
            </select>
          </div>
          <div class="readout" data-domain-status aria-live="polite"></div>
          <div class="stat-grid">
            <div class="stat"><span>Continuous?</span><strong>Yes</strong></div>
            <div class="stat"><span>Unique if attained?</span><strong data-unique></strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
  setupTabs(body);

  const xInput = body.querySelector("#topology-x");
  const yInput = body.querySelector("#topology-y");
  const epsilonInput = body.querySelector("#topology-epsilon");
  const ballPlot = body.querySelector("[data-ball-plot]");
  const domainSelect = body.querySelector("#topology-domain");
  const domainPlot = body.querySelector("[data-domain-plot]");

  // Keep the pointer-capture owner and SVG transform stable during updates.
  const ballSvg = createSvg('Point and epsilon ball relative to an open set', 'A dashed unit disk represents the open set. Both coordinates have the same scale.');
  const ballX = scaleLinear(-1.6, 1.6, 175, 445), ballY = scaleLinear(-1.6, 1.6, 300, 30);
  ballSvg.append(svgEl('line',{x1:ballX(-1.55),x2:ballX(1.55),y1:ballY(0),y2:ballY(0),class:'axis'}));
  ballSvg.append(svgEl('line',{x1:ballX(0),x2:ballX(0),y1:ballY(-1.55),y2:ballY(1.55),class:'axis'}));
  ballSvg.append(svgEl('circle',{cx:ballX(0),cy:ballY(0),r:ballX(1)-ballX(0),fill:'#eaf3fb',stroke:'#125b9a','stroke-width':2.4,'stroke-dasharray':'7 6'}));
  ballSvg.append(svgEl('text',{x:ballX(-.94),y:ballY(1.1)},'open set U'));
  const neighborhood=svgEl('circle',{fill:'rgba(213,164,58,.18)',stroke:'#b77b09','stroke-width':2,'stroke-dasharray':'4 3'});
  const point=svgEl('circle',{r:7,fill:'#125b9a',class:'point draggable',tabindex:0,role:'button'});
  ballSvg.append(neighborhood,point);ballPlot.append(ballSvg);
  let dragging=false;
  point.addEventListener('pointerdown',event=>{event.preventDefault();dragging=true;point.setPointerCapture(event.pointerId);});
  point.addEventListener('pointermove',event=>{
    if(!dragging)return;
    const position=new DOMPoint(event.clientX,event.clientY).matrixTransform(ballSvg.getScreenCTM().inverse());
    xInput.value=clamp(-1.6+(position.x-175)/270*3.2,-1.45,1.45);
    yInput.value=clamp(-1.6+(300-position.y)/270*3.2,-1.45,1.45);
    renderBall();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>point.addEventListener(name,()=>{dragging=false;}));
  point.addEventListener('keydown',event=>{
    const delta={ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,.05],ArrowDown:[0,-.05]}[event.key];
    if(!delta)return;event.preventDefault();
    xInput.value=clamp(Number(xInput.value)+delta[0],-1.45,1.45);
    yInput.value=clamp(Number(yInput.value)+delta[1],-1.45,1.45);renderBall();
  });
  function renderBall() {
    const x=Number(xInput.value),y=Number(yInput.value),epsilon=Number(epsilonInput.value);
    body.querySelector('[data-x-output]').textContent=format(x,2);
    body.querySelector('[data-y-output]').textContent=format(y,2);
    body.querySelector('[data-epsilon-output]').textContent=format(epsilon,2);
    for(const node of [neighborhood,point]) {node.setAttribute('cx',ballX(x));node.setAttribute('cy',ballY(y));}
    neighborhood.setAttribute('r',(ballX(1)-ballX(0))*epsilon);
    point.setAttribute('aria-label',`Point at x ${format(x,2)}, y ${format(y,2)}. Use arrow keys to move.`);
    const radius=Math.hypot(x,y),inside=radius<1,contained=inside && radius+epsilon<=1;
    const status=body.querySelector('[data-ball-status]');
    status.removeAttribute('aria-live');
    status.className=contained?'readout success':'readout warning';
    status.innerHTML=!inside?'<strong>The point is outside U.</strong> It cannot have a neighborhood contained in U.':contained?'<strong>The open ε-ball is contained in U.</strong> Tangency is allowed because the ball excludes its boundary.':`<strong>The point is in U, but this ball crosses the boundary.</strong> Try ε ≤ ${format(1-radius,2)}.`;
    [xInput,yInput,epsilonInput].forEach(input=>{const numeric=body.querySelector(`#${input.id}-number`);if(numeric && document.activeElement!==numeric)numeric.value=input.value;});
  }

  const domainCases = {
    open: {
      xMax: 1,
      f: (x) => x,
      yMax: 1.05,
      status: "<strong>Infimum 0, not attained.</strong> The missing endpoint prevents existence.",
      unique: "At most one",
      endpoints: "open",
    },
    compact: {
      xMax: 1,
      f: (x) => x,
      yMax: 1.05,
      status: "<strong>Minimum 0 at x=0.</strong> Continuity plus compactness guarantees attainment.",
      unique: "Yes",
      endpoints: "closed",
    },
    unbounded: {
      xMax: 5,
      f: (x) => Math.exp(-x),
      yMax: 1.05,
      status: "<strong>Infimum 0, not attained.</strong> Closedness alone does not prevent escape to infinity.",
      unique: "At most one",
      endpoints: "left-closed",
    },
  };

  function renderDomain() {
    const model = domainCases[domainSelect.value];
    clear(domainPlot);
    const svg = createSvg(
      "Objective over the selected domain",
      "A continuous objective is plotted with open or closed endpoint markers to show whether its infimum is attained.",
    );
    const sx = scaleLinear(0, model.xMax, 55, 585);
    const sy = scaleLinear(0, model.yMax, 300, 28);
    drawAxes(svg, {
      xTicks: range(0, model.xMax, 6),
      yTicks: range(0, model.yMax, 5),
      xScale: sx,
      yScale: sy,
      left: 55,
      right: 585,
      top: 28,
      bottom: 300,
      xFormat: (v) => format(v, 1),
      yFormat: (v) => format(v, 2),
      xLabel: "x",
      yLabel: "f(x)",
    });
    const points = range(0, model.xMax, 150).map((x) => [sx(x), sy(model.f(x))]);
    svg.append(svgEl("path", { d: linePath(points), class: "curve", stroke: "#125b9a" }));
    const leftClosed = model.endpoints !== "open";
    svg.append(svgEl("circle", {
      cx: sx(0),
      cy: sy(model.f(0)),
      r: 6,
      fill: leftClosed ? "#125b9a" : "white",
      stroke: "#125b9a",
      "stroke-width": 2.5,
    }));
    if (model.endpoints !== "left-closed") {
      svg.append(svgEl("circle", {
        cx: sx(model.xMax),
        cy: sy(model.f(model.xMax)),
        r: 6,
        fill: model.endpoints === "closed" ? "#125b9a" : "white",
        stroke: "#125b9a",
        "stroke-width": 2.5,
      }));
    }
    if (domainSelect.value === "compact") {
      svg.append(svgEl("circle", { cx: sx(0), cy: sy(0), r: 7, fill: "#1c713d" }));
      svg.append(svgEl("text", { x: sx(0) + 10, y: sy(0) - 10 }, "minimum attained"));
    } else {
      svg.append(svgEl("line", {
        x1: sx(0),
        x2: sx(model.xMax),
        y1: sy(0),
        y2: sy(0),
        stroke: "#a64518",
        "stroke-dasharray": "5 5",
      }));
      svg.append(svgEl("text", { x: sx(model.xMax) - 4, y: sy(0) - 8, "text-anchor": "end" }, "infimum"));
    }
    domainPlot.append(svg);
    const status = body.querySelector("[data-domain-status]");
    status.className = domainSelect.value === "compact" ? "readout success" : "readout warning";
    status.innerHTML = model.status;
    body.querySelector("[data-unique]").textContent = model.unique;
  }

  [xInput, yInput, epsilonInput].forEach((input) => input.addEventListener("input", renderBall));
  domainSelect.addEventListener("change", renderDomain);
  reset.addEventListener("click", () => {
    xInput.value = 0.35;
    yInput.value = 0.2;
    epsilonInput.value = 0.35;
    domainSelect.value = "open";
    renderBall();
    renderDomain();
  });
  renderBall();
  renderDomain();
  return card;
}

function gaussianTailWidget() {
  const { card, body, reset } = createCard(
    "Gaussian tails and the √log d scale",
    "Compare numerical reference probabilities with analytic bounds, then simulate maxima using a fixed seed for reproducible results.",
  );
  body.innerHTML = `
    <div class="tab-list" role="tablist" aria-label="Gaussian visualization">
      <button class="tab-button" role="tab" aria-selected="true" aria-controls="gaussian-tail-panel" id="gaussian-tail-tab">Tail bounds</button>
      <button class="tab-button" role="tab" aria-selected="false" aria-controls="gaussian-max-panel" id="gaussian-max-tab" tabindex="-1">Coordinate maxima</button>
    </div>
    <div class="tab-panel" role="tabpanel" id="gaussian-tail-panel" aria-labelledby="gaussian-tail-tab">
      <div class="plot-panel" data-tail-plot></div>
      <div class="chart-legend">
        <span class="legend-key" style="--legend-color:#125b9a">Numerical P(|G|≥t)</span>
        <span class="legend-key" style="--legend-color:#1c713d">Lower Mills</span>
        <span class="legend-key" style="--legend-color:#b77b09">Upper Mills</span>
        <span class="legend-key" style="--legend-color:#a64518">2e⁻ᵗ²⁄²</span>
      </div>
    </div>
    <div class="tab-panel" role="tabpanel" id="gaussian-max-panel" aria-labelledby="gaussian-max-tab" hidden>
      <div class="widget-grid">
        <div class="plot-panel" data-max-plot></div>
        <div class="widget-controls">
          <div class="control-row"><label for="gaussian-d">Dimension d=2ᵏ</label><input id="gaussian-d" type="range" min="1" max="10" step="1" value="6"><output data-d-output></output></div>
          <div class="control-row"><label for="gaussian-delta">Failure probability δ</label><input id="gaussian-delta" type="range" min="0.01" max="0.2" step="0.01" value="0.05"><output data-delta-output></output></div>
          <div class="stat-grid">
            <div class="stat"><span>Union-bound threshold</span><strong data-threshold></strong></div>
            <div class="stat"><span>Empirical coverage</span><strong data-coverage></strong></div>
            <div class="stat"><span>Mean maximum</span><strong data-mean></strong></div>
            <div class="stat"><span>√log d</span><strong data-log-scale></strong></div>
          </div>
          <div class="readout"><strong>Simulation note:</strong> coordinates are independent here, but the lecture’s union bound does not require independence.</div>
        </div>
      </div>
    </div>
  `;
  setupTabs(body);
  const tailPlot = body.querySelector("[data-tail-plot]");
  const maxPlot = body.querySelector("[data-max-plot]");
  const dInput = body.querySelector("#gaussian-d");
  const deltaInput = body.querySelector("#gaussian-delta");

  function renderTail() {
    clear(tailPlot);
    const svg = createSvg(
      "Gaussian tail bounds on a logarithmic scale",
      "The numerical two-sided Gaussian tail lies between two Mills-ratio curves and below the exponential bound.",
    );
    const sx = scaleLinear(0.5, 5.5, 58, 590);
    const sy = scaleLinear(-8, 0.35, 300, 25);
    drawAxes(svg, {
      xTicks: [1, 2, 3, 4, 5],
      yTicks: [-8, -6, -4, -2, 0],
      xScale: sx,
      yScale: sy,
      left: 58,
      right: 590,
      top: 25,
      bottom: 300,
      xFormat: String,
      yFormat: (v) => `10^${v}`,
      xLabel: "threshold t",
      yLabel: "probability (log scale)",
    });
    const ts = range(0.5, 5.5, 180);
    const phi = (t) => Math.exp(-(t * t) / 2) / Math.sqrt(2 * Math.PI);
    const curves = [
      { color: "#125b9a", fn: (t) => 2 * normalTail(t) },
      { color: "#1c713d", fn: (t) => (2 * t * phi(t)) / (t * t + 1) },
      { color: "#b77b09", fn: (t) => (2 * phi(t)) / t },
      { color: "#a64518", fn: (t) => 2 * Math.exp(-(t * t) / 2) },
    ];
    curves.forEach(({ color, fn }) => {
      const points = ts.map((t) => [
        sx(t),
        sy(clamp(Math.log10(fn(t)), -8, 0.35)),
      ]);
      svg.append(svgEl("path", { d: linePath(points), class: "curve", stroke: color }));
    });
    tailPlot.append(svg);
  }

  function renderMaxima() {
    const d = 2 ** Number(dInput.value);
    const delta = Number(deltaInput.value);
    const threshold = Math.sqrt(2 * Math.log((2 * d) / delta));
    body.querySelector("[data-d-output]").textContent = d.toLocaleString();
    body.querySelector("[data-delta-output]").textContent = format(delta, 2);
    const random = mulberry32(709 + d);
    const maxima = [];
    for (let trial = 0; trial < 320; trial += 1) {
      let maximum = 0;
      for (let index = 0; index < d; index += 1) {
        maximum = Math.max(maximum, Math.abs(standardNormal(random)));
      }
      maxima.push(maximum);
    }
    const empiricalCoverage =
      maxima.filter((value) => value <= threshold).length / maxima.length;
    const mean = maxima.reduce((sum, value) => sum + value, 0) / maxima.length;
    body.querySelector("[data-threshold]").textContent = format(threshold, 3);
    body.querySelector("[data-coverage]").textContent = `${format(100 * empiricalCoverage, 1)}%`;
    body.querySelector("[data-mean]").textContent = format(mean, 3);
    body.querySelector("[data-log-scale]").textContent = format(Math.sqrt(Math.log(d)), 3);

    clear(maxPlot);
    const svg = createSvg(
      `Simulated maxima for ${d} Gaussian coordinates`,
      "A histogram of simulated maximum absolute Gaussian coordinates includes the square-root-log dimension scale and the union-bound threshold.",
    );
    const maxX = Math.max(threshold * 1.08, ...maxima) + 0.1;
    const bins = 20;
    const counts = Array(bins).fill(0);
    maxima.forEach((value) => {
      const index = Math.min(bins - 1, Math.floor((value / maxX) * bins));
      counts[index] += 1;
    });
    const maxCount = Math.max(...counts);
    const sx = scaleLinear(0, maxX, 55, 590);
    const sy = scaleLinear(0, maxCount, 300, 28);
    drawAxes(svg, {
      xTicks: range(0, maxX, 6),
      yTicks: range(0, maxCount, 5),
      xScale: sx,
      yScale: sy,
      left: 55,
      right: 590,
      top: 28,
      bottom: 300,
      xFormat: (v) => format(v, 1),
      yFormat: (v) => Math.round(v),
      xLabel: "max |Gⱼ|",
      yLabel: "simulation count",
    });
    const binWidth = maxX / bins;
    counts.forEach((count, index) => {
      svg.append(svgEl("rect", {
        x: sx(index * binWidth) + 1,
        y: sy(count),
        width: Math.max(1, sx(binWidth) - sx(0) - 2),
        height: sy(0) - sy(count),
        fill: "#9ec3df",
      }));
    });
    [
      { value: Math.sqrt(Math.log(d)), color: "#b77b09", label: "√log d" },
      { value: threshold, color: "#a64518", label: "union threshold" },
    ].forEach(({ value, color, label }) => {
      svg.append(svgEl("line", {
        x1: sx(value),
        x2: sx(value),
        y1: 28,
        y2: 300,
        stroke: color,
        "stroke-width": 2.5,
        "stroke-dasharray": "6 5",
      }));
      svg.append(svgEl("text", { x: sx(value) + 5, y: 42, fill: color }, label));
    });
    maxPlot.append(svg);
  }

  dInput.addEventListener("input", renderMaxima);
  deltaInput.addEventListener("input", renderMaxima);
  reset.addEventListener("click", () => {
    dInput.value = 6;
    deltaInput.value = 0.05;
    renderMaxima();
  });
  renderTail();
  renderMaxima();
  return card;
}

export function stirlingLogFactorial(n) {
  if (!Number.isInteger(n) || n < 1) throw new RangeError("Stirling requires a positive integer.");
  return n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n);
}

function combinatoricsWidget() {
  const { card, body, reset } = createCard(
    "Exact counts and Stirling",
    "Change n and k/n to see when each approximation becomes accurate; the histogram keeps the Binomial(n,½) interpretation in view.",
  );
  body.innerHTML = `
    <div class="widget-grid">
      <div class="plot-panel" data-binomial-plot></div>
      <div class="widget-controls">
        <div class="control-row"><label for="stirling-n">n</label><input id="stirling-n" type="range" min="20" max="160" step="2" value="80"><output data-n-output></output></div>
        <div class="control-row"><label for="stirling-p">k/n</label><input id="stirling-p" type="range" min="0.05" max="0.95" step="0.01" value="0.5"><output data-p-output></output></div>
        <label class="checkbox-row"><input type="checkbox" data-entropy-toggle checked> Show entropy approximation</label>
        <div class="stat-grid">
          <div class="stat"><span>k</span><strong data-k></strong></div>
          <div class="stat"><span>log exact</span><strong data-exact></strong></div>
          <div class="stat"><span>Stirling error</span><strong data-stirling-error></strong></div>

        </div>
        <div class="readout" data-coefficient></div>
        <details><summary>Show approximation steps</summary><p>Apply the logarithmic Stirling formula to n!, k!, and (n−k)!, and subtract the latter two from the first. The square-root factors supply the local correction.</p></details>
      </div>
    </div>
    <div class="chart-legend">
      <span class="legend-key" style="--legend-color:#7daed1">Exact Binomial(n,½) mass</span>
      <span class="legend-key" style="--legend-color:#a64518">Local Gaussian approximation</span>
    </div>
  `;
  const nInput = body.querySelector("#stirling-n");
  const pInput = body.querySelector("#stirling-p");
  const entropyToggle = body.querySelector("[data-entropy-toggle]");
  const entropyBlock=[...document.querySelectorAll('details.lowpriority')].find(node=>node.querySelector('summary').textContent.includes('Binary entropy'));
  const entropyTools=document.createElement('div');entropyTools.className='readout';
  entropyTools.append(entropyToggle.closest('label'));
  const entropyError=document.createElement('p'),entropyParameters=document.createElement('p');
  entropyTools.append(entropyParameters,entropyError);
  const entropyNote=document.createElement('p');entropyNote.textContent='The refined entropy expression and three-factor Stirling calculation are algebraically the same leading approximation.';entropyTools.append(entropyNote);
  entropyBlock.querySelector('.priority-details-body').append(entropyTools);
  const plot = body.querySelector("[data-binomial-plot]");

  function render() {
    const n = Number(nInput.value);
    const k = clamp(Math.round(Number(pInput.value) * n), 1, n - 1);
    const p = k / n;
    nInput.value = n;
    body.querySelector("[data-n-output]").textContent = n;
    body.querySelector("[data-p-output]").textContent = `${format(p, 3)} (${k}/${n})`;
    const exact = logChoose(n, k);
    const stirling =
      stirlingLogFactorial(n) -
      stirlingLogFactorial(k) -
      stirlingLogFactorial(n - k);
    const entropyApprox =
      n * binaryEntropy(p) -
      0.5 * Math.log(2 * Math.PI * n * p * (1 - p));
    body.querySelector("[data-k]").textContent = k;
    body.querySelector("[data-exact]").textContent = format(exact, 3);
    body.querySelector("[data-stirling-error]").textContent = format(stirling - exact, 5);
    entropyParameters.textContent = `Using the counting activity: n = ${n}, k = ${k}, k/n = ${format(p,3)}.`;
    entropyError.textContent = entropyToggle.checked ? `Entropy approximation minus exact log count: ${format(entropyApprox-exact,5)}` : "Entropy comparison hidden.";
    const log10 = exact / Math.LN10;
    body.querySelector("[data-coefficient]").innerHTML =
      `<strong>Scale:</strong> C(${n},${k}) ≈ 10<sup>${format(log10, 2)}</sup>.`;

    clear(plot);
    const svg = createSvg(
      `Binomial mass and local Gaussian approximation for n ${n}`,
      "Exact Binomial n one-half probabilities are shown as bars with a local Gaussian approximation curve.",
    );
    const ks = Array.from({ length: n + 1 }, (_, index) => index);
    const exactMass = ks.map((value) =>
      Math.exp(logChoose(n, value) - n * Math.log(2)),
    );
    const gaussian = ks.map((value) =>
      Math.sqrt(2 / (Math.PI * n)) *
      Math.exp((-2 * (value - n / 2) ** 2) / n),
    );
    const maxY = Math.max(...exactMass, ...gaussian) * 1.08;
    const sx = scaleLinear(0, n, 52, 592);
    const sy = scaleLinear(0, maxY, 300, 28);
    drawAxes(svg, {
      xTicks: range(0, n, 6),
      yTicks: range(0, maxY, 5),
      xScale: sx,
      yScale: sy,
      left: 52,
      right: 592,
      top: 28,
      bottom: 300,
      xFormat: (v) => Math.round(v),
      yFormat: (v) => format(v, 3),
      xLabel: "number of successes",
      yLabel: "probability mass",
    });
    const barWidth = Math.max(1, (sx(1) - sx(0)) * 0.75);
    exactMass.forEach((mass, index) => {
      svg.append(svgEl("rect", {
        x: sx(index) - barWidth / 2,
        y: sy(mass),
        width: barWidth,
        height: sy(0) - sy(mass),
        fill: "#7daed1",
        opacity: 0.78,
      }));
    });
    svg.append(svgEl("path", {
      d: linePath(gaussian.map((mass, index) => [sx(index), sy(mass)])),
      class: "curve",
      stroke: "#a64518",
    }));
    svg.append(svgEl("line", {
      x1: sx(k),
      x2: sx(k),
      y1: 28,
      y2: 300,
      stroke: "#76518e",
      "stroke-width": 2,
      "stroke-dasharray": "5 4",
    }));
    plot.append(svg);
  }

  [nInput, pInput].forEach((input) => input.addEventListener("input", render));
  entropyToggle.addEventListener("change", render);
  reset.addEventListener("click", () => {
    nInput.value = 80;
    pInput.value = 0.5;
    entropyToggle.checked = true;
    entropyBlock.open = false;
    render();
  });
  render();
  return card;
}

function centeredData() {
  const raw = [
    [-2.5, -1.5], [-2.2, -0.7], [-1.9, -1.2], [-1.5, -0.3],
    [-1.2, -0.8], [-0.8, 0.1], [-0.4, -0.3], [-0.1, 0.5],
    [0.2, -0.1], [0.5, 0.8], [0.9, 0.2], [1.2, 1.1],
    [1.5, 0.7], [1.8, 1.5], [2.1, 0.8], [2.5, 1.9],
  ];
  const mean = raw
    .reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0])
    .map((value) => value / raw.length);
  return raw.map(([x, y]) => [x - mean[0], y - mean[1]]);
}

export function covariance2(points) {
  const n = points.length;
  let a = 0;
  let b = 0;
  let c = 0;
  points.forEach(([x, y]) => {
    a += x * x;
    b += x * y;
    c += y * y;
  });
  return [a / n, b / n, c / n];
}

export function eigensystem2([a, b, c]) {
  const trace = a + c;
  const difference = Math.sqrt((a - c) ** 2 + 4 * b * b);
  const lambda1 = (trace + difference) / 2;
  const lambda2 = (trace - difference) / 2;
  let vector = [b, lambda1 - a];
  if (Math.hypot(...vector) < 1e-9) vector = [1, 0];
  const length = Math.hypot(...vector);
  const v1 = vector.map((value) => value / length);
  const v2 = [-v1[1], v1[0]];
  return { lambda1, lambda2, v1, v2 };
}

function svdGeometryWidget() {
  const { card, body, reset } = createCard(
    "Geometric intuition of SVD",
    "Follow a vector and the unit circle through Vᵀ, coordinatewise scaling, and U. Together these three maps equal A.",
  );
  body.innerHTML = `
    <div>
      <div class="plot-panel svd-pipeline" data-svd-plot></div>
      <div class="chart-legend">
        <span class="legend-key" style="--legend-color:#125b9a">Image of the unit circle</span>
        <span class="legend-key" style="--legend-color:#b77b09">Mapped input vector</span>
        <span class="legend-key" style="--legend-color:#76518e">Mapped coordinate directions</span>
      </div>
    </div>
    <div class="widget-grid svd-controls-row">
      <div class="widget-controls">
        <div class="control-row"><label for="svd-input-angle">Input vector angle</label><input id="svd-input-angle" type="range" min="0" max="360" step="1" value="35"><output data-svd-angle></output></div>
        <div class="control-row"><label for="svd-second-value">Second singular value s₂</label><input id="svd-second-value" type="range" min="0.2" max="1.4" step="0.05" value="0.65"><output data-svd-second></output></div>
      </div>
      <div class="widget-controls">
        <div class="stat-grid">
          <div class="stat"><span>First singular value</span><strong>s₁ = 1.80</strong></div>
          <div class="stat"><span>Second singular value</span><strong data-svd-second-stat></strong></div>
          <div class="stat"><span>Input length</span><strong>1.00</strong></div>
          <div class="stat"><span>Output length</span><strong data-svd-output-length></strong></div>
        </div>
        <div class="readout" data-svd-matrix aria-live="polite"></div>
      </div>
    </div>
  `;
  const angleInput = body.querySelector("#svd-input-angle");
  const secondInput = body.querySelector("#svd-second-value");
  const plot = body.querySelector("[data-svd-plot]");
  const vAngle = (32 * Math.PI) / 180;
  const uAngle = (28 * Math.PI) / 180;
  const rotate = ([x, y], angle) => [
    Math.cos(angle) * x - Math.sin(angle) * y,
    Math.sin(angle) * x + Math.cos(angle) * y,
  ];

  function render() {
    const angle = Number(angleInput.value);
    const theta = (angle * Math.PI) / 180;
    const s1 = 1.8;
    const s2 = Number(secondInput.value);
    const input = [Math.cos(theta), Math.sin(theta)];
    const afterV = rotate(input, -vAngle);
    const afterS = [s1 * afterV[0], s2 * afterV[1]];
    const output = rotate(afterS, uAngle);
    const stages = [
      {
        label: "Input x",
        transform: (point) => point,
        vector: input,
      },
      {
        label: "Vᵀx",
        transform: (point) => rotate(point, -vAngle),
        vector: afterV,
      },
      {
        label: "ΣVᵀx",
        transform: (point) => {
          const rotated = rotate(point, -vAngle);
          return [s1 * rotated[0], s2 * rotated[1]];
        },
        vector: afterS,
      },
      {
        label: "Ax = UΣVᵀx",
        transform: (point) => {
          const rotated = rotate(point, -vAngle);
          return rotate([s1 * rotated[0], s2 * rotated[1]], uAngle);
        },
        vector: output,
      },
    ];
    const a11 = Math.cos(uAngle) * s1 * Math.cos(vAngle) +
      Math.sin(uAngle) * s2 * Math.sin(vAngle);
    const a12 = Math.cos(uAngle) * s1 * Math.sin(vAngle) -
      Math.sin(uAngle) * s2 * Math.cos(vAngle);
    const a21 = Math.sin(uAngle) * s1 * Math.cos(vAngle) -
      Math.cos(uAngle) * s2 * Math.sin(vAngle);
    const a22 = Math.sin(uAngle) * s1 * Math.sin(vAngle) +
      Math.cos(uAngle) * s2 * Math.cos(vAngle);
    body.querySelector("[data-svd-angle]").textContent = `${angle}°`;
    body.querySelector("[data-svd-second]").textContent = format(s2, 2);
    body.querySelector("[data-svd-second-stat]").textContent = `s₂ = ${format(s2, 2)}`;
    body.querySelector("[data-svd-output-length]").textContent =
      format(Math.hypot(...output), 3);
    body.querySelector("[data-svd-matrix]").innerHTML =
      `<strong>Combined matrix:</strong> A ≈ [[${format(a11, 2)}, ${format(a12, 2)}], ` +
      `[${format(a21, 2)}, ${format(a22, 2)}]]. ` +
      "The orthogonal stages preserve length; only Σ stretches or contracts.";

    clear(plot);
    const svg = createSvg(
      "Singular value decomposition as three consecutive linear maps",
      "Four panels show an input vector and unit circle, rotation by V transpose, scaling by Sigma, and rotation by U to produce the matrix output.",
      "0 0 820 300",
    );
    const centers = [90, 300, 510, 730];
    const centerY = 150;
    const scale = 49;
    const circle = range(0, 2 * Math.PI, 100).map((value) => [
      Math.cos(value),
      Math.sin(value),
    ]);
    stages.forEach((stage, index) => {
      const centerX = centers[index];
      const toScreen = ([x, y]) => [centerX + scale * x, centerY - scale * y];
      svg.append(svgEl("line", {
        x1: centerX - 78, x2: centerX + 78, y1: centerY, y2: centerY,
        class: "grid-line",
      }));
      svg.append(svgEl("line", {
        x1: centerX, x2: centerX, y1: centerY - 92, y2: centerY + 92,
        class: "grid-line",
      }));
      svg.append(svgEl("path", {
        d: `${linePath(circle.map((point) => toScreen(stage.transform(point))))} Z`,
        fill: "rgba(18,91,154,.1)",
        stroke: "#125b9a",
        "stroke-width": 2.4,
      }));
      [[1, 0], [0, 1]].forEach((basis) => {
        const endpoint = toScreen(stage.transform(basis));
        svg.append(svgEl("line", {
          x1: centerX,
          y1: centerY,
          x2: endpoint[0],
          y2: endpoint[1],
          stroke: "#76518e",
          "stroke-width": 2,
          "stroke-dasharray": "5 4",
        }));
      });
      const vectorEnd = toScreen(stage.vector);
      svg.append(svgEl("line", {
        x1: centerX,
        y1: centerY,
        x2: vectorEnd[0],
        y2: vectorEnd[1],
        stroke: "#b77b09",
        "stroke-width": 4,
        "stroke-linecap": "round",
      }));
      svg.append(svgEl("circle", {
        cx: vectorEnd[0], cy: vectorEnd[1], r: 5, fill: "#b77b09",
      }));
      svg.append(svgEl("text", {
        x: centerX, y: 270, "text-anchor": "middle", fill: "#17202a",
      }, stage.label));
    });
    [
      { x: 195, label: "Vᵀ", note: "orthogonal" },
      { x: 405, label: "Σ", note: "scale" },
      { x: 620, label: "U", note: "orthogonal" },
    ].forEach(({ x, label, note }) => {
      svg.append(svgEl("line", {
        x1: x - 25, x2: x + 25, y1: 150, y2: 150,
        stroke: "#8796a3", "stroke-width": 1.8,
      }));
      svg.append(svgEl("path", {
        d: `M${x + 25},150 l-8,-5 l0,10 Z`,
        fill: "#8796a3",
      }));
      svg.append(svgEl("text", {
        x, y: 126, "text-anchor": "middle", fill: "#17202a",
      }, label));
      svg.append(svgEl("text", {
        x, y: 185, "text-anchor": "middle",
      }, note));
    });
    plot.append(svg);
  }

  angleInput.addEventListener("input", render);
  secondInput.addEventListener("input", render);
  reset.addEventListener("click", () => {
    angleInput.value = 35;
    secondInput.value = 0.65;
    render();
  });
  render();
  return card;
}

export function dualSupport(type, vector) {
  const c = vector.map(x=>Math.abs(x)<1e-15?0:x);
  if(c.every(x=>x===0)) return {point:[0,0],support:0,dual:type==='l1'?'ℓ∞':type==='l2'?'ℓ₂':'ℓ₁',tie:'Every point of the ball is a maximizer.'};
  if (type === "l1") {
    const point =
      Math.abs(c[0]) >= Math.abs(c[1])
        ? [Math.sign(c[0]) || 1, 0]
        : [0, Math.sign(c[1]) || 1];
    return {
      point,
      support: Math.max(Math.abs(c[0]), Math.abs(c[1])),
      dual: "ℓ∞",
      tie: Math.abs(Math.abs(c[0])-Math.abs(c[1]))<1e-14 ? "An entire edge maximizes the objective; one endpoint is shown." : "",
    };
  }
  if (type === "l2") {
    const length = Math.hypot(...c);
    return {
      point: c.map((value) => value / length),
      support: length,
      dual: "ℓ₂",
    };
  }
  return {
    point: c.map((value) => Math.sign(value) || 1),
    support: Math.abs(c[0]) + Math.abs(c[1]),
    dual: "ℓ₁",
    tie: c.some(x=>x===0) ? "An entire edge maximizes the objective; one endpoint is shown." : "",
  };
}

function normWidget() {
  const { card, body, reset } = createCard(
    "Dual norms as supporting geometry",
    "Rotate a linear objective and watch the maximizing point move around three unit balls.",
  );
  body.innerHTML = `
    <div class="widget-grid">
      <div class="plot-panel" data-norm-plot></div>
      <div class="widget-controls">
        <div class="control-row"><label for="norm-ball">Constraint ball</label><select id="norm-ball"><option value="l1">ℓ₁ ball</option><option value="l2" selected>ℓ₂ ball</option><option value="linf">ℓ∞ ball</option></select></div>
        <div class="control-row"><label for="norm-angle">Objective angle</label><input id="norm-angle" type="range" min="0" max="360" step="1" value="28"><output data-norm-angle></output></div>
        <div class="stat-grid">
          <div class="stat"><span>Dual norm</span><strong data-dual></strong></div>
          <div class="stat"><span>Support value</span><strong data-support></strong></div>
          <div class="stat"><span>Maximizer x*</span><strong data-maximizer></strong></div>
          <div class="stat"><span>Nonzero coordinates</span><strong data-sparsity></strong></div>
        </div>
        <div class="readout" data-norm-status></div>
      </div>
    </div>
  `;
  const plot = body.querySelector("[data-norm-plot]");
  const ballSelect = body.querySelector("#norm-ball");
  const angleInput = body.querySelector("#norm-angle");

  function render() {
    const theta = (Number(angleInput.value) * Math.PI) / 180;
    const c = [Math.cos(theta), Math.sin(theta)];
    const type = ballSelect.value;
    const { point, support, dual, tie } = dualSupport(type, c);
    body.querySelector("[data-norm-angle]").textContent = `${angleInput.value}°`;
    body.querySelector("[data-dual]").textContent = dual;
    body.querySelector("[data-support]").textContent = format(support, 4);
    body.querySelector("[data-maximizer]").textContent = `(${format(point[0], 2)}, ${format(point[1], 2)})`;
    const nonzero = point.filter((value) => Math.abs(value) > 1e-8).length;
    body.querySelector("[data-sparsity]").textContent = `${nonzero} of 2`;
    body.querySelector("[data-norm-status]").innerHTML =
      tie ? `<strong>Nonunique maximum:</strong> ${tie}` : type === "l1"
        ? "<strong>Corner solution:</strong> a generic linear objective touches the ℓ₁ ball at a sparse axis-aligned corner."
        : `<strong>Hölder in action:</strong> max cᵀx over this unit ball equals the ${dual} norm of c.`;

    clear(plot);
    const svg = createSvg(
      "Unit norm balls and a supporting linear objective",
      "The l1 diamond, l2 circle, and l-infinity square are overlaid. A support line touches the selected ball at its maximizing point.",
    );
    const sx = scaleLinear(-1.45, 1.45, 175, 445);
    const sy = scaleLinear(-1.45, 1.45, 300, 30);
    svg.append(svgEl("line", { x1: sx(-1.4), x2: sx(1.4), y1: sy(0), y2: sy(0), class: "axis" }));
    svg.append(svgEl("line", { x1: sx(0), x2: sx(0), y1: sy(-1.4), y2: sy(1.4), class: "axis" }));
    const balls = [
      { type: "linf", points: [[-1, -1], [1, -1], [1, 1], [-1, 1]], color: "#5f6872" },
      { type: "l1", points: [[0, -1], [1, 0], [0, 1], [-1, 0]], color: "#76518e" },
      { type: "l2", points: range(0, 2 * Math.PI, 100).map((angle) => [Math.cos(angle), Math.sin(angle)]), color: "#125b9a" },
    ];
    balls.forEach((ball) => {
      const points = ball.points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");
      svg.append(svgEl("polygon", {
        points,
        fill: ball.type === type ? `${ball.color}20` : "none",
        stroke: ball.color,
        "stroke-width": ball.type === type ? 3.5 : 1.6,
        opacity: ball.type === type ? 1 : 0.48,
      }));
    });
    const direction = [-c[1], c[0]];
    const extent = 1.5;
    const lineA = [point[0] - extent * direction[0], point[1] - extent * direction[1]];
    const lineB = [point[0] + extent * direction[0], point[1] + extent * direction[1]];
    svg.append(svgEl("line", {
      x1: sx(lineA[0]), y1: sy(lineA[1]), x2: sx(lineB[0]), y2: sy(lineB[1]),
      stroke: "#b77b09", "stroke-width": 2.5, "stroke-dasharray": "7 5",
    }));
    svg.append(svgEl("line", {
      x1: sx(0), y1: sy(0), x2: sx(c[0] * 0.8), y2: sy(c[1] * 0.8),
      stroke: "#b77b09", "stroke-width": 3,
    }));
    svg.append(svgEl("circle", { cx: sx(point[0]), cy: sy(point[1]), r: 7, fill: "#b77b09", class: "point" }));
    plot.append(svg);
  }

  angleInput.addEventListener("input", render);
  ballSelect.addEventListener("change", render);
  reset.addEventListener("click", () => {
    angleInput.value = 28;
    ballSelect.value = "l2";
    render();
  });
  render();
  return card;
}

export function softThreshold(y, lambda) {
  return Math.sign(y) * Math.max(Math.abs(y) - lambda / 2, 0);
}

function convexityWidget() {
  const instance=JSON.parse(document.getElementById('lecture-components').textContent).instances.find(i=>i.component==='convexity-chord'&&i.selection==='selected');
  if(!instance)throw new Error('Missing selected convexity configuration');
  const settings=instance.settings;
  if(settings.preset!=='quadratic'||settings.presets.length!==1)throw new Error('Lecture 1 implements only the selected quadratic');
  const coefficients=settings.quadraticCoefficients || [1,0,0];
  const { card, body, reset } = createCard(
    "Chord and tangent tests for convexity",
    "Move the mixing weight: compare A, average then evaluate, with B, evaluate then average. Compare the labeled points and their vertical gap.",
  );
  body.innerHTML = `
    <div class="tab-list" role="tablist" aria-label="Convexity visualization">
      <button class="tab-button" role="tab" aria-selected="true" aria-controls="convex-chord-panel" id="convex-chord-tab">Chord & tangent</button>
      <button class="tab-button" role="tab" aria-selected="false" aria-controls="convex-subgradient-panel" id="convex-subgradient-tab" tabindex="-1">Subgradient</button>
      <button class="tab-button" role="tab" aria-selected="false" aria-controls="convex-lasso-panel" id="convex-lasso-tab" tabindex="-1">LASSO</button>
    </div>
    <div class="tab-panel" role="tabpanel" id="convex-chord-panel" aria-labelledby="convex-chord-tab">
      <div class="widget-grid">
        <div class="plot-panel" data-convex-plot></div>
        <div class="widget-controls">
          <div class="control-row"><label for="convex-x">Tangent/chord point x</label><input id="convex-x" type="range" min="-2" max="1.8" step="0.05" value="-1"><output data-convex-x></output></div>
          <div class="control-row"><label for="convex-y">Second chord point y</label><input id="convex-y" type="range" min="-1.8" max="2" step="0.05" value="1.5"><output data-convex-y></output></div>
          <div class="readout success" data-convex-status></div>
        </div>
      </div>
    </div>
    <div class="tab-panel" role="tabpanel" id="convex-subgradient-panel" aria-labelledby="convex-subgradient-tab" hidden>
      <div class="widget-grid">
        <div class="plot-panel" data-subgradient-plot></div>
        <div class="widget-controls">
          <div class="control-row"><label for="subgradient-x">Evaluation point x</label><input id="subgradient-x" type="range" min="-1.5" max="1.5" step="0.05" value="0"><output data-subgradient-x></output></div>
          <div class="readout" data-subgradient-status></div>
        </div>
      </div>
    </div>
    <div class="tab-panel" role="tabpanel" id="convex-lasso-panel" aria-labelledby="convex-lasso-tab" hidden>
      <div class="widget-grid">
        <div class="plot-panel" data-lasso-plot></div>
        <div class="widget-controls">
          <div class="control-row"><label for="lasso-y">Observed y</label><input id="lasso-y" type="range" min="-3" max="3" step="0.05" value="1.5"><output data-lasso-y></output></div>
          <div class="control-row"><label for="lasso-lambda">Penalty λ</label><input id="lasso-lambda" type="range" min="0.05" max="5" step="0.05" value="1"><output data-lasso-lambda></output></div>
          <div class="stat-grid">
            <div class="stat"><span>Threshold λ/2</span><strong data-lasso-threshold></strong></div>
            <div class="stat"><span>Minimizer β̂</span><strong data-lasso-beta></strong></div>
          </div>
          <div class="readout" data-lasso-status></div>
        </div>
      </div>
    </div>
  `;
  card.id=instance.instanceId;card.dataset.component=instance.component;card.dataset.sourceLabel=instance.source.label;card.dataset.fallbackLabel=instance.source.fallbackLabel;
  const controls=body.querySelector('#convex-chord-panel .widget-controls');
  const weightRow=document.createElement('div');weightRow.className='control-row';
  weightRow.innerHTML='<label for="convex-weight">Mixing weight t (on y)</label><input id="convex-weight" type="range"><output data-convex-weight></output>';
  const tangentRow=document.createElement('label');tangentRow.className='tangent-toggle';
  tangentRow.innerHTML='<input type="checkbox" id="convex-tangent"> Show tangent at x';tangentRow.hidden=!settings.tangent.available;
  controls.querySelector('[data-convex-status]').before(weightRow,tangentRow);
  for(const [key,id] of [['x','convex-x'],['y','convex-y'],['weight','convex-weight']]){
    const input=body.querySelector(`#${id}`),spec=settings[key];
    for(const attr of ['min','max','step'])input.setAttribute(attr,spec[attr] ?? 'any');input.value=spec.value;
  }
  const weight=body.querySelector('#convex-weight'),tangent=body.querySelector('#convex-tangent');
  tangent.checked=settings.tangent.initial;
  setupTabs(body);
  const convexPlot = body.querySelector("[data-convex-plot]");
  const convexX = body.querySelector("#convex-x");
  const convexY = body.querySelector("#convex-y");
  const subgradientPlot = body.querySelector("[data-subgradient-plot]");
  const subgradientX = body.querySelector("#subgradient-x");
  const lassoPlot = body.querySelector("[data-lasso-plot]");
  const lassoY = body.querySelector("#lasso-y");
  const lassoLambda = body.querySelector("#lasso-lambda");
  const subPanel=body.querySelector("#convex-subgradient-panel"),lassoPanel=body.querySelector("#convex-lasso-panel");

  const f = x => quadraticValue(x,coefficients);
  const derivative = x => 2*coefficients[0]*x+coefficients[1];

  function renderConvex() {
    const x = Number(convexX.value);
    const y = Number(convexY.value);
    body.querySelector("[data-convex-x]").textContent = format(x, 2);
    body.querySelector("[data-convex-y]").textContent = format(y, 2);
    const t=Number(weight.value),values=chordValues(x,y,t,coefficients);
    const {z,A,B,gap}=values;card.dataset.chordValues=JSON.stringify(values);
    body.querySelector('[data-convex-weight]').textContent=format(t,2);
    const tangentValue = f(x) + derivative(x) * (y - x);
    body.querySelector('[data-convex-status]').innerHTML =
      `<strong>z = (1 − t)x + ty = ${format(z,5)}</strong><br>`+
      `<span class="quantity-a"><strong>A ●: average then evaluate</strong><br>f(z) = ${format(A,5)}</span><br>`+
      `<span class="quantity-b"><strong>B ◆: evaluate then average</strong><br>(1 − t)f(x) + tf(y) = ${format(B,5)}</span><br>`+
      `<strong>Gap B − A = ${format(gap,5)} ≥ 0</strong>`+
      (tangent.checked?`<br>First-order gap at y: ${format(f(y)-tangentValue,5)} ≥ 0.`:'');
    clear(convexPlot);
    const svg = createSvg(
      "Convex quadratic with chord and tangent",
      "A convex function lies below the chord joining two selected points and above the tangent at the first point.",
    );
    const sx = scaleLinear(-2.2, 2.2, 52, 590);
    const sy = scaleLinear(0, 4.3, 300, 25);
    drawAxes(svg, {
      xTicks: [-2, -1, 0, 1, 2],
      yTicks: [0, 1, 2, 3, 4],
      xScale: sx,
      yScale: sy,
      left: 52,
      right: 590,
      top: 25,
      bottom: 300,
      xLabel: "input",
      yLabel: "f(x)",
    });
    svg.append(svgEl("path", {
      d: linePath(range(-2.2, 2.2, 140).map((value) => [sx(value), sy(f(value))])),
      class: "curve",
      stroke: "#125b9a",
    }));
    svg.append(svgEl("line", {
      x1: sx(x), y1: sy(f(x)), x2: sx(y), y2: sy(f(y)),
      stroke: "#b77b09", "stroke-width": 2.5,
    }));
    const tangentA = -2.2;
    const tangentB = 2.2;
    if(tangent.checked)svg.append(svgEl("line", {
      x1: sx(tangentA),
      y1: sy(f(x) + derivative(x) * (tangentA - x)),
      x2: sx(tangentB),
      y2: sy(f(x) + derivative(x) * (tangentB - x)),
      stroke: "#76518e",
      "stroke-width": 2,
      "stroke-dasharray": "6 5",
    }));
    [[x, f(x)], [y, f(y)]].forEach(([px, py]) => {
      svg.append(svgEl("circle", { cx: sx(px), cy: sy(py), r: 6, fill: "#b77b09", class: "point" }));
    });
    svg.append(svgEl('line',{x1:sx(z),x2:sx(z),y1:sy(A),y2:sy(B),stroke:'#536270','stroke-width':2}));
    svg.append(svgEl('circle',{cx:sx(z),cy:sy(A),r:6,fill:'#0b626b',stroke:'white','stroke-width':1.5}));
    svg.append(svgEl('path',{d:`M${sx(z)} ${sy(B)-7}l7 7-7 7-7-7Z`,fill:'#703b72',stroke:'white','stroke-width':1.5}));
    svg.append(svgEl('text',{x:sx(z)+11,y:sy(A)+21,fill:'#0b626b','font-size':20,'font-weight':700},'A'));
    svg.append(svgEl('text',{x:sx(z)+11,y:sy(B)-10,fill:'#703b72','font-size':20,'font-weight':700},'B'));
    convexPlot.append(svg);
  }

  function renderSubgradient() {
    const x = Number(subgradientX.value);
    subPanel.querySelector("[data-subgradient-x]").textContent = format(x, 2);
    const interval = Math.abs(x) < 0.025 ? "[-1,1]" : x > 0 ? "{1}" : "{−1}";
    subPanel.querySelector("[data-subgradient-status]").innerHTML =
      `<strong>∂|x| = ${interval}.</strong> ` +
      (Math.abs(x) < 0.025
        ? "Every slope between −1 and 1 supports the graph at the kink."
        : "Away from zero the subgradient is the ordinary derivative.");
    clear(subgradientPlot);
    const svg = createSvg(
      "Absolute value and its supporting lines",
      "The graph of absolute value has a full interval of supporting slopes at zero.",
    );
    const sx = scaleLinear(-2, 2, 52, 590);
    const sy = scaleLinear(-0.5, 2.2, 300, 25);
    drawAxes(svg, {
      xTicks: [-2, -1, 0, 1, 2],
      yTicks: [0, 1, 2],
      xScale: sx,
      yScale: sy,
      left: 52,
      right: 590,
      top: 25,
      bottom: 300,
      xLabel: "x",
      yLabel: "|x|",
    });
    svg.append(svgEl("path", {
      d: linePath(range(-2, 2, 120).map((value) => [sx(value), sy(Math.abs(value))])),
      class: "curve",
      stroke: "#125b9a",
    }));
    const slopes = Math.abs(x) < 0.025 ? [-1, -0.5, 0, 0.5, 1] : [Math.sign(x)];
    slopes.forEach((slope, index) => {
      svg.append(svgEl("line", {
        x1: sx(-2),
        y1: sy(Math.abs(x) + slope * (-2 - x)),
        x2: sx(2),
        y2: sy(Math.abs(x) + slope * (2 - x)),
        stroke: "#b77b09",
        "stroke-width": index === 2 ? 2.3 : 1.4,
        opacity: 0.65,
      }));
    });
    svg.append(svgEl("circle", { cx: sx(x), cy: sy(Math.abs(x)), r: 7, fill: "#76518e", class: "point" }));
    subgradientPlot.append(svg);
  }

  function renderLasso() {
    const y = Number(lassoY.value);
    const lambda = Number(lassoLambda.value);
    const beta = softThreshold(y, lambda);
    lassoPanel.querySelector("[data-lasso-y]").textContent = format(y, 2);
    lassoPanel.querySelector("[data-lasso-lambda]").textContent = format(lambda, 2);
    lassoPanel.querySelector("[data-lasso-threshold]").textContent = format(lambda / 2, 2);
    lassoPanel.querySelector("[data-lasso-beta]").textContent = format(beta, 3);
    const status = lassoPanel.querySelector("[data-lasso-status]");
    if (beta === 0) {
      status.className = "readout success";
      status.innerHTML = "<strong>Exactly zero:</strong> |y|≤λ/2, so the left derivative at zero is nonpositive and the right derivative is nonnegative.";
    } else {
      status.className = "readout";
      status.innerHTML = `<strong>Shrinkage:</strong> β̂ moves ${format(lambda / 2, 2)} toward zero from the unpenalized estimate y.`;
    }
    clear(lassoPlot);
    const svg = createSvg(
      "One-dimensional LASSO objective",
      "The squared-error plus absolute-value penalty is plotted with its soft-thresholded minimizer.",
    );
    const values = range(-4, 4, 180);
    const objective = (value) => (y - value) ** 2 + lambda * Math.abs(value);
    const maxY = Math.min(25, Math.max(...values.map(objective)));
    const sx = scaleLinear(-4, 4, 52, 590);
    const sy = scaleLinear(0, maxY, 300, 25);
    drawAxes(svg, {
      xTicks: [-4, -2, 0, 2, 4],
      yTicks: range(0, maxY, 5),
      xScale: sx,
      yScale: sy,
      left: 52,
      right: 590,
      top: 25,
      bottom: 300,
      xFormat: String,
      yFormat: (value) => format(value, 1),
      xLabel: "β",
      yLabel: "objective",
    });
    svg.append(svgEl("path", {
      d: linePath(values.map((value) => [sx(value), sy(objective(value))])),
      class: "curve",
      stroke: "#125b9a",
    }));
    svg.append(svgEl("circle", { cx: sx(beta), cy: sy(objective(beta)), r: 7, fill: "#1c713d", class: "point" }));
    svg.append(svgEl("line", {
      x1: sx(0), x2: sx(0), y1: 25, y2: 300,
      stroke: "#aab5bd", "stroke-dasharray": "5 4",
    }));
    lassoPlot.append(svg);
  }

  [convexX, convexY, weight].forEach((input) => input.addEventListener("input", renderConvex));
  subgradientX.addEventListener("input", renderSubgradient);
  [lassoY, lassoLambda].forEach((input) => input.addEventListener("input", renderLasso));
  tangent.addEventListener('change',renderConvex);
  reset.addEventListener('click',()=>{convexX.value=settings.x.value;convexY.value=settings.y.value;weight.value=settings.weight.value;tangent.checked=settings.tangent.initial;renderConvex();});
  body.querySelector('.tab-list').remove();
  body.querySelectorAll('[role="tabpanel"]').forEach(panel=>{panel.hidden=false;panel.removeAttribute('role');panel.removeAttribute('aria-labelledby');});
  const subCard=createCard('Supporting slopes of absolute value','Low priority — not examined. Inspect the kink or move away from zero.');
  subCard.body.append(subPanel);subCard.card.dataset.widget='subgradient';
  document.getElementById('subgradients-and-nonsmooth-optimality').nextElementSibling.querySelector('.priority-details-body').append(subCard.card);
  subCard.reset.addEventListener('click',()=>{subgradientX.value=0;renderSubgradient();});
  const lassoCard=createCard('Soft thresholding by one-sided calculus','Mid priority — Exercise 9. Compare the minimizer with the threshold λ/2.');
  lassoCard.body.append(lassoPanel);lassoCard.card.dataset.widget='soft-threshold';
  document.getElementById('exercise-9').after(lassoCard.card);
  lassoCard.reset.addEventListener('click',()=>{lassoY.value=1.5;lassoLambda.value=1;renderLasso();});
  renderConvex();renderSubgradient();renderLasso();
  return card;
}

const widgets = [
  ['sets-topology-and-compactness',topologyWidget],
  ['gaussian-tails-and-mills-ratio',gaussianTailWidget],
  ['combinatorics-stirlings-formula-and-entropy',combinatoricsWidget],
  ['singular-value-decomposition-and-matrix-norms',svdGeometryWidget],
  ['vector-norms-inequalities-and-duality',normWidget],
  ['convexity-and-optimality',convexityWidget],
];

export function mountLectureWidgets() {
  widgets.forEach(([section,create])=>{
    const widget=create();widget.dataset.widget=section;
    let block=document.getElementById(section).nextElementSibling;
    while(block && !block.classList.contains('priority-block'))block=block.nextElementSibling;
    if(!block.classList.contains('priority-block'))throw new Error(`Missing source tier for ${section}`);
    const placement=widget.dataset.fallbackLabel && document.getElementById(widget.dataset.fallbackLabel)?.closest('p');
    if(placement)placement.after(widget);else block.append(widget);
    widget.dataset.componentPriority=block.dataset.priority;
  });
  // Keyboard/numeric parity for the retained scalar controls. Invalid or
  // incomplete entry retains the plot until a valid value is supplied.
  document.querySelectorAll('.interactive-card input[type="range"]').forEach(slider=>{
    const numeric=document.createElement('input');numeric.type='number';numeric.id=`${slider.id}-number`;
    for(const attribute of ['min','max','step'])numeric.setAttribute(attribute,slider.getAttribute(attribute));
    numeric.value=slider.value;numeric.className='range-number';
    numeric.setAttribute('aria-label',`${document.querySelector(`label[for="${slider.id}"]`).textContent}, numeric`);
    slider.after(numeric);
    slider.addEventListener('input',()=>{numeric.value=slider.value;numeric.setCustomValidity('');numeric.removeAttribute('aria-invalid');});
    numeric.addEventListener('input',()=>{
      if(numeric.value==='' || !numeric.checkValidity()) {numeric.setAttribute('aria-invalid','true');numeric.reportValidity();return;}
      numeric.removeAttribute('aria-invalid');slider.value=numeric.value;slider.dispatchEvent(new Event('input'));
    });
    slider.closest('.interactive-card').querySelector('.reset-button').addEventListener('click',()=>{numeric.value=slider.value;numeric.removeAttribute('aria-invalid');});
  });
}

function appendRelated(details, links) {
  const container = details?.querySelector(".priority-details-body");
  if (!container || container.querySelector(".related-links")) return;
  const nav = document.createElement("nav");
  nav.className = "related-links readout";
  nav.setAttribute("aria-label", "Related core material");
  nav.innerHTML = `<strong>Related core material:</strong> ${links
    .map(([label, href]) => `<a href="#${href}">${label}</a>`)
    .join(" · ")}`;
  container.append(nav);
}

export function addLectureCrossLinks() {
  const lowDetails = [...document.querySelectorAll("details.lowpriority")];
  const find = (text) =>
    lowDetails.find((details) =>
      details.querySelector("summary")?.textContent.includes(text),
    );
  appendRelated(find("Function spaces"), [
    ["PCA and low-rank projection", "linear-algebra-for-statistics"],
    ["Gaussian calculations", "gaussian-calculations"],
  ]);
  appendRelated(find("Proof sketches"), [
    ["Gaussian tails", "gaussian-calculations"],
    ["Spectral methods and SVD", "linear-algebra-for-statistics"],
  ]);
  appendRelated(find("Subgradients"), [
    ["Smooth convex optimality", "convexity-and-optimality"],
  ]);
}
