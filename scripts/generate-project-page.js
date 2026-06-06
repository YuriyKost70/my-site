const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const projectsRoot = path.join(root, 'assets', 'projects');
const imageExt = /\.(jpe?g|png|webp)$/i;

const args = process.argv.slice(2);
const projectArg = readArg('--project') || 'project-interior-apartment-001';
const watchMode = args.includes('--watch');
const updateProjects = !args.includes('--no-projects');

const dictionary = {
  uk: {
    htmlLang: 'uk',
    navLabel: 'Головне меню',
    openMenu: 'Відкрити меню',
    home: 'Головна',
    services: 'Послуги',
    projects: 'Проєкти',
    contacts: 'Контакти',
    consultation: 'Замовити консультацію',
    languageVersion: 'Версія сайту',
    planBefore: 'До зміни',
    planAfter: 'Після зміни',
    planBeforeAlt: 'Планування до зміни',
    planAfterAlt: 'Планування після зміни',
    planRange: 'Порівняти планування до та після зміни',
    contactKicker: 'Контакти',
    contactTitle: 'Розкажіть про свій проєкт',
    contactText: 'Опишіть простір, який ви хочете створити, і ми обговоримо формат роботи.',
    name: 'Ваше ім’я',
    phone: 'Телефон',
    email: 'Email',
    objectType: 'Тип об’єкта',
    interior: 'Інтер’єр',
    exterior: 'Екстер’єр',
    residential: 'Житловий об’єкт',
    commercial: 'Комерційний простір',
    message: 'Коротко опишіть задачу',
    send: 'Надіслати заявку',
    footerText: 'YVK Design — дизайн інтер’єрів, екстер’єрів та комерційних просторів.',
    city: 'м. Суми, Україна',
    close: 'Закрити перегляд',
    prev: 'Попереднє зображення',
    next: 'Наступне зображення',
    visualization: 'Візуалізація проєкту',
    viewProject: 'Дивитися проєкт'
  },
  en: {
    htmlLang: 'en',
    navLabel: 'Main menu',
    openMenu: 'Open menu',
    home: 'Home',
    services: 'Services',
    projects: 'Projects',
    contacts: 'Contacts',
    consultation: 'Book a consultation',
    languageVersion: 'Site version',
    planBefore: 'Before',
    planAfter: 'After',
    planBeforeAlt: 'Planning before changes',
    planAfterAlt: 'Planning after changes',
    planRange: 'Compare planning before and after changes',
    contactKicker: 'Contacts',
    contactTitle: 'Tell us about your project',
    contactText: 'Describe the space you want to create, and we will discuss the right format of work.',
    name: 'Your name',
    phone: 'Phone',
    email: 'Email',
    objectType: 'Object type',
    interior: 'Interior',
    exterior: 'Exterior',
    residential: 'Residential object',
    commercial: 'Commercial space',
    message: 'Briefly describe the task',
    send: 'Send request',
    footerText: 'YVK Design — interior, exterior and commercial space design.',
    city: 'Sumy, Ukraine',
    close: 'Close preview',
    prev: 'Previous image',
    next: 'Next image',
    visualization: 'Project visualization',
    viewProject: 'View project'
  }
};

function readArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function relUrl(fullPath) {
  return path.relative(root, fullPath)
    .replaceAll('\\', '/')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Required text is missing: ${field}`);
  }
}

function heroLines(value, lang) {
  const resolved = localized(value, lang);
  const lines = (Array.isArray(resolved) ? resolved : String(resolved).split(/\r?\n/))
    .map((line) => String(line).trim())
    .filter(Boolean);

  if (lines.length > 2) {
    throw new Error(`Hero field must contain no more than two lines: hero (${lang})`);
  }

  return lines;
}

function validateConfig(config, projectDir) {
  if (config.schema !== 'yvk-project-auto-v1') {
    throw new Error('Unsupported or missing project schema: expected yvk-project-auto-v1');
  }

  if (typeof config.output === 'string') {
    assertText(config.output, 'output');
  } else {
    assertText(config.output?.uk, 'output.uk');
  }
  assertText(config.paths?.cover, 'paths.cover');
  assertText(config.paths?.planningBefore, 'paths.planningBefore');
  assertText(config.paths?.planningAfter, 'paths.planningAfter');
  assertText(config.paths?.galleryDir, 'paths.galleryDir');
  assertText(config.hero?.left?.uk, 'hero.left.uk');
  assertText(config.hero?.right?.uk, 'hero.right.uk');
  assertText(config.hero?.imageAlt?.uk, 'hero.imageAlt.uk');
  assertText(config.info?.kicker?.uk, 'info.kicker.uk');
  assertText(config.info?.heading?.uk, 'info.heading.uk');

  heroLines(config.hero.left, 'uk');
  heroLines(config.hero.right, 'uk');

  if (!Array.isArray(config.info?.paragraphs?.uk) || !config.info.paragraphs.uk.length) {
    throw new Error('At least one Ukrainian project description paragraph is required: info.paragraphs.uk');
  }

  config.info.paragraphs.uk.forEach((paragraph, index) => {
    assertText(paragraph, `info.paragraphs.uk[${index}]`);
  });

  if (!Array.isArray(config.info?.meta) || !config.info.meta.length) {
    throw new Error('At least one project fact is required: info.meta');
  }

  config.info.meta.forEach((item, index) => {
    assertText(item?.label?.uk, `info.meta[${index}].label.uk`);
    assertText(item?.value?.uk, `info.meta[${index}].value.uk`);
  });

  [
    config.paths.cover,
    config.paths.planningBefore,
    config.paths.planningAfter,
    config.paths.galleryDir
  ].forEach((relativePath) => {
    if (!fs.existsSync(path.join(projectDir, relativePath))) {
      throw new Error(`Project path does not exist: ${relativePath}`);
    }
  });
}

function localized(value, lang) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    return value[lang] || value.uk || value.en || Object.values(value).find((item) => typeof item === 'string' && item.trim()) || '';
  }
  return String(value);
}

function localizedArray(value, lang) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  const direct = value[lang];
  if (Array.isArray(direct) && direct.length) return direct;
  if (Array.isArray(value.uk) && value.uk.length) return value.uk;
  if (Array.isArray(value.en) && value.en.length) return value.en;
  return Object.values(value).find((item) => Array.isArray(item) && item.length) || [];
}

function leadingNumber(name) {
  const match = name.match(/^\s*(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function lastNumber(name) {
  const match = name.match(/(\d+)(?!.*\d)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function splitFolderTitle(folderName) {
  const withoutNumber = folderName.replace(/^\s*\d+\s*[-_.]*\s*/, '').trim();
  const [ukRaw, enRaw = ''] = withoutNumber.split(/\s*__\s*/);
  const normalize = (text) => text.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

  return {
    uk: normalize(ukRaw).toLocaleUpperCase('uk-UA'),
    en: normalize(enRaw).toLocaleUpperCase('en-US')
  };
}

function imageFilesByNumber(dir) {
  if (!fs.existsSync(dir)) return new Map();

  const files = fs.readdirSync(dir)
    .filter((name) => imageExt.test(name))
    .sort((a, b) => lastNumber(a) - lastNumber(b) || a.localeCompare(b))
    .map((name) => [lastNumber(name), path.join(dir, name)]);

  const result = new Map();
  for (const [number, filePath] of files) {
    if (result.has(number)) {
      throw new Error(`Duplicate image number ${number} in ${path.relative(root, dir)}`);
    }
    result.set(number, filePath);
  }

  return result;
}

function outputFor(config, lang) {
  if (typeof config.output === 'string') return config.output;
  return config.output?.[lang] || config.output?.uk || `${projectArg}-${lang}.html`;
}

function buildLanguageSwitch(config, lang) {
  const languageLinks = config.languageLinks || {};
  const ukHref = languageLinks.uk || outputFor(config, 'uk');
  const enHref = languageLinks.en || outputFor(config, 'en');

  return `<div class="language-switch" aria-label="${escapeHtml(dictionary[lang].languageVersion)}">
          <a class="${lang === 'uk' ? 'is-active' : ''}" href="${escapeHtml(ukHref)}" ${lang === 'uk' ? 'aria-current="page"' : ''}>UA</a>
          <a class="${lang === 'en' ? 'is-active' : ''}" href="${escapeHtml(enHref)}" ${lang === 'en' ? 'aria-current="page"' : ''}>EN</a>
        </div>`;
}

function buildGallery(projectDir, galleryDirName, lang) {
  const galleryRoot = path.join(projectDir, galleryDirName);
  if (!fs.existsSync(galleryRoot)) return { html: '', firstImage: '', count: 0 };

  let imageCount = 0;
  let firstImage = '';
  let renderedZoneIndex = 0;

  const zones = fs.readdirSync(galleryRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => leadingNumber(a.name) - leadingNumber(b.name) || a.name.localeCompare(b.name, 'uk'))
    .map((entry) => {
      const zonePath = path.join(galleryRoot, entry.name);
      const preview = imageFilesByNumber(path.join(zonePath, 'preview'));
      const full = imageFilesByNumber(path.join(zonePath, 'full'));
      const previewNumbers = [...preview.keys()].sort((a, b) => a - b);
      const fullNumbers = [...full.keys()].sort((a, b) => a - b);
      const onlyPreview = previewNumbers.filter((number) => !full.has(number));
      const onlyFull = fullNumbers.filter((number) => !preview.has(number));

      if (onlyPreview.length || onlyFull.length) {
        throw new Error(
          `Preview/full mismatch in ${entry.name}: ` +
          `preview only [${onlyPreview.join(', ')}], full only [${onlyFull.join(', ')}]`
        );
      }

      if (!previewNumbers.length) return '';

      const zoneIndex = renderedZoneIndex;
      renderedZoneIndex += 1;
      const title = splitFolderTitle(entry.name);
      const displayTitle = (lang === 'en' && title.en) ? title.en : title.uk;
      const id = `gallery-zone-${String(zoneIndex + 1).padStart(2, '0')}`;
      const layoutPattern = previewNumbers.length === 1
        ? 'gallery-layout-single'
        : previewNumbers.length === 2
          ? 'gallery-layout-pair'
          : ['gallery-pattern-a', 'gallery-pattern-b', 'gallery-pattern-c'][zoneIndex % 3];
      const tailSize = previewNumbers.length % 6;
      const tailClass = previewNumbers.length > 2 && tailSize ? ` gallery-tail-${tailSize}` : '';

      const buttons = previewNumbers.map((number) => {
        const previewPath = preview.get(number);
        const fullPath = full.get(number);

        imageCount += 1;
        if (!firstImage) firstImage = fullPath;

        const label = `${displayTitle} ${String(imageCount).padStart(2, '0')}`;
        return `          <button class="gallery-item" type="button" aria-label="${escapeHtml(label)}">
            <img loading="lazy" decoding="async" src="${relUrl(previewPath)}" data-full-src="${relUrl(fullPath)}" alt="${escapeHtml(label)}" draggable="false" />
          </button>`;
      }).filter(Boolean).join('\n');

      return `        <section class="detail-gallery-zone" id="${id}" data-gallery-folder="${escapeHtml(entry.name)}" data-title-uk="${escapeHtml(title.uk)}" data-title-en="${escapeHtml(title.en)}">
          <div class="detail-gallery-zone-head">
            <h2>${escapeHtml(displayTitle)}</h2>
          </div>
          <div class="detail-gallery-grid gallery-layout-auto ${layoutPattern}${tailClass}" data-image-count="${previewNumbers.length}" aria-label="${escapeHtml(displayTitle)}">
${buttons}
          </div>
        </section>`;
    })
    .filter(Boolean);

  return {
    html: zones.join('\n\n'),
    firstImage: firstImage ? relUrl(firstImage) : '',
    count: imageCount
  };
}

function withBreaks(value, lang) {
  return heroLines(value, lang).map(escapeHtml).join('<br>');
}

function renderPage(config, projectDir, lang) {
  const t = dictionary[lang] || dictionary.uk;
  const cover = relUrl(path.join(projectDir, config.paths.cover));
  const planBefore = relUrl(path.join(projectDir, config.paths.planningBefore));
  const planAfter = relUrl(path.join(projectDir, config.paths.planningAfter));
  const gallery = buildGallery(projectDir, config.paths.galleryDir, lang);
  const lightboxImage = gallery.firstImage || cover;

  return `<!DOCTYPE html>
<html lang="${escapeHtml(t.htmlLang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(localized(config.seo, lang).title || localized(config.seo, 'uk').title)}</title>
  <meta name="description" content="${escapeHtml(localized(config.seo, lang).description || localized(config.seo, 'uk').description)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/style.css" />
  <link rel="stylesheet" href="css/project-detail.css" />
</head>
<body class="project-detail-page">
  <header class="site-header project-detail-header">
    <div class="container header-inner">
      <a href="index.html" class="logo" aria-label="YVK Design">
        <img src="assets/logo/yvk-logo.svg" alt="YVK Design" />
      </a>

      <button class="menu-toggle" type="button" aria-label="${escapeHtml(t.openMenu)}" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>

      <nav class="main-nav" aria-label="${escapeHtml(t.navLabel)}">
        <a href="index.html#home">${escapeHtml(t.home)}</a>
        <a href="services.html">${escapeHtml(t.services)}</a>
        <a href="projects.html">${escapeHtml(t.projects)}</a>
        <a href="contact.html">${escapeHtml(t.contacts)}</a>
        ${buildLanguageSwitch(config, lang)}
      </nav>

      <div class="header-actions">
        <a class="btn btn-secondary" href="contact.html">${escapeHtml(t.consultation)}</a>
      </div>
    </div>
  </header>

  <main>
    <section class="detail-hero">
      <img src="${cover}" alt="${escapeHtml(localized(config.hero.imageAlt, lang))}" draggable="false" />
      <div class="detail-hero-overlay"></div>
      <div class="container detail-hero-content">
        <h1 class="detail-hero-title-line">
          <span>${withBreaks(config.hero.left, lang)}</span>
          <span class="title-divider"></span>
          <span>${withBreaks(config.hero.right, lang)}</span>
        </h1>
      </div>
    </section>

    <section class="ref-project-info ref-project-info-light">
      <div class="container ref-project-info-grid">
        <div class="ref-project-description">
          <div class="section-kicker">${escapeHtml(localized(config.info.kicker, lang))}</div>
          <h2>${escapeHtml(localized(config.info.heading, lang))}</h2>
${localizedArray(config.info.paragraphs, lang).map((text) => `          <p>${escapeHtml(text)}</p>`).join('\n')}
        </div>

        <dl class="ref-project-meta">
${config.info.meta.map((item) => `          <div>
            <dt>${escapeHtml(localized(item.label, lang))}</dt>
            <dd>${escapeHtml(localized(item.value, lang))}</dd>
          </div>`).join('\n')}
        </dl>
      </div>
    </section>

    <section class="detail-plan">
      <div class="container">
        <div class="detail-plan-compare" data-plan-compare style="--compare-position: 50%;">
          <div class="detail-plan-compare-stage">
            <img class="detail-plan-before" loading="lazy" decoding="async" src="${planBefore}" alt="${escapeHtml(t.planBeforeAlt)}" draggable="false" />
            <div class="detail-plan-after-wrap">
              <img class="detail-plan-after" loading="lazy" decoding="async" src="${planAfter}" alt="${escapeHtml(t.planAfterAlt)}" draggable="false" />
            </div>
            <div class="detail-plan-label detail-plan-label-before">${escapeHtml(t.planBefore)}</div>
            <div class="detail-plan-label detail-plan-label-after">${escapeHtml(t.planAfter)}</div>
            <div class="detail-plan-divider" aria-hidden="true"></div>
            <input class="detail-plan-range" type="range" min="0" max="100" value="50" aria-label="${escapeHtml(t.planRange)}" />
          </div>
        </div>
      </div>
    </section>

    <section class="detail-gallery" id="visualizations">
      <div class="container">
${gallery.html}
      </div>
    </section>

    <section class="contact" id="contact">
      <div class="container contact-grid">
        <div class="contact-info">
          <div class="section-kicker">${escapeHtml(t.contactKicker)}</div>
          <h2 class="section-title">${escapeHtml(t.contactTitle)}</h2>
          <p>${escapeHtml(t.contactText)}</p>
        </div>

        <form class="contact-form">
          <input type="text" name="name" placeholder="${escapeHtml(t.name)}" />
          <input type="tel" name="phone" placeholder="${escapeHtml(t.phone)}" />
          <input type="email" name="email" placeholder="${escapeHtml(t.email)}" />
          <select name="type" aria-label="${escapeHtml(t.objectType)}">
            <option value="">${escapeHtml(t.objectType)}</option>
            <option value="interior">${escapeHtml(t.interior)}</option>
            <option value="exterior">${escapeHtml(t.exterior)}</option>
            <option value="residential">${escapeHtml(t.residential)}</option>
            <option value="commercial">${escapeHtml(t.commercial)}</option>
          </select>
          <textarea class="full" name="message" placeholder="${escapeHtml(t.message)}"></textarea>
          <button class="btn btn-primary" type="submit">${escapeHtml(t.send)}</button>
        </form>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <a href="index.html" class="footer-logo" aria-label="YVK Design">
          <img src="assets/logo/yvk-logo.svg" alt="YVK Design" />
        </a>
        <p>${escapeHtml(t.footerText)}</p>
      </div>
      <div class="footer-contacts">
        <a href="tel:+380675404756">+38 (067) 540 47 56</a>
        <a href="mailto:info@yvkdesign.com">info@yvkdesign.com</a>
        <span>${escapeHtml(t.city)}</span>
      </div>
    </div>
  </footer>

  <div class="project-lightbox" aria-hidden="true">
    <button class="lightbox-close" type="button" aria-label="${escapeHtml(t.close)}">×</button>
    <button class="lightbox-arrow lightbox-prev" type="button" aria-label="${escapeHtml(t.prev)}">‹</button>
    <div class="lightbox-content">
      <div class="lightbox-counter">1 / ${gallery.count}</div>
      <img src="${lightboxImage}" data-full-src="${lightboxImage}" alt="${escapeHtml(t.visualization)}" draggable="false" />
    </div>
    <button class="lightbox-arrow lightbox-next" type="button" aria-label="${escapeHtml(t.next)}">›</button>
  </div>

  <script src="js/main.js" defer></script>
  <script src="js/project-gallery.js" defer></script>
</body>
</html>
`;
}

function renderProjectCard(config, projectDir, lang) {
  const t = dictionary[lang] || dictionary.uk;
  const cover = relUrl(path.join(projectDir, config.paths.cover));
  const output = outputFor(config, lang);
  const card = config.card;
  const badges = localizedArray(card.badges, lang);

  return `          <article class="project-card" data-tags="${escapeHtml(card.tags)}">
            <a class="project-card-link" href="${escapeHtml(output)}">
              <div class="project-image">
                <img loading="lazy" decoding="async" src="${cover}" alt="${escapeHtml(localized(card.title, lang))}" />
                <div class="project-label">${escapeHtml(localized(card.label, lang))}</div>
              </div>

              <div class="project-body">
                <div class="project-topline">
                  <span>${escapeHtml(localized(card.toplineLeft, lang))}</span>
                  <span>${escapeHtml(localized(card.toplineRight, lang))}</span>
                </div>

                <h3>${escapeHtml(localized(card.title, lang))}</h3>

                <p class="project-description">
                  ${escapeHtml(localized(card.description, lang))}
                </p>

                <div class="project-tags">
${badges.map((badge) => `                  <span>${escapeHtml(badge)}</span>`).join('\n')}
                </div>

                <div class="project-footer">
                  <span>${escapeHtml(t.viewProject)}</span>
                  <span class="project-arrow">→</span>
                </div>
              </div>
            </a>
          </article>`;
}

function updateProjectsPage(config, projectDir) {
  const file = path.join(root, 'projects.html');
  if (!fs.existsSync(file)) return;

  const markerStart = `          <!-- AUTO_PROJECT_CARD:${projectArg}:START -->`;
  const markerEnd = `          <!-- AUTO_PROJECT_CARD:${projectArg}:END -->`;
  const block = `${markerStart}\n${renderProjectCard(config, projectDir, 'uk')}\n${markerEnd}`;
  let html = fs.readFileSync(file, 'utf8');

  if (html.includes(markerStart) && html.includes(markerEnd)) {
    const start = html.indexOf(markerStart);
    const end = html.indexOf(markerEnd, start) + markerEnd.length;
    html = html.slice(0, start) + block + html.slice(end);
  } else {
    const oldAutoCard = /          <article class="project-card" data-tags="[^"]*auto[^"]*"[\s\S]*?          <\/article>/;
    if (oldAutoCard.test(html)) {
      html = html.replace(oldAutoCard, block);
    } else {
      const gridStart = html.indexOf('<div class="project-grid">');
      const firstArticleEnd = html.indexOf('          </article>', gridStart);
      if (gridStart < 0 || firstArticleEnd < 0) throw new Error('Cannot find project grid insertion point');
      const insertAt = firstArticleEnd + '          </article>'.length;
      html = html.slice(0, insertAt) + `\n${block}` + html.slice(insertAt);
    }
  }

  fs.writeFileSync(file, html, 'utf8');
}

function generate() {
  const projectDir = path.join(projectsRoot, projectArg);
  const configPath = path.join(projectDir, 'project.auto.json');
  const config = readJson(configPath);
  validateConfig(config, projectDir);
  const languages = config.languages?.length ? config.languages : ['uk'];

  for (const lang of languages) {
    const outputPath = path.join(root, outputFor(config, lang));
    fs.writeFileSync(outputPath, renderPage(config, projectDir, lang), 'utf8');
    console.log(`Generated ${path.relative(root, outputPath)} (${lang})`);
  }

  if (updateProjects) {
    updateProjectsPage(config, projectDir);
    console.log('Updated projects.html auto card');
  }
}

generate();

if (watchMode) {
  const projectDir = path.join(projectsRoot, projectArg);
  let timer = null;
  fs.watch(projectDir, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        generate();
      } catch (error) {
        console.error(error.message);
      }
    }, 250);
  });
  console.log(`Watching ${path.relative(root, projectDir)}`);
}
