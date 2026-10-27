# API (`@zuku/core` v27.26102701)

ESM only, no dependencies. Entrypoints: `.` (all), `./command`, `./diagnostics`, `./client-version.json`.

## Commands
- `parseCommand(source: unknown): ParsedCommand` - parses a fixed command grammar (never evaluates JavaScript). Source must be a string of at most 2048 chars. Arguments are JSON strings matching `[a-zA-Z.]*`, at most 64 chars. Throws `CommandError` (`code`: `INVALID_INPUT`, `COMMAND_SYNTAX`, `UNKNOWN_COMMAND`, `COMMAND_ARGUMENT`).
- `commandHelp(namespace?: string)` - `{name, usage, description}[]`, optionally filtered.
- `COMMANDS`, `COMMAND_PROTOCOL` (`zuku-command/1`), `CommandError`, types `CommandName`, `ParsedCommand`.
- `COMMANDS` and every command metadata entry are frozen and typed `readonly`.
- `VERSION`, `IDENTITY` - contents of `client-version.json` (`name`, `version`, `command_protocol`). `scripts/build.ts` generates `src/client-version.json` from `src/version.json`. Do not edit `src/version.json`.

## Diagnostics
- `safeDiagnostic(value: unknown): string` - accepts strings and `Error`s only. Any other value returns a fixed fallback. For an Error, it reads only the own data property `message` (a `value` descriptor from `Object.getOwnPropertyDescriptor`); getters, inherited values, `toString`, and `toJSON` are never called. A Proxy still runs caller-supplied `instanceof` and `getOwnPropertyDescriptor` traps; exceptions from them are caught, and any string they return is redacted and bounded. Input is cut to 4096 chars before redaction, output to 500 after.
- `redactString(raw: string): string` - the string pipeline used by `safeDiagnostic`. It uses captured prefixes instead of regex lookbehind, so it runs on engines without lookbehind support.
- `readableTrace(value)` - `{message, frames, reference}`. If an Error has an own string `digest` (server error), message/stack are never used: fixed message, no frames, `reference` = digest if `^[a-zA-Z0-9_-]{1,80}$`. Otherwise up to 8 redacted stack frames from the own `stack` data property.
- `debug.error(code, err)` / `debug.warning(code, msg)` - frozen; log through `safeDiagnostic`.
- `MAX_INPUT` (4096), `MAX_OUTPUT` (500).

## What is redacted
Keys containing token/password/passwd/pwd/secret/api-key/credential/session(id)/sid (bare, double/single quoted JSON, and backslash-escaped JSON), including `x-api-key`, `access_token`, `refresh_token`, `session_token`, camelCase variants. `Authorization`, `Proxy-Authorization`, `Cookie`, `Set-Cookie` headers: whole value through end of line (all cookie parts and attributes). Bearer/Basic credentials, known token prefixes (`sk-`, `ghp_`, `github_pat_`, `shz_*`, `xox*`, `AKIA`), JWTs. URLs become `[app resource]`. Paths under `/root /home /srv /etc /var /tmp /usr /opt /mnt /proc /run /app /workspace(s) /data /snapshot /Users /private /volumeN /build /code /github`, `~/`, Windows drive and UNC paths become `[private path]`.

## Limits
- Redaction is pattern-based. It does not recognize secrets in free text that have no key, known prefix, or scheme.
- Paths with spaces are redacted up to the first space.
- Callers must not log secrets.
- Pathological inputs (e.g. 4000 chars of repeated `token`) take on the order of 10 ms because of regex backtracking. The 4096-char input cut bounds this cost.
