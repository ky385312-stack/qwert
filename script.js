/**
 * OBELISK — Digital Studio
 * script.js
 * ---------------------------------------------------------------------------
 * Every feature is an isolated init* function and each one bails out safely
 * when its markup is missing or the environment cannot support it.
 *
 *   initLoader          page-load counter + curtain wipe
 *   initSmoothScroll    Lenis smooth scrolling wired into the GSAP ticker
 *   initSlidingAnchors  in-page anchor links routed through Lenis
 *   initNav             scrolled state on the sticky header
 *   initScrollSpy       active navigation link per section
 *   initMobileNav       animated mobile panel with scroll lock
 *   initSplitText       word-by-word headline reveals
 *   initReveals         scroll-triggered reveal classes
 *   initParallax        image parallax on hero, work, studio, contact
 *   initMarquee         seamless duplicated marquee track
 *   initCursor          desktop-only custom cursor
 *   initMagnetic        magnetic pull on primary buttons
 *   initProjectOverlay  project detail dialog with focus trap
 *   initFooter          dynamic copyright year
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/* ── Environment flags ─────────────────────────────────────────────────── */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

const prefersReducedMotion = () => reduceMotion.matches;
/* Expensive pointer-following effects are desktop-only by design. */
const canUsePointerFx = () => finePointer.matches && !prefersReducedMotion();

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const navHeight = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;

/* ── Project data (drives the detail overlay) ──────────────────────────── */
const PROJECTS = {
  'neon-exodus': {
    title: 'Neon Exodus',
    meta: 'Game World · 2025',
    image: './assets/work-neon-exodus.jpg',
    alt: 'Neon Exodus — rain-lit brutalist megacity key art',
    text:
      'A single-player survival epic set in a drowned megacity. We built the world bible, the art direction and the interface language, then shipped the in-game UI system in engine. Two years, one very stubborn art team, 40+ explorable districts.',
    tags: ['Art Direction', 'World Building', 'UI Systems', 'Engine Integration'],
  },
  voidrunner: {
    title: 'Voidrunner',
    meta: 'Game Identity · 2025',
    image: './assets/work-voidrunner.jpg',
    alt: 'Voidrunner — matte black interceptor craft in a hangar void',
    text:
      'Identity and launch campaign for an indie spaceflight sim. A hard-edged logotype, a modular HUD kit and a trailer cut entirely from in-engine footage. Wishlists tripled in the fortnight after reveal.',
    tags: ['Logotype', 'HUD Kit', 'Trailer', 'Campaign'],
  },
  helio: {
    title: 'Helio',
    meta: 'Brand Identity · 2024',
    image: './assets/work-helio-brand.jpg',
    alt: 'Helio — embossed matte black brand artifact photographed in raking light',
    text:
      'A full identity for a climate-data company that refused the usual green. Monolithic marks, a monospaced data voice and a physical artifact program that made an invisible business feel built to last.',
    tags: ['Strategy', 'Identity System', 'Type Design', 'Guidelines'],
  },
  'signal-noise': {
    title: 'Signal / Noise',
    meta: 'Motion Design · 2024',
    image: './assets/work-signal-cinema.jpg',
    alt: 'Signal / Noise — long-exposure light ribbons through black space',
    text:
      'Titles, transitions and interstitial loops for an international design festival. One rule for the whole package: nothing settles. Every frame is either leaving or arriving.',
    tags: ['Titles', 'Loops', 'Sound Direction', 'Stage Visuals'],
  },
  'atlas-os': {
    title: 'Atlas OS',
    meta: 'Digital Experience · 2023',
    image: './assets/work-atlas-interface.jpg',
    alt: 'Atlas OS — dark experimental interface panel with wireframe terrain',
    text:
      'An experimental front end for a spatial computing platform: hand-written WebGL terrain, a keyboard-first command layer and a component library the client now ships in production.',
    tags: ['Frontend', 'WebGL', 'Design System', 'Prototyping'],
  },
};

/* ══ Loader ═════════════════════════════════════════════════════════════ */
function initLoader() {
  const loader = $('#loader');
  const countEl = $('#loaderCount');
  const barEl = $('#loaderBar');
  if (!loader) return Promise.resolve();

  if (prefersReducedMotion()) {
    loader.remove();
    return Promise.resolve();
  }

  document.body.classList.add('is-locked');

  const progress = { value: 0 };

  return new Promise((resolve) => {
    gsap
      .timeline({
        onComplete: () => {
          // The curtain lifts immediately so the hero is never withheld from
          // the first paint for more than a fraction of a second.
          loader.classList.add('is-done');
          document.body.classList.remove('is-locked');
          resolve();
          window.setTimeout(() => loader.remove(), 700);
        },
      })
      .to(progress, {
        value: 100,
        duration: 0.35,
        ease: 'power2.inOut',
        onUpdate: () => {
          const v = Math.round(progress.value);
          if (countEl) countEl.textContent = String(v).padStart(2, '0');
          if (barEl) barEl.style.transform = `scaleX(${progress.value / 100})`;
        },
      });
  });
}

