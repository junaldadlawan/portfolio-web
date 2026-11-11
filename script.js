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
