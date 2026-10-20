import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const registry = path.join(root, 'src/audio/musicManifest.json');
const manifest = JSON.parse(readFileSync(registry, 'utf8'));
if (process.argv.includes('--prompts')) {
  for (const entry of manifest.stages.filter(track => !track.file)) console.log(`\nSTAGE ${entry.stage}: ${entry.title}\n${entry.prompt}\n`);
} else {
  const args = process.argv.slice(2), stage = Number(args[args.indexOf('--stage') + 1]);
  const fileIndex = args.indexOf('--file');
  const entry = manifest.stages.find(track => track.stage === stage);
  if (!entry || fileIndex < 0 || !args[fileIndex + 1]) throw new Error('Usage: npm run music:import -- --stage 2 --file /path/to/track.mp3');
  const source = path.resolve(args[fileIndex + 1]), extension = path.extname(source).toLowerCase();
  if (!['.mp3', '.ogg', '.wav'].includes(extension)) throw new Error('Expected an MP3, Ogg or WAV audio file.');
  const bytes = readFileSync(source);
  const audioHeader = bytes.subarray(0, 4).toString('ascii');
  if (!(audioHeader.startsWith('ID3') || audioHeader === 'OggS' || audioHeader === 'RIFF' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))) throw new Error('File does not have a recognized audio header.');
  const destination = `assets/audio/stages/${entry.slug}${extension}`, target = path.join(root, 'public', destination);
  if (existsSync(target)) throw new Error(`Refusing to overwrite ${destination}; review the existing track first.`);
  mkdirSync(path.dirname(target), { recursive: true }); copyFileSync(source, target);
  entry.file = destination; writeFileSync(registry, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Imported stage ${stage}: ${destination}`);
}
