import { test, expect, describe } from 'bun:test';
import { safeDiagnostic, readableTrace, debug, redactString } from '../src/index';
import { legacyRedact } from './fixtures/legacy-redact';
import { readFileSync } from 'node:fs';

const hidden = (input: string, ...secrets: string[]) => {
  const out = safeDiagnostic(input);
  for (const s of secrets) expect(out).not.toContain(s);
  return out;
};

describe('redaction gaps', () => {
  test('quoted JSON keys', () => {
    hidden('{"token":"abc123SECRET","password": "p w d"}', 'abc123SECRET', 'p w d');
    hidden("{'secret': 'hunter2 x'}", 'hunter2');
  });
  test('escaped JSON in strings', () => {
    hidden('body={\\"access_token\\":\\"abcSECRET\\",\\"x\\":1}', 'abcSECRET');
  });
  test('access/refresh/session token variants', () => {
    hidden('access_token=AAA111 refresh_token=BBB222 session_token=CCC333', 'AAA111', 'BBB222', 'CCC333');
    hidden('{"accessToken":"AAA111","refreshToken":"BBB222","sessionToken":"CCC333","id_token":"DDD444"}', 'AAA111', 'BBB222', 'CCC333', 'DDD444');
    hidden('session_id=ZZZ999; sessionid: YYY888', 'ZZZ999', 'YYY888');
  });
  test('Authorization header forms', () => {
    hidden('Authorization: Bearer abcdef123456', 'abcdef123456');
    hidden('Authorization: Basic dXNlcjpwYXNz', 'dXNlcjpwYXNz');
    hidden('authorization=Digest user="a", response="zzz999"', 'zzz999');
    hidden('Proxy-Authorization: Bearer qwerty12345', 'qwerty12345');
    hidden('{"Authorization":"Bearer abcdef123456"}', 'abcdef123456');
  });
  test('Cookie / Set-Cookie includes all cookie parts', () => {
    hidden('Cookie: a=AAAA1; b=BBBB2; c=CCCC3', 'AAAA1', 'BBBB2', 'CCCC3');
    hidden('Set-Cookie: sid=SSSS1; Path=/; HttpOnly; Secure', 'SSSS1', 'HttpOnly');
    hidden('"cookie":"a=AAAA1; b=BBBB2"', 'AAAA1', 'BBBB2');
    hidden('{\\"cookie\\":\\"a=AAAA1; b=BBBB2\\"}', 'AAAA1', 'BBBB2');
    expect(hidden('Cookie: a=AAAA1\nnext line', 'AAAA1')).toContain('next line');
  });
  test('x-api-key', () => {
    hidden('x-api-key: KEY12345', 'KEY12345');
    hidden('{"X-API-Key":"KEY12345"}', 'KEY12345');
    hidden('api_key=KEY12345&apikey=KEY67890', 'KEY12345', 'KEY67890');
  });
  test('escaped header values', () => {
    hidden('headers: {\\"x-api-key\\":\\"KEY12345\\",\\"authorization\\":\\"Bearer tok123456\\"}', 'KEY12345', 'tok123456');
  });
  test('unix/app/workspace paths', () => {
    for (const p of ['/root/.ssh/id', '/home/u/a.ts', '/app/server.js', '/workspace/web/x.ts', '/var/log/a', '/Users/me/x', '/tmp/x', 'C:\\Users\\a\\b', '~/secrets/a', '/volume1/x']) {
      const out = safeDiagnostic(`at fn (${p}:10:5) failed`);
      expect(out).toContain('[private path]');
      expect(out).not.toMatch(/\/(root|home|app|workspace|var|Users|tmp|volume1)\/|Users|secrets/);
    }
    expect(safeDiagnostic('visit /settings now')).toContain('/settings');
  });
  test('legacy behaviors kept', () => {
    hidden('Bearer abcdefghij sk-abc123 ghp_abc eyJhbGci.eyJzdWIi.sig', 'abcdefghij', 'sk-abc123', 'ghp_abc', 'eyJhbGci');
    expect(safeDiagnostic('GET https://a.example/x?t=1 failed')).toBe('GET [app resource] failed');
    expect(safeDiagnostic('a\u0000b\u0007c')).toBe('abc');
  });
});

