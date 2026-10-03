/**
 * Diagnostics redaction. Pure string processing; never serializes unknown
 * objects. Own data properties are read via descriptors, so accessors are not invoked and
 * toString/toJSON are never called; Proxy traps cannot generally be prohibited (see docs/API.md).
 */
export const MAX_INPUT = 4096;
export const MAX_OUTPUT = 500;
const R = '[redacted]';

// Value forms: escaped-quote JSON (\"x\"), double, single, then bare.
const QV = String.raw`\\"(?:(?!\\").)*\\"|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'`;
const KEY_OPEN = String.raw`(?:\\*["'])?`;
const KEY_CLOSE = String.raw`(?:\\*["'])?`;
const SEP = String.raw`\s*[:=]\s*`;

// Boundary (formerly lookbehind) is a captured prefix: start of string or one non-forbidden char.
const LEAD = String.raw`(^|[^\w-])`;
const LEAD_PATH = String.raw`(^|[^\w.:\/-])`;

// Headers whose bare value may contain spaces/semicolons: redact the whole line.
const HEADER = new RegExp(
  String.raw`${LEAD}(?:proxy-)?(?:authorization|(?:set-)?cookie2?)${KEY_CLOSE}${SEP}(?:${QV}|[^\r\n]*)`, 'gi');
const SENSITIVE_KEY = new RegExp(
  String.raw`${LEAD}${KEY_OPEN}[\w-]*(?:token|password|passwd|pwd|secret|api[_-]?key|apikey|credential|session(?:[_-]?id)?|sid)[\w-]*${KEY_CLOSE}${SEP}(?:${QV}|(?:bearer|basic)\s+[^\s,;&}\]]+|[^\s,;&}\]"']+)`, 'gi');
const SCHEME = new RegExp(String.raw`${LEAD}(?:bearer|basic)\s+[A-Za-z0-9._~+\/=-]{6,}`, 'gi');
const PREFIXED = /\b(?:shz_(?:at|bs|rt)_|sk-|ghp_|gho_|ghs_|github_pat_|xox[abp]-|AKIA)[a-zA-Z0-9_-]+/g;
const JWT = /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]*/g;
const URLS = /(?:https?|wss?|ftp):\/\/[^\s)'"<>]+/gi;
const PATHS = new RegExp(
  String.raw`${LEAD_PATH}(?:\/(?:root|home|srv|etc|var|tmp|usr|opt|mnt|proc|run|app|workspace|workspaces|data|snapshot|Users|private|volume\d+|build|code|github)(?:\/[^\s)'"<>:]*)?|~\/[^\s)'"<>:]*|[A-Za-z]:[\\/][^\s)'"<>]*|\\\\[^\s\\)]+\\[^\s)'"<>]*)`, 'g');
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

// Regex lookbehind is deliberately not used (older mobile JS engines reject the syntax at parse
// time). The boundary that a negative lookbehind used to assert is instead a captured prefix
// (group 1: start of string, or one char outside the forbidden class) that is re-emitted verbatim.
// A prefix char consumed by one match cannot serve the next one, so after each match scanning
// resumes one char early (the last matched char acts as the next prefix iff it is allowed, which
// the regex itself enforces). Failing positions are rejected in O(1) by the prefix, so work stays
// linear-ish and bounded by MAX_INPUT. The old "file://" optional group before the path boundary
// could never match (the char before the path is always "/", which is forbidden), so it is dropped.
function replaceLead(input: string, re: RegExp, replacement: string): string {
  re.lastIndex = 0;
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const end = m.index + m[0].length;
    // A prefix char that lies inside the previous (already replaced) match must not be re-emitted.
    out += (m.index >= last ? input.slice(last, m.index) + m[1] : '') + replacement;
    last = end;
    re.lastIndex = Math.max(end - 1, m.index + 1); // always progresses
  }
  return out + input.slice(last);
}

/** Redact secrets/paths from an arbitrary string, bounded to MAX_INPUT in, MAX_OUTPUT out. */
export function redactString(raw: string): string {
  let s = raw.slice(0, MAX_INPUT).replace(CONTROL, '');
  s = replaceLead(s, HEADER, R);
  s = replaceLead(s, SENSITIVE_KEY, R);
  s = replaceLead(s, SCHEME, R);
  s = s.replace(PREFIXED, R).replace(JWT, R).replace(URLS, '[app resource]');
  s = replaceLead(s, PATHS, '[private path]');
  return s.slice(0, MAX_OUTPUT);
}

/** Read an own data property only; accessors and inherited values are ignored; Proxy descriptor traps may run. */
function ownString(obj: object, key: string): string | undefined {
  try {
    const d = Object.getOwnPropertyDescriptor(obj, key);
    return d && 'value' in d && typeof d.value === 'string' ? d.value : undefined;
  } catch { return undefined; }
}
function isError(v: unknown): v is Error {
  try { return v instanceof Error; } catch { return false; }
}

const FALLBACK = '진단 정보가 없습니다.';

export function safeDiagnostic(value: unknown): string {
  const raw = typeof value === 'string' ? value : isError(value) ? ownString(value, 'message') ?? Object.getOwnPropertyDescriptor(Error.prototype, 'message')?.value ?? FALLBACK : FALLBACK;
  return redactString(typeof raw === 'string' ? raw : FALLBACK);
}

/** Server digests intentionally suppress arbitrary server message/stack details. */
export function readableTrace(value: unknown): { message: string; frames: string[]; reference: string | null } {
  if (!isError(value)) return { message: '화면을 처리하는 중 오류가 발생했습니다.', frames: [], reference: null };
  const digest = ownString(value, 'digest');
  if (digest) return { message: '서버에서 화면을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.', frames: [], reference: /^[a-zA-Z0-9_-]{1,80}$/.test(digest) ? digest : null };
  const stack = ownString(value, 'stack') ?? '';
  const frames = stack.slice(0, MAX_INPUT * 4).split('\n').slice(1, 9).map(l => redactString(l.trim())).filter(Boolean);
  return { message: safeDiagnostic(value), frames, reference: null };
}

export const debug = Object.freeze({
  error(code: string, error: unknown) { console.error('ZukuJS Error!', code, safeDiagnostic(error)); },
  warning(code: string, message: unknown) { console.warn('ZukuJS Warning!', code, safeDiagnostic(message)); },
});
