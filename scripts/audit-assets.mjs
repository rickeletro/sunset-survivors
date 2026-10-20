import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const catalog = JSON.parse(readFileSync(path.join(root, 'src/assets/catalog.json'), 'utf8'));
const walk = dir => existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).flatMap(item => {
  const file = path.join(dir, item.name);
  return item.isDirectory() ? walk(file) : [file];
}) : [];
const image = file => /\.(png|jpe?g|webp|svg)$/i.test(file);
const runtime = new Set([...Object.values(catalog.images), ...Object.values(catalog.sheets).map(s => s.path)]);
for (const sequence of Object.values(catalog.sequences)) {
  for (const direction of sequence.directions) for (let i = 0; i < sequence.frames; i++) {
    runtime.add(`${sequence.root}/${direction ? `${direction}/` : ''}frame_${String(i).padStart(3, '0')}.png`);
  }
}
const missing = [...runtime].filter(file => !existsSync(path.join(root, 'public', file)));
if (missing.length) throw new Error(`Missing runtime images:\n${missing.join('\n')}`);
// A new literal path must first be registered, so the audit cannot silently delete it.
for (const file of walk(path.join(root, 'src')).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'))) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (node.text.startsWith('assets/') && image(node.text) && !runtime.has(node.text)) throw new Error(`Unregistered image in ${path.relative(root, file)}: ${node.text}`);
    }
    if (ts.isTemplateExpression(node) && node.head.text.startsWith('assets/') && image(node.templateSpans.at(-1).literal.text)) throw new Error(`Dynamic image path must use the asset registry: ${path.relative(root, file)}`);
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const candidates = [...walk(path.join(root, 'public')), ...walk(path.join(root, 'src/assets'))]
  .filter(image).filter(file => !runtime.has(path.relative(path.join(root, 'public'), file).split(path.sep).join('/')))
  .map(file => ({ path: path.relative(root, file), bytes: readFileSync(file).byteLength, sha256: createHash('sha256').update(readFileSync(file)).digest('hex') }));
if (process.argv.includes('--write')) {
  const archives = [];
  // Originals and exports are editable source material, not files served by Vite.
  for (const file of walk(path.join(root, 'public/assets')).filter(f => /\.(zip|json)$/i.test(f))) {
    const relative = path.relative(path.join(root, 'public/assets'), file);
    if (!relative.includes(`${path.sep}pixellab${path.sep}`)) continue;
    const target = path.join(root, 'art/source', relative);
    if (existsSync(target)) throw new Error(`Refusing to overwrite source artifact: ${target}`);
    mkdirSync(path.dirname(target), { recursive: true }); renameSync(file, target);
    archives.push({ from: path.relative(root, file), to: path.relative(root, target) });
  }
  const report = { runtimeImages: runtime.size, removedImages: candidates.length, removedBytes: candidates.reduce((sum, f) => sum + f.bytes, 0), removed: candidates, movedSourceArtifacts: archives };
  const reportPath = path.join(root, 'docs/architecture/asset-cleanup.json');
  mkdirSync(path.dirname(reportPath), { recursive: true });
  if (existsSync(reportPath)) throw new Error('Cleanup report already exists; review before overwriting it.');
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  for (const file of candidates) unlinkSync(path.join(root, file.path));
  console.log(`Removed ${candidates.length} unused images (${(report.removedBytes / 1024 / 1024).toFixed(1)} MiB); moved ${archives.length} source artifacts out of public/.`);
} else {
  console.log(`Runtime images: ${runtime.size}; missing: ${missing.length}; unused: ${candidates.length} (${(candidates.reduce((sum, f) => sum + f.bytes, 0) / 1024 / 1024).toFixed(1)} MiB).`);
  if (process.argv.includes('--list')) for (const file of candidates) console.log(file.path);
  if (candidates.length && process.argv.includes('--check')) process.exitCode = 1;
}
