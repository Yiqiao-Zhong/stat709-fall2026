# STAT 709 — Fall 2026 course website

This repository contains the finished student website for STAT 709 Mathematical Statistics at the University of Wisconsin–Madison.

## Available materials

- [Course home](index.html)
- [Syllabus: authoritative course policies](syllabus.html)
- [Report an issue](report-issue.html)
- [Preface and reading guide](preface.html)
- Lecture 1: [HTML](lect-1.html) · [Student PDF](lect-1.pdf)
- Lecture 2: [HTML](lect-2.html) · [Student PDF](lect-2.pdf)
- Lecture 3: [HTML](lect-3.html) · [Student PDF](lect-3.pdf)
- Lecture 4: [HTML](lect-4.html) · [Student PDF](lect-4.pdf)
- Lecture 5: [HTML](lect-5.html) · [Student PDF](lect-5.pdf)
- Lecture 6: [HTML](lect-6.html) · [Student PDF](lect-6.pdf)
- Lecture 7: [HTML](lect-7.html) · [Student PDF](lect-7.pdf)
- Lecture 8: [HTML](lect-8.html) · [Student PDF](lect-8.pdf)
- Lecture 9: [HTML](lect-9.html) · [Student PDF](lect-9.pdf)
- Lecture 10: [HTML](lect-10.html) · [Student PDF](lect-10.pdf)
- Lecture 11: [HTML](lect-11.html) · [Student PDF](lect-11.pdf)
- Lecture 12: [HTML](lect-12.html) · [Student PDF](lect-12.pdf)
- Lecture 13: [HTML](lect-13.html) · [Student PDF](lect-13.pdf)
- Lecture 14: [HTML](lect-14.html) · [Student PDF](lect-14.pdf)
- Lecture 15: [HTML](lect-15.html) · [Student PDF](lect-15.pdf)
- Lecture 16: [HTML](lect-16.html) · [Student PDF](lect-16.pdf)
- Lecture 17: [HTML](lect-17.html) · [Student PDF](lect-17.pdf)
- Lecture 18 (optional): [HTML](lect-18.html) · [Student PDF](lect-18.pdf)
- Lecture 19 (optional): [HTML](lect-19.html) · [Student PDF](lect-19.pdf)
- Lecture 20 (optional): [HTML](lect-20.html) · [Student PDF](lect-20.pdf)
- [Original lecture notes: Lectures 1–20 (ZIP)](resources/Lectures-STAT709.zip)
- [Homework 1 assignment](homework/HW1.pdf)
- [Homework 2 assignment](homework/HW2.pdf)
- [Homework 3 assignment](homework/HW3.pdf)
- [Homework 4 assignment](homework/HW4.pdf)
- [Homework 5 assignment](homework/HW5.pdf)
- [Homework 6 assignment](homework/HW6.pdf)

Homework solutions are not included. The homepage and seven part-overview pages organize Lectures 1–20. Part VI (Lectures 18–20) is optional and not examined; its student HTML and PDF notes are available. Part VII has no lecture entries yet.

The website syllabus is authoritative. The homepage links it alongside the preface, part checkpoints and current lecture downloads.

## Preview locally

From this folder, with Python 3 installed:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://127.0.0.1:8000/ in a browser. A local server lets the lecture JavaScript modules run correctly; simply double-clicking a lecture HTML file may not.

## Publish with GitHub Pages

1. Create a GitHub repository named `stat709-fall2026`.
2. Upload or commit and push this folder's contents to its `main` branch, preserving subfolders and the empty `.nojekyll` file.
3. In **Settings → Pages**, choose **Deploy from a branch**, **main**, and **/(root)**, then save.
4. Use the site address shown by GitHub and check the homepage, lecture links, and PDFs.

The local repository has a GitHub remote configured, but no publishing workflow is included. Copying files here does not publish them. No build tools, Node dependencies, Pandoc, or LaTeX installation are needed to host these files.

## Update the materials

“Publish lecture XX” means copying the approved website-related files here, committing the relevant changes in both preparation and hosting repositories, and pushing this hosting repository to GitHub. The preparation PLAN owns the full publication policy.

The sibling `STAT709-html-conversion` repository remains the preparation repository. Make content changes and regenerate student outputs there, then copy the approved HTML/PDF files and any changed runtime assets here. Keep their relative paths.

The course homepage is maintained separately from the lecture build in `STAT709-html-conversion/dist/index.html`. Keep this copy synchronized when updating it. Add each new lecture or homework assignment to `index.html` when you copy it. Preserve this publishing homepage when refreshing lectures.

This publishing copy offers student HTML and PDFs, plus the instructor-approved original lecture-note PDFs in `resources/Lectures-STAT709.zip`. Its lecture pages omit the LaTeX-source download link. Repeat that small navigation adjustment when adding or replacing a page with a new build; do not copy author PDFs, source `.tex` files, or standalone HTML containing embedded source downloads into this repository.

The copied student PDFs are unchanged. The selected CSS and application modules come from `dist/assets`. MathJax 3.2.2 uses its combined `tex-chtml.js` renderer, TeX autoload extensions, and CHTML fonts. Recheck dependencies if later pages use another renderer or enable additional MathJax features.

