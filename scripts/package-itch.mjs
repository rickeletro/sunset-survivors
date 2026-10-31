import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = path.join(root, 'dist');
const zipOutput = path.join(root, 'sunset-survivors.zip');

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('Error: dist/index.html not found. Run npm run build first.');
  process.exit(1);
}

const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(item => {
  const p = path.join(dir, item.name);
  if (item.name.startsWith('.')) return [];
  return item.isDirectory() ? walk(p) : [p];
});

const files = walk(dist);
console.log(`Auditing dist/: ${files.length} files found (itch.io limit: 1000).`);

if (files.length > 1000) {
  console.error(`Error: File count (${files.length}) exceeds itch.io 1000 limit!`);
  process.exit(1);
}

const pyCode = `
import zipfile, os, sys
root_dir = sys.argv[1]
zip_path = sys.argv[2]
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for foldername, subfolders, filenames in os.walk(root_dir):
        subfolders[:] = [d for d in subfolders if not d.startswith(".")]
        for filename in filenames:
            if filename.startswith("."):
                continue
            filepath = os.path.join(foldername, filename)
            arcname = os.path.relpath(filepath, root_dir)
            zf.write(filepath, arcname)
print(f"Packaged {len(zf.infolist())} files into {os.path.basename(zip_path)}")
`;

execFileSync('python3', ['-c', pyCode, dist, zipOutput], { stdio: 'inherit' });

console.log(`\nSuccessfully created sunset-survivors.zip!`);
console.log(`Total files inside ZIP: ${files.length} (Under 1,000 threshold)`);
console.log(`index.html is at the root of the ZIP file.`);
