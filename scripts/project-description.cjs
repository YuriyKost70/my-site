const fs = require('fs');
const path = require('path');

const projectFields = new Set([
  'ID',
  'STATUS',
  'DIRECTION',
  'SEGMENT',
  'STYLE',
  'FEATURED',
  'ORDER'
]);

const languageFields = new Set([
  'TITLE',
  'SUBTITLE',
  'LOCATION',
  'LOCATION_LABEL',
  'OBJECT_TYPE',
  'OBJECT_TYPE_LABEL',
  'AREA',
  'AREA_LABEL',
  'AUTHOR',
  'AUTHOR_LABEL',
  'PROJECT_TYPE',
  'PROJECT_TYPE_LABEL',
  'DESCRIPTION',
  'HERO_LEFT',
  'HERO_RIGHT',
  'ABOUT_LABEL',
  'ABOUT_TITLE',
  'CARD_LABEL',
  'CARD_TOPLINE_LEFT',
  'CARD_TOPLINE_RIGHT',
  'CARD_TITLE',
  'CARD_DESCRIPTION',
  'BADGES',
  'SEO_TITLE',
  'SEO_DESCRIPTION',
  'IMAGE_ALT'
]);

const directionLabels = {
  interior: { uk: "Інтер’єр", en: 'Interior' },
  exterior: { uk: "Екстер’єр", en: 'Exterior' }
};

const styleLabels = {
  modern: { uk: 'Сучасний', en: 'Modern' },
  classic: { uk: 'Класичний', en: 'Classic' },
  mixed: { uk: 'Змішаний', en: 'Mixed' }
};

const defaults = {
  uk: {
    aboutLabel: 'Про проєкт',
    author: 'Юрій Костюченко',
    projectType: 'Комерційний проєкт',
    visualization: 'Візуалізація',
    meta: {
      location: 'Локація',
      objectType: "Тип об’єкта",
      area: 'Площа',
      author: 'Дизайн та візуалізація',
      projectType: 'Тип робіт'
    }
  },
  en: {
    aboutLabel: 'About the project',
    author: 'Yuriy Kostyuchenko',
    projectType: 'Commercial project',
    visualization: 'Visualisation',
    meta: {
      location: 'Location',
      objectType: 'Property type',
      area: 'Area',
      author: 'Design and visualisation',
      projectType: 'Project type'
    }
  }
};

function trimEmptyLines(lines = []) {
  const result = [...lines];
  while (result.length && !result[0].trim()) result.shift();
  while (result.length && !result[result.length - 1].trim()) result.pop();
  return result;
}

function parseSource(filePath) {
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

    if (trimmed.startsWith('#')) continue;

    if (sectionMatch) {
      const sectionName = sectionMatch[1].toLowerCase();
      section = sectionName === 'project' ? 'project' : sectionName === 'en' ? 'en' : 'uk';
      field = '';
      continue;
    }

    if (fieldMatch) {
      if (!section) {
        throw new Error(`Field before section at line ${index + 1}: ${fieldMatch[1]}`);
      }

      field = fieldMatch[1].toUpperCase();
      const allowedFields = section === 'project' ? projectFields : languageFields;
      if (!allowedFields.has(field)) {
        throw new Error(`Unknown field in [${section.toUpperCase()}] at line ${index + 1}: ${field}`);
      }
      if (result[section][field]) {
        throw new Error(`Duplicate field at line ${index + 1}: ${field}`);
      }

      result[section][field] = [];
      if (fieldMatch[2]) result[section][field].push(fieldMatch[2]);
      continue;
    }

    if (!section || !field) {
      if (trimmed) {
        throw new Error(`Text outside a field at line ${index + 1}`);
      }
      continue;
    }

    result[section][field].push(rawLine);
  }

  return result;
}

function text(fields, name, multiline = false) {
  const lines = trimEmptyLines(fields[name]);
  if (!lines.length) return '';
  return multiline
    ? lines.map((line) => line.trim()).filter(Boolean).join('\n')
    : lines.map((line) => line.trim()).filter(Boolean).join(' ');
}

function lines(fields, name) {
  return trimEmptyLines(fields[name]).map((line) => line.trim()).filter(Boolean);
}

function paragraphs(fields) {
  const source = trimEmptyLines(fields.DESCRIPTION);
  const result = [];
  let current = [];

  for (const line of source) {
    if (!line.trim()) {
      if (current.length) result.push(current.join(' '));
      current = [];
    } else {
      current.push(line.trim());
    }
  }

  if (current.length) result.push(current.join(' '));
  return result;
}

function required(value, field) {
  if (!String(value || '').trim()) {
    throw new Error(`Required field is missing: ${field}`);
  }
}

function assertPlainValue(value, field) {
  if (String(value).includes('|')) {
    throw new Error(`Field cannot contain "|": ${field}`);
  }
}

