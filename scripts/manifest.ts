import { readdirSync, lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const out: string[] = [];
const excluded = new Set(['MANIFEST.sha256', 'node_modules', '.git', '.codex']);
const walk = (d: string) => {
  for (const e of readdirSync(root + d).sort()) {
    if (excluded.has(e)) continue;
    const p = d ? d + '/' + e : e;
    const info = lstatSync(root + p);
    if (info.isSymbolicLink()) throw new Error('Manifest input must not be a symbolic link: ' + p);
    if (info.isDirectory()) walk(p);
    else out.push(createHash('sha256').update(readFileSync(root + p)).digest('hex') + '  ' + p);
  }
};
walk('');
writeFileSync(root + 'MANIFEST.sha256', out.join('\n') + '\n');
