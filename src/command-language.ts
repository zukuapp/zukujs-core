import identity from './client-version.json';

export const COMMAND_PROTOCOL = identity.command_protocol;
export const COMMANDS = Object.freeze({
  'system.help': Object.freeze({ usage: 'help(); / system.help("app")', summary: '명령과 네임스페이스 안내', args: 1 }),
  'system.version': Object.freeze({ usage: 'version();', summary: 'ZukuJS와 명령 규격 버전', args: 0 }),
  'app.status': Object.freeze({ usage: 'status();', summary: '현재 화면·연결 상태', args: 0 }),
  'routes.list': Object.freeze({ usage: 'routes();', summary: '주요 화면 안내', args: 0 }),
  'navigation.open': Object.freeze({ usage: 'go("jump"); / navigation.open("game")', summary: '등록된 화면으로 이동 · 기존 작품 탐색 별칭 지원', args: 1 }),
  'performance.snapshot': Object.freeze({ usage: 'perf();', summary: '이 탭의 렌더링 측정값', args: 0 }),
  'theme.current': Object.freeze({ usage: 'theme();', summary: '현재 화면 테마', args: 0 }),
  'console.clear': Object.freeze({ usage: 'clear();', summary: 'ZukuJS 명령 기록 지우기', args: 0 }),
});
export type CommandName = keyof typeof COMMANDS;
export type ParsedCommand = { name: CommandName; args: string[] };
const aliases: Record<string, CommandName> = Object.freeze({ help:'system.help', version:'system.version', status:'app.status', routes:'routes.list', go:'navigation.open', perf:'performance.snapshot', theme:'theme.current', clear:'console.clear' });
export class CommandError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = 'ZukuJSCommandError'; }
}

/** This is a command grammar, never JavaScript evaluation. No DOM/network capabilities. */
export function parseCommand(source: unknown): ParsedCommand {
  if (typeof source !== 'string' || source.length > 2048) throw new CommandError('INVALID_INPUT', '명령은 2,048자 이내의 문자열이어야 합니다.');
  let input = source.trim();
  input = input.replace(/^(?:wscp|zuku)\s+/i, '').replace(/^(?:ZukuJS|zuku|wscp)\./, '');
  const match = /^([a-z][a-zA-Z]*(?:\.[a-z][a-zA-Z]*)*)(?:\s*\(([^]*)\))?\s*;?$/.exec(input);
  if (!match) throw new CommandError('COMMAND_SYNTAX', 'help();처럼 허용된 명령 하나를 입력해 주세요. JavaScript 코드는 실행하지 않습니다.');
  const candidate = aliases[match[1]] ?? match[1];
  if (!Object.hasOwn(COMMANDS, candidate)) throw new CommandError('UNKNOWN_COMMAND', '등록되지 않은 명령입니다. help();로 목록을 확인하세요.');
  const name = candidate as CommandName;
  let args: unknown[] = [];
  if (match[2]?.trim()) {
    try { args = JSON.parse('[' + match[2] + ']'); }
    catch { throw new CommandError('COMMAND_ARGUMENT', '인수는 큰따옴표로 감싼 문자열만 사용할 수 있습니다.'); }
  }
  if (args.length > COMMANDS[name].args || args.some(arg => typeof arg !== 'string' || arg.length > 64 || !/^[a-zA-Z.]*$/.test(arg))) {
    throw new CommandError('COMMAND_ARGUMENT', '허용된 인수 형식을 확인해 주세요. 예: system.help("app");');
  }
  return { name, args: args as string[] };
}

export function commandHelp(namespace = '') {
  if (namespace && !/^[a-zA-Z.]{1,64}$/.test(namespace)) throw new CommandError('COMMAND_ARGUMENT', '네임스페이스 형식을 확인하세요.');
  return Object.entries(COMMANDS).filter(([name]) => !namespace || name.startsWith(namespace + '.') || name === namespace)
    .map(([name, item]) => ({ name, usage: item.usage, description: item.summary }));
}
