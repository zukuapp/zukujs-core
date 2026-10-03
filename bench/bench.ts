// Small micro-benchmark. Timings are machine/run dependent; not performance claims.
import { safeDiagnostic } from '../src/diagnostics';
import { parseCommand } from '../src/command-language';
const inputs: Record<string, string> = {
  clean: 'Network request failed while loading the page',
  secrets: 'Authorization: Bearer abcdef123456 {"access_token":"x","cookie":"a=1; b=2"} at f (/app/a.ts:1:2) https://x.y/z',
  max4096: ('token=abc /home/u/x '.repeat(300)).slice(0, 5000),
};
function run(name: string, fn: () => unknown, n: number) {
  for (let i = 0; i < n / 10; i++) fn();
  const samples: number[] = [];
  for (let r = 0; r < 5; r++) { const t = performance.now(); for (let i = 0; i < n; i++) fn(); samples.push((performance.now() - t) * 1e6 / n); }
  samples.sort((a, b) => a - b);
  console.log(`${name.padEnd(24)} median ${samples[2].toFixed(0)} ns/op  (min ${samples[0].toFixed(0)}, max ${samples[4].toFixed(0)}, n=${n}x5)`);
}
for (const [k, v] of Object.entries(inputs)) run('safeDiagnostic ' + k, () => safeDiagnostic(v), 20000);
run('parseCommand go("jump")', () => parseCommand('go("jump")'), 100000);
