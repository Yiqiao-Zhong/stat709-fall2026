(() => {
// Shared by the website, file:// previews, and offline lecture editions.
// Only course page/section context is carried in links. No report is submitted here.
function cleanText(value, limit = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function reportContext(config, value = {}) {
  const page = Object.hasOwn(config.pages, value.page) ? value.page : config.page;
  const anchor = /^[\p{L}\p{N}_.:-]{1,180}$/u.test(value.anchor || '') ? value.anchor : '';
  return {page, title: config.pages[page], anchor, section: anchor ? cleanText(value.section || anchor) : ''};
}

function contextLink(config, context, base = 'report-issue.html') {
  const c = reportContext(config, context);
  const params = new URLSearchParams({page: c.page});
  if (c.anchor) { params.set('anchor', c.anchor); params.set('section', c.section); }
  return base + '#' + params.toString();
}

function reportDestinations(config, context) {
  const c = reportContext(config, context);
  const source = new URL(c.page + '.html', config.siteUrl);
  if (c.anchor) source.hash = c.anchor;
  const subject = cleanText(`[STAT 709] ${c.title}${c.section ? ' · ' + c.section : ''}`, 230);
  const github = new URL(`https://github.com/${config.repository}/issues/new`);
  // Labels belong to the repository's form, never to a student-controlled URL.
  for (const [key, value] of Object.entries({template: config.template, title: subject,
    page: c.title, section: c.section || 'Whole page / not specified', url: source.href})) github.searchParams.set(key, value);
  const body = `Page: ${c.title}\nSection: ${c.section || 'Whole page / not specified'}\nLink: ${source.href}\n\nType (typo / mathematical error / unclear explanation / figure / broken link or display problem / other):\n\nWhat is wrong?\n\nSuggested fix (optional):\n\nDevice and browser (display problems only):\n`;
  return {source: source.href, github: github.href,
    email: `mailto:${config.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`};
}

function nearestSection(doc, viewportHeight = 800) {
  const main = doc.querySelector('main');
  if (!main) return {};
  const line = Math.min(160, viewportHeight * 0.25);
  let current;
  for (const heading of main.querySelectorAll('h1, h2, h3, h4')) {
    if (heading.closest('#discussion, .course-changes, [hidden]') || !heading.getClientRects().length) continue;
    const closed = heading.closest('details:not([open])');
    if (closed) continue;
    const anchor = heading.id || heading.closest('section[id]')?.id;
    if (!anchor) continue;
    if (heading.getBoundingClientRect().top <= line) current = {anchor, section: cleanText(heading.textContent)};
  }
  return current || {};
}

function mountReporting(doc = document, win = window) {
  const node = doc.getElementById('issue-report-config');
  if (!node) return;
  const config = JSON.parse(node.textContent);
  const links = [...doc.querySelectorAll('a[data-report-issue]')];
  const update = () => {
    const c = reportContext(config, {page: config.page, ...nearestSection(doc, win.innerHeight)});
    for (const a of links) a.href = contextLink(config, c, config.reportPage || 'report-issue.html');
  };
  update();
  let pending = false;
  win.addEventListener('scroll', () => {
    if (!pending) {pending = true; win.requestAnimationFrame(() => { pending = false; update(); });}
  }, {passive: true});
  for (const a of links) {a.addEventListener('pointerdown', update); a.addEventListener('focus', update);}
  win.addEventListener('resize', update);

  if (config.page !== 'report-issue') return;
  const preview = doc.getElementById('report-preview');
  if (preview) preview.hidden = win.location.origin === new URL(config.siteUrl).origin;
  const showContext = () => {
    const params = new URLSearchParams(win.location.hash.slice(1));
    const c = reportContext(config, {page: params.get('page'), anchor: params.get('anchor'), section: params.get('section')});
    const dest = reportDestinations(config, c);
    doc.getElementById('report-page-name').textContent = c.title;
    doc.getElementById('report-section-name').textContent = c.section || 'Whole page / not specified';
    const source = doc.getElementById('report-source'); source.href = dest.source; source.textContent = dest.source;
    doc.getElementById('report-public').href = dest.github;
    doc.getElementById('report-private').href = dest.email;
  };
  showContext();
  win.addEventListener('hashchange', showContext);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => mountReporting());
  else mountReporting();
}

})();
