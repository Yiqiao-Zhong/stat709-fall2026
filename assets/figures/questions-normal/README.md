# Normal-distribution supplement: original course figures

These SVGs are generated from the accepted PGFPlots sources in
`source_lectures/questions-and-extensions/demystifying-normal/figures/`.
They are original course drawings, with that credit retained in both captions.

- `binomial-standardization-{1,2,3}.svg`: the original axes for n = 8, 32, 128. Coordinates, bar heights, lattice spacing, normal curve, labels and plot bounds are unchanged.
- `heat-rescaling-{1,2}.svg`: the original spreading-density and rescaled-density axes. The formulas, times, colors, line styles, labels and legends are unchanged.

The scoped builder exports each axis with the TikZ dvisvgm driver and outlined
fonts. The HTML groups them into the same two figures and stacks their panels
on narrow screens. This changes presentation only; no simulation or new drawing
is substituted. Source hashes and panel descriptions are recorded in
the accompanying `provenance.json` (source and SVG SHA-256 hashes).
