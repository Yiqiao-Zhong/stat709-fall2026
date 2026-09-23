# Lecture 3 intuition figures, version 1

**Student-site copy.** Generator and canonical-source paths below refer to the sibling `STAT709-html-conversion` preparation repository. Rights are described in the [hosting notice](../../../../README.md#third-party-notices).


Original course diagrams authored for the September 22, 2026 revision. No external
artwork was copied. They follow the course palette and use labeled line styles
and captions in addition to color. The plotted examples are separate from the
signed-area exercise data. Existing six figures and their provenance are unchanged.

- `positive-negative`: sin(x), its positive part, and its reflected negative part.
- `truncation`: min(x+1,n) times the indicator of [0,n], n=1,2,3.
- `spike-envelope`: n times the indicator of (0,1/n), n=1,4,16, under g(x)=1/x
  for x>0 (g(0)=0), on fixed axes. The curve continues above the visible frame.

Canonical captions and arguments live in `source_lectures/lect-3.tex`.
PNGs appear in both PDFs; full SVGs and seven individually drawn SVG panels are
used in HTML, including print and offline reading. `figures.json` records all
asset hashes and placements. Regenerate with `scripts/lecture3-intuition-figures.py`
in an environment containing NumPy and Matplotlib. It also checks the actual
sampled mathematical models. The checks illustrate the formulas; proofs remain
in the source. No interactive component is introduced.

The generator uses DejaVu Sans and Matplotlib's DejaVu math font, with SVG glyphs
converted to outlines for consistent rendering. DejaVu font license:
https://dejavu-fonts.github.io/License.html . The artwork follows the repository's
course-material distribution policy.
