// src/diagnostics.ts
var MAX_INPUT = 4096;
var MAX_OUTPUT = 500;
var R = "[redacted]";
var QV = String.raw`\\"(?:(?!\\").)*\\"|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'`;
var KEY_OPEN = String.raw`(?:\\*["'])?`;
var KEY_CLOSE = String.raw`(?:\\*["'])?`;
var SEP = String.raw`\s*[:=]\s*`;
var LEAD = String.raw`(^|[^\w-])`;
var LEAD_PATH = String.raw`(^|[^\w.:\/-])`;
var HEADER = new RegExp(String.raw`${LEAD}(?:proxy-)?(?:authorization|(?:set-)?cookie2?)${KEY_CLOSE}${SEP}(?:${QV}|[^\r\n]*)`, "gi");
var SENSITIVE_KEY = new RegExp(String.raw`${LEAD}${KEY_OPEN}[\w-]*(?:token|password|passwd|pwd|secret|api[_-]?key|apikey|credential|session(?:[_-]?id)?|sid)[\w-]*${KEY_CLOSE}${SEP}(?:${QV}|(?:bearer|basic)\s+[^\s,;&}\]]+|[^\s,;&}\]"']+)`, "gi");
var SCHEME = new RegExp(String.raw`${LEAD}(?:bearer|basic)\s+[A-Za-z0-9._~+\/=-]{6,}`, "gi");
var PREFIXED = /\b(?:shz_(?:at|bs|rt)_|sk-|ghp_|gho_|ghs_|github_pat_|xox[abp]-|AKIA)[a-zA-Z0-9_-]+/g;
var JWT = /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]*/g;
var URLS = /(?:https?|wss?|ftp):\/\/[^\s)'"<>]+/gi;
var PATHS = new RegExp(String.raw`${LEAD_PATH}(?:\/(?:root|home|srv|etc|var|tmp|usr|opt|mnt|proc|run|app|workspace|workspaces|data|snapshot|Users|private|volume\d+|build|code|github)(?:\/[^\s)'"<>:]*)?|~\/[^\s)'"<>:]*|[A-Za-z]:[\\/][^\s)'"<>]*|\\\\[^\s\\)]+\\[^\s)'"<>]*)`, "g");
var CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
function replaceLead(input, re, replacement) {
  re.lastIndex = 0;
  let out = "";
  let last = 0;
  let m;
  while ((m = re.exec(input)) !== null) {
    const end = m.index + m[0].length;
    out += (m.index >= last ? input.slice(last, m.index) + m[1] : "") + replacement;
    last = end;
    re.lastIndex = Math.max(end - 1, m.index + 1);
  }
  return out + input.slice(last);
}
function redactString(raw) {
  let s = raw.slice(0, MAX_INPUT).replace(CONTROL, "");
  s = replaceLead(s, HEADER, R);
  s = replaceLead(s, SENSITIVE_KEY, R);
  s = replaceLead(s, SCHEME, R);
  s = s.replace(PREFIXED, R).replace(JWT, R).replace(URLS, "[app resource]");
  s = replaceLead(s, PATHS, "[private path]");
  return s.slice(0, MAX_OUTPUT);
}
function ownString(obj, key) {
  try {
    const d = Object.getOwnPropertyDescriptor(obj, key);
    return d && "value" in d && typeof d.value === "string" ? d.value : undefined;
  } catch {
    return;
  }
}
function isError(v) {
  try {
    return v instanceof Error;
  } catch {
    return false;
  }
}
var FALLBACK = "진단 정보가 없습니다.";
function safeDiagnostic(value) {
  const raw = typeof value === "string" ? value : isError(value) ? ownString(value, "message") ?? Object.getOwnPropertyDescriptor(Error.prototype, "message")?.value ?? FALLBACK : FALLBACK;
  return redactString(typeof raw === "string" ? raw : FALLBACK);
}
function readableTrace(value) {
  if (!isError(value))
    return { message: "화면을 처리하는 중 오류가 발생했습니다.", frames: [], reference: null };
  const digest = ownString(value, "digest");
  if (digest)
    return { message: "서버에서 화면을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.", frames: [], reference: /^[a-zA-Z0-9_-]{1,80}$/.test(digest) ? digest : null };
  const stack = ownString(value, "stack") ?? "";
  const frames = stack.slice(0, MAX_INPUT * 4).split(`
`).slice(1, 9).map((l) => redactString(l.trim())).filter(Boolean);
  return { message: safeDiagnostic(value), frames, reference: null };
}
var debug = Object.freeze({
  error(code, error) {
    console.error("ZukuJS Error!", code, safeDiagnostic(error));
  },
  warning(code, message) {
    console.warn("ZukuJS Warning!", code, safeDiagnostic(message));
  }
});
export {
  MAX_INPUT,
  MAX_OUTPUT,
  debug,
  readableTrace,
  redactString,
  safeDiagnostic
};
