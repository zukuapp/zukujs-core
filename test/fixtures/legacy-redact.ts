// Test-only oracle: the previous lookbehind implementation, kept to prove equivalence. Never imported by src.
const MAX_INPUT = 4096;
const MAX_OUTPUT = 500;
const R = '[redacted]';

// Value forms: escaped-quote JSON (\"x\"), double, single, then bare.
const QV = String.raw`\\"(?:(?!\\").)*\\"|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'`;
const KEY_OPEN = String.raw`(?:\\*["'])?`;
const KEY_CLOSE = String.raw`(?:\\*["'])?`;
const SEP = String.raw`\s*[:=]\s*`;

// Headers whose bare value may contain spaces/semicolons: redact the whole line.
const HEADER = new RegExp(
  String.raw`(?<![\w-])(?:proxy-)?(?:authorization|(?:set-)?cookie2?)${KEY_CLOSE}${SEP}(?:${QV}|[^\r\n]*)`, 'gi');
const SENSITIVE_KEY = new RegExp(
  String.raw`(?<![\w-])${KEY_OPEN}[\w-]*(?:token|password|passwd|pwd|secret|api[_-]?key|apikey|credential|session(?:[_-]?id)?|sid)[\w-]*${KEY_CLOSE}${SEP}(?:${QV}|(?:bearer|basic)\s+[^\s,;&}\]]+|[^\s,;&}\]"']+)`, 'gi');
const SCHEME = /(?<![\w-])(?:bearer|basic)\s+[A-Za-z0-9._~+\/=-]{6,}/gi;
const PREFIXED = /\b(?:shz_(?:at|bs|rt)_|sk-|ghp_|gho_|ghs_|github_pat_|xox[abp]-|AKIA)[a-zA-Z0-9_-]+/g;
const JWT = /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]*/g;
const URLS = /(?:https?|wss?|ftp):\/\/[^\s)'"<>]+/gi;
const PATHS = new RegExp(
  String.raw`(?:file:\/\/)?(?<![\w.:\/-])(?:\/(?:root|home|srv|etc|var|tmp|usr|opt|mnt|proc|run|app|workspace|workspaces|data|snapshot|Users|private|volume\d+|build|code|github)(?:\/[^\s)'"<>:]*)?|~\/[^\s)'"<>:]*|[A-Za-z]:[\\/][^\s)'"<>]*|\\\\[^\s\\)]+\\[^\s)'"<>]*)`, 'g');
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/** Redact secrets/paths from an arbitrary string, bounded to MAX_INPUT in, MAX_OUTPUT out. */
export function legacyRedact(raw: string): string {
  return raw.slice(0, MAX_INPUT)
    .replace(CONTROL, '')
    .replace(HEADER, R)
    .replace(SENSITIVE_KEY, R)
    .replace(SCHEME, R)
    .replace(PREFIXED, R)
    .replace(JWT, R)
    .replace(URLS, '[app resource]')
    .replace(PATHS, '[private path]')
    .slice(0, MAX_OUTPUT);
}

