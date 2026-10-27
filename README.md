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

`@zuku/core` is a standalone ESM library for the ZukuJS command grammar and bounded diagnostic redaction. It has zero runtime dependencies. The command parser accepts registered commands and string arguments. It never evaluates JavaScript and provides no DOM or network access.

이 모듈은 명령 문법과 진단 문자열을 처리하는 독립 라이브러리입니다. 이 모듈의 CI는 실제 ESM 소비자, 명령 인수 제한, 오류 및 Proxy 경계, 생성 선언 파일을 검사합니다. 프레임워크의 JSX 컴파일, SSR, hydration, HMR 검증은 이 저장소의 범위가 아닙니다. 이 저장소의 CI는 애플리케이션을 배포하지 않고 npm 패키지를 공개하지 않습니다.

## Requirements

| Use | Requirement |
| --- | --- |
| Runtime | ESM. Runtime output uses no Node.js or Bun APIs. CI runs Bun 1.4.0 and Node.js 24. |
| Development | Bun 1.4 or newer |
| CI | Bun 1.4.0, Node.js 24, TypeScript 5.9.3 |

## Installation

Install the published package:

```sh
npm install @zuku/core@27.0.1
```

The package manifest version is 27.0.1. The package release version and the framework identity are separate fields. Package 27.0.1 retains the ZukuJS 27.0.0 client identity and the existing command protocol.

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

The client identity contains only `name`, `version`, and `command_protocol`. The build derives this projection from the authoritative source identity. Upstream and server protocol fields are excluded from the distributed client files. This package uses ZukuJS 27.0.0 and `zuku-command/1`.

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

The build creates unminified browser-targeted ESM without source maps or timestamps. It copies the compiler-generated declaration snapshots in `types/` into `dist/`. A change to the public TypeScript API requires regenerating those declarations before building. All runtime exports select `dist/`. The package also includes its README, API guide, and approved original logo assets. The distribution whitelist excludes source, tests, benchmarks, local state, and dependencies.

Tests cover parser boundaries, built exports, exact client identity projection, diagnostic bounds, accessors and Proxy traps, and differential comparison with the previous redactor. The runtime source and output contain no regex lookbehind. Build output is reproducible with the same Bun version.

The command registry freezes each metadata entry and the top-level map. A consumer cannot relax the registered argument limits. A Node.js ESM consumer test resolves every declared package export using only the distributed files.

CI performs these checks:

1. Regenerates the declaration snapshots with TypeScript 5.9.3.
2. Rebuilds the browser output and checks that it is reproducible.
3. Runs the test suite.
4. Checks the ESM declaration paths in a NodeNext TypeScript consumer without relaxing module resolution.
5. Regenerates and verifies the integrity manifest.

The integrity manifest excludes Git metadata, local task state, and dependencies. It rejects symbolic links.

## Limits

- Diagnostic redaction is pattern-based. Secrets in free text with no recognized key, prefix, or scheme remain visible. Callers must not log secrets.
- Input is limited to 4,096 characters. Output is limited to 500 characters.
- Pathological inputs (about 4,000 characters of repeated `token`) take on the order of 10 ms.
- `safeDiagnostic` does not invoke Error accessors. A Proxy still runs caller-supplied traps.
- CI runs the tests on Bun 1.4.0 and imports the package in Node.js 24. No browser or mobile engine runs in CI.
- The included benchmark measures these helpers only. It does not measure page startup or rendering performance.

## Source and rights

This independent module was extracted from the platform-owned ZukuJS console implementation. It then received standalone entry points, a public client identity projection, compiler-generated declarations, portable tests, and a redactor without lookbehind. It contains no Next.js implementation. The upstream framework's MIT license is separate and does not grant rights to this module. The package name identifies this standalone source. It does not alter the private application's existing dependency.

**Public source visibility and npm distribution do not grant an additional software-use license.** This source retains `"license": "UNLICENSED"`; no SOL, MIT, or other software license is granted by this repository. The approved package release enables public distribution while preserving that rights declaration. Please contact the source owner for permission beyond rights available under applicable law and the hosting service's terms.

The original 32-file source snapshot was verified against manifest SHA-256 `f66ef2ef8d869015b0bf84a8412db3a8c3d45013c8f2ef1e25cf541856931fa8`. Runtime code, tests, and declaration snapshots were preserved. Standalone package metadata and documentation were revised. This copy's `MANIFEST.sha256` records its current file hashes.

## Changelog

[CHANGELOG.md](CHANGELOG.md) lists the release history.