/* ══ Smooth scrolling ═══════════════════════════════════════════════════ */
let lenis = null;

function initSmoothScroll() {
  if (prefersReducedMotion()) return;

  lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* Route in-page anchors through Lenis so smoothing is never bypassed. */
function initSlidingAnchors() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    const target = document.querySelector(hash);
    if (!target) return;

    event.preventDefault();
    closeMobilePanel();

    const isHero = hash === '#top';

    if (lenis) {
      lenis.scrollTo(target, { offset: isHero ? 0 : -navHeight(), duration: 1.2 });
    } else {
      const top = target.getBoundingClientRect().top + window.scrollY - (isHero ? 0 : navHeight());
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
}

/* ══ Navigation ═════════════════════════════════════════════════════════ */
function initNav() {
  const nav = $('#nav');
  if (!nav) return;

  const sync = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  sync();
  window.addEventListener('scroll', sync, { passive: true });
}

function initScrollSpy() {
  const links = $$('[data-spy]');
  if (!links.length) return;

  const sections = links
    .map((link) => document.getElementById(link.dataset.spy))
    .filter(Boolean);
  if (!sections.length) return;

  const setActive = (id) => {
    links.forEach((link) => link.classList.toggle('is-active', link.dataset.spy === id));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    },
    { rootMargin: `-30% 0px -55% 0px`, threshold: [0, 0.2, 0.5] }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ══ Mobile navigation ══════════════════════════════════════════════════ */
let closeMobilePanel = () => {};

function initMobileNav() {
  const burger = $('#burger');
  const panel = $('#mobilePanel');
  const nav = $('#nav');
  if (!burger || !panel) return;

  let isOpen = false;

  const open = () => {
    isOpen = true;
    panel.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close navigation menu');
    document.body.classList.add('is-locked');
    if (lenis) lenis.stop();
    // Next frame, so the transition has a starting frame to animate from.
    requestAnimationFrame(() => panel.classList.add('is-open'));
    const first = $('.mobile-panel__link', panel);
    if (first) first.focus({ preventScroll: true });
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open navigation menu');
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();
    window.setTimeout(() => {
      if (!isOpen) panel.hidden = true;
    }, prefersReducedMotion() ? 0 : 480);
  };

  closeMobilePanel = close;

  burger.addEventListener('click', () => (isOpen ? close() : open()));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) {
      close();
      burger.focus();
    }
  });

  // Never leave a stale open panel behind when returning to desktop widths.
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1023 && isOpen) close();
  });
}

/* ══ Text splitting + reveals ═══════════════════════════════════════════ */

/** Hero headline word spans, revealed once the loader curtain lifts. */
const heroWordTargets = [];

/**
 * Wraps every word of a headline in its own masked span so the words can be
 * lifted into place. Runs only when scripting is available, so the plain
 * headline is what a no-JS visitor sees.
 */
function splitWords(element) {
  const accent = (element.dataset.accent || '').toLowerCase().trim();
  const words = element.textContent.trim().split(/\s+/);

  element.textContent = '';

  const parts = words.map((word, index) => {
    const outer = document.createElement('span');
    outer.className = 'word';

    const inner = document.createElement('span');
    inner.className = 'word__inner';
    inner.textContent = word;
    if (accent && word.toLowerCase().replace(/[^a-z]/g, '') === accent) {
      outer.classList.add('is-accent');
    }

    outer.appendChild(inner);
    element.appendChild(outer);
    // Preserve normal word spacing between the inline-block spans.
    if (index < words.length - 1) element.appendChild(document.createTextNode(' '));
    return inner;
  });

  return parts;
}

function initSplitText() {
  const headlines = $$('[data-split-words]');
  if (!headlines.length) return;

  headlines.forEach((headline) => {
    const inners = splitWords(headline);

    if (prefersReducedMotion()) return;

    gsap.set(inners, { yPercent: 106 });

    // The hero headline is revealed by the post-loader entrance timeline,
    // otherwise the trigger would fire while the curtain is still covering it.
    if (headline.closest('.hero')) {
      heroWordTargets.push(...inners);
      return;
    }

    gsap.to(inners, {
      yPercent: 0,
      duration: 1.05,
      ease: 'power4.out',
      stagger: 0.075,
      scrollTrigger: {
        trigger: headline,
        start: 'top 88%',
        once: true,
      },
    });
  });
}

