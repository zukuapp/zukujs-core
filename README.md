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

# @zukujs/core 27.0.0

A standalone ESM library for the ZukuJS command grammar and bounded diagnostic redaction. It has zero runtime dependencies. The command parser accepts registered commands and string arguments; it never evaluates JavaScript or provides DOM or network access.

```ts
import { parseCommand, safeDiagnostic, readableTrace, debug } from '@zukujs/core';

parseCommand('go("jump")'); // { name: 'navigation.open', args: ['jump'] }
safeDiagnostic('Cookie: a=1; b=2'); // '[redacted]'
```

The entry points are `.`, `./command`, `./diagnostics`, and `./client-version.json`. See [docs/API.md](docs/API.md) for the full contract.

## Identity

The client identity contains only `name`, `version`, and `command_protocol`. The build derives this projection from the authoritative source identity; upstream and server protocol fields are excluded from the distributed client files. This package uses ZukuJS 27.0.0 and `zuku-command/1`.

## Development

Use Bun 1.4 or newer:

```sh
bun scripts/build.ts
bun test
bun bench/bench.ts
bun scripts/manifest.ts
```

The build creates unminified browser-targeted ESM without source maps or timestamps. It copies the compiler-generated declaration snapshots in `types/` into `dist/`; changes to the public TypeScript API require regenerating those declarations before building. Runtime output is independent of Node and Bun APIs. Only `dist/` is selected for a potential package distribution; npm publication is disabled by `private: true`.

Tests cover parser boundaries, built exports, exact client identity projection, diagnostic bounds, accessors and Proxy traps, and differential comparison with the previous redactor. Regex lookbehind is excluded from the runtime source and output. Build reproducibility applies to the same Bun version.

## Limits

Diagnostic redaction is a heuristic. Unrecognized secrets in free text can remain visible, so callers must avoid logging secrets. Input is limited to 4,096 characters and output to 500; some repeated-token inputs can still take milliseconds. Error accessors are avoided, but a Proxy can run caller-supplied traps. Browser compatibility, mobile device behavior, and application performance need separate verification. The included benchmark measures these helpers and does not establish page startup or rendering performance.

## Source and rights

This independent module was extracted from the platform-owned ZukuJS console implementation, then given standalone entry points, a public client identity projection, compiler-generated declarations, portable tests, and a redactor without lookbehind. It contains no Next.js implementation. The upstream framework's MIT license is separate and does not grant rights to this module. The package name identifies this standalone source; it does not alter the private application's existing dependency.

**Public source visibility does not grant an additional software-use license.** This source retains `"license": "UNLICENSED"` and `"private": true`; no SOL, MIT, or other software license is granted by this repository. The package is not published to npm. Please contact the source owner for permission beyond rights available under applicable law and the hosting service's terms.

The original 32-file source snapshot was verified against manifest SHA-256 `f66ef2ef8d869015b0bf84a8412db3a8c3d45013c8f2ef1e25cf541856931fa8`. Runtime code, tests, and declaration snapshots were preserved. Standalone package metadata and documentation were revised; this copy's `MANIFEST.sha256` records its current file hashes.
