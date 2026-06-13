(() => {
  const siteHeader = document.querySelector('.site-header');
  const headerInner = siteHeader?.querySelector('.header-inner');
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  const servicesSubnav = document.querySelector('.services-subnav');
  const navLanguageSwitch = mainNav?.querySelector('.language-switch');

  if (headerInner && menuToggle && navLanguageSwitch) {
    const mobileLanguageSwitch = navLanguageSwitch.cloneNode(true);
    mobileLanguageSwitch.classList.add('mobile-language-switch');
    mobileLanguageSwitch.setAttribute('aria-label', navLanguageSwitch.getAttribute('aria-label') || 'Language');
    headerInner.insertBefore(mobileLanguageSwitch, menuToggle);
  }

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
  scrollTopButton.setAttribute(
    'aria-label',
    document.documentElement.lang === 'en' ? 'Back to top' : 'Повернутися нагору'
  );
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

  document.querySelectorAll('.project-tabs').forEach((tabsContainer) => {
    const projectsSection = tabsContainer.closest('.projects');
    const grid = projectsSection?.querySelector('.project-grid');
    if (!grid) return;

    const tabs = [...tabsContainer.querySelectorAll('.tab')];
    const cards = [...grid.querySelectorAll('.project-card')];
    const configuredLimit = Number.parseInt(grid.dataset.visibleLimit || '', 10);
    const visibleLimit = Number.isFinite(configuredLimit) ? configuredLimit : Number.POSITIVE_INFINITY;

    const applyProjectFilter = (filter) => {
      let visibleCount = 0;

      cards.forEach((card) => {
        const tags = (card.dataset.tags || '').split(/\s+/);
        const matchesFilter = filter === 'all' || tags.includes(filter);
        const visible = matchesFilter && visibleCount < visibleLimit;

        card.classList.toggle('is-hidden', !visible);
        if (visible) visibleCount += 1;
      });
    };

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
        applyProjectFilter(filter);
      });
    });

    const initialFilter = tabs.find((tab) => tab.classList.contains('active'))?.dataset.filter || 'all';
    applyProjectFilter(initialFilter);
  });
})();
