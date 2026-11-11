document.getElementById('year').textContent = new Date().getFullYear();

// On refresh, start at the top instead of jumping back to the last section (#contact etc.).
// Shared links like /#projects still open at that section.
history.scrollRestoration = 'manual';
if (performance.getEntriesByType('navigation')[0]?.type === 'reload') {
  history.replaceState(null, '', location.pathname + location.search);
  const toTop = () => window.scrollTo({ top: 0, behavior: 'instant' });
  toTop();
  window.addEventListener('load', toTop); // browsers may jump to the anchor late
}

const toggle = document.querySelector('.nav-toggle');
const links = document.getElementById('nav-links');

toggle.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});

// Close the mobile menu after picking a link
links.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Typing effect on the tagline (height is reserved first so the page doesn't jump)
const tagline = document.querySelector('.tagline');
if (!reduceMotion) {
  const full = tagline.textContent;
  tagline.style.minHeight = tagline.offsetHeight + 'px';
  tagline.setAttribute('aria-label', full);
  tagline.textContent = '';
  tagline.classList.add('typing');
  let i = 0;
  const type = () => {
    tagline.textContent = full.slice(0, ++i);
    if (i < full.length) setTimeout(type, 18);
    else setTimeout(() => tagline.classList.remove('typing'), 1500);
  };
  setTimeout(type, 400);
}

// Fade sections in as they scroll into view
const revealed = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  revealed.forEach((s) => io.observe(s));
} else {
  revealed.forEach((s) => s.classList.add('visible'));
}

// Glow that follows the mouse on cards
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--x', e.clientX - r.left + 'px');
    card.style.setProperty('--y', e.clientY - r.top + 'px');
  });
});

// Highlight the menu link of the section in view
const navLinks = [...links.querySelectorAll('a')];
const navIO = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  navLinks.forEach((a) => {
    const on = a.hash === '#' + e.target.id;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
}), { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main > section[id]').forEach((s) => navIO.observe(s));

// Timeline: scrolling moves the glowing marker up from the oldest job (bottom) toward the newest (top), lighting each job it passes
const timeline = document.querySelector('.timeline');
const jobs = [...timeline.children];
let ticking = false;
function updateTimeline() {
  ticking = false;
  const y = innerHeight * 0.95; // progress line near the bottom: finishes once the whole timeline is on screen
  const r = timeline.getBoundingClientRect();
  timeline.style.setProperty('--p', Math.min(1, Math.max(0, (y - r.top) / r.height)));
  const p = parseFloat(timeline.style.getPropertyValue('--p'));
  const markerTop = (1 - p) * timeline.offsetHeight;
  jobs.forEach((li) => li.classList.toggle('reached', li.offsetTop + 8 >= markerTop));
}
if (reduceMotion) {
  timeline.style.setProperty('--p', 1);
  jobs.forEach((li) => li.classList.add('reached'));
} else {
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateTimeline); } }, { passive: true });
  addEventListener('resize', updateTimeline);
  updateTimeline();
}

// Count the stats up from 1: fast at first, then slowing as it nears the final value
document.querySelectorAll('.count').forEach((el) => {
  const to = +el.dataset.to;
  if (reduceMotion) return;
  el.textContent = 1;
  const plus = el.nextElementSibling?.classList.contains('plus') ? el.nextElementSibling : null;
  if (plus) plus.style.display = 'none'; // "yrs" hugs the number; the "+" slides in once the count finishes
  const start = performance.now() + 250, duration = 1300;
  const tick = (now) => {
    const t = Math.min(1, Math.max(0, (now - start) / duration));
    const eased = 1 - (1 - t) ** 2; // ease-out
    el.textContent = 1 + Math.floor(eased * (to - 1) + 1e-9); // reaches the final value only at the very end
    if (t < 1) requestAnimationFrame(tick);
    else if (plus) { plus.style.display = ''; plus.classList.add('pop'); }
  };
  requestAnimationFrame(tick);
});
