/* Global helpers */
const select = (selector, scope = document) => scope.querySelector(selector);
const selectAll = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/* Current year */
select('#year').textContent = new Date().getFullYear();

/* Gallery data and ordering: list all media once; newest first automatically */
// Put any newly added filenames here to force them to the very top
const NEW_MEDIA_FIRST = [
  // Newly added custom photos (shown first, in this exact order)
  'IMG-20250809-WA0058.jpg',
  'IMG-20250809-WA0056.jpg',
  'IMG-20250809-WA0059.jpg',
  'malle.jpg',
  'mum nd tiwa.jpg',
  'mum nd tiwa2.jpg',
  'mum1.jpg',
  'IMG-20250809-WA0047.jpg',
  'IMG-20250809-WA0046.jpg',
  'IMG-20250809-WA0045.jpg',
  'IMG-20250809-WA0044.jpg',
  'IMG-20250809-WA0043.jpg',
  'IMG-20250809-WA0042.jpg',
  'IMG-20250809-WA0041.jpg',
  'mum2.jpg',
  'mum and abbey.jpg',
  'mum3.jpg',
  'mum4.jpg',
  'tinu.jpg',
  'tinu2.jpg',
  'IMG-20250809-WA0057.jpg',
  'IMG-20250809-WA0055.jpg',
  'IMG-20250809-WA0051.jpg',
  'IMG-20250809-WA0050.jpg',
  'IMG-20250809-WA0049.jpg',
  'IMG-20250809-WA0052.jpg',
  'IMG-20250809-WA0048.jpg',
  'IMG-20250809-WA0054.jpg',
  'IMG-20250809-WA0053.jpg',
];

// Base media list (existing files in the project)
const BASE_MEDIA = [
  // Images
  'IMG-20250809-WA0007.jpg','IMG-20250809-WA0008.jpg','IMG-20250809-WA0009.jpg','IMG-20250809-WA0010.jpg',
  'IMG-20250809-WA0011.jpg','IMG-20250809-WA0012.jpg','IMG-20250809-WA0013.jpg','IMG-20250809-WA0014.jpg',
  'IMG-20250809-WA0015.jpg','IMG-20250809-WA0016.jpg','IMG-20250809-WA0017.jpg','IMG-20250809-WA0018.jpg',
  'IMG-20250809-WA0019.jpg','IMG-20250809-WA0020.jpg','IMG-20250809-WA0021.jpg','IMG-20250809-WA0022.jpg',
  'IMG-20250809-WA0023.jpg','IMG-20250809-WA0024.jpg','IMG-20250809-WA0025.jpg','IMG-20250809-WA0026.jpg',
  'IMG-20250809-WA0027.jpg','IMG-20250809-WA0028.jpg','IMG-20250809-WA0029.jpg','IMG-20250809-WA0030.jpg',
  'IMG-20250809-WA0031.jpg','IMG-20250809-WA0032.jpg','IMG-20250809-WA0033.jpg','IMG-20250809-WA0034.jpg',
  'IMG-20250809-WA0035.jpg','IMG-20250809-WA0036.jpg','IMG-20250809-WA0037.jpg','IMG-20250809-WA0038.jpg',
  // Videos
  'VID-20250809-WA0003.mp4','VID-20250809-WA0004.mp4','VID-20250809-WA0005.mp4'
];

// Combine and de-duplicate maintaining order (NEW_MEDIA_FIRST first)
const combinedNames = [...NEW_MEDIA_FIRST, ...BASE_MEDIA];
const uniqueNames = Array.from(new Set(combinedNames));

let mediaItems = uniqueNames.map(path => ({
  type: path.toLowerCase().endsWith('.mp4') ? 'video' : 'image',
  src: path,
  alt: path.replace(/[-_]/g, ' ').replace(/\.\w+$/, '')
}));

// Mix new images throughout the gallery instead of placing them first
const prioritySet = new Set(NEW_MEDIA_FIRST);
function extractNumericOrder(src) {
  const wa = src.match(/WA(\d+)/i);
  if (wa) return Number(wa[1]);
  const nums = src.match(/(\d+)/g);
  return nums ? Number(nums[nums.length - 1]) : -Infinity;
}
const baseItems = mediaItems.filter(item => !prioritySet.has(item.src));
const newItems = mediaItems.filter(item => prioritySet.has(item.src));

