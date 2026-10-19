# Lecture 18 review illustrations

October 11, 2026. Original course drawings generated from explicit mathematical coordinates. No pixels or artwork were copied from the references. Existing course rights apply; no new public license is assigned.

Regenerate with `python3 scripts/figures-lectures14-20-review.py` from the repository root. PNG files are used in TeX and HTML; SVG companions retain vector output. Preserve the adjacent provenance record and this notice.

## Figures

- **radial-shrinkage**: A two-coordinate slice of the five-dimensional positive-part James–Stein rule: observations inside radius square root of 3 map to zero; outside observations move inward without reversing direction. Stein risk identity and positive-part rule; Wasserman Stein notes. This is an estimator map, not a pointwise loss comparison.
- **tweedie-mixture**: With prior mass one half at each of minus 2 and plus 2 and noise variance 1, the posterior mean is 2 tanh(2x). Score corrections can move observations away from zero toward either mode. Tweedie identity; exact Bayes calculation for a two-point prior, no copied plot.

## Mathematical references

- [Textbook / paper 1](https://stat.cmu.edu/~larry/=sml/stein.pdf)
- [Textbook / paper 2](https://pmc.ncbi.nlm.nih.gov/articles/PMC3325056/)

See [the section-by-section review](../../../../docs/LECTURES-14-20-REVIEW.md) for exact sections, assumptions, and verification.
