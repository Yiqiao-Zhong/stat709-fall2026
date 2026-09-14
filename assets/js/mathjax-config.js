window.MathJax = {
  startup: {
    pageReady() {
      return window.MathJax.startup.defaultPageReady().then(() => {
        document.documentElement.classList.add('math-ready');
      });
    }
  },
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true,
    packages: {"[+]": ["ams"]},
    macros: {
      R: "\\mathbb{R}",
      Q: "\\mathbb{Q}",
      N: "\\mathbb{N}",
      Z: "\\mathbb{Z}",
      C: "\\mathbb{C}",
      E: "\\mathbb{E}",
      PR: "\\mathbb{P}",
      F: "\\mathcal{F}",
      gB: "\\mathcal{B}",
      gG: "\\mathcal{G}",
      gH: "\\mathcal{H}",
      Unif: "\\operatorname{Unif}",
      tr: "\\operatorname{tr}",
      var: "\\operatorname{Var}",
      rank: "\\operatorname{rank}",
      op: "\\mathrm{op}",
      sign: "\\operatorname{sign}",
      diag: "\\operatorname{diag}",
      iid: "\\mathrm{i.i.d.}",
      argmin: "\\operatorname*{arg\\,min}",
      argmax: "\\operatorname*{arg\\,max}"
    }
  },
  chtml: {
    scale: 1.08,
    matchFontHeight: false
  },
  svg: {
    scale: 1.08,
    fontCache: 'local'
  },
  options: {
    enableMenu: false
  }
};
