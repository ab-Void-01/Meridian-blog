/* ==========================================================================
   MERIDIAN — script.js
   Vanilla JS, organized into small single-purpose modules.
   ========================================================================== */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------------------------------------------------------------
     Utility: throttle via requestAnimationFrame
  --------------------------------------------------------------------- */
  function rafThrottle(fn) {
    var ticking = false;
    return function () {
      var args = arguments;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          fn.apply(null, args);
          ticking = false;
        });
      }
    };
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments;
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }

  /* ---------------------------------------------------------------------
     Loader
  --------------------------------------------------------------------- */
  function initLoader() {
    var loader = document.getElementById('loader');
    if (!loader) return;
    window.addEventListener('load', function () {
      setTimeout(function () { loader.classList.add('is-done'); }, 350);
    });
  }

  /* ---------------------------------------------------------------------
     Footer year
  --------------------------------------------------------------------- */
  function initYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------------------------------------------------------------
     Custom cursor
  --------------------------------------------------------------------- */
  function initCursor() {
    if (!isFinePointer) return;
    var dot = document.querySelector('.cursor-dot');
    var ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;

    var mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
    var lastX = 0, lastY = 0;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
      dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px) translate(-50%,-50%)';
    });

    function loop() {
      var dx = mouseX - ringX, dy = mouseY - ringY;
      ringX += dx * 0.18;
      ringY += dy * 0.18;

      var speed = Math.min(Math.hypot(mouseX - lastX, mouseY - lastY), 40);
      var angle = Math.atan2(mouseY - lastY, mouseX - lastX) * (180 / Math.PI);
      var stretch = 1 + speed / 60;
      lastX = mouseX; lastY = mouseY;

      ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px) translate(-50%,-50%) rotate(' + angle + 'deg) scaleX(' + stretch + ')';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    var hoverTargets = 'a, button, .tilt-card, .category-card, input, textarea';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(hoverTargets)) {
        ring.classList.add('is-hover');
        if (e.target.closest('a')) ring.classList.add('is-link');
      }
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(hoverTargets)) {
        ring.classList.remove('is-hover');
        ring.classList.remove('is-link');
      }
    });
  }

  /* ---------------------------------------------------------------------
     Header: solidify on scroll + mobile nav toggle
  --------------------------------------------------------------------- */
  function initHeader() {
    var header = document.getElementById('siteHeader');
    var toggle = document.getElementById('navToggle');
    var nav = document.querySelector('.main-nav');
    if (!header) return;

    var onScroll = rafThrottle(function () {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      nav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('is-open');
          toggle.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ---------------------------------------------------------------------
     Reading progress bar
  --------------------------------------------------------------------- */
  function initReadingProgress() {
    var fill = document.getElementById('progressFill');
    if (!fill) return;
    var onScroll = rafThrottle(function () {
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || document.body.scrollTop;
      var height = doc.scrollHeight - doc.clientHeight;
      var pct = height > 0 ? (scrollTop / height) * 100 : 0;
      fill.style.width = pct + '%';
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------------------
     Scroll to top button
  --------------------------------------------------------------------- */
  function initScrollTop() {
    var btn = document.getElementById('scrollTop');
    if (!btn) return;
    var onScroll = rafThrottle(function () {
      btn.classList.toggle('is-visible', window.scrollY > 600);
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------------------------------------------------------------------
     Scroll reveal via IntersectionObserver
  --------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (entry.isIntersecting) {
          var el = entry.target;
          setTimeout(function () { el.classList.add('is-visible'); }, (i % 6) * 70);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Hero parallax (mouse-reactive blobs) + starfield canvas
  --------------------------------------------------------------------- */
  function initHeroParallax() {
    var hero = document.getElementById('hero');
    var blobs = document.querySelectorAll('.hero-blob');
    if (!hero || !blobs.length || !isFinePointer || prefersReducedMotion) return;

    var onMove = rafThrottle(function (e) {
      var rect = hero.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      blobs.forEach(function (blob, i) {
        var depth = (i + 1) * 18;
        blob.style.transform = 'translate(' + (x * depth) + 'px,' + (y * depth) + 'px)';
      });
    });
    hero.addEventListener('mousemove', onMove);
  }

  function makeStarfield(canvasId, opts) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var stars = [];
    var count = (opts && opts.count) || 140;
    var speed = (opts && opts.speed) || 0.08;
    var w, h, dpr;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.4 + 0.3,
          a: Math.random() * 0.6 + 0.2,
          tw: Math.random() * 0.02 + 0.005,
          dir: Math.random() > 0.5 ? 1 : -1
        });
      }
    }

    resize();
    seed();
    window.addEventListener('resize', debounce(function () { resize(); seed(); }, 200));

    if (prefersReducedMotion) {
      ctx.fillStyle = '#e8e3d3';
      stars.forEach(function (s) {
        ctx.globalAlpha = s.a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      return;
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.a += s.tw * s.dir;
        if (s.a > 0.9 || s.a < 0.15) s.dir *= -1;
        s.y -= speed;
        if (s.y < -2) { s.y = h + 2; s.x = Math.random() * w; }
        ctx.globalAlpha = s.a;
        ctx.fillStyle = '#e8e3d3';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ---------------------------------------------------------------------
     3D tilt cards (mouse-tracked)
  --------------------------------------------------------------------- */
  function initTiltCards() {
    if (!isFinePointer || prefersReducedMotion) return;
    var cards = document.querySelectorAll('[data-tilt]');
    cards.forEach(function (card) {
      var inner = card.querySelector('.tilt-card-inner');
      if (!inner) return;
      var bounds;

      card.addEventListener('mouseenter', function () {
        bounds = card.getBoundingClientRect();
      });

      var onMove = rafThrottle(function (e) {
        if (!bounds) bounds = card.getBoundingClientRect();
        var x = (e.clientX - bounds.left) / bounds.width - 0.5;
        var y = (e.clientY - bounds.top) / bounds.height - 0.5;
        var rotX = (y * -10).toFixed(2);
        var rotY = (x * 12).toFixed(2);
        inner.style.transform = 'translateY(-10px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
      });
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', function () {
        inner.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
      });
    });
  }

  /* ---------------------------------------------------------------------
     Magnetic buttons
  --------------------------------------------------------------------- */
  function initMagnetic() {
    if (!isFinePointer || prefersReducedMotion) return;
    var items = document.querySelectorAll('.magnetic');
    items.forEach(function (el) {
      var strength = 18;
      el.addEventListener('mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = 'translate(' + (x / rect.width) * strength + 'px,' + (y / rect.height) * strength + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.style.transform = 'translate(0,0)';
      });
    });
  }

  /* ---------------------------------------------------------------------
     Ripple on button click
  --------------------------------------------------------------------- */
  function initRipple() {
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.style.position = btn.style.position || 'relative';
      btn.addEventListener('click', function (e) {
        var rect = btn.getBoundingClientRect();
        var span = document.createElement('span');
        var size = Math.max(rect.width, rect.height);
        span.className = 'ripple';
        span.style.width = span.style.height = size + 'px';
        span.style.left = (e.clientX - rect.left - size / 2) + 'px';
        span.style.top = (e.clientY - rect.top - size / 2) + 'px';
        btn.appendChild(span);
        setTimeout(function () { span.remove(); }, 650);
      });
    });
  }

  /* ---------------------------------------------------------------------
     Latest blogs: skeletons -> masonry content, staggered reveal
  --------------------------------------------------------------------- */
  var BLOG_DATA = [
    { cat: 'Technology', title: 'Designing Software That Forgets Gracefully', excerpt: 'Most apps hoard data forever. What if forgetting was a feature?', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=700&q=70', read: '5 min', date: 'Jul 15' },
    { cat: 'Survival', title: 'Water Before Everything Else', excerpt: 'A field guide to the only rule that actually matters out there.', img: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=700&q=70', read: '8 min', date: 'Jul 14' },
    { cat: 'Psychology', title: 'The Attention Economy Has a Body Count', excerpt: 'On dopamine, doomscrolling, and getting your evenings back.', img: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=700&q=70', read: '6 min', date: 'Jul 11' },
    { cat: 'Adventure', title: 'Notes From a Failed Summit', excerpt: 'The mountain said no. Here is what I learned from listening.', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=700&q=70', read: '10 min', date: 'Jul 09' },
    { cat: 'Space', title: 'Why We Keep Looking Up', excerpt: 'A short history of humanity refusing to stay put.', img: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=700&q=70', read: '7 min', date: 'Jul 06' },
    { cat: 'Nature', title: 'The Forest Keeps Its Own Time', excerpt: 'On old growth, patience, and things that outlive us.', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=700&q=70', read: '4 min', date: 'Jul 04' },
    { cat: 'Philosophy', title: 'Camus Was Right About Tuesdays', excerpt: 'The absurd is not a crisis. It is a Tuesday.', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&q=70', read: '9 min', date: 'Jul 01' },
    { cat: 'Poetry', title: 'On Writing Less and Meaning More', excerpt: 'Every word you cut is a word the reader keeps.', img: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=700&q=70', read: '3 min', date: 'Jun 28' }
  ];

  function buildSkeletons(grid, n) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < n; i++) {
      var sk = document.createElement('div');
      sk.className = 'skeleton';
      sk.innerHTML =
        '<div class="skeleton-media"></div>' +
        '<div class="skeleton-lines">' +
          '<div class="skeleton-line w60"></div>' +
          '<div class="skeleton-line w80"></div>' +
          '<div class="skeleton-line w60"></div>' +
        '</div>';
      frag.appendChild(sk);
    }
    grid.appendChild(frag);
  }

  function buildCard(post) {
    var card = document.createElement('article');
    card.className = 'masonry-card';
    card.innerHTML =
      '<div class="masonry-media">' +
        '<img src="' + post.img + '" alt="' + post.title + '" loading="lazy" />' +
      '</div>' +
      '<div class="masonry-body">' +
        '<span class="masonry-cat">' + post.cat.toUpperCase() + '</span>' +
        '<h3>' + post.title + '</h3>' +
        '<p>' + post.excerpt + '</p>' +
        '<div class="masonry-foot"><span>' + post.read + ' read</span><span>' + post.date + '</span></div>' +
      '</div>';
    return card;
  }

  function initMasonry() {
    var grid = document.getElementById('masonryGrid');
    if (!grid) return;

    buildSkeletons(grid, BLOG_DATA.length);

    setTimeout(function () {
      grid.innerHTML = '';
      var cards = BLOG_DATA.map(buildCard);
      cards.forEach(function (c) { grid.appendChild(c); });

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry, i) {
            if (entry.isIntersecting) {
              setTimeout(function () { entry.target.classList.add('is-in'); }, (i % 4) * 90);
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        cards.forEach(function (c) { io.observe(c); });
      } else {
        cards.forEach(function (c) { c.classList.add('is-in'); });
      }
    }, 700);
  }

  /* ---------------------------------------------------------------------
     Cinematic quote scene: starfield, floating particles, letter reveal
  --------------------------------------------------------------------- */
  function initQuoteParticles() {
    var host = document.getElementById('quoteParticles');
    if (!host) return;
    var n = prefersReducedMotion ? 0 : 24;
    for (var i = 0; i < n; i++) {
      var p = document.createElement('span');
      p.className = 'quote-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.bottom = (Math.random() * 20) + '%';
      p.style.animationDuration = (6 + Math.random() * 8) + 's';
      p.style.animationDelay = (Math.random() * 6) + 's';
      host.appendChild(p);
    }
  }

  function initQuoteLetterReveal() {
    var el = document.getElementById('quoteText');
    if (!el) return;
    var text = el.getAttribute('data-text') || el.textContent;
    var words = text.split(' ');
    el.innerHTML = words.map(function (word) {
      return '<span style="display:inline-block;white-space:nowrap;">' +
        word.split('').map(function (ch) { return '<span class="qc">' + ch + '</span>'; }).join('') +
        '&nbsp;</span>';
    }).join('');

    var letters = el.querySelectorAll('.qc');

    if (!('IntersectionObserver' in window)) {
      letters.forEach(function (l) { l.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          letters.forEach(function (l, i) {
            setTimeout(function () { l.classList.add('is-in'); }, i * 18);
          });
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
  }

  /* ---------------------------------------------------------------------
     Forms: contact + newsletter (client-side only, no backend wired)
  --------------------------------------------------------------------- */
  function initForms() {
    var contactForm = document.getElementById('contactForm');
    var formStatus = document.getElementById('formStatus');
    if (contactForm && formStatus) {
      contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        formStatus.textContent = 'Message received. We will write back soon.';
        contactForm.reset();
      });
    }

    var newsletterForm = document.getElementById('newsletterForm');
    var newsletterStatus = document.getElementById('newsletterStatus');
    if (newsletterForm && newsletterStatus) {
      newsletterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        newsletterStatus.textContent = 'Subscribed. Welcome aboard.';
        newsletterForm.reset();
      });
    }
  }

  /* ---------------------------------------------------------------------
     Init
  --------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initLoader();
    initYear();
    initCursor();
    initHeader();
    initReadingProgress();
    initScrollTop();
    initReveal();
    initHeroParallax();
    makeStarfield('heroStars', { count: 130, speed: 0.06 });
    makeStarfield('quoteStars', { count: 90, speed: 0.03 });
    initTiltCards();
    initMagnetic();
    initRipple();
    initMasonry();
    initQuoteParticles();
    initQuoteLetterReveal();
    initForms();
  });

})();