describe('bounds and safety', () => {
  test('output <= 500, input preprocessing bounded to 4096', () => {
    expect(safeDiagnostic('x'.repeat(100000)).length).toBe(500);
    // secret beyond 4096 chars is never examined/emitted
    expect(safeDiagnostic('a'.repeat(5000) + 'token=LATE')).not.toContain('LATE');
  });
  test('pathological input finishes quickly', () => {
    const t = performance.now();
    for (const s of ['a-'.repeat(2048), 'token'.repeat(800), '\\"'.repeat(2048), 'Cookie:'.repeat(600), '/home/'.repeat(700)]) safeDiagnostic(s);
    expect(performance.now() - t).toBeLessThan(2000);
  });
  test('unknown objects never serialized, getters not invoked', () => {
    let called = 0;
    const o = { toString() { called++; return 'x'; }, toJSON() { called++; return 'x'; }, get message() { called++; return 'password=abc'; } };
    expect(safeDiagnostic(o)).toBe('진단 정보가 없습니다.');
    expect(safeDiagnostic(Symbol('s'))).toBe('진단 정보가 없습니다.');
    const e = new Error('safe'); Object.defineProperty(e, 'message', { get() { called++; return 'leak'; } });
    expect(safeDiagnostic(e)).not.toContain('leak');
    const e2 = new Error('x'); Object.defineProperty(e2, 'stack', { get() { called++; return 'leak\nat leak'; } });
    expect(readableTrace(e2).frames).toEqual([]);
    const e3 = new Error('x'); Object.defineProperty(e3, 'digest', { get() { called++; return 'abc'; } });
    expect(readableTrace(e3).reference).toBeNull();
    expect(called).toBe(0);
  });
  test('Error message redacted', () => {
    expect(safeDiagnostic(new Error('failed token=abc123'))).not.toContain('abc123');
  });
});

describe('public exports', () => {
  test('server digest excludes message and stack', () => {
    const e = Object.assign(new Error('secret db password=x /root/a'), { digest: 'abc_123' });
    const t = readableTrace(e);
    expect(t.frames).toEqual([]);
    expect(t.reference).toBe('abc_123');
    expect(JSON.stringify(t)).not.toContain('password');
    expect(readableTrace(Object.assign(new Error('x'), { digest: 'bad digest!' })).reference).toBeNull();
  });
  test('readableTrace frames redacted and capped at 8', () => {
    const e = new Error('m'); e.stack = 'Error: m\n' + Array.from({ length: 20 }, (_, i) => `  at f${i} (/app/src/a.ts:1:${i})`).join('\n');
    const t = readableTrace(e);
    expect(t.frames.length).toBe(8);
    expect(t.frames.join()).not.toContain('/app/');
    expect(readableTrace('str').frames).toEqual([]);
  });
  test('debug is frozen and logs redacted', () => {
    expect(Object.isFrozen(debug)).toBe(true);
    const orig = console.error; const seen: unknown[][] = [];
    console.error = (...a: unknown[]) => { seen.push(a); };
    try { debug.error('E1', new Error('password=zzz')); } finally { console.error = orig; }
    expect(JSON.stringify(seen)).not.toContain('zzz');
    expect(typeof redactString).toBe('function');
  });
});

