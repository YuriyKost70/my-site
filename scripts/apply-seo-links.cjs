const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://yvkdesign.com.ua';
const ROOT = path.resolve(__dirname, '..');

function cleanPath(fileName) {
  if (fileName === 'index.html') return '/';
  return `/${fileName.replace(/\.html$/, '')}`;
}

function absoluteUrl(fileName) {
  return `${SITE_URL}${cleanPath(fileName)}`;
}

function counterpartFor(fileName) {
  if (fileName === 'index.html') return 'index-en.html';
  if (fileName === 'index-en.html') return 'index.html';
  if (fileName.endsWith('-en.html')) return fileName.replace(/-en\.html$/, '.html');
  return fileName.replace(/\.html$/, '-en.html');
}

function ukFileFor(fileName) {
  return fileName.endsWith('-en.html') ? counterpartFor(fileName) : fileName;
}

function enFileFor(fileName) {
  return fileName.endsWith('-en.html') ? fileName : counterpartFor(fileName);
}

function buildLinks(fileName, files) {
  const canonical = absoluteUrl(fileName);
  const ukFile = ukFileFor(fileName);
  const enFile = enFileFor(fileName);
  const lines = [`  <link rel="canonical" href="${canonical}" />`];

  if (files.has(ukFile)) {
    lines.push(`  <link rel="alternate" hreflang="uk" href="${absoluteUrl(ukFile)}" />`);
  }

  if (files.has(enFile)) {
    lines.push(`  <link rel="alternate" hreflang="en" href="${absoluteUrl(enFile)}" />`);
  }

  if (files.has(ukFile)) {
    lines.push(`  <link rel="alternate" hreflang="x-default" href="${absoluteUrl(ukFile)}" />`);
  }

  return lines.join('\n');
}

function stripExistingSeoLinks(html) {
  return html.replace(/\n\s*<link\s+rel="(?:canonical|alternate)"[^>]*\/?>/gi, '');
}

function insertLinks(html, links) {
  const descriptionMatch = html.match(/(\n\s*<meta\s+name="description"[\s\S]*?\/>)/i);
  if (descriptionMatch) {
    return html.replace(descriptionMatch[1], `${descriptionMatch[1]}\n${links}`);
  }

  const titleMatch = html.match(/(\n\s*<title>[\s\S]*?<\/title>)/i);
  if (titleMatch) {
    return html.replace(titleMatch[1], `${titleMatch[1]}\n${links}`);
  }

  return html.replace(/<head>/i, `<head>\n${links}`);
}

const htmlFiles = fs.readdirSync(ROOT).filter((fileName) => fileName.endsWith('.html'));
const files = new Set(htmlFiles);

for (const fileName of htmlFiles) {
  const filePath = path.join(ROOT, fileName);
  const original = fs.readFileSync(filePath, 'utf8');
  const withoutLinks = stripExistingSeoLinks(original);
  const updated = insertLinks(withoutLinks, buildLinks(fileName, files));

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
  }
}

console.log(`Applied SEO links to ${htmlFiles.length} HTML files.`);
