// src/client-version.json
var client_version_default = {
  name: "ZukuJS",
  version: "27.0.0",
  command_protocol: "zuku-command/1"
};

// src/command-language.ts
var COMMAND_PROTOCOL = client_version_default.command_protocol;
var COMMANDS = Object.freeze({
  "system.help": { usage: 'help(); / system.help("app")', summary: "명령과 네임스페이스 안내", args: 1 },
  "system.version": { usage: "version();", summary: "ZukuJS와 명령 규격 버전", args: 0 },
  "app.status": { usage: "status();", summary: "현재 화면·연결 상태", args: 0 },
  "routes.list": { usage: "routes();", summary: "주요 화면 안내", args: 0 },
  "navigation.open": { usage: 'go("jump"); / navigation.open("game")', summary: "등록된 화면으로 이동 · 기존 작품 탐색 별칭 지원", args: 1 },
  "performance.snapshot": { usage: "perf();", summary: "이 탭의 렌더링 측정값", args: 0 },
  "theme.current": { usage: "theme();", summary: "현재 화면 테마", args: 0 },
  "console.clear": { usage: "clear();", summary: "ZukuJS 명령 기록 지우기", args: 0 }
});
var aliases = Object.freeze({ help: "system.help", version: "system.version", status: "app.status", routes: "routes.list", go: "navigation.open", perf: "performance.snapshot", theme: "theme.current", clear: "console.clear" });

class CommandError extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "ZukuJSCommandError";
  }
}
function parseCommand(source) {
  if (typeof source !== "string" || source.length > 2048)
    throw new CommandError("INVALID_INPUT", "명령은 2,048자 이내의 문자열이어야 합니다.");
  let input = source.trim();
  input = input.replace(/^(?:wscp|zuku)\s+/i, "").replace(/^(?:ZukuJS|zuku|wscp)\./, "");
  const match = /^([a-z][a-zA-Z]*(?:\.[a-z][a-zA-Z]*)*)(?:\s*\(([^]*)\))?\s*;?$/.exec(input);
  if (!match)
    throw new CommandError("COMMAND_SYNTAX", "help();처럼 허용된 명령 하나를 입력해 주세요. JavaScript 코드는 실행하지 않습니다.");
  const candidate = aliases[match[1]] ?? match[1];
  if (!Object.hasOwn(COMMANDS, candidate))
    throw new CommandError("UNKNOWN_COMMAND", "등록되지 않은 명령입니다. help();로 목록을 확인하세요.");
  const name = candidate;
  let args = [];
  if (match[2]?.trim()) {
    try {
      args = JSON.parse("[" + match[2] + "]");
    } catch {
      throw new CommandError("COMMAND_ARGUMENT", "인수는 큰따옴표로 감싼 문자열만 사용할 수 있습니다.");
    }
  }
  if (args.length > COMMANDS[name].args || args.some((arg) => typeof arg !== "string" || arg.length > 64 || !/^[a-zA-Z.]*$/.test(arg))) {
    throw new CommandError("COMMAND_ARGUMENT", '허용된 인수 형식을 확인해 주세요. 예: system.help("app");');
  }
  return { name, args };
}
function commandHelp(namespace = "") {
  if (namespace && !/^[a-zA-Z.]{1,64}$/.test(namespace))
    throw new CommandError("COMMAND_ARGUMENT", "네임스페이스 형식을 확인하세요.");
  return Object.entries(COMMANDS).filter(([name]) => !namespace || name.startsWith(namespace + ".") || name === namespace).map(([name, item]) => ({ name, usage: item.usage, description: item.summary }));
}
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

// src/index.ts
var VERSION = client_version_default.version;
var IDENTITY = Object.freeze({ ...client_version_default });
export {
  COMMANDS,
  COMMAND_PROTOCOL,
  CommandError,
  IDENTITY,
  MAX_INPUT,
  MAX_OUTPUT,
  VERSION,
  commandHelp,
  debug,
  parseCommand,
  readableTrace,
  redactString,
  safeDiagnostic
};
