// Reproducible build: fixed entries, no minify, no sourcemap/timestamps.
import { copyFileSync, mkdirSync, rmSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
rmSync(root + 'dist', { recursive: true, force: true });
mkdirSync(root + 'dist', { recursive: true });
// Public projection of the authoritative src/version.json (never edited by the build).
const auth = JSON.parse(readFileSync(root + 'src/version.json', 'utf8'));
const projection = JSON.stringify({ name: auth.name, version: auth.version, command_protocol: auth.command_protocol }, null, 2) + '\n';
writeFileSync(root + 'src/client-version.json', projection);
const entries: [string, string][] = [['src/index.ts','index'],['src/command.ts','command'],['src/diag-entry.ts','diagnostics']];
for (const [src, name] of entries) {
  const r = await Bun.build({ entrypoints: [root + src], target: 'browser', format: 'esm', minify: false, sourcemap: 'none', outdir: root + 'dist', naming: name + '.js' });
  if (!r.success) { console.error(r.logs); process.exit(1); }
}
copyFileSync(root + 'src/client-version.json', root + 'dist/client-version.json');
for (const file of readdirSync(root + 'types')) if (file.endsWith('.d.ts')) copyFileSync(root + 'types/' + file, root + 'dist/' + file);
console.log('build ok');
