<!-- BEGIN ZUKU OFFICIAL BRAND -->
<!-- markdownlint-disable MD033 MD041 -->
<p align="center">
  <a href="https://docs.zuzunza.com/">
    <picture>
      <source media="(prefers-color-scheme: dark)"
        srcset="docs/branding/zuku-logo-dark.png">
      <img src="docs/branding/zuku-logo-light.png"
        alt="ZUKU" width="320">
    </picture>
  </a>
</p>
<p align="center">ZUKU - 내가 불러 일으키는 새로운 창작.</p>
<!-- markdownlint-enable MD033 MD041 -->
<!-- END ZUKU OFFICIAL BRAND -->

# @zuku/core

![version](https://img.shields.io/badge/version-v27.26102701-informational)

`@zuku/core` is a standalone ESM library for the ZukuJS command grammar and bounded diagnostic redaction. It has zero runtime dependencies. The command parser accepts registered commands and string arguments and never evaluates JavaScript.

## Requirements

| Use | Requirement |
| --- | --- |
| Runtime | ESM. Runtime output uses no Node.js or Bun APIs. |
| Development | Bun 1.4 or newer |
| CI | Bun 1.4.0, Node.js 24, TypeScript 5.9.3 |

## Installation

```sh
npm install @zuku/core@27.0.1
```

## Usage

```ts
import { parseCommand, safeDiagnostic, readableTrace, debug } from '@zuku/core';

parseCommand('go("jump")'); // { name: 'navigation.open', args: ['jump'] }
safeDiagnostic('Cookie: a=1; b=2'); // '[redacted]'
```

| Entry point | Contents |
| --- | --- |
| `.` | All exports |
| `./command` | Command grammar |
| `./diagnostics` | Diagnostic redaction |
| `./client-version.json` | Public client identity |

[docs/API.md](docs/API.md) documents the full contract.

## Identity

Package 27.0.1 reports the client identity ZukuJS 27.0.0 with command protocol `zuku-command/1`.

## Development

1. Build the package:

   ```sh
   bun scripts/build.ts
   ```

2. Run the tests:

   ```sh
   bun test
   ```

3. Run the benchmark:

   ```sh
   bun bench/bench.ts
   ```

4. Regenerate the integrity manifest:

   ```sh
   bun scripts/manifest.ts
   ```

The build copies the compiler-generated declaration snapshots in `types/` into `dist/`. A change to the public TypeScript API requires regenerating those declarations before building. Runtime source must not use regex lookbehind; the tests reject it. The manifest script rejects symbolic links.

CI performs these checks:

1. Regenerates the declaration snapshots with TypeScript 5.9.3.
2. Rebuilds the browser output and checks that it is reproducible.
3. Runs the test suite.
4. Checks the ESM declaration paths in a NodeNext TypeScript consumer without relaxing module resolution.
5. Regenerates and verifies the integrity manifest.

## Limits

Callers must not log secrets. [docs/API.md](docs/API.md#limits) lists the redaction limits.

## License

**Public source visibility and npm distribution do not grant an additional software-use license.** This source retains `"license": "UNLICENSED"`; no SOL, MIT, or other software license is granted by this repository. Please contact the source owner for permission beyond rights available under applicable law and the hosting service's terms.

## Changelog

[CHANGELOG.md](CHANGELOG.md) lists the release history.