function splitHero(value, locale) {
  const explicitLines = String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (explicitLines.length > 2) {
    throw new Error('HERO_LEFT and HERO_RIGHT can contain no more than two non-empty lines');
  }
  if (explicitLines.length > 1) return explicitLines.slice(0, 2).join('\n').toLocaleUpperCase(locale);

  const words = explicitLines.join(' ').split(/\s+/).filter(Boolean);
  if (words.length < 3) return words.join(' ').toLocaleUpperCase(locale);

  const totalLength = words.reduce((sum, word) => sum + word.length, 0) + words.length - 1;
  const target = totalLength / 2;
  let currentLength = 0;
  let splitAt = 1;

  for (let index = 0; index < words.length - 1; index += 1) {
    currentLength += words[index].length + (index ? 1 : 0);
    if (currentLength <= target) splitAt = index + 1;
  }

  return [
    words.slice(0, splitAt).join(' '),
    words.slice(splitAt).join(' ')
  ].join('\n').toLocaleUpperCase(locale);
}

function shorten(value, maxLength) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;

  const slice = normalized.slice(0, maxLength + 1);
  const sentenceEnd = Math.max(slice.lastIndexOf('.'), slice.lastIndexOf('!'), slice.lastIndexOf('?'));
  if (sentenceEnd >= Math.floor(maxLength * 0.55)) return slice.slice(0, sentenceEnd + 1);

  const wordEnd = slice.lastIndexOf(' ');
  return `${slice.slice(0, wordEnd > 0 ? wordEnd : maxLength).trim()}…`;
}

function languageHasContent(fields) {
  return Object.values(fields).some((value) => trimEmptyLines(value).length);
}

function normalizeLanguage(source, language, project) {
  if (!languageHasContent(source)) return null;

  const locale = language === 'uk' ? 'uk-UA' : 'en-US';
  const languageDefaults = defaults[language];
  const title = text(source, 'TITLE');
  const subtitle = text(source, 'SUBTITLE');
  const descriptionParagraphs = paragraphs(source);
  const location = text(source, 'LOCATION');
  const objectType = text(source, 'OBJECT_TYPE');
  const area = text(source, 'AREA');
  const author = text(source, 'AUTHOR') || languageDefaults.author;
  const projectType = text(source, 'PROJECT_TYPE') || languageDefaults.projectType;
  const metaLabels = {
    location: text(source, 'LOCATION_LABEL') || languageDefaults.meta.location,
    objectType: text(source, 'OBJECT_TYPE_LABEL') || languageDefaults.meta.objectType,
    area: text(source, 'AREA_LABEL') || languageDefaults.meta.area,
    author: text(source, 'AUTHOR_LABEL') || languageDefaults.meta.author,
    projectType: text(source, 'PROJECT_TYPE_LABEL') || languageDefaults.meta.projectType
  };

  required(title, `${language}.TITLE`);
  required(subtitle, `${language}.SUBTITLE`);
  required(location, `${language}.LOCATION`);
  required(objectType, `${language}.OBJECT_TYPE`);
  required(area, `${language}.AREA`);
  if (!descriptionParagraphs.length) {
    throw new Error(`Required field is missing: ${language}.DESCRIPTION`);
  }

  [
    ['LOCATION', location],
    ['OBJECT_TYPE', objectType],
    ['AREA', area],
    ['AUTHOR', author],
    ['PROJECT_TYPE', projectType]
  ].forEach(([field, value]) => assertPlainValue(value, `${language}.${field}`));

  const explicitBadges = lines(source, 'BADGES');
  const styleLabel = styleLabels[project.style]?.[language] || '';
  const defaultBadges = [objectType, styleLabel, languageDefaults.visualization].filter(Boolean);
  const heroLeftSource = text(source, 'HERO_LEFT', true) || title;
  const heroRightSource = text(source, 'HERO_RIGHT', true) || subtitle;
  const cardDescription = text(source, 'CARD_DESCRIPTION') || shorten(descriptionParagraphs[0], 220);
  const seoDescription = text(source, 'SEO_DESCRIPTION') || shorten(descriptionParagraphs[0], 160);

  return {
    heroLeft: splitHero(heroLeftSource, locale),
    heroRight: splitHero(heroRightSource, locale),
    aboutLabel: text(source, 'ABOUT_LABEL') || languageDefaults.aboutLabel,
    aboutTitle: text(source, 'ABOUT_TITLE') || title,
    descriptionParagraphs,
    meta: [
      `${metaLabels.location} | ${location}`,
      `${metaLabels.objectType} | ${objectType}`,
      `${metaLabels.area} | ${area}`,
      `${metaLabels.author} | ${author}`,
      `${metaLabels.projectType} | ${projectType}`
    ],
    cardLabel: text(source, 'CARD_LABEL') || directionLabels[project.direction][language],
    cardToplineLeft: text(source, 'CARD_TOPLINE_LEFT') || objectType,
    cardToplineRight: text(source, 'CARD_TOPLINE_RIGHT') || projectType,
    cardTitle: text(source, 'CARD_TITLE') || title,
    cardDescription,
    badges: explicitBadges.length ? explicitBadges : defaultBadges,
    seoTitle: text(source, 'SEO_TITLE') || `${title} — YVK Design`,
    seoDescription,
    imageAlt: text(source, 'IMAGE_ALT') || `${title} — ${language === 'uk' ? 'головне зображення проєкту' : 'main project image'}`
  };
}

