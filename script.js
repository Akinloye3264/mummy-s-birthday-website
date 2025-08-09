/* Global helpers */
const select = (selector, scope = document) => scope.querySelector(selector);
const selectAll = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

/* Current year */
select('#year').textContent = new Date().getFullYear();

/* Gallery data: use each media file exactly once */
const galleryItems = [
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
].map(path => ({
  type: path.toLowerCase().endsWith('.mp4') ? 'video' : 'image',
  src: path,
  alt: path.replace(/[-_]/g, ' ').replace(/\.\w+$/, '')
}));

/* Deduplicate just in case (do not replicate any image) */
const uniqueBySrc = (items) => {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.src)) return false;
    seen.add(item.src);
    return true;
  });
};
const mediaItems = uniqueBySrc(galleryItems);

/* Render gallery */
const grid = select('#gallery-grid');
const fragment = document.createDocumentFragment();
mediaItems.forEach((item, index) => {
  const tile = document.createElement('figure');
  tile.className = 'tile';
  tile.setAttribute('data-index', String(index));

  const button = document.createElement('button');
  button.setAttribute('aria-label', 'Open in viewer');

  if (item.type === 'image') {
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = item.src;
    img.alt = item.alt;
    button.appendChild(img);
  } else {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;
    video.src = item.src;
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
});
grid.appendChild(fragment);

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


