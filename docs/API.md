# API (`@zuku/core` v27.26102701)

ESM only, no dependencies. Entrypoints: `.` (all), `./command`, `./diagnostics`, `./client-version.json`.

## Commands
- `parseCommand(source: unknown): ParsedCommand` - parses a fixed command grammar (never evaluates JavaScript). Source must be a string of at most 2048 chars. Arguments are JSON strings matching `[a-zA-Z.]*`, at most 64 chars. Throws `CommandError` (`code`: `INVALID_INPUT`, `COMMAND_SYNTAX`, `UNKNOWN_COMMAND`, `COMMAND_ARGUMENT`).
- `commandHelp(namespace?: string)` - `{name, usage, description}[]`, optionally filtered.
- `COMMANDS`, `COMMAND_PROTOCOL` (`zuku-command/1`), `CommandError`, types `CommandName`, `ParsedCommand`.
- `COMMANDS` and every command metadata entry are frozen. Consumers cannot change argument limits or help metadata; generated declarations expose the same readonly boundary.
- `VERSION`, `IDENTITY` - public projection `client-version.json` (`name`, `version`, `command_protocol` only). The authoritative `src/version.json` (which also carries upstream and internal protocol fields) is never edited and is not bundled, exported or shipped in `dist`; `scripts/build.ts` regenerates `src/client-version.json` from it.

## Diagnostics
- `safeDiagnostic(value: unknown): string` - accepts strings and `Error`s only. Any other value returns a fixed fallback. Only the own data property `message` of an Error is read (via `Object.getOwnPropertyDescriptor`, accepting `value` descriptors only), so getters/accessors and inherited values are not invoked and `toString`/`toJSON` are never called. This does not prohibit Proxy traps: `instanceof` and `getOwnPropertyDescriptor` on a Proxy can run caller-supplied trap code, and a Proxy cannot generally be detected. Exceptions from such traps are caught; whatever string a trap returns is still redacted and bounded. Input is cut to 4096 chars before redaction, output to 500 after.
- `redactString(raw: string): string` - the string pipeline used by `safeDiagnostic`. Uses no regex lookbehind (boundaries are captured prefixes), so the module parses on engines without lookbehind support. Behavior is checked equal to the previous lookbehind implementation by a differential fuzz test (the old implementation lives only in `test/fixtures`).
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
- CI runs the lookbehind-free redactor on Bun 1.4.0 (JavaScriptCore) and imports the package in Node.js 24. No mobile engine (including Hermes) runs in CI.
