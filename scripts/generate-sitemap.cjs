const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://yvkdesign.com.ua';
const ROOT = path.resolve(__dirname, '..');
const TODAY = new Date().toISOString().slice(0, 10);

function urlForFile(fileName) {
  if (fileName === 'index.html') return '/';
  return `/${fileName.replace(/\.html$/, '')}`;
}

function priorityForFile(fileName) {
  if (fileName === 'index.html' || fileName === 'index-en.html') return '1.0';
  if (fileName.startsWith('services') || fileName.startsWith('projects')) return '0.9';
  if (fileName.startsWith('contact')) return '0.8';
  return '0.7';
}

function changefreqForFile(fileName) {
  if (fileName.startsWith('project-')) return 'monthly';
  if (fileName.startsWith('projects') || fileName.startsWith('index')) return 'weekly';
  return 'monthly';
}

const htmlFiles = fs
  .readdirSync(ROOT)
  .filter((fileName) => fileName.endsWith('.html'))
  .sort((a, b) => {
    const order = ['index.html', 'index-en.html', 'services.html', 'services-en.html', 'projects.html', 'projects-en.html', 'contact.html', 'contact-en.html'];
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai !== -1 || bi !== -1) return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    return a.localeCompare(b);
  });

const urls = htmlFiles
  .map((fileName) => {
    const loc = `${SITE_URL}${urlForFile(fileName)}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreqForFile(fileName)}</changefreq>
    <priority>${priorityForFile(fileName)}</priority>
  </url>`;
  })
  .join('\n');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
console.log(`Generated sitemap.xml with ${htmlFiles.length} URLs.`);
