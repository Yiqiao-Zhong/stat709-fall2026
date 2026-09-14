# Lecture 3 static figures, version 1

**Student-site copy.** These assets came from the sibling `STAT709-html-conversion` preparation repository. Generator commands and canonical-source paths below refer to that repository. Historical source-stage statuses describe the original asset preparation; Lecture 3 now displays the web derivatives.


Prepared September 13, 2026 for source review and a later HTML conversion. These are original course illustrations generated from formulas in the canonical LaTeX (`STAT709-html-conversion/source_lectures/lect-3.tex`), not downloaded third-party artwork. No public license is assigned to the course material; see [RIGHTS](../../../../README.md#third-party-notices). No third-party figure license or attribution is being removed.

Each figure has an SVG for future web use and a PNG for PDF previews/fallbacks. SVGs include a title and description, have no scripts, and use local text/paths. [figures.json](figures.json) records source labels, alternative text, status, and SHA-256 hashes. The author PDF includes the six PNGs inside instructor-only plans; the student PDF does not. **HTML status: not mounted.**

| Files (SVG and PNG) | Canonical content | Reading purpose |
|---|---|---|
| `measure-family` | `lec03-measure-figure-caption` | Compare the same h(x)=x under endpoint masses, length, and a mixed measure; integrals are 1/2, 1/2, 1/4. Discrete and Lebesgue measures are examples of general measures; mixtures are not an exhaustive classification. |
| `mct` | `lec03-mct-figure-caption` | Curves u_n(x)=(1−2^(−n))x increase to x on [0,1]; exact integrals increase to 1/2. |
| `dct` | `lec03-dct-figure-caption` | Curves x^n/(1+x) share g=1 on [0,1]; the pointwise limit is zero except at x=1, where it is 1/2. The integral tends to zero. |
| `rn-reweighting` | `lec03-rn-reweighting`, `lec03-rn-continuous-caption` | Finite reference masses (1,2,3) become (2,1,6) under ratios (2,1/2,2); continuous density 2x assigns mass 3/4 to [1/2,1]. |
| `rn-mixture` | `lec03-rn-mixture-caption` | Reference, multiplier, and target, with atomic mass and continuous density in separate rows. The chosen target is half a point mass at zero plus half uniform mass. The reference counts both endpoints; the target has no atom at one. |
| `rn-reference` | `lec03-rn-circle-caption` | The circle law has no density relative to plane area but density 1/(2π) relative to arc length. A quarter-circle arc has probability 1/4. |

The generator (`STAT709-html-conversion/scripts/lecture3-figures.py`) uses Matplotlib/Numpy. It was executed with Matplotlib 3.3.2 and Numpy 1.24.4. Regenerate from the repository root with an available Python that contains these packages:

```sh
python scripts/lecture3-figures.py
```

It writes only this figure bundle and runs deterministic checks on the plotted MCT/DCT/RN formulas. Finite curves illustrate the theorems; they are not proofs. Fixed axes, line styles and text supplement color. Arrow heights in atomic panels represent mass, not a density spike. The plotted circle's line width does not give the mathematical circle positive area.

For proof context, the source links [Durrett's author draft](https://sites.math.duke.edu/~rtd/PTE/PTE5_011119.pdf), including Theorems 1.5.7–1.5.8 and A.4.8. This is a reference, not a source of copied artwork. Internet figure searches did not supply an adopted asset; the formulas and conventions needed here are represented by these original graphics.

Future HTML work must place figures at the source-linked passages, supply full visible captions and alt text, adapt panels to small screens without shrinking labels, and retain SVG/PNG print/no-script fallbacks. No sliders, animation, browser integration, or accessibility certification is included in this source-stage delivery.