function initReveals() {
  const all = $$('[data-reveal], [data-reveal-card]');
  if (!all.length) return;

  if (prefersReducedMotion()) {
    all.forEach((el) => {
      el.classList.add('is-visible');
      el.classList.add('is-revealed');
    });
    return;
  }

  // Hero items are owned by the entrance timeline that runs after the loader,
  // so the observer must not claim them first.
  const targets = all.filter((el) => !el.closest('.hero'));
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-visible');
        if (el.hasAttribute('data-reveal-card')) el.classList.add('is-revealed');
        observer.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
  );

  targets.forEach((el) => observer.observe(el));
}

function initParallax() {
  if (prefersReducedMotion()) return;

  const heroImg = $('#heroImg');
  const hero = $('.hero');
  if (heroImg && hero) {
    // Scroll moves the plate on `y`; the pointer effect owns xPercent/yPercent.
    gsap.to(heroImg, {
      y: () => -hero.offsetHeight * 0.07,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }

  const contactBg = $('.contact__bg img');
  if (contactBg) {
    gsap.fromTo(
      contactBg,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  }

  // Media parallax: the extra scale provides the headroom, so nothing shifts.
  $$('[data-parallax-media]').forEach((wrapper) => {
    const img = $('img', wrapper);
    if (!img) return;

    gsap.fromTo(
      img,
      { yPercent: -5 },
      {
        yPercent: 5,
        ease: 'none',
        scrollTrigger: { trigger: wrapper, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );
  });

  if (canUsePointerFx()) initHeroPointerFx(heroImg);
}

/* Subtle mouse-responsive drift on the hero plate. */
function initHeroPointerFx(heroImg) {
  if (!heroImg) return;

  const xTo = gsap.quickTo(heroImg, 'xPercent', { duration: 1.1, ease: 'power3.out' });
  const yTo = gsap.quickTo(heroImg, 'yPercent', { duration: 1.1, ease: 'power3.out' });

  window.addEventListener('pointermove', (event) => {
    const nx = event.clientX / window.innerWidth - 0.5;
    const ny = event.clientY / window.innerHeight - 0.5;
    xTo(nx * -2.4);
    yTo(ny * -1.6);
  });
}

/* ══ Marquee ════════════════════════════════════════════════════════════ */
function initMarquee() {
  const track = $('[data-marquee] .marquee__track');
  const set = track ? $('.marquee__set', track) : null;
  if (!track || !set) return;

  // Reduced motion keeps a single set: it wraps instead of scrolling, so no
  // duplicate copy of the text is injected into the accessibility tree.
  if (prefersReducedMotion()) return;

  // A second identical set makes the -50% keyframe loop seamless.
  const clone = set.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.classList.add('marquee__set--clone');
  track.appendChild(clone);

  const viewport = track.parentElement;
  viewport.addEventListener('mouseenter', () => track.classList.add('is-paused'));
  viewport.addEventListener('mouseleave', () => track.classList.remove('is-paused'));
  viewport.addEventListener('focusin', () => track.classList.add('is-paused'));
  viewport.addEventListener('focusout', () => track.classList.remove('is-paused'));
}

/* ══ Custom cursor ══════════════════════════════════════════════════════ */
function initCursor() {
  const cursor = $('#cursor');
  if (!cursor || !canUsePointerFx()) return;

  const dot = $('.cursor__dot', cursor);
  const ring = $('.cursor__ring', cursor);
  if (!dot || !ring) return;

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' });
  const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });

  let shown = false;

  window.addEventListener('pointermove', (event) => {
    if (!shown) {
      shown = true;
      cursor.classList.add('is-active');
    }
    dotX(event.clientX);
    dotY(event.clientY);
    ringX(event.clientX);
    ringY(event.clientY);

    const interactive = event.target.closest?.('a, button, [data-magnetic]');
    cursor.classList.toggle('is-hovering', Boolean(interactive));
  });

  document.addEventListener('pointerleave', () => {
    cursor.classList.remove('is-active');
    shown = false;
  });
}

/* ══ Magnetic buttons ═══════════════════════════════════════════════════ */
function initMagnetic() {
  if (!canUsePointerFx()) return;

  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });

    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      xTo(((event.clientX - rect.left) / rect.width - 0.5) * 12);
      yTo(((event.clientY - rect.top) / rect.height - 0.5) * 8);
    });

    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