function normalizeSource(parsed, folderName) {
  const project = {
    id: text(parsed.project, 'ID') || folderName,
    status: (text(parsed.project, 'STATUS') || 'draft').toLowerCase(),
    direction: text(parsed.project, 'DIRECTION').toLowerCase(),
    segment: text(parsed.project, 'SEGMENT').toLowerCase(),
    style: text(parsed.project, 'STYLE').toLowerCase(),
    featured: (text(parsed.project, 'FEATURED') || 'no').toLowerCase(),
    order: Number(text(parsed.project, 'ORDER'))
  };

  if (project.id !== folderName) {
    throw new Error(`PROJECT.ID must match the folder name: expected ${folderName}`);
  }
  if (!['draft', 'published'].includes(project.status)) {
    throw new Error('PROJECT.STATUS must be draft or published');
  }
  if (!Object.hasOwn(directionLabels, project.direction)) {
    throw new Error('PROJECT.DIRECTION must be interior or exterior');
  }
  if (!['residential', 'commercial'].includes(project.segment)) {
    throw new Error('PROJECT.SEGMENT must be residential or commercial');
  }
  if (project.style && !Object.hasOwn(styleLabels, project.style)) {
    throw new Error('PROJECT.STYLE must be modern, classic, mixed or empty');
  }
  if (!['yes', 'no'].includes(project.featured)) {
    throw new Error('PROJECT.FEATURED must be yes or no');
  }
  if (!Number.isInteger(project.order) || project.order < 1) {
    throw new Error('PROJECT.ORDER must be a positive whole number');
  }

  return {
    project,
    uk: normalizeLanguage(parsed.uk, 'uk', project),
    en: normalizeLanguage(parsed.en, 'en', project)
  };
}

function renderLanguage(language) {
  if (!language) {
    return `HERO_LEFT:

HERO_RIGHT:

ABOUT_LABEL:

ABOUT_TITLE:

ABOUT_TEXT:

META:

CARD_LABEL:

CARD_TOPLINE_LEFT:

CARD_TOPLINE_RIGHT:

CARD_TITLE:

CARD_DESCRIPTION:

CARD_BADGES:

SEO_TITLE:

SEO_DESCRIPTION:

IMAGE_ALT:
`;
  }

  return `HERO_LEFT:
${language.heroLeft}

HERO_RIGHT:
${language.heroRight}

ABOUT_LABEL:
${language.aboutLabel}

ABOUT_TITLE:
${language.aboutTitle}

ABOUT_TEXT:
${language.descriptionParagraphs.join('\n\n')}

META:
${language.meta.join('\n')}

CARD_LABEL:
${language.cardLabel}

CARD_TOPLINE_LEFT:
${language.cardToplineLeft}

CARD_TOPLINE_RIGHT:
${language.cardToplineRight}

CARD_TITLE:
${language.cardTitle}

CARD_DESCRIPTION:
${language.cardDescription}

CARD_BADGES:
${language.badges.join('\n')}

SEO_TITLE:
${language.seoTitle}

SEO_DESCRIPTION:
${language.seoDescription}

IMAGE_ALT:
${language.imageAlt}
`;
}

function renderProjectContent(normalized) {
  const { project } = normalized;
  return `# Generated from project-description.txt. Edit the source file, not this file.

[PROJECT]

ID:
${project.id}

STATUS:
${project.status}

DIRECTION:
${project.direction}

SEGMENT:
${project.segment}

STYLE:
${project.style}

FEATURED:
${project.featured}

FEATURED_ORDER:
${project.order}


[UA]

${renderLanguage(normalized.uk)}

[EN]

${renderLanguage(normalized.en)}`;
}

function prepareProjectContent(projectDir, options = {}) {
  const sourcePath = path.join(projectDir, 'project-description.txt');
  const outputPath = path.join(projectDir, 'project-content.txt');
  const parsed = parseSource(sourcePath);

  if (!parsed) {
    return { found: false, changed: false, sourcePath, outputPath };
  }

  const normalized = normalizeSource(parsed, path.basename(projectDir));
  const output = renderProjectContent(normalized);
  const previous = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  const changed = previous !== output;

  if (options.write !== false && changed) {
    fs.writeFileSync(outputPath, output, 'utf8');
  }

  return {
    found: true,
    changed,
    sourcePath,
    outputPath,
    status: normalized.project.status,
    languages: {
      uk: Boolean(normalized.uk),
      en: Boolean(normalized.en)
    }
  };
}

module.exports = {
  parseSource,
  prepareProjectContent,
  renderProjectContent
};
