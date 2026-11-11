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
    else { setTimeout(() => tagline.classList.remove('typing'), 1500); startNudge(); } // the resume nudge waits until the tagline is done so the eye isn't pulled away
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
const navSections = [...document.querySelectorAll('main > section[id]')];
let navTicking = false;
function updateNav() {
  navTicking = false;
  // The active section is the last one whose top has passed the middle of the screen (a clicked link centres its section); at the very bottom, the last section.
  let current = navSections.filter((s) => s.getBoundingClientRect().top <= innerHeight * 0.5).pop();
  if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = navSections[navSections.length - 1];
  navLinks.forEach((a) => {
    const on = !!current && a.hash === '#' + current.id;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
  });
}
// Clicking a menu link centres that section on screen (sections taller than the screen line up under the header instead)
links.addEventListener('click', (e) => {
  const sec = e.target.hash && navSections.find((s) => '#' + s.id === e.target.hash);
  if (!sec) return;
  e.preventDefault();
  const header = 56, r = sec.getBoundingClientRect();
  const room = innerHeight - header;
  const top = r.height < room ? r.top - header - (room - r.height) / 2 : r.top - header;
  scrollTo({ top: scrollY + top, behavior: reduceMotion ? 'instant' : 'smooth' });
  history.replaceState(null, '', e.target.hash);
});
addEventListener('scroll', () => { if (!navTicking) { navTicking = true; requestAnimationFrame(updateNav); } }, { passive: true });
updateNav();

// Timeline: starts full, then drains downward as you scroll. The marker sinks from the newest job toward the oldest (back in time) and lights each job it reaches.
const timeline = document.querySelector('.timeline');
const jobs = [...timeline.children];
let ticking = false;
function updateTimeline() {
  ticking = false;
  const y = innerHeight * 0.5; // the marker follows the middle of the screen
  const r = timeline.getBoundingClientRect();
  const travelled = Math.min(1, Math.max(0, (y - r.top) / r.height)); // 0 = at the newest job, 1 = at the oldest
  timeline.style.setProperty('--p', 1 - travelled); // --p is how much of the line is still lit
  const markerTop = travelled * timeline.offsetHeight;
  jobs.forEach((li) => li.classList.toggle('reached', li.offsetTop - 8 <= markerTop));
  const now = jobs.filter((li) => li.offsetTop - 8 <= markerTop).pop();
  jobs.forEach((li) => li.classList.toggle('current', li === now)); // the job the marker is in gets highlighted
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

// Once the big Download resume button has scrolled out of view, offer the same link in the menu bar
const siteHeader = document.querySelector('.site-header');
new IntersectionObserver(([e]) => siteHeader.classList.toggle('show-resume', !e.isIntersecting), { rootMargin: '-56px 0px 0px 0px' })
  .observe(document.querySelector('.btn-shake'));

// Resume button: every 12s (after the shake) the label types out a nudge, holds, then goes back
const nudgeBtn = document.querySelector('.btn-shake'), nudgeLabel = nudgeBtn.querySelector('.label');
if (!reduceMotion) {
  const original = nudgeLabel.textContent, nudge = 'Psst! Grab my resume!';
  nudgeLabel.textContent = nudge; // measure the longer text so the button doesn't resize while typing
  const w = nudgeBtn.offsetWidth;
  nudgeLabel.textContent = original;
  nudgeBtn.style.minWidth = Math.max(w, nudgeBtn.offsetWidth) + 'px';
  nudgeBtn.style.textAlign = 'center';
  var typeNudge = () => {
    let i = 0;
    const step = () => {
      if (nudgeBtn.matches(':hover')) { nudgeLabel.textContent = original; return; }
      nudgeLabel.textContent = nudge.slice(0, ++i);
      if (i < nudge.length) setTimeout(step, 55);
      else setTimeout(() => { nudgeLabel.textContent = original; }, 3000);
    };
    step();
  };
}
// Shake first (CSS, .go), then type after it settles; repeats every 12s
function startNudge() {
  if (reduceMotion) return;
  nudgeBtn.classList.add('go');
  setTimeout(() => { typeNudge(); setInterval(typeNudge, 12000); }, 2040);
}
