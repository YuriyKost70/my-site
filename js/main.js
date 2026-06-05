(() => {
  const siteHeader = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  const servicesSubnav = document.querySelector('.services-subnav');

  if (siteHeader) {
    const updateHeaderState = () => {
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 12);
    };

    updateHeaderState();
    window.addEventListener('scroll', updateHeaderState, { passive: true });
  }

  if (menuToggle && mainNav) {
    const closeMenu = () => {
      mainNav.classList.remove('is-open');
      document.body.classList.remove('mobile-menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    };

    menuToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      document.body.classList.toggle('mobile-menu-open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    mainNav.addEventListener('click', (event) => {
      if (event.target === mainNav) closeMenu();
    });

    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    servicesSubnav?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const scrollTopButton = document.createElement('button');
  scrollTopButton.className = 'scroll-top-button';
  scrollTopButton.type = 'button';
  scrollTopButton.setAttribute('aria-label', 'Повернутися нагору');
  scrollTopButton.textContent = '↑';
  document.body.append(scrollTopButton);

  const updateScrollTopButton = () => {
    scrollTopButton.classList.toggle('is-visible', window.scrollY > 420);
  };

  scrollTopButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  updateScrollTopButton();
  window.addEventListener('scroll', updateScrollTopButton, { passive: true });

  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroDots = document.querySelectorAll('.hero-dot');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let heroSlideIndex = 0;
  let heroSliderTimer;

  function showHeroSlide(index) {
    if (!heroSlides.length) return;

    heroSlideIndex = (index + heroSlides.length) % heroSlides.length;

    heroSlides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === heroSlideIndex);
    });

    heroDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === heroSlideIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-pressed', String(isActive));
    });
  }

  function startHeroSlider() {
    if (heroSlides.length < 2 || prefersReducedMotion) return;

    clearInterval(heroSliderTimer);
    heroSliderTimer = setInterval(() => {
      showHeroSlide(heroSlideIndex + 1);
    }, 5000);
  }

  heroDots.forEach((dot, index) => {
    dot.setAttribute('aria-pressed', String(index === 0));
    dot.addEventListener('click', () => {
      showHeroSlide(index);
      startHeroSlider();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(heroSliderTimer);
    } else {
      startHeroSlider();
    }
  });

  showHeroSlide(0);
  startHeroSlider();

  const tabs = document.querySelectorAll('.tab');
  const cards = document.querySelectorAll('.project-card');

  tabs.forEach((tab) => {
    tab.setAttribute('aria-pressed', String(tab.classList.contains('active')));

    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter || 'all';

      tabs.forEach((item) => {
        item.classList.remove('active');
        item.setAttribute('aria-pressed', 'false');
      });

      tab.classList.add('active');
      tab.setAttribute('aria-pressed', 'true');

      cards.forEach((card) => {
        const tags = card.dataset.tags || '';
        const visible = filter === 'all' || tags.split(/\s+/).includes(filter);

        card.classList.toggle('is-hidden', !visible);
      });
    });
  });
})();
