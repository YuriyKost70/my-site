(() => {
  const track = document.querySelector('.project-example-track');
  const slides = [...document.querySelectorAll('.project-example-slide')];
  const sliderPrev = document.querySelector('[data-slider-prev]');
  const sliderNext = document.querySelector('[data-slider-next]');
  const sliderCounter = document.querySelector('.project-example-counter');
  const preview = document.querySelector('.project-example-preview');
  const previewImage = preview?.querySelector('img');
  const previewCaption = preview?.querySelector('figcaption');
  const previewCounter = preview?.querySelector('.project-example-preview-counter');
  const previewClose = preview?.querySelector('.project-example-preview-close');
  const previewPrev = preview?.querySelector('[data-preview-prev]');
  const previewNext = preview?.querySelector('[data-preview-next]');
  let currentPreviewIndex = 0;

  function getVisibleSlides() {
    if (!track) return 1;

    return Number.parseInt(getComputedStyle(track).getPropertyValue('--visible-slides'), 10) || 1;
  }

  function getSlideStep() {
    if (!track || !slides.length) return 0;

    const firstSlide = slides[0];
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0;
    return firstSlide.getBoundingClientRect().width + gap;
  }

  function getSliderIndex() {
    const step = getSlideStep();
    if (!track || !step) return 0;

    return Math.round(track.scrollLeft / step);
  }

  function updateSliderControls() {
    if (!track || !slides.length || !sliderCounter) return;

    const visible = getVisibleSlides();
    const firstVisible = Math.min(getSliderIndex() + 1, slides.length);
    const lastVisible = Math.min(firstVisible + visible - 1, slides.length);

    sliderCounter.textContent = `${firstVisible}-${lastVisible} / ${slides.length}`;

    if (sliderPrev) sliderPrev.disabled = firstVisible <= 1;
    if (sliderNext) sliderNext.disabled = lastVisible >= slides.length;
  }

  function scrollSlider(direction) {
    if (!track) return;

    track.scrollBy({ left: getSlideStep() * direction, behavior: 'smooth' });
    window.setTimeout(updateSliderControls, 320);
  }

  function updatePreview(index) {
    if (!previewImage || !previewCaption || !previewCounter || !slides.length) return;

    currentPreviewIndex = (index + slides.length) % slides.length;
    const slide = slides[currentPreviewIndex];
    const src = slide.dataset.previewSrc;
    const title = slide.dataset.previewTitle || slide.textContent.trim();

    if (!src) return;

    previewImage.src = src;
    previewImage.alt = title;
    previewCaption.textContent = title;
    previewCounter.textContent = `${currentPreviewIndex + 1} / ${slides.length}`;
  }

  function openPreview(index) {
    if (!preview || !slides.length) return;

    if (!slides[index]?.dataset.previewSrc) return;

    updatePreview(index);
    preview.classList.add('is-open');
    preview.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closePreview() {
    if (!preview) return;

    preview.classList.remove('is-open');
    preview.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  sliderPrev?.addEventListener('click', () => scrollSlider(-1));
  sliderNext?.addEventListener('click', () => scrollSlider(1));
  track?.addEventListener('scroll', () => window.requestAnimationFrame(updateSliderControls));
  window.addEventListener('resize', updateSliderControls);

  slides.forEach((slide, index) => {
    slide.addEventListener('click', () => openPreview(index));
  });

  previewClose?.addEventListener('click', closePreview);
  previewPrev?.addEventListener('click', () => updatePreview(currentPreviewIndex - 1));
  previewNext?.addEventListener('click', () => updatePreview(currentPreviewIndex + 1));

  preview?.addEventListener('click', (event) => {
    if (event.target === preview) closePreview();
  });

  document.addEventListener('keydown', (event) => {
    if (!preview?.classList.contains('is-open')) return;

    if (event.key === 'Escape') closePreview();
    if (event.key === 'ArrowLeft') updatePreview(currentPreviewIndex - 1);
    if (event.key === 'ArrowRight') updatePreview(currentPreviewIndex + 1);
  });

  updateSliderControls();
})();
