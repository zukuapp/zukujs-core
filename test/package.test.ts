import { test, expect } from 'bun:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

test('Node ESM consumer resolves every declared package export from dist only', () => {
  const directory = mkdtempSync(join(tmpdir(), 'zuku-core-consumer-'));
  try {
    const packageDirectory = join(directory, 'node_modules/@zukujs/core');
    mkdirSync(packageDirectory, { recursive: true });
    cpSync(join(root, 'dist'), join(packageDirectory, 'dist'), { recursive: true });
    cpSync(join(root, 'package.json'), join(packageDirectory, 'package.json'));
    writeFileSync(join(directory, 'consumer.mjs'), `
      import assert from 'node:assert/strict';
      import { parseCommand, safeDiagnostic, IDENTITY } from '@zukujs/core';
      import { commandHelp } from '@zukujs/core/command';
      import { readableTrace } from '@zukujs/core/diagnostics';
      import identity from '@zukujs/core/client-version.json' with { type: 'json' };
      assert.deepEqual(parseCommand('go("jump")'), {name: 'navigation.open', args: ['jump']});
      assert.equal(commandHelp('app')[0].name, 'app.status');
      assert.equal(safeDiagnostic('token=example'), '[redacted]');
      assert.equal(readableTrace(null).reference, null);
      assert.deepEqual(identity, IDENTITY);
      assert.deepEqual(Object.keys(identity), ['name', 'version', 'command_protocol']);
      console.log('consumer exports ok');
    `);
    const result = Bun.spawnSync(['node', join(directory, 'consumer.mjs')]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain('consumer exports ok');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test('manifest excludes VCS and task state in a path containing spaces', () => {
  const directory = mkdtempSync(join(tmpdir(), 'zuku core manifest '));
  try {
    mkdirSync(join(directory, 'scripts'));
    cpSync(join(root, 'scripts/manifest.ts'), join(directory, 'scripts/manifest.ts'));
    mkdirSync(join(directory, '.git'));
    mkdirSync(join(directory, '.codex'));
    writeFileSync(join(directory, '.git/config'), 'private local metadata');
    writeFileSync(join(directory, '.codex/task-state.md'), 'local task state');
    writeFileSync(join(directory, 'source.ts'), 'export const value = 1;');
    let result = Bun.spawnSync([process.execPath, join(directory, 'scripts/manifest.ts')]);
    expect(result.exitCode).toBe(0);
    const manifest = readFileSync(join(directory, 'MANIFEST.sha256'), 'utf8');
    expect(manifest).toContain('  source.ts');
    expect(manifest).not.toContain('.git/');
    expect(manifest).not.toContain('.codex/');
    symlinkSync(join(directory, '.git/config'), join(directory, 'outside-link'));
    result = Bun.spawnSync([process.execPath, join(directory, 'scripts/manifest.ts')]);
    expect(result.exitCode).not.toBe(0);
    expect(readFileSync(join(directory, 'MANIFEST.sha256'), 'utf8')).toBe(manifest);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
