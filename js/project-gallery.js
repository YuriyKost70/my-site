(() => {
  const galleryButtons = [...document.querySelectorAll('.gallery-item')].filter((button) => button.querySelector('img'));
  const lightbox = document.querySelector('.project-lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxCounter = lightbox?.querySelector('.lightbox-counter');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');
  const lightboxPrev = lightbox?.querySelector('.lightbox-prev');
  const lightboxNext = lightbox?.querySelector('.lightbox-next');
  const planCompare = document.querySelector('[data-plan-compare]');
  const planCompareRange = planCompare?.querySelector('.detail-plan-range');

  function updatePlanCompare(value) {
    if (!planCompare) return;

    const position = Math.min(100, Math.max(0, Number(value) || 0));
    const positionNumber = Math.max(position / 100, 0.01);
    planCompare.style.setProperty('--compare-position', `${position}%`);
    planCompare.style.setProperty('--compare-position-number', positionNumber);
  }

  if (planCompareRange) {
    updatePlanCompare(planCompareRange.value);
    planCompareRange.addEventListener('input', (event) => updatePlanCompare(event.target.value));
  }

  const galleryImages = galleryButtons.map((button) => {
    const img = button.querySelector('img');

    return {
      src: img?.dataset.fullSrc || img?.getAttribute('src') || '',
      alt: img?.getAttribute('alt') || 'Візуалізація проєкту'
    };
  });

  let currentGalleryIndex = 0;

  function updateLightbox(index) {
    if (!lightbox || !lightboxImage || !lightboxCounter || !galleryImages.length) return;

    currentGalleryIndex = (index + galleryImages.length) % galleryImages.length;
    const currentImage = galleryImages[currentGalleryIndex];

    lightboxImage.src = currentImage.src;
    lightboxImage.alt = currentImage.alt;
    lightboxCounter.textContent = `${currentGalleryIndex + 1} / ${galleryImages.length}`;
  }

  function openLightbox(index) {
    if (!lightbox || !galleryImages.length) return;

    updateLightbox(index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;

    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (!galleryImages.length) {
    lightbox?.setAttribute('hidden', '');
  }

  galleryButtons.forEach((button, index) => {
    const img = button.querySelector('img');

    img?.addEventListener('error', () => {
      if (!img.dataset.fullSrc || img.src.endsWith(img.dataset.fullSrc)) return;
      img.src = img.dataset.fullSrc;
    }, { once: true });

    button.addEventListener('click', () => openLightbox(index));
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', () => updateLightbox(currentGalleryIndex - 1));
  lightboxNext?.addEventListener('click', () => updateLightbox(currentGalleryIndex + 1));

  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox?.classList.contains('is-open')) return;

    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') updateLightbox(currentGalleryIndex - 1);
    if (event.key === 'ArrowRight') updateLightbox(currentGalleryIndex + 1);
  });

  document.querySelectorAll('.project-detail-page img, .project-lightbox img').forEach((img) => {
    img.addEventListener('contextmenu', (event) => event.preventDefault());
    img.addEventListener('dragstart', (event) => event.preventDefault());
  });
})();
