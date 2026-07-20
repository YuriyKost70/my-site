const fs = require('fs');
const path = require('path');
const { prepareProjectContent } = require('./project-description.cjs');

const root = path.resolve(__dirname, '..');
const projectsRoot = path.join(root, 'assets', 'projects');
const imageExt = /\.(jpe?g|png|webp)$/i;
const siteUrl = 'https://yvkdesign.com.ua';

const args = process.argv.slice(2);
const projectArg = readArg('--project') || 'project-interior-apartment-001';
const watchMode = args.includes('--watch');
const updateProjects = !args.includes('--no-projects');
const cardsOnly = args.includes('--cards-only');
const prepareOnly = args.includes('--prepare-only');

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
    private: 'Приватний об’єкт',
    business: 'Простір для бізнесу',
    message: 'Коротко опишіть задачу',
    send: 'Надіслати заявку',
    footerText: 'YVK Design — дизайн інтер’єрів, екстер’єрів та просторів для бізнесу.',
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
    private: 'Private project',
    business: 'Business space',
    message: 'Briefly describe the task',
    send: 'Send request',
    footerText: 'YVK Design — interior, exterior and business space design.',
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

const contentFields = new Set([
  'HERO_LEFT',
  'HERO_RIGHT',
  'ABOUT_LABEL',
  'ABOUT_TITLE',
  'ABOUT_TEXT',
  'META',
  'CARD_LABEL',
  'CARD_TOPLINE_LEFT',
  'CARD_TOPLINE_RIGHT',
  'CARD_TITLE',
  'CARD_DESCRIPTION',
  'CARD_BADGES',
  'SEO_TITLE',
  'SEO_DESCRIPTION',
  'IMAGE_ALT'
]);
const projectFields = new Set([
  'ID',
  'STATUS',
  'DIRECTION',
  'SEGMENT',
  'STYLE',
  'FEATURED',
  'FEATURED_ORDER'
]);
const projectDirections = new Set(['interior', 'exterior']);
const projectSegments = new Set(['private', 'business']);
const segmentAliases = {
  residential: 'private',
  commercial: 'business'
};

function parseProjectContent(filePath) {
  if (!fs.existsSync(filePath)) return null;

  const result = { project: {}, uk: {}, en: {} };
  const lines = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
  let section = '';
  let field = '';

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();
    const sectionMatch = trimmed.match(/^\[(PROJECT|UA|UK|EN)\]$/i);
    const fieldMatch = trimmed.match(/^([A-Z_]+):(?:\s*(.*))?$/i);

    if (sectionMatch) {
      const sectionName = sectionMatch[1].toLowerCase();
      section = sectionName === 'project' ? 'project' : sectionName === 'en' ? 'en' : 'uk';
      field = '';
      continue;
    }

    if (fieldMatch) {
      if (!section) {
        throw new Error(`Content field before section at line ${index + 1}: ${fieldMatch[1]}`);
      }

      field = fieldMatch[1].toUpperCase();
      const allowedFields = section === 'project' ? projectFields : contentFields;
      if (!allowedFields.has(field)) {
        throw new Error(`Unknown field in [${section.toUpperCase()}] at line ${index + 1}: ${field}`);
      }
      if (result[section][field]) {
        throw new Error(`Duplicate content field at line ${index + 1}: ${field}`);
      }

      result[section][field] = [];
      if (fieldMatch[2]) result[section][field].push(fieldMatch[2]);
      continue;
    }

    if (!section || !field) {
      if (trimmed && !trimmed.startsWith('#')) {
        throw new Error(`Text outside a content field at line ${index + 1}`);
      }
      continue;
    }

    result[section][field].push(rawLine);
  }

  return result;
}

function trimEmptyLines(lines = []) {
  const result = [...lines];
  while (result.length && !result[0].trim()) result.shift();
  while (result.length && !result[result.length - 1].trim()) result.pop();
  return result;
}

function contentText(fields, name, multiline = false) {
  const lines = trimEmptyLines(fields[name]);
  if (!lines.length) return '';
  return multiline
    ? lines.map((line) => line.trim()).filter(Boolean).join('\n')
    : lines.map((line) => line.trim()).filter(Boolean).join(' ');
}

