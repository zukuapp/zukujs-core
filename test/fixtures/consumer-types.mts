import { parseCommand, safeDiagnostic, type ParsedCommand } from '@zukujs/core';
import { commandHelp } from '@zukujs/core/command';
import { readableTrace } from '@zukujs/core/diagnostics';
import identity from '@zukujs/core/client-version.json' with { type: 'json' };

const command: ParsedCommand = parseCommand('go("jump")');
const message: string = safeDiagnostic(command);
const entries = commandHelp('app');
const trace = readableTrace(null);
const version: string = identity.version;
void [message, entries, trace, version];