Every lecture and the preface now include a Comments section with a separate Disqus thread. Comments are configured with the course's Disqus shortname `stat709-fall2026-1`. On a published lecture or preface page, choose **Load comments** to read or join that page's public discussion. Local previews link to the published page. The single configuration lives in the preparation repository at `config/discussion.json`; update it there, run `npm run build:discussion` there, and refresh the student pages and changed runtime assets here. Preserve the existing thread identifiers across updates. Setting up GitHub Pages does not activate Disqus.

## Third-party notices

MathJax's license, font license, font notices, and upstream provenance are retained in `assets/vendor/mathjax/`. Paths beginning with `es5/` inside those upstream records describe the original distribution. The corresponding files here are directly under `assets/vendor/mathjax/`.

Lecture 3's original course illustrations and web derivatives retain their provenance and hash records in `assets/figures/lect-3/`. Lecture 4's illustrations and Markov area-proof figure retain their provenance and hashes in `assets/figures/lect-4/`. Lecture 5's three solution diagrams and fixed Gaussian fixture retain their provenance and hashes in `assets/figures/lect-5/v1/`. Lecture 6's five illustrations and seeded normal-maxima fixture retain their provenance and hashes in `assets/figures/lect-6/v1/`. Their generation scripts and canonical LaTeX remain in the preparation repository. No new license is assigned to the course materials by this publishing repository.

Lecture 7 retains five original course figures, their attribution and source records in `assets/figures/lect-7/original-v1/`; its new diagrams are recorded in `web-v1/`. Lecture 8 retains the original GloVe analogy figure and attribution in `assets/figures/lect-8/language-v1/`. That record does not assert that the GloVe code or vector-data licenses cover the figure. Its five original teaching diagrams are recorded in `assets/figures/lect-8/web-v1/`. The latest Lecture 3 diagrams and provenance are in `assets/figures/lect-3/intuition-v1/`.

Lecture 9 retains its original convergence, tail-event, empirical-CDF and minimum-separation diagrams, plus the Pareto moment-area explorer’s static fallback, in `assets/figures/lect-9/web-v1/`. The accompanying hash and provenance record refers to generation scripts and canonical LaTeX in the preparation repository.

Lecture 10 retains its original weak-convergence and CLT diagrams, including the exact sign-sum activity fallback, in `assets/figures/lect-10/web-v1/`. The figure record retains hashes and provenance; generation scripts and canonical LaTeX remain in the preparation repository.

Lecture 11 retains its delta-method diagram and curve data in `assets/figures/lect-11/`, together with its provenance record. Canonical sources and author materials remain in preparation.

Lecture 13 retains its original Fisher-information illustrations and Stpasha’s public-domain static projection diagram in `assets/figures/lect-13/`, with source, license and hashes. The removed Gaussian-coordinate diagram is not hosted; its mathematical explanation remains in the lecture.

Lecture 15 retains the instructor’s original cloud image and the course Gaussian-shell illustration in `assets/figures/lect-15/`, with mathematical source and provenance. Its removed Figure 2 and rejected replacements are not hosted.

Lecture 16 uses Georg-Johann’s SVD diagram adapted to transpose notation (CC BY-SA 3.0) and an attributed covering/packing excerpt from Vershynin. Selected figures, the original SVD vector and provenance are in `assets/figures/lect-16/literature-v2/`.

Lecture 17 retains the attributed Belkin et al. double-descent schematic, Hastie et al. isotropic prediction-risk plot, and NeuroData community-network image in `assets/figures/lect-17/`. Source credits, notation explanations and provenance accompany the selected figures. Removed figures and complete research papers are not hosted.

Lecture 14 retains the instructor’s original tail-deviation sketch in `assets/figures/lect-14/original/`, with inherited provenance and its checksum. The removed numbered Bernstein-radius plot and explorer are not hosted.

## October 14 website update

The student website includes the revised syllabus, seven-part organization, backward recaps, Key ideas, cross-lecture links, restored inherited figures and public/private issue-reporting routes. Selected new illustrations retain their provenance under the corresponding `review-20261014/` figure folders; restored source figures keep their original credits and licenses.

`report-issue.html` prepares a public GitHub form or a private email draft to the instructor. It never submits a report automatically. Public reports must not include homework solutions or personal information. GitHub form definitions live in `.github/ISSUE_TEMPLATE/`; the form selects the repository label `report`. Disqus remains the separate public conversation channel.

## October 17 optional lectures

Lectures 18–20 are published as optional enrichment, with links on the homepage and Part VI overview, reading navigation, Comments, and Report an issue. High/mid/low tiers within these three lectures describe a study route and do not add exam requirements. Part VII still has no lecture entries.

The 14 selected figures retain credits and provenance under `assets/figures/lect-18/`, `lect-19/` and `lect-20/`. Complete research books, unused images and author materials are not hosted.

## October 19 corrections

The current student pages and PDFs include the approved course-wide errata and policy follow-up. The TA office hour is Friday, 1:00–2:00 p.m., Morgridge Hall 2517. Lecture 4 omits the spatial log-gradient exercise; Lecture 7 uses an original minimum-norm drawing with its provenance in `assets/figures/lect-7/minimum-norm-v2/`; Lecture 9 Section 7.1 is mid priority; and Lecture 17 community detection is optional and not examined, retaining its reading tiers. Lectures 18–20 remain optional. Homework assignments are unchanged, and homework solutions remain private.
