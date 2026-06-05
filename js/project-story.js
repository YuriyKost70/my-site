(() => {
  const zones = [...document.querySelectorAll('.project-zone')];
  const lightbox = document.querySelector('[data-story-lightbox]');
  const lightboxImage = document.querySelector('[data-story-lightbox-image]');
  const lightboxClose = document.querySelector('[data-story-lightbox-close]');
  const lightboxPrev = document.querySelector('[data-story-lightbox-prev]');
  const lightboxNext = document.querySelector('[data-story-lightbox-next]');
  const galleryImages = [...document.querySelectorAll('.project-zone-slide img')];
  let currentImageIndex = 0;

  zones.forEach((zone) => {
    const slider = zone.querySelector('[data-story-slider]');
    const prev = zone.querySelector('[data-story-slider-prev]');
    const next = zone.querySelector('[data-story-slider-next]');
    const counter = zone.querySelector('[data-story-slider-counter]');
    const slides = [...zone.querySelectorAll('.project-zone-slide')];

    if (!slider || !slides.length) return;

    function getIndex() {
      const width = slider.getBoundingClientRect().width || 1;
      return Math.round(slider.scrollLeft / width);
    }

    function updateControls() {
      const index = getIndex();

      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= slides.length - 1;
      if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
    }

    function scrollToSlide(direction) {
      const width = slider.getBoundingClientRect().width;
      slider.scrollBy({ left: width * direction, behavior: 'smooth' });
      window.setTimeout(updateControls, 350);
    }

    prev?.addEventListener('click', () => scrollToSlide(-1));
    next?.addEventListener('click', () => scrollToSlide(1));
    slider.addEventListener('scroll', () => window.requestAnimationFrame(updateControls));
    window.addEventListener('resize', updateControls);

    updateControls();
  });

  function updateLightbox(index) {
    if (!lightboxImage || !galleryImages.length) return;

    currentImageIndex = (index + galleryImages.length) % galleryImages.length;
    const image = galleryImages[currentImageIndex];

    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || '';
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

  galleryImages.forEach((image, index) => {
    image.tabIndex = 0;
    image.addEventListener('click', () => openLightbox(index));
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(index);
      }
    });
  });

  lightboxClose?.addEventListener('click', closeLightbox);
  lightboxPrev?.addEventListener('click', () => updateLightbox(currentImageIndex - 1));
  lightboxNext?.addEventListener('click', () => updateLightbox(currentImageIndex + 1));

  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox?.classList.contains('is-open')) return;

    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') updateLightbox(currentImageIndex - 1);
    if (event.key === 'ArrowRight') updateLightbox(currentImageIndex + 1);
  });
})();
