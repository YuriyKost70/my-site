const path = require('path');
const { prepareProjectContent } = require('./project-description.cjs');

const root = path.resolve(__dirname, '..');
const projectsRoot = path.join(root, 'assets', 'projects');
const args = process.argv.slice(2);
const projectIndex = args.indexOf('--project');
const projectName = projectIndex >= 0 ? args[projectIndex + 1] : '';
const checkOnly = args.includes('--check');

if (!projectName) {
  throw new Error('Use --project <folder-name>');
}

const projectDir = path.join(projectsRoot, projectName);
const result = prepareProjectContent(projectDir, { write: !checkOnly });

if (!result.found) {
  throw new Error(`project-description.txt was not found in ${projectName}`);
}

const action = checkOnly
  ? result.changed ? 'needs regeneration' : 'is up to date'
  : result.changed ? 'generated' : 'is already up to date';

console.log(`project-content.txt ${action}`);
console.log(`Status: ${result.status}`);
console.log(`Languages: UK ${result.languages.uk ? 'ready' : 'empty'}, EN ${result.languages.en ? 'ready' : 'empty'}`);
