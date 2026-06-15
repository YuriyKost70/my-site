const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const projectsRoot = path.join(root, 'assets', 'projects');
const args = process.argv.slice(2);
const projectIndex = args.indexOf('--project');
const projectName = projectIndex >= 0 ? args[projectIndex + 1] : '';
const force = args.includes('--force');

const styles = {
  'project-interior-apartment-001': 'modern',
  'project-interior-apartment-002': 'modern',
  'project-interior-apartment-003': 'modern',
  'project-interior-apartment-004': 'modern',
  'project-interior-apartment-005': 'modern',
  'project-interior-apartment-006': 'classic',
  'project-interior-house-001': 'modern',
  'project-interior-house-002': 'classic'
};

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

function trimEmptyLines(lines = []) {
  const result = [...lines];
  while (result.length && !result[0].trim()) result.shift();
  while (result.length && !result[result.length - 1].trim()) result.pop();
  return result;
}

function parseContent(filePath) {
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
      field = fieldMatch[1].toUpperCase();
      const allowed = section === 'project' ? projectFields : contentFields;
      if (!section || !allowed.has(field)) {
        throw new Error(`Unsupported field at line ${index + 1}: ${field}`);
      }
      result[section][field] = [];
      if (fieldMatch[2]) result[section][field].push(fieldMatch[2]);
      continue;
    }

    if (section && field) result[section][field].push(rawLine);
  }

  return result;
}

function text(fields, name, multiline = false) {
  const source = trimEmptyLines(fields[name]);
  if (!source.length) return '';
  return multiline
    ? source.map((line) => line.trim()).filter(Boolean).join('\n')
    : source.map((line) => line.trim()).filter(Boolean).join(' ');
}

function rawBlock(fields, name) {
  return trimEmptyLines(fields[name]).join('\n');
}

function metaValues(fields, language) {
  const entries = trimEmptyLines(fields.META).filter((line) => line.trim()).map((line) => {
    const separator = line.indexOf('|');
    return {
      label: separator >= 0 ? line.slice(0, separator).trim() : '',
      value: separator >= 0 ? line.slice(separator + 1).trim() : ''
    };
  });

  if (entries.length < 5) {
    throw new Error(`Expected five META entries in ${language}`);
  }

  return {
    location: entries[0],
    objectType: entries[1],
    area: entries[2],
    author: entries[3],
    projectType: entries[4]
  };
}

function localizedSeo(config, language) {
  const seo = config.seo?.[language] || {};
  return {
    title: seo.title || '',
    description: seo.description || '',
    imageAlt: config.hero?.imageAlt?.[language] || ''
  };
}

function renderLanguage(fields, config, language) {
  const meta = metaValues(fields, language);
  const seo = localizedSeo(config, language);
  const heroLeft = rawBlock(fields, 'HERO_LEFT');
  const heroRight = rawBlock(fields, 'HERO_RIGHT');

  return `TITLE:
${text(fields, 'CARD_TITLE')}

SUBTITLE:
${text(fields, 'HERO_RIGHT')}

LOCATION:
${meta.location.value}

LOCATION_LABEL:
${meta.location.label}

OBJECT_TYPE:
${meta.objectType.value}

OBJECT_TYPE_LABEL:
${meta.objectType.label}

AREA:
${meta.area.value}

AREA_LABEL:
${meta.area.label}

AUTHOR:
${meta.author.value}

AUTHOR_LABEL:
${meta.author.label}

PROJECT_TYPE:
${meta.projectType.value}

PROJECT_TYPE_LABEL:
${meta.projectType.label}

DESCRIPTION:
${rawBlock(fields, 'ABOUT_TEXT')}

HERO_LEFT:
${heroLeft}

HERO_RIGHT:
${heroRight}

ABOUT_LABEL:
${text(fields, 'ABOUT_LABEL')}

ABOUT_TITLE:
${text(fields, 'ABOUT_TITLE')}

CARD_LABEL:
${text(fields, 'CARD_LABEL')}

CARD_TOPLINE_LEFT:
${text(fields, 'CARD_TOPLINE_LEFT')}

CARD_TOPLINE_RIGHT:
${text(fields, 'CARD_TOPLINE_RIGHT')}

CARD_TITLE:
${text(fields, 'CARD_TITLE')}

CARD_DESCRIPTION:
${text(fields, 'CARD_DESCRIPTION')}

BADGES:
${rawBlock(fields, 'CARD_BADGES')}

SEO_TITLE:
${seo.title}

SEO_DESCRIPTION:
${seo.description}

IMAGE_ALT:
${seo.imageAlt}`;
}

function migrate(folderName) {
  const projectDir = path.join(projectsRoot, folderName);
  const contentPath = path.join(projectDir, 'project-content.txt');
  const configPath = path.join(projectDir, 'project.auto.json');
  const outputPath = path.join(projectDir, 'project-description.txt');

  if (!fs.existsSync(contentPath) || !fs.existsSync(configPath)) {
    throw new Error(`Missing project files in ${folderName}`);
  }
  if (fs.existsSync(outputPath) && !force) {
    console.log(`Skipped ${folderName}: project-description.txt already exists`);
    return;
  }

  const content = parseContent(contentPath);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const id = text(content.project, 'ID') || folderName;
  const direction = text(content.project, 'DIRECTION');
  const segment = text(content.project, 'SEGMENT');
  const featured = text(content.project, 'FEATURED');
  const order = text(content.project, 'FEATURED_ORDER');
  const style = text(content.project, 'STYLE') || styles[folderName] || '';

  const output = `[PROJECT]

ID:

STATUS:
published

DIRECTION:
${direction}

SEGMENT:
${segment}

STYLE:
${style}

FEATURED:
${featured}

ORDER:
${order}


[UA]

${renderLanguage(content.uk, config, 'uk')}


[EN]

${renderLanguage(content.en, config, 'en')}
`;

  if (id !== folderName) {
    throw new Error(`Project ID does not match folder name: ${id}`);
  }

  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`Migrated ${folderName}`);
}

if (projectName) {
  migrate(projectName);
} else {
  fs.readdirSync(projectsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .sort()
    .forEach(migrate);
}
