// Highlight the menu section currently on screen in the sticky menu nav.
(function () {
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  var links = Array.prototype.slice.call(document.querySelectorAll('.menu-nav a'));
  if (!links.length || !('IntersectionObserver' in window)) return;

  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      links.forEach(function (a) { a.classList.remove('is-active'); });
      var link = byId[entry.target.id];
      if (!link) return;
      link.classList.add('is-active');
      var nav = link.parentElement;
      nav.scrollTo({ left: link.offsetLeft - nav.clientWidth / 2 + link.clientWidth / 2, behavior: 'smooth' });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  Object.keys(byId).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) observer.observe(el);
  });
})();

// Scroll reveal: fade content up as it enters the screen. Anything already on screen
// at load stays visible, and nothing is hidden when motion is reduced or unsupported.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Groups whose children appear one after another (small stagger).
  var staggered = ['.strip-in > p', '.dishes > li', '.quotes > .quote', '.grid > figure', '.visit-list > div', '.drinks > div'];
  // Single blocks.
  var singles = ['.section-head', '.course > h3', '.course-photo', '.wine-scroll', '.allergy',
    '.story-photo', '.story-copy', '.motto', '.visit-copy > h2', '.visit-copy > p', '.visit-photo', '.footer-in'];

  var items = [];
  staggered.forEach(function (sel) {
    var groups = new Map();
    document.querySelectorAll(sel).forEach(function (el) {
      var n = groups.get(el.parentElement) || 0;
      el.style.setProperty('--reveal-delay', Math.min(n, 6) * 0.07 + 's');
      groups.set(el.parentElement, n + 1);
      items.push(el);
    });
  });
  singles.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) { items.push(el); });
  });

  var fold = window.innerHeight;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  items.forEach(function (el) {
    if (el.getBoundingClientRect().top < fold) return; // already visible: leave it alone
    el.classList.add('reveal');
    observer.observe(el);
  });
  document.documentElement.classList.add('reveal-on');

  // Jumping via the menu or nav links: show the target section straight away.
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;
    var target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    target.querySelectorAll('.reveal').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top - target.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-visible');
    });
  });
})();

// Gallery lightbox: click (or Enter/Space) a photo to view it large; arrows, swipe and Esc to navigate.
(function () {
  var box = document.getElementById('lightbox');
  var figures = Array.prototype.slice.call(document.querySelectorAll('.grid figure'));
  if (!box || !figures.length || typeof box.showModal !== 'function') return;

  var img = document.getElementById('lb-img');
  var caption = document.getElementById('lb-caption');
  var count = document.getElementById('lb-count');
  var current = 0;
  var opener = null;

  function show(i) {
    current = (i + figures.length) % figures.length;
    var fig = figures[current];
    var thumb = fig.querySelector('img');
    img.src = thumb.currentSrc || thumb.src;
    img.alt = thumb.alt;
    caption.textContent = fig.querySelector('figcaption') ? fig.querySelector('figcaption').textContent : '';
    count.textContent = (current + 1) + ' / ' + figures.length;
  }

  function open(i) {
    opener = figures[i];
    show(i);
    box.showModal();
    document.body.style.overflow = 'hidden';
  }

  box.addEventListener('close', function () {
    document.body.style.overflow = '';
    if (opener) opener.focus();
  });

  figures.forEach(function (fig, i) {
    var label = fig.querySelector('figcaption');
    fig.setAttribute('tabindex', '0');
    fig.setAttribute('role', 'button');
    fig.setAttribute('aria-label', 'View photo: ' + (label ? label.textContent : 'gallery image'));
    fig.addEventListener('click', function () { open(i); });
    fig.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
    });
  });

  box.addEventListener('click', function (e) {
    var action = e.target.getAttribute('data-lb');
    if (action === 'close') box.close();
    else if (action === 'prev') show(current - 1);
    else if (action === 'next') show(current + 1);
    else if (e.target === box || e.target.classList.contains('lb-figure')) box.close(); // click on the dark background
  });

  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  var startX = null;
  box.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();