// Sort base items (existing gallery) by inferred recency descending for a pleasant order
baseItems.sort((a, b) => (extractNumericOrder(b.src) - extractNumericOrder(a.src)) || a.src.localeCompare(b.src));

// Randomly generate unique insertion positions to scatter new items among base
function generateUniquePositions(count, max) {
  const set = new Set();
  while (set.size < Math.min(count, max + 1)) {
    set.add(Math.floor(Math.random() * (max + 1)));
  }
  return Array.from(set).sort((a, b) => a - b);
}

const positions = generateUniquePositions(newItems.length, baseItems.length);
const mixed = [...baseItems];
positions.forEach((pos, idx) => {
  mixed.splice(pos + idx, 0, newItems[idx]);
});

mediaItems = mixed;

/* Render gallery with skeletons, IntersectionObserver lazy load, and fade-in */
const grid = select('#gallery-grid');
const fragment = document.createDocumentFragment();

// Prepare observer for lazy loading
const lazyObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const tile = entry.target;
    const media = tile.querySelector('img,video');
    if (!media) return;

    // Set fetch priority for first rows
    const tileIndex = Number(tile.getAttribute('data-index')) || 0;
    if (media.tagName === 'IMG') {
      if (tileIndex < 6) media.setAttribute('fetchpriority', 'high');
      else media.setAttribute('fetchpriority', 'low');
      media.src = media.dataset.src;
    } else {
      media.preload = 'metadata';
      media.src = media.dataset.src;
    }

    // Unobserve once we start loading
    lazyObserver.unobserve(tile);
  });
}, { rootMargin: '300px 0px' });

let firstPaintTimeout = null;

mediaItems.forEach((item, index) => {
  const tile = document.createElement('figure');
  tile.className = 'tile is-loading';
  tile.setAttribute('data-index', String(index));

  const button = document.createElement('button');
  button.setAttribute('aria-label', 'Open in viewer');

  if (item.type === 'image') {
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.dataset.src = item.src; // set later via observer
    img.alt = item.alt;
    img.addEventListener('load', () => {
      tile.classList.remove('is-loading');
      tile.classList.add('is-ready');
    });
    button.appendChild(img);
  } else {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.autoplay = false; // load on demand only
    video.loop = true;
    video.dataset.src = item.src; // set later via observer
    video.addEventListener('loadeddata', () => {
      tile.classList.remove('is-loading');
      tile.classList.add('is-ready');
    });
    button.appendChild(video);

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = 'Video';
    tile.appendChild(badge);
  }

  const overlay = document.createElement('span');
  overlay.className = 'overlay';
  button.appendChild(overlay);

  tile.appendChild(button);
  fragment.appendChild(tile);

  // Observe for lazy loading
  lazyObserver.observe(tile);
});
grid.appendChild(fragment);

// Reveal grid quickly so skeletons show immediately (avoid white page)
firstPaintTimeout = setTimeout(() => {
  grid.classList.add('ready');
  clearTimeout(firstPaintTimeout);
}, 150);

/* Lightbox */
const lightbox = select('#lightbox');
const lightboxContent = select('#lightbox-content');
const closeBtn = select('.lightbox-close');
const prevBtn = select('.lightbox-prev');
const nextBtn = select('.lightbox-next');
let currentIndex = -1;

function openLightbox(index) {
  currentIndex = index;
  const item = mediaItems[currentIndex];
  if (!item) return;

  lightboxContent.innerHTML = '';
  if (item.type === 'image') {
    const img = document.createElement('img');
    img.src = item.src;
    img.alt = item.alt;
    lightboxContent.appendChild(img);
  } else {
    const video = document.createElement('video');
    video.src = item.src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    lightboxContent.appendChild(video);
  }

  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxContent.innerHTML = '';
  currentIndex = -1;
}

function showNext(delta) {
  if (currentIndex < 0) return;
  const len = mediaItems.length;
  const next = (currentIndex + delta + len) % len;
  openLightbox(next);
}

grid.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  const tile = e.target.closest('.tile');
  if (!button || !tile) return;
  const index = Number(tile.getAttribute('data-index'));
  openLightbox(index);
});

closeBtn.addEventListener('click', closeLightbox);
prevBtn.addEventListener('click', () => showNext(-1));
nextBtn.addEventListener('click', () => showNext(1));

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') showNext(1);
  if (e.key === 'ArrowLeft') showNext(-1);
});

/* Smooth scroll for in-page links */
selectAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const target = select(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});