describe('lookbehind removal', () => {
  test('source and build contain no regex lookbehind', () => {
    for (const f of ['../src/diagnostics.ts', '../src/command-language.ts', '../src/index.ts', '../dist/index.js', '../dist/diagnostics.js'])
      expect(readFileSync(new URL(f, import.meta.url), 'utf8')).not.toMatch(/\(\?<[!=]/);
  });
  test('start-of-string and boundary cases', () => {
    expect(safeDiagnostic('token=ABC')).toBe('[redacted]');
    expect(safeDiagnostic('Bearer abcdefghij')).toBe('[redacted]');
    expect(safeDiagnostic('Cookie: a=1')).toBe('[redacted]');
    expect(safeDiagnostic('/root/x')).toBe('[private path]');
    expect(safeDiagnostic('~/x')).toBe('[private path]');
    expect(safeDiagnostic('C:\\a\\b')).toBe('[private path]');
    expect(safeDiagnostic('"token":"AB"')).toBe('[redacted]');
    expect(safeDiagnostic('{\\"cookie\\":\\"a=1\\"}')).not.toContain('a=1');
    // boundary: word/hyphen-preceded scheme and paths keep legacy behavior
    expect(safeDiagnostic('xBearer abcdefghij')).toBe(legacyRedact('xBearer abcdefghij'));
    expect(safeDiagnostic('a/root/x')).toBe(legacyRedact('a/root/x'));
    expect(safeDiagnostic('file:///root/x')).toBe(legacyRedact('file:///root/x'));
    expect(safeDiagnostic('"token":"a""token":"b"')).toBe(legacyRedact('"token":"a""token":"b"'));
  });
  test('differential fuzz against the previous lookbehind implementation', () => {
    const parts = ['token', 'Token', 'x-api-key', 'api_key', 'Authorization', 'Proxy-Authorization', 'Cookie', 'Set-Cookie', 'session_id', 'sid', 'Bearer', 'basic', 'abcdefghij', 'AAA111',
      ':', '=', ': ', ' = ', '"', "'", '\\"', '\\', '/', '//', 'file://', '/root/', '/home/u', '/app', '~/', 'C:\\', '\\\\srv\\x', 'a', 'Z9', '-', '_', '.', ' ', '\n', ';', ',', '&', '}', ']', 'sk-abc', 'eyJa.b.c', 'https://h.io/p', '(', ')', ':10:5'];
    let seed = 123456789;
    const rnd = (n: number) => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) % n;
    let mismatches = 0;
    for (let i = 0; i < 20000; i++) {
      let s = ''; const n = 1 + rnd(14);
      for (let k = 0; k < n; k++) s += parts[rnd(parts.length)];
      if (redactString(s) !== legacyRedact(s)) { mismatches++; if (mismatches < 4) console.log('MISMATCH', JSON.stringify(s)); }
    }
    expect(mismatches).toBe(0);
  });
  test('fuzz includes long bounded inputs', () => {
    for (const s of ['a-'.repeat(3000) + 'token=x', ('Cookie: a=1\n/root/x token="y" Bearer abcdefgh ').repeat(120), '/'.repeat(5000), '-token'.repeat(900)])
      expect(redactString(s)).toBe(legacyRedact(s));
  });
});

describe('own-data reads vs Proxy', () => {
  test('accessors on real Errors are not invoked; message uses own data property only', () => {
    let called = 0;
    const e = new Error('x'); Object.defineProperty(e, 'message', { get() { called++; return 'leak'; } });
    expect(safeDiagnostic(e)).not.toContain('leak');
    expect(called).toBe(0);
  });
  test('Proxy traps are not prohibited: a throwing trap is contained, a returning trap is still redacted and bounded', () => {
    const throwing = new Proxy(new Error('m'), { getOwnPropertyDescriptor() { throw new Error('trap'); }, getPrototypeOf() { throw new Error('trap'); } });
    expect(() => safeDiagnostic(throwing)).not.toThrow();
    expect(() => readableTrace(throwing)).not.toThrow();
    const err = new Error('base');
    const evil = new Proxy(err, { getOwnPropertyDescriptor(t, k) { return k === 'message' ? { value: 'password=hunter2 ' + 'x'.repeat(9000), configurable: true, enumerable: false, writable: true } : Reflect.getOwnPropertyDescriptor(t, k); } });
    const out = safeDiagnostic(evil);
    expect(out).not.toContain('hunter2');
    expect(out.length).toBeLessThanOrEqual(500);
  });
});
