import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('..', import.meta.url).pathname;
const out: string[] = [];
const walk = (d: string) => { for (const e of readdirSync(root + d).sort()) { const p = d ? d + '/' + e : e; if (e === 'MANIFEST.sha256' || e === 'node_modules') continue; statSync(root + p).isDirectory() ? walk(p) : out.push(createHash('sha256').update(readFileSync(root + p)).digest('hex') + '  ' + p); } };
walk('');
writeFileSync(root + 'MANIFEST.sha256', out.join('\n') + '\n');
