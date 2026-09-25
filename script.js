const APPS_URL = 'apps.json';
const grid = document.getElementById('appsGrid');
const search = document.getElementById('search');
const year = document.getElementById('year');

let ALL_APPS = [];

year.textContent = new Date().getFullYear();

const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive:true });

const menuBtn = document.getElementById('menuBtn');
const navLinks = document.querySelector('.nav-links');
menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold:.15 });

function observeReveals(){
  document.querySelectorAll('.card, .section-head, .about-text, .about-visual, .contact-box')
    .forEach(el => { el.classList.add('reveal'); io.observe(el); });
}

function formatSize(bytes){
  if (!bytes) return '';
  const mb = bytes / 1048576;
  return mb >= 1024 ? (mb/1024).toFixed(2) + ' GB' : mb.toFixed(1) + ' MB';
}

function escapeHTML(str){
  return String(str == null ? '' : str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function render(list){
  if (!list.length){
    grid.innerHTML = '<div class="empty"><div class="empty-icon">📭</div><div>لا توجد برامج مطابقة لبحثك</div></div>';
    return;
  }
  grid.innerHTML = list.map((app, i) => {
    const iconHTML = app.icon
      ? '<img src="' + escapeHTML(app.icon) + '" alt="' + escapeHTML(app.name) + '">'
      : '📦';
    const tagsHTML = Array.isArray(app.tags) && app.tags.length
      ? '<div class="tags">' + app.tags.map(t => '<span class="tag">' + escapeHTML(t) + '</span>').join('') + '</div>'
      : '';
    const sizeHTML = app.size ? '<span class="size">' + formatSize(app.size) + '</span>' : '';
    const dateHTML = app.date ? '<span>' + escapeHTML(app.date) + '</span>' : '';

    return '<div class="card" style="animation-delay:' + (i * 60) + 'ms">' +
      '<div class="card-head">' +
        '<div class="card-icon">' + iconHTML + '</div>' +
        '<div class="card-title-wrap">' +
          '<div class="card-title">' + escapeHTML(app.name) + '</div>' +
          '<div class="card-ver"><span class="chip-ver">v' + escapeHTML(app.version || '1.0.0') + '</span>' + dateHTML + '</div>' +
        '</div>' +
      '</div>' +
      (app.description ? '<p class="card-desc">' + escapeHTML(app.description) + '</p>' : '') +
      tagsHTML +
      '<div class="card-foot">' +
        '<a class="btn-dl" href="' + escapeHTML(app.downloadUrl || '#') + '" target="_blank" rel="noopener">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
          'تحميل' +
        '</a>' +
        sizeHTML +
      '</div>' +
    '</div>';
  }).join('');
  observeReveals();
}

function animateNumber(el, target, duration){
  duration = duration || 1200;
  const start = performance.now();
  function step(now){
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.floor(target * eased);
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

function updateStats(list){
  const total = list.length;
  const downloads = list.reduce((s, a) => s + (a.downloads || 0), 0);
  animateNumber(document.getElementById('statApps'), total);
  animateNumber(document.getElementById('statDownloads'), downloads || total * 12);
}

async function loadApps(){
  try{
    const res = await fetch(APPS_URL + '?t=' + Date.now(), { cache:'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    ALL_APPS = (data.apps || []).sort((a, b) => {
      const f = (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (f) return f;
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
    render(ALL_APPS);
    updateStats(ALL_APPS);
  } catch(err){
    console.error(err);
    grid.innerHTML = '<div class="empty"><div class="empty-icon">⚠️</div><div>تعذّر تحميل البرامج. حاول لاحقاً.</div></div>';
  }
}

search.addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q){ render(ALL_APPS); return; }
  const filtered = ALL_APPS.filter(a =>
    (a.name || '').toLowerCase().includes(q) ||
    (a.description || '').toLowerCase().includes(q) ||
    (a.tags || []).join(' ').toLowerCase().includes(q)
  );
  render(filtered);
});

loadApps();