/**
 * Last-resort safety net that marks every animated element as visible and
 * neutralises any leftover transform. Keeps the page readable even if an
 * observer, a tween or the intro misbehaves.
 */
function revealEverything() {
  $$('[data-reveal], [data-reveal-card]').forEach((el) => {
    el.classList.add('is-visible', 'is-revealed');
    el.style.opacity = '';
    el.style.transform = '';
  });

  $$('.word__inner').forEach((el) => {
    el.style.transform = '';
  });

  const loader = $('#loader');
  if (loader) {
    loader.remove();
    document.body.classList.remove('is-locked');
  }
}

/* ══ Project detail overlay ═════════════════════════════════════════════ */
function initProjectOverlay() {
  const overlay = $('#overlay');
  if (!overlay) return;

  const panel = $('.overlay__panel', overlay);
  const closeBtn = $('#overlayClose');
  const ctaLink = $('#overlayLink');
  const img = $('#overlayImg');
  const meta = $('#overlayMeta');
  const title = $('#overlayTitle');
  const text = $('#overlayText');
  const tags = $('#overlayTags');

  let lastFocused = null;
  let isOpen = false;

  const trapFocus = (event) => {
    if (event.key !== 'Tab' || !panel) return;
    const focusable = $$('a[href], button:not([disabled])', panel).filter(
      (el) => el.offsetParent !== null
    );
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const open = (id, trigger) => {
    const data = PROJECTS[id];
    if (!data) return;

    lastFocused = trigger || document.activeElement;

    if (img) {
      img.src = data.image;
      img.alt = data.alt;
    }
    if (meta) meta.textContent = data.meta;
    if (title) title.textContent = data.title;
    if (text) text.textContent = data.text;
    if (tags) {
      tags.textContent = '';
      data.tags.forEach((tag) => {
        const li = document.createElement('li');
        li.textContent = tag;
        tags.appendChild(li);
      });
    }

    isOpen = true;
    overlay.hidden = false;
    document.body.classList.add('is-locked');
    if (lenis) lenis.stop();

    requestAnimationFrame(() => overlay.classList.add('is-open'));
    if (closeBtn) closeBtn.focus({ preventScroll: true });
    document.addEventListener('keydown', trapFocus);
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('is-open');
    document.removeEventListener('keydown', trapFocus);
    document.body.classList.remove('is-locked');
    if (lenis) lenis.start();

    window.setTimeout(() => {
      if (!isOpen) overlay.hidden = true;
    }, prefersReducedMotion() ? 0 : 360);

    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus({ preventScroll: true });
    }
  };

  $$('[data-project]').forEach((trigger) => {
    trigger.addEventListener('click', () => open(trigger.dataset.project, trigger));
  });

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (ctaLink) ctaLink.addEventListener('click', close);
  $$('[data-overlay-close]', overlay).forEach((el) => el.addEventListener('click', close));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) close();
  });
}

/* ══ Footer ═════════════════════════════════════════════════════════════ */
function initFooter() {
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
}

/* ══ Bootstrap ══════════════════════════════════════════════════════════ */
async function bootstrap() {
  initNav();
  initScrollSpy();
  initMobileNav();
  initSlidingAnchors();
  initSmoothScroll();
  initSplitText();
  initReveals();
  initParallax();
  initMarquee();
  initCursor();
  initMagnetic();
  initProjectOverlay();
  initFooter();

  // Tells the head guard that the bundle booted, so progressive-enhancement
  // styles stay applied instead of being rolled back.
  window.__obeliskReady = true;

  await initLoader();

  // Hero entrance runs after the curtain lifts, so nothing is missed.
  if (!prefersReducedMotion()) {
    const heroBits = $$('.hero [data-reveal]');
    const tl = gsap.timeline();

    if (heroWordTargets.length) {
      tl.to(heroWordTargets, {
        yPercent: 0,
        duration: 1.05,
        ease: 'power4.out',
        stagger: 0.08,
      });
    }

    if (heroBits.length) {
      tl.to(
        heroBits,
        { opacity: 1, duration: 0.8, ease: 'power2.out', stagger: 0.08, clearProps: 'opacity,transform' },
        0.25
      );
    }
  }

  // Fonts change text metrics, which changes trigger positions.
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());

  // Failsafe: whatever happens to the observers or the intro, nothing is
  // allowed to stay hidden. Content must always end up visible.
  window.setTimeout(revealEverything, 1600);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
