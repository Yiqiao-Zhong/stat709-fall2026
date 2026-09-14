const SVG_NS = "http://www.w3.org/2000/svg";

export function svgEl(name, attributes = {}, text = "") {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, String(value));
  }
  if (text) node.textContent = text;
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function format(value, digits = 3) {
  if (!Number.isFinite(value)) return "∞";
  const absolute = Math.abs(value);
  if ((absolute > 0 && absolute < 0.001) || absolute >= 10000) {
    return value.toExponential(2);
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function range(start, end, count) {
  return Array.from(
    { length: count },
    (_, index) => start + ((end - start) * index) / Math.max(1, count - 1),
  );
}

export function scaleLinear(domainMin, domainMax, rangeMin, rangeMax) {
  return (value) =>
    rangeMin +
    ((value - domainMin) / (domainMax - domainMin)) * (rangeMax - rangeMin);
}

export function linePath(points) {
  return points
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
    .map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}

export function createSvg(label, description, viewBox = "0 0 620 340") {
  const svg = svgEl("svg", {
    class: "chart",
    viewBox,
    role: "img",
    "aria-label": label,
  });
  svg.append(svgEl("title", {}, label));
  svg.append(svgEl("desc", {}, description));
  return svg;
}

export function drawAxes(
  svg,
  {
    xTicks = [],
    yTicks = [],
    xScale,
    yScale,
    left = 54,
    right = 600,
    top = 20,
    bottom = 300,
    xFormat = String,
    yFormat = String,
    xLabel = "",
    yLabel = "",
  },
) {
  for (const tick of yTicks) {
    const y = yScale(tick);
    svg.append(svgEl("line", { x1: left, x2: right, y1: y, y2: y, class: "grid-line" }));
    svg.append(svgEl("text", { x: left - 8, y: y + 4, "text-anchor": "end" }, yFormat(tick)));
  }
  for (const tick of xTicks) {
    const x = xScale(tick);
    svg.append(svgEl("line", { x1: x, x2: x, y1: top, y2: bottom, class: "grid-line" }));
    svg.append(svgEl("text", { x, y: bottom + 18, "text-anchor": "middle" }, xFormat(tick)));
  }
  svg.append(svgEl("line", { x1: left, x2: right, y1: bottom, y2: bottom, class: "axis" }));
  svg.append(svgEl("line", { x1: left, x2: left, y1: top, y2: bottom, class: "axis" }));
  if (xLabel) {
    svg.append(svgEl("text", { x: (left + right) / 2, y: 334, "text-anchor": "middle" }, xLabel));
  }
  if (yLabel) {
    svg.append(
      svgEl(
        "text",
        {
          x: 14,
          y: (top + bottom) / 2,
          transform: `rotate(-90 14 ${(top + bottom) / 2})`,
          "text-anchor": "middle",
        },
        yLabel,
      ),
    );
  }
}

export function createCard(title, subtitle) {
  const card = document.createElement("section");
  card.className = "interactive-card";
  card.innerHTML = `
    <div class="interactive-header">
      <div>
        <div class="interactive-eyebrow">Interactive figure</div>
        <h3>${title}</h3>
        <p class="control-note">${subtitle}</p>
      </div>
      <button class="reset-button" type="button">Reset</button>
    </div>
    <div class="interactive-body"></div>
  `;
  return {
    card,
    body: card.querySelector(".interactive-body"),
    reset: card.querySelector(".reset-button"),
  };
}

export function setupTabs(root) {
  const buttons = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const activate = (button, focus = false) => {
    buttons.forEach((item) => {
      const selected = item === button;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.id !== button.getAttribute("aria-controls");
    });
    if (focus) button.focus();
  };
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => activate(button));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowLeft") next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = buttons.length - 1;
      activate(buttons[next], true);
    });
  });
  return { activate };
}

export function insertAfterSection(sectionId, node) {
  const heading = document.getElementById(sectionId);
  if (!heading) return false;
  const level = Number(heading.tagName.slice(1));
  let cursor = heading.nextElementSibling;
  while (
    cursor &&
    !(
      (/^H[1-6]$/.test(cursor.tagName) &&
        Number(cursor.tagName.slice(1)) <= level) ||
      cursor.classList.contains("collapsible")
    )
  ) {
    cursor = cursor.nextElementSibling;
  }
  heading.parentElement.insertBefore(node, cursor);
  return true;
}

export function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function standardNormal(random) {
  const u = Math.max(Number.EPSILON, random());
  const v = Math.max(Number.EPSILON, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function erf(value) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const approximation =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) *
      Math.exp(-x * x);
  return sign * approximation;
}

export function normalTail(value) {
  return 0.5 * (1 - erf(value / Math.SQRT2));
}

export function logGamma(value) {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ];
  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  }
  const z = value - 1;
  let x = 0.9999999999998099;
  coefficients.forEach((coefficient, index) => {
    x += coefficient / (z + index + 1);
  });
  const t = z + coefficients.length - 0.5;
  return (
    0.5 * Math.log(2 * Math.PI) +
    (z + 0.5) * Math.log(t) -
    t +
    Math.log(x)
  );
}

export function logChoose(n, k) {
  if (k < 0 || k > n) return -Infinity;
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
}

export function binaryEntropy(p) {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log(p) - (1 - p) * Math.log(1 - p);
}