function contentParagraphs(fields) {
  const lines = trimEmptyLines(fields.ABOUT_TEXT);
  const paragraphs = [];
  let current = [];

  for (const line of lines) {
    if (!line.trim()) {
      if (current.length) paragraphs.push(current.join(' '));
      current = [];
    } else {
      current.push(line.trim());
    }
  }

  if (current.length) paragraphs.push(current.join(' '));
  return paragraphs;
}

function contentMeta(fields, language) {
  return trimEmptyLines(fields.META).filter((line) => line.trim()).map((line, index) => {
    const separator = line.indexOf('|');
    if (separator < 1 || separator === line.length - 1) {
      throw new Error(`Invalid META entry ${index + 1} in [${language.toUpperCase()}]: use Label | Value`);
    }

    return {
      label: line.slice(0, separator).trim(),
      value: line.slice(separator + 1).trim()
    };
  });
}

function contentLines(fields, name) {
  return trimEmptyLines(fields[name]).map((line) => line.trim()).filter(Boolean);
}

function applyProjectContent(config, projectDir) {
  const contentPath = path.join(projectDir, 'project-content.txt');
  const content = parseProjectContent(contentPath);
  if (!content) return config;

  config.hero ||= {};
  config.hero.imageAlt ||= {};
  config.info ||= {};
  config.info.paragraphs ||= {};
  config.card ||= {};
  config.seo ||= {};

  const projectId = contentText(content.project, 'ID');
  const status = contentText(content.project, 'STATUS').toLowerCase();
  const direction = contentText(content.project, 'DIRECTION').toLowerCase();
  const rawSegment = contentText(content.project, 'SEGMENT').toLowerCase();
  const segment = segmentAliases[rawSegment] || rawSegment;
  const style = contentText(content.project, 'STYLE').toLowerCase();
  const featured = contentText(content.project, 'FEATURED').toLowerCase();
  const featuredOrder = contentText(content.project, 'FEATURED_ORDER');

  if (projectId) config.projectId = projectId;
  config.projectStatus = status || config.projectStatus || 'published';
  if (direction) config.projectDirection = direction;
  if (segment) config.projectSegment = segment;
  if (style) config.projectStyle = style;
  if (featured) config.featured = featured;
  if (featuredOrder) config.featuredOrder = Number(featuredOrder);
  if (direction && segment) config.card.tags = [direction, segment, style, 'auto'].filter(Boolean).join(' ');

  for (const language of ['uk', 'en']) {
    const fields = content[language];
    const heroLeft = contentText(fields, 'HERO_LEFT', true);
    const heroRight = contentText(fields, 'HERO_RIGHT', true);
    const aboutLabel = contentText(fields, 'ABOUT_LABEL');
    const aboutTitle = contentText(fields, 'ABOUT_TITLE');
    const paragraphs = contentParagraphs(fields);
    const cardLabel = contentText(fields, 'CARD_LABEL');
    const cardToplineLeft = contentText(fields, 'CARD_TOPLINE_LEFT');
    const cardToplineRight = contentText(fields, 'CARD_TOPLINE_RIGHT');
    const cardTitle = contentText(fields, 'CARD_TITLE');
    const cardDescription = contentText(fields, 'CARD_DESCRIPTION');
    const cardBadges = contentLines(fields, 'CARD_BADGES');
    const seoTitle = contentText(fields, 'SEO_TITLE');
    const seoDescription = contentText(fields, 'SEO_DESCRIPTION');
    const imageAlt = contentText(fields, 'IMAGE_ALT');

    if (heroLeft) {
      config.hero.left ||= {};
      config.hero.left[language] = heroLeft;
    }
    if (heroRight) {
      config.hero.right ||= {};
      config.hero.right[language] = heroRight;
    }
    if (aboutLabel) {
      config.info.kicker ||= {};
      config.info.kicker[language] = aboutLabel;
    }
    if (aboutTitle) {
      config.info.heading ||= {};
      config.info.heading[language] = aboutTitle;
    }
    if (paragraphs.length) config.info.paragraphs[language] = paragraphs;
    if (cardLabel) {
      config.card.label ||= {};
      config.card.label[language] = cardLabel;
    }
    if (cardToplineLeft) {
      config.card.toplineLeft ||= {};
      config.card.toplineLeft[language] = cardToplineLeft;
    }
    if (cardToplineRight) {
      config.card.toplineRight ||= {};
      config.card.toplineRight[language] = cardToplineRight;
    }
    if (cardTitle) {
      config.card.title ||= {};
      config.card.title[language] = cardTitle;
    }
    if (cardDescription) {
      config.card.description ||= {};
      config.card.description[language] = cardDescription;
    }
    if (cardBadges.length) {
      config.card.badges ||= {};
      config.card.badges[language] = cardBadges;
    }
    if (seoTitle || seoDescription) {
      config.seo[language] ||= {};
      if (seoTitle) config.seo[language].title = seoTitle;
      if (seoDescription) config.seo[language].description = seoDescription;
    }
    if (imageAlt) config.hero.imageAlt[language] = imageAlt;
  }

  const metaByLanguage = {
    uk: contentMeta(content.uk, 'UA'),
    en: contentMeta(content.en, 'EN')
  };
  const metaCount = Math.max(metaByLanguage.uk.length, metaByLanguage.en.length);

  if (metaCount) {
    config.info.meta = Array.from({ length: metaCount }, (_, index) => {
      const existing = config.info.meta?.[index] || {};
      const uk = metaByLanguage.uk[index];
      const en = metaByLanguage.en[index];

      return {
        label: {
          uk: uk?.label || existing.label?.uk || '',
          en: en?.label || existing.label?.en || ''
        },
        value: {
          uk: uk?.value || existing.value?.uk || '',
          en: en?.value || existing.value?.en || ''
        }
      };
    });
  }

  return config;
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
  assertText(config.paths?.galleryDir, 'paths.galleryDir');
  assertText(config.hero?.left?.uk, 'hero.left.uk');
  assertText(config.hero?.right?.uk, 'hero.right.uk');
  assertText(config.hero?.imageAlt?.uk, 'hero.imageAlt.uk');
  assertText(config.info?.kicker?.uk, 'info.kicker.uk');
  assertText(config.info?.heading?.uk, 'info.heading.uk');
  assertText(config.projectId, 'project.ID');
  assertText(config.projectDirection, 'project.DIRECTION');
  assertText(config.projectSegment, 'project.SEGMENT');
  assertText(config.card?.label?.uk, 'card.label.uk');
  assertText(config.card?.toplineLeft?.uk, 'card.toplineLeft.uk');
  assertText(config.card?.toplineRight?.uk, 'card.toplineRight.uk');
  assertText(config.card?.title?.uk, 'card.title.uk');
  assertText(config.card?.description?.uk, 'card.description.uk');

  if (!['draft', 'published'].includes(config.projectStatus || 'published')) {
    throw new Error('Invalid project STATUS: use draft or published');
  }
  if (config.projectId !== path.basename(projectDir)) {
    throw new Error(`Project ID must match the project folder name: expected ${path.basename(projectDir)}`);
  }
  if (!projectDirections.has(config.projectDirection)) {
    throw new Error(`Invalid project DIRECTION: use ${[...projectDirections].join(' or ')}`);
  }
  if (!projectSegments.has(config.projectSegment)) {
    throw new Error(`Invalid project SEGMENT: use ${[...projectSegments].join(' or ')}`);
  }
  if (!['yes', 'no'].includes(config.featured)) {
    throw new Error('Invalid project FEATURED: use yes or no');
  }
  if (!Number.isInteger(config.featuredOrder) || config.featuredOrder < 1) {
    throw new Error('Invalid project FEATURED_ORDER: use a positive whole number');
  }
  if (!Array.isArray(config.card?.badges?.uk) || !config.card.badges.uk.length) {
    throw new Error('At least one Ukrainian card badge is required: CARD_BADGES');
  }

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

  const planImages = planningImages(config);
  const plans = planImages.length ? [] : planningSets(config);
  plans.forEach((plan, index) => {
    assertText(plan?.before, `paths.planningSets[${index}].before`);
    assertText(plan?.after, `paths.planningSets[${index}].after`);
  });
  planImages.forEach((plan, index) => {
    assertText(plan?.src, `paths.planningImages[${index}].src`);
  });

  [
    config.paths.cover,
    config.paths.galleryDir,
    ...plans.flatMap((plan) => [plan.before, plan.after]),
    ...planImages.map((plan) => plan.src)
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
  const [ukRaw, enRaw = ''] = withoutNumber.split(/\s*_{1,2}\s*/);
  const normalize = (text) => text.replace(/_+/g, ' ').replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim();
  const normalizeEnglishFloor = (text) => text
    .replace(/\b1-st\b/gi, '1st')
    .replace(/\b2-st\b/gi, '2nd')
    .replace(/\b3-st\b/gi, '3rd');

  return {
    uk: normalize(ukRaw).toLocaleUpperCase('uk-UA'),
    en: normalizeEnglishFloor(normalize(enRaw)).toLocaleUpperCase('en-US')
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

function cleanUrlForOutput(output) {
  const normalized = String(output || '').replaceAll('\\', '/');
  if (normalized === 'index.html') return '/';
  return `/${normalized.replace(/\.html$/, '')}`;
}

function absoluteUrlForOutput(output) {
  return `${siteUrl}${cleanUrlForOutput(output)}`;
}

function absoluteUrlForAsset(assetPath) {
  const normalized = String(assetPath || '').replaceAll('\\', '/').replace(/^\/+/, '');
  return normalized ? `${siteUrl}/${normalized}` : siteUrl;
}

function ogLocale(lang) {
  return lang === 'en' ? 'en_US' : 'uk_UA';
}

function buildSocialMeta(config, lang, title, description, imagePath) {
  const output = outputFor(config, lang);
  const imageAlt = localized(config.hero?.imageAlt, lang) || localized(config.hero?.imageAlt, 'uk') || title;
  const imageUrl = absoluteUrlForAsset(imagePath);

  return [
    `  <meta property="og:type" content="website" />`,
    `  <meta property="og:site_name" content="YVK Design" />`,
    `  <meta property="og:locale" content="${escapeHtml(ogLocale(lang))}" />`,
    `  <meta property="og:url" content="${escapeHtml(absoluteUrlForOutput(output))}" />`,
    `  <meta property="og:title" content="${escapeHtml(title)}" />`,
    `  <meta property="og:description" content="${escapeHtml(description)}" />`,
    `  <meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
    `  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `  <meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`,
    `  <meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}" />`
  ].join('\n');
}

function buildSeoLinks(config, lang) {
  const languages = config.languages?.length ? config.languages : ['uk'];
  const currentOutput = outputFor(config, lang);
  const ukOutput = outputFor(config, 'uk');
  const enOutput = outputFor(config, 'en');
  const lines = [
    `  <link rel="canonical" href="${escapeHtml(absoluteUrlForOutput(currentOutput))}" />`
  ];

  if (languages.includes('uk')) {
    lines.push(`  <link rel="alternate" hreflang="uk" href="${escapeHtml(absoluteUrlForOutput(ukOutput))}" />`);
  }

  if (languages.includes('en')) {
    lines.push(`  <link rel="alternate" hreflang="en" href="${escapeHtml(absoluteUrlForOutput(enOutput))}" />`);
  }

  if (languages.includes('uk')) {
    lines.push(`  <link rel="alternate" hreflang="x-default" href="${escapeHtml(absoluteUrlForOutput(ukOutput))}" />`);
  }

  return lines.join('\n');
}

function planningSets(config) {
  if (Array.isArray(config.paths?.planningSets) && config.paths.planningSets.length) {
    return config.paths.planningSets;
  }

  return [{
    before: config.paths?.planningBefore,
    after: config.paths?.planningAfter
  }];
}

function planningImages(config) {
  return Array.isArray(config.paths?.planningImages) ? config.paths.planningImages : [];
}

function renderPlanning(config, projectDir, lang, t) {
  const planImages = planningImages(config);

  if (planImages.length) {
    return planImages.map((plan) => {
      const planSrc = relUrl(path.join(projectDir, plan.src));
      const title = localized(plan.title, lang);
      const alt = localized(plan.alt, lang) || title || t.planAfterAlt;

      return `        <div class="detail-plan-set detail-plan-set--image">
${title ? `          <h2 class="detail-plan-title">${escapeHtml(title)}</h2>\n` : ''}          <figure class="detail-plan-image">
            <img loading="lazy" decoding="async" src="${planSrc}" alt="${escapeHtml(alt)}" draggable="false" />
          </figure>
        </div>`;
    }).join('\n');
  }

  return planningSets(config).map((plan) => {
    const planBefore = relUrl(path.join(projectDir, plan.before));
    const planAfter = relUrl(path.join(projectDir, plan.after));
    const title = localized(plan.title, lang);

    return `        <div class="detail-plan-set">
${title ? `          <h2 class="detail-plan-title">${escapeHtml(title)}</h2>\n` : ''}          <div class="detail-plan-compare" data-plan-compare style="--compare-position: 50%;">
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
        </div>`;
  }).join('\n');
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
  const homeHref = lang === 'en' ? 'index-en.html' : 'index.html';
  const servicesHref = lang === 'en' ? 'services-en.html' : 'services.html';
  const projectsHref = lang === 'en' ? 'projects-en.html' : 'projects.html';
  const contactHref = lang === 'en' ? 'contact-en.html' : 'contact.html';
  const cover = relUrl(path.join(projectDir, config.paths.cover));
  const planningHtml = renderPlanning(config, projectDir, lang, t);
  const gallery = buildGallery(projectDir, config.paths.galleryDir, lang);
  const lightboxImage = gallery.firstImage || cover;
  const seo = localized(config.seo, lang);
  const fallbackSeo = localized(config.seo, 'uk');
  const seoTitle = seo.title || fallbackSeo.title || 'YVK Design';
  const seoDescription = seo.description || fallbackSeo.description || '';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(t.htmlLang)}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(seoTitle)}</title>
  <meta name="description" content="${escapeHtml(seoDescription)}" />
${buildSocialMeta(config, lang, seoTitle, seoDescription, cover)}
${buildSeoLinks(config, lang)}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="css/style.css" />
  <link rel="stylesheet" href="css/project-detail.css" />
</head>
<body class="project-detail-page" data-project-id="${escapeHtml(config.projectId)}" data-project-direction="${escapeHtml(config.projectDirection)}" data-project-segment="${escapeHtml(config.projectSegment)}">
  <header class="site-header project-detail-header">
    <div class="container header-inner">
      <a href="${homeHref}" class="logo" aria-label="YVK Design">
        <img src="assets/logo/yvk-logo.svg" alt="YVK Design" />
      </a>

      <button class="menu-toggle" type="button" aria-label="${escapeHtml(t.openMenu)}" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>

      <nav class="main-nav" aria-label="${escapeHtml(t.navLabel)}">
        <a href="${homeHref}#home">${escapeHtml(t.home)}</a>
        <a href="${servicesHref}">${escapeHtml(t.services)}</a>
        <a href="${projectsHref}">${escapeHtml(t.projects)}</a>
        <a href="${contactHref}">${escapeHtml(t.contacts)}</a>
        ${buildLanguageSwitch(config, lang)}
      </nav>

      <div class="header-actions">
        <a class="btn btn-secondary" href="${contactHref}">${escapeHtml(t.consultation)}</a>
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
      <div class="container detail-plan-list">
${planningHtml}
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

        <form class="contact-form" action="/api/contact" method="post" data-contact-form data-success-message="${escapeHtml(lang === 'en' ? 'Thank you, your enquiry has been sent. We will contact you shortly.' : 'Дякуємо, заявку надіслано. Ми зв’яжемося з вами найближчим часом.')}" data-error-message="${escapeHtml(lang === 'en' ? 'The enquiry could not be sent. Please write to us directly: info@yvkdesign.com.ua' : 'Не вдалося надіслати заявку. Напишіть нам напряму: info@yvkdesign.com.ua')}">
          <input class="form-hp" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true" hidden />
          <input type="text" name="name" placeholder="${escapeHtml(t.name)}" required />
          <input type="tel" name="phone" placeholder="${escapeHtml(t.phone)}" />
          <input type="email" name="email" placeholder="${escapeHtml(t.email)}" required />
          <select name="project-type" aria-label="${escapeHtml(t.objectType)}" required>
            <option value="">${escapeHtml(t.objectType)}</option>
            <option value="interior">${escapeHtml(t.interior)}</option>
            <option value="exterior">${escapeHtml(t.exterior)}</option>
            <option value="private">${escapeHtml(t.private)}</option>
            <option value="business">${escapeHtml(t.business)}</option>
          </select>
          <textarea class="full" name="message" placeholder="${escapeHtml(t.message)}" required></textarea>
          <button class="btn btn-primary" type="submit">${escapeHtml(t.send)}</button>
          <div class="form-status" role="status" aria-live="polite"></div>
        </form>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <a href="${homeHref}" class="footer-logo" aria-label="YVK Design">
          <img src="assets/logo/yvk-logo.svg" alt="YVK Design" />
        </a>
        <p>${escapeHtml(t.footerText)}</p>
      </div>
      <div class="footer-contacts">
        <a href="tel:+380675404756">+38 (067) 540 47 56</a>
        <a href="mailto:info@yvkdesign.com.ua">info@yvkdesign.com.ua</a>
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

  <script src="js/main.js?v=20260627-validation" defer></script>
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
  const sourceFolder = path.basename(projectDir);
  const sourceOrder = config.featuredOrder;

  return `          <article class="project-card project-card--footer-pinned" data-project-id="${escapeHtml(config.projectId)}" data-project-source="${escapeHtml(sourceFolder)}" data-project-order="${escapeHtml(sourceOrder)}" data-project-direction="${escapeHtml(config.projectDirection)}" data-project-segment="${escapeHtml(config.projectSegment)}" data-project-style="${escapeHtml(config.projectStyle || '')}" data-featured-order="${escapeHtml(config.featuredOrder)}" data-tags="${escapeHtml(card.tags)}">
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

function projectGridInsertAt(html, fileName) {
  const gridMatch = /<div class="project-grid"[^>]*>/.exec(html);
  if (!gridMatch) throw new Error(`Cannot find project grid in ${fileName}`);

  const lineEnd = html.indexOf('\n', gridMatch.index + gridMatch[0].length);
  return lineEnd >= 0 ? lineEnd + 1 : gridMatch.index + gridMatch[0].length;
}

function updateCardInPage({ config, projectDir, fileName, lang, markerPrefix, featuredOnly = false }) {
  const file = path.join(root, fileName);
  if (!fs.existsSync(file)) return;

  const markerStart = `<!-- ${markerPrefix}:${config.projectId}:START -->`;
  const markerEnd = `<!-- ${markerPrefix}:${config.projectId}:END -->`;
  const escapedPrefix = markerPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedProjectId = config.projectId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const projectBlockPattern = new RegExp(
    `\\s*<!--\\s*${escapedPrefix}:${escapedProjectId}:START\\s*-->[\\s\\S]*?<!--\\s*${escapedPrefix}:${escapedProjectId}:END\\s*-->`,
    'g'
  );
  let html = fs.readFileSync(file, 'utf8');

  if (featuredOnly) {
    html = html.replace(/<div class="project-grid"[^>]*>/, (gridTag) => (
      gridTag.includes('data-visible-limit=')
        ? gridTag
        : gridTag.replace('>', ' data-visible-limit="4">')
    ));
  }

  if (config.projectStatus !== 'published') {
    html = html.replace(projectBlockPattern, '');
    fs.writeFileSync(file, html, 'utf8');
    return;
  }

  const localizedBlock = `          ${markerStart}\n${renderProjectCard(config, projectDir, lang)}\n          ${markerEnd}`;
  html = html.replace(projectBlockPattern, '');
  const insertAt = projectGridInsertAt(html, fileName);
  html = html.slice(0, insertAt) + `${localizedBlock}\n` + html.slice(insertAt);

  const blockPattern = new RegExp(
    `\\s*<!--\\s*${escapedPrefix}:[^:]+:START\\s*-->[\\s\\S]*?<!--\\s*${escapedPrefix}:[^:]+:END\\s*-->`,
    'g'
  );
  const markerPattern = new RegExp(`<!--\\s*${escapedPrefix}:([^:]+):START\\s*-->`);
  const uniqueBlocks = new Map();

  for (const block of html.match(blockPattern) || []) {
    const projectId = block.match(markerPattern)?.[1];
    if (projectId && !uniqueBlocks.has(projectId)) {
      uniqueBlocks.set(projectId, block);
    }
  }

  const blocks = [...uniqueBlocks.values()];

  if (blocks.length > 1) {
    blocks.sort((a, b) => {
      if (featuredOnly) {
        const orderA = Number(a.match(/data-featured-order="(\d+)"/)?.[1] || Number.MAX_SAFE_INTEGER);
        const orderB = Number(b.match(/data-featured-order="(\d+)"/)?.[1] || Number.MAX_SAFE_INTEGER);
        return orderA - orderB;
      }

      const orderA = Number(a.match(/data-project-order="(\d+)"/)?.[1] || Number.MAX_SAFE_INTEGER);
      const orderB = Number(b.match(/data-project-order="(\d+)"/)?.[1] || Number.MAX_SAFE_INTEGER);
      return orderA - orderB;
    });

    html = html.replace(blockPattern, '');
    const insertAt = projectGridInsertAt(html, fileName);
    html = html.slice(0, insertAt) + blocks.map((item) => item.trimStart()).join('\n') + '\n' + html.slice(insertAt);
  }

  fs.writeFileSync(file, html, 'utf8');
}

function updateProjectCards(config, projectDir) {
  updateCardInPage({
    config,
    projectDir,
    fileName: 'projects.html',
    lang: 'uk',
    markerPrefix: 'AUTO_PROJECT_CARD'
  });

  updateCardInPage({
    config,
    projectDir,
    fileName: 'projects-en.html',
    lang: 'en',
    markerPrefix: 'AUTO_PROJECT_CARD'
  });

  updateCardInPage({
    config,
    projectDir,
    fileName: 'index.html',
    lang: 'uk',
    markerPrefix: 'AUTO_HOME_PROJECT_CARD',
    featuredOnly: true
  });

  updateCardInPage({
    config,
    projectDir,
    fileName: 'index-en.html',
    lang: 'en',
    markerPrefix: 'AUTO_HOME_PROJECT_CARD',
    featuredOnly: true
  });
}

function generate() {
  const projectDir = path.join(projectsRoot, projectArg);
  const preparation = prepareProjectContent(projectDir);

  if (preparation.found) {
    console.log(`Prepared project-content.txt from project-description.txt${preparation.changed ? '' : ' (no changes)'}`);
  }

  if (prepareOnly) return;

  const configPath = path.join(projectDir, 'project.auto.json');
  const config = applyProjectContent(readJson(configPath), projectDir);
  config.projectStatus ||= 'published';

  if (!['draft', 'published'].includes(config.projectStatus)) {
    throw new Error('Invalid project STATUS: use draft or published');
  }

  if (config.projectStatus === 'draft') {
    if (updateProjects) updateProjectCards(config, projectDir);
    console.log('Draft project: pages and cards were not published');
    return;
  }

  validateConfig(config, projectDir);
  const languages = config.languages?.length ? config.languages : ['uk'];

  if (!cardsOnly) {
    for (const lang of languages) {
      const outputPath = path.join(root, outputFor(config, lang));
      fs.writeFileSync(outputPath, renderPage(config, projectDir, lang), 'utf8');
      console.log(`Generated ${path.relative(root, outputPath)} (${lang})`);
    }
  }

  if (updateProjects) {
    updateProjectCards(config, projectDir);
    console.log('Updated generated project cards');
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
