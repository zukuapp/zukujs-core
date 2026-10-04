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

# @zukujs/core 27.0.1

A standalone ESM library for the ZukuJS command grammar and bounded diagnostic redaction. It has zero runtime dependencies. The command parser accepts registered commands and string arguments; it never evaluates JavaScript or provides DOM or network access.

```ts
import { parseCommand, safeDiagnostic, readableTrace, debug } from '@zukujs/core';

parseCommand('go("jump")'); // { name: 'navigation.open', args: ['jump'] }
safeDiagnostic('Cookie: a=1; b=2'); // '[redacted]'
```

The entry points are `.`, `./command`, `./diagnostics`, and `./client-version.json`. See [docs/API.md](docs/API.md) for the full contract.

Install a published release with `npm install @zukujs/core@27.0.1`. Package patch
27.0.1 retains the ZukuJS 27.0.0 client identity and the existing command protocol;
the package release version and framework identity are separate fields.

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

The build creates unminified browser-targeted ESM without source maps or timestamps. It copies the compiler-generated declaration snapshots in `types/` into `dist/`; changes to the public TypeScript API require regenerating those declarations before building. Runtime output is independent of Node and Bun APIs. All runtime exports select `dist/`; the package also includes its README, API guide, and approved original logo assets. Source, tests, benchmarks, local state, and dependencies are excluded from the distribution whitelist.

Tests cover parser boundaries, built exports, exact client identity projection, diagnostic bounds, accessors and Proxy traps, and differential comparison with the previous redactor. Regex lookbehind is excluded from the runtime source and output. Build reproducibility applies to the same Bun version.

The command registry freezes each metadata entry as well as the top-level map,
so a consumer cannot relax the registered argument limits. A real Node.js ESM
consumer test resolves every declared package export using only the distributed
files. CI regenerates the declaration snapshots with TypeScript 5.9.3 and checks
that browser output remains reproducible. A NodeNext TypeScript consumer also
checks the ESM declaration paths without relaxing module resolution. The integrity manifest excludes Git
metadata, local task state and dependencies, and rejects symbolic links.

이 모듈은 명령 문법과 진단 문자열을 처리하는 독립 라이브러리입니다. 프레임워크의
JSX 컴파일·SSR·hydration·HMR 검증과 별도로, 실제 ESM 소비자·명령 인수 제한·
오류 및 Proxy 경계·생성 선언 파일을 검사합니다. 이 저장소의 CI는 애플리케이션을
배포하거나 npm 패키지를 공개하지 않습니다.

## Limits

Diagnostic redaction is a heuristic. Unrecognized secrets in free text can remain visible, so callers must avoid logging secrets. Input is limited to 4,096 characters and output to 500; some repeated-token inputs can still take milliseconds. Error accessors are avoided, but a Proxy can run caller-supplied traps. Browser compatibility, mobile device behavior, and application performance need separate verification. The included benchmark measures these helpers and does not establish page startup or rendering performance.

## Source and rights

This independent module was extracted from the platform-owned ZukuJS console implementation, then given standalone entry points, a public client identity projection, compiler-generated declarations, portable tests, and a redactor without lookbehind. It contains no Next.js implementation. The upstream framework's MIT license is separate and does not grant rights to this module. The package name identifies this standalone source; it does not alter the private application's existing dependency.

**Public source visibility and npm distribution do not grant an additional software-use license.** This source retains `"license": "UNLICENSED"`; no SOL, MIT, or other software license is granted by this repository. The approved package release enables public distribution while preserving that rights declaration. Please contact the source owner for permission beyond rights available under applicable law and the hosting service's terms.

The original 32-file source snapshot was verified against manifest SHA-256 `f66ef2ef8d869015b0bf84a8412db3a8c3d45013c8f2ef1e25cf541856931fa8`. Runtime code, tests, and declaration snapshots were preserved. Standalone package metadata and documentation were revised; this copy's `MANIFEST.sha256` records its current file hashes.
