const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

const publicAssetExtensions = new Set([
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
]);

const rootFileExtensions = new Set([".html"]);
const publicDirectories = new Set(["css", "js"]);

function ensureInsideRoot(target) {
  const resolved = path.resolve(target);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Refusing to work outside project root: ${resolved}`);
  }
  return resolved;
}

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function walk(directory, onFile) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, onFile);
    } else if (entry.isFile()) {
      onFile(fullPath);
    }
  }
}

function copyDirectory(sourceDir, targetDir, shouldCopy) {
  if (!fs.existsSync(sourceDir)) {
    return 0;
  }

  let count = 0;
  walk(sourceDir, (sourceFile) => {
    if (!shouldCopy(sourceFile)) {
      return;
    }

    const relative = path.relative(sourceDir, sourceFile);
    copyFile(sourceFile, path.join(targetDir, relative));
    count += 1;
  });
  return count;
}

ensureInsideRoot(dist);
fs.rmSync(dist, { force: true, recursive: true });
fs.mkdirSync(dist, { recursive: true });

let copied = 0;

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  const source = path.join(root, entry.name);
  if (entry.isFile() && rootFileExtensions.has(path.extname(entry.name).toLowerCase())) {
    copyFile(source, path.join(dist, entry.name));
    copied += 1;
  }
}

for (const dirName of publicDirectories) {
  copied += copyDirectory(path.join(root, dirName), path.join(dist, dirName), () => true);
}

copied += copyDirectory(
  path.join(root, "assets"),
  path.join(dist, "assets"),
  (sourceFile) => publicAssetExtensions.has(path.extname(sourceFile).toLowerCase()),
);

const totalBytes = (() => {
  let sum = 0;
  walk(dist, (file) => {
    sum += fs.statSync(file).size;
  });
  return sum;
})();

console.log(`Built dist: ${copied} files, ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
