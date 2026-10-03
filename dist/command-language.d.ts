export declare const COMMAND_PROTOCOL: string;
export declare const COMMANDS: Readonly<{
    'system.help': {
        usage: string;
        summary: string;
        args: number;
    };
    'system.version': {
        usage: string;
        summary: string;
        args: number;
    };
    'app.status': {
        usage: string;
        summary: string;
        args: number;
    };
    'routes.list': {
        usage: string;
        summary: string;
        args: number;
    };
    'navigation.open': {
        usage: string;
        summary: string;
        args: number;
    };
    'performance.snapshot': {
        usage: string;
        summary: string;
        args: number;
    };
    'theme.current': {
        usage: string;
        summary: string;
        args: number;
    };
    'console.clear': {
        usage: string;
        summary: string;
        args: number;
    };
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
    usage: string;
    description: string;
}[];
