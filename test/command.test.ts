import { test, expect } from 'bun:test';
import { readFileSync, existsSync } from 'node:fs';
import { parseCommand, commandHelp, CommandError, COMMAND_PROTOCOL, VERSION, IDENTITY } from '../src/index';
import * as dist from '../dist/index.js';

test('parse aliases and namespaced', () => {
  expect(parseCommand('help();')).toEqual({ name: 'system.help', args: [] });
  expect(parseCommand('zuku go("jump")')).toEqual({ name: 'navigation.open', args: ['jump'] });
  expect(parseCommand('ZukuJS.system.version();').name).toBe('system.version');
});
test('rejects javascript and bad args', () => {
  for (const s of ['alert(1)', 'help(1)', 'help("a b")', 'go("a","b")', 'constructor()', '__proto__()', 'help(); alert(1)', 'x'.repeat(3000)])
    expect(() => parseCommand(s)).toThrow(CommandError);
  expect(() => parseCommand(5)).toThrow(CommandError);
});
test('commandHelp filtering', () => {
  expect(commandHelp('app').map(c => c.name)).toEqual(['app.status']);
  expect(() => commandHelp('a b')).toThrow(CommandError);
});
test('version identity', () => {
  expect(VERSION).toBe('27.0.0');
  expect(COMMAND_PROTOCOL).toBe('zuku-command/1');
});
test('authoritative version.json byte-identical to baseline; client projection exact', () => {
  const a = readFileSync(new URL('../src/version.json', import.meta.url));
  expect(a.equals(readFileSync(process.env.ZUKUJS_IDENTITY_FILE ?? new URL('./fixtures/authoritative-version.json', import.meta.url)))).toBe(true);
  const auth = JSON.parse(a.toString('utf8'));
  const client = readFileSync(new URL('../src/client-version.json', import.meta.url));
  const parsed = JSON.parse(client.toString('utf8'));
  expect(Object.keys(parsed)).toEqual(['name', 'version', 'command_protocol']);
  expect(parsed).toEqual({ name: auth.name, version: auth.version, command_protocol: auth.command_protocol });
  expect(client.equals(readFileSync(new URL('../dist/client-version.json', import.meta.url)))).toBe(true);
  expect(existsSync(new URL('../dist/version.json', import.meta.url))).toBe(false);
});
test('public surface and dist do not expose upstream/internal protocol', () => {
  expect(Object.keys(IDENTITY)).toEqual(['name', 'version', 'command_protocol']);
  for (const f of ['index.js', 'command.js', 'diagnostics.js', 'client-version.json', 'index.d.ts'])
    expect(readFileSync(new URL('../dist/' + f, import.meta.url), 'utf8')).not.toMatch(/zuku-hmac|internal_protocol|upstream|16\.4\.0-canary/);
  expect(readFileSync(new URL('../dist/diagnostics.js', import.meta.url), 'utf8')).not.toContain('(?<');
  expect(readFileSync(new URL('../dist/index.js', import.meta.url), 'utf8')).not.toContain('(?<');
});
test('built dist exports are present and work', () => {
  for (const k of ['parseCommand', 'commandHelp', 'safeDiagnostic', 'readableTrace', 'debug', 'COMMANDS', 'CommandError'])
    expect(k in dist).toBe(true);
  expect(dist.safeDiagnostic('token=abc')).not.toContain('abc');
});
