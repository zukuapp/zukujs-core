export declare const COMMAND_PROTOCOL: string;
export declare const COMMANDS: Readonly<{
    'system.help': Readonly<{
        usage: "help(); / system.help(\"app\")";
        summary: "명령과 네임스페이스 안내";
        args: 1;
    }>;
    'system.version': Readonly<{
        usage: "version();";
        summary: "ZukuJS와 명령 규격 버전";
        args: 0;
    }>;
    'app.status': Readonly<{
        usage: "status();";
        summary: "현재 화면·연결 상태";
        args: 0;
    }>;
    'routes.list': Readonly<{
        usage: "routes();";
        summary: "주요 화면 안내";
        args: 0;
    }>;
    'navigation.open': Readonly<{
        usage: "go(\"jump\"); / navigation.open(\"game\")";
        summary: "등록된 화면으로 이동 · 기존 작품 탐색 별칭 지원";
        args: 1;
    }>;
    'performance.snapshot': Readonly<{
        usage: "perf();";
        summary: "이 탭의 렌더링 측정값";
        args: 0;
    }>;
    'theme.current': Readonly<{
        usage: "theme();";
        summary: "현재 화면 테마";
        args: 0;
    }>;
    'console.clear': Readonly<{
        usage: "clear();";
        summary: "ZukuJS 명령 기록 지우기";
        args: 0;
    }>;
}>;
export type CommandName = keyof typeof COMMANDS;
export type ParsedCommand = {
    name: CommandName;
    args: string[];
};
export declare class CommandError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
/** This is a command grammar, never JavaScript evaluation. No DOM/network capabilities. */
export declare function parseCommand(source: unknown): ParsedCommand;
export declare function commandHelp(namespace?: string): {
    name: string;
    usage: "help(); / system.help(\"app\")" | "version();" | "status();" | "routes();" | "go(\"jump\"); / navigation.open(\"game\")" | "perf();" | "theme();" | "clear();";
    description: "명령과 네임스페이스 안내" | "ZukuJS와 명령 규격 버전" | "현재 화면·연결 상태" | "주요 화면 안내" | "등록된 화면으로 이동 · 기존 작품 탐색 별칭 지원" | "이 탭의 렌더링 측정값" | "현재 화면 테마" | "ZukuJS 명령 기록 지우기";
}[];
