import { parseCommand, safeDiagnostic, type ParsedCommand } from '@zuku/core';
import { commandHelp } from '@zuku/core/command';
import { readableTrace } from '@zuku/core/diagnostics';
import identity from '@zuku/core/client-version.json' with { type: 'json' };

const command: ParsedCommand = parseCommand('go("jump")');
const message: string = safeDiagnostic(command);
const entries = commandHelp('app');
const trace = readableTrace(null);
const version: string = identity.version;
void [message, entries, trace, version];
