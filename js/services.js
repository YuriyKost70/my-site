(() => {
  const preview = document.querySelector('.project-example-preview');
  const previewImage = preview?.querySelector('img');
  const previewCaption = preview?.querySelector('figcaption');
  const previewClose = preview?.querySelector('.project-example-preview-close');
  const sampleButtons = document.querySelectorAll('.project-example-item');

  function closePreview() {
    if (!preview) return;

    preview.classList.remove('is-open');
    preview.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  sampleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (!preview || !previewImage || !previewCaption) return;

      const src = button.dataset.previewSrc;
      const title = button.dataset.previewTitle || button.textContent.trim();

      if (!src) return;

      previewImage.src = src;
      previewImage.alt = title;
      previewCaption.textContent = title;
      preview.classList.add('is-open');
      preview.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });

  previewClose?.addEventListener('click', closePreview);
  preview?.addEventListener('click', (event) => {
    if (event.target === preview) closePreview();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePreview();
  });
})();
