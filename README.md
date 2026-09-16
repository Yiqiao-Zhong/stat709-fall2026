# STAT 709 — Fall 2026 course website

This repository contains the finished student website for STAT 709 Mathematical Statistics at the University of Wisconsin–Madison.

## Available materials

- [Course home](index.html)
- [Preface and reading guide](preface.html)
- Lecture 1: [HTML](lect-1.html) · [Student PDF](lect-1.pdf)
- Lecture 2: [HTML](lect-2.html) · [Student PDF](lect-2.pdf)
- Lecture 3: [HTML](lect-3.html) · [Student PDF](lect-3.pdf)
- Lecture 4: [HTML](lect-4.html) · [Student PDF](lect-4.pdf)
- [Original lecture notes: Lectures 1–20 (ZIP)](resources/Lectures-STAT709.zip)
- [Homework 1 assignment](homework/HW1.pdf)

Homework solutions are not included. Further lectures can be added when their student editions are ready.

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

The sibling `STAT709-html-conversion` repository remains the preparation repository. Make content changes and regenerate student outputs there, then copy the approved HTML/PDF files and any changed runtime assets here. Keep their relative paths.

The course homepage is maintained separately from the lecture build in `STAT709-html-conversion/dist/index.html`. Keep this copy synchronized when updating it. Add each new lecture or homework assignment to `index.html` when you copy it. Preserve this publishing homepage when refreshing lectures.

This publishing copy offers student HTML and PDFs, plus the instructor-approved original lecture-note PDFs in `resources/Lectures-STAT709.zip`. Its lecture pages omit the LaTeX-source download link. Repeat that small navigation adjustment when adding or replacing a page with a new build; do not copy author PDFs, source `.tex` files, or standalone HTML containing embedded source downloads into this repository.

The copied student PDFs are unchanged. The selected CSS and application modules come from `dist/assets`. MathJax 3.2.2 uses its combined `tex-chtml.js` renderer, TeX autoload extensions, and CHTML fonts. Recheck dependencies if later pages use another renderer or enable additional MathJax features.

Every lecture and the preface now include a Comments section with a separate Disqus thread. Comments remain inactive until the course's registered Disqus shortname is supplied. The single configuration lives in the preparation repository at `config/discussion.json`; update it there, run `npm run build:all` there, and refresh the student pages and changed runtime assets here. Preserve the existing thread identifiers across updates. Setting up GitHub Pages does not activate Disqus.

## Third-party notices

MathJax's license, font license, font notices, and upstream provenance are retained in `assets/vendor/mathjax/`. Paths beginning with `es5/` inside those upstream records describe the original distribution. The corresponding files here are directly under `assets/vendor/mathjax/`.

Lecture 3's original course illustrations and web derivatives retain their provenance and hash records in `assets/figures/lect-3/`. Lecture 4's illustrations and Markov area-proof figure retain their provenance and hashes in `assets/figures/lect-4/`. Their generation scripts and canonical LaTeX remain in the preparation repository. No new license is assigned to the course materials by this publishing repository.
