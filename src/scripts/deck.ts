// Presentation-deck controller.
//
// Turns the home page's <main data-deck> into a slide deck: each direct child
// section is a slide. This script tracks which slide fills the viewport, marks
// it `.is-current` (which replays that slide's grand entrance via CSS), builds
// a clickable dot rail, drives the per-slide backdrop mood shift, and gives the
// deck real keyboard navigation (arrows / space / Home / End).
//
// Everything is a no-op on pages without <main data-deck> (e.g. the blog), so
// it can live in the shared layout.

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

// A cinematic hue offset applied to the backdrop, one per slide, cycled.
// Kept gentle so each scene shifts mood without muddying the glass cards.
const HUES = [0, 18, -16, 28, -24, 12];

let slides: HTMLElement[] = [];
let rail: HTMLElement | null = null;
let slash: HTMLElement | null = null;
let slashTimer = 0;
/** Guards the slash against firing for the initial slide, or for a repeat. */
let lastSlashed = -1;
let observer: IntersectionObserver | null = null;
let currentIndex = 0;
const ratios = new WeakMap<HTMLElement, number>();

function deckMain(): HTMLElement | null {
  return document.querySelector<HTMLElement>('main[data-deck]');
}

/** Cuts a pair of skewed bars across the screen, the way a game menu would. */
function fireSlash(index: number): void {
  if (!slash || reduce.matches || index === lastSlashed) return;
  lastSlashed = index;

  window.clearTimeout(slashTimer);
  slash.classList.remove('is-firing');
  // Reading layout between the remove and the add restarts the animation
  // instead of letting the browser coalesce the two into no change at all.
  void slash.offsetWidth;
  slash.classList.add('is-firing');
  slashTimer = window.setTimeout(() => slash?.classList.remove('is-firing'), 800);
}

function teardown(): void {
  observer?.disconnect();
  observer = null;
  rail?.remove();
  rail = null;
  window.clearTimeout(slashTimer);
  slash?.remove();
  slash = null;
  lastSlashed = -1;
  slides = [];
  document.documentElement.style.removeProperty('--deck-hue');
}

function setCurrent(index: number): void {
  if (index < 0 || index >= slides.length) return;
  currentIndex = index;

  slides.forEach((slide, i) => slide.classList.toggle('is-current', i === index));

  if (rail) {
    Array.from(rail.children).forEach((dot, i) =>
      dot.setAttribute('aria-current', i === index ? 'true' : 'false'),
    );
  }

  document.documentElement.style.setProperty('--deck-hue', `${HUES[index % HUES.length]}deg`);

  // Anything that wants to stage itself per slide — the 3D character in
  // `lionk.ts`, for one — listens for this instead of duplicating the
  // intersection bookkeeping.
  document.dispatchEvent(
    new CustomEvent('deck:change', { detail: { index, total: slides.length } }),
  );

  fireSlash(index);
}

function goTo(index: number): void {
  const clamped = Math.max(0, Math.min(slides.length - 1, index));
  slides[clamped]?.scrollIntoView({
    behavior: reduce.matches ? 'auto' : 'smooth',
    block: 'start',
  });
  setCurrent(clamped);
}

/**
 * Picks the element whose text names the slide on its rail tab. Sections lead
 * with a short eyebrow ("Tentang", "Proyek") that beats their full heading, but
 * the hero's eyebrow is a whole job title, so take whichever reads shorter.
 */
function labelSourceFor(slide: HTMLElement): Element | null {
  const candidates = [slide.querySelector('.eyebrow'), slide.querySelector('h1, h2')].filter(
    (el): el is Element => !!el?.textContent?.trim(),
  );
  if (candidates.length === 0) return null;
  return candidates.reduce((best, el) =>
    (el.textContent as string).trim().length < (best.textContent as string).trim().length
      ? el
      : best,
  );
}

function buildRail(): void {
  rail = document.createElement('nav');
  rail.className = 'deck-rail';
  rail.setAttribute('aria-label', 'Slide navigation');

  slides.forEach((slide, i) => {
    const source = labelSourceFor(slide);
    const label = source?.textContent?.trim().replace(/\s+/g, ' ') ?? `Slide ${i + 1}`;

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', label);
    dot.setAttribute('aria-current', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => goTo(i));

    // The label sits in its own element so it can be counter-skewed against
    // the slanted tab, and hidden outright when the rail is too narrow.
    const text = document.createElement('span');
    text.textContent = label;
    // Carrying the translation attributes across means the language toggle
    // retitles the rail along with everything else it owns.
    if (source instanceof HTMLElement && source.dataset.i18nId) {
      text.dataset.i18nId = source.dataset.i18nId;
      if (source.dataset.i18nEn) text.dataset.i18nEn = source.dataset.i18nEn;
    }
    dot.appendChild(text);

    rail!.appendChild(dot);
  });

  document.body.appendChild(rail);
}

function onKey(event: KeyboardEvent): void {
  if (!deckMain() || slides.length === 0) return;

  // Never hijack typing in the search field or any editable control.
  const target = event.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  ) {
    return;
  }

  switch (event.key) {
    case 'ArrowDown':
    case 'PageDown':
      event.preventDefault();
      goTo(currentIndex + 1);
      break;
    case 'ArrowUp':
    case 'PageUp':
      event.preventDefault();
      goTo(currentIndex - 1);
      break;
    case ' ':
      event.preventDefault();
      goTo(currentIndex + (event.shiftKey ? -1 : 1));
      break;
    case 'Home':
      event.preventDefault();
      goTo(0);
      break;
    case 'End':
      event.preventDefault();
      goTo(slides.length - 1);
      break;
    default:
      break;
  }
}

function init(): void {
  teardown();

  const main = deckMain();
  if (!main) return;

  slides = Array.from(main.children).filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );
  if (slides.length === 0) return;

  // Number each slide's elements in document order so the CSS can stagger
  // their entrance without hard-coding one nth-child rule per component.
  slides.forEach((slide) => {
    slide
      .querySelectorAll<HTMLElement>('.reveal, .project-card')
      .forEach((el, i) => el.style.setProperty('--enter-index', String(i)));
  });

  slash = document.createElement('div');
  slash.className = 'deck-slash';
  slash.setAttribute('aria-hidden', 'true');
  slash.append(document.createElement('span'), document.createElement('span'));
  document.body.appendChild(slash);

  buildRail();
  // The first slide arrives with the entrance cascade, not with a slash.
  lastSlashed = 0;
  setCurrent(0);

  // The slide holding the largest share of the viewport is the active one.
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => ratios.set(entry.target as HTMLElement, entry.intersectionRatio));

      let bestIndex = currentIndex;
      let bestRatio = -1;
      slides.forEach((slide, i) => {
        const r = ratios.get(slide) ?? 0;
        if (r > bestRatio) {
          bestRatio = r;
          bestIndex = i;
        }
      });

      if (bestRatio >= 0.4 && bestIndex !== currentIndex) setCurrent(bestIndex);
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  );

  slides.forEach((slide) => observer!.observe(slide));
}

document.addEventListener('keydown', onKey);
document.addEventListener('astro:page-load', init);
// Tear the rail and observer down before ClientRouter swaps the page out.
document.addEventListener('astro:before-swap', teardown);

if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init);
