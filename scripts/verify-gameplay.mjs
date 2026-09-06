import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Exercise the same local engine as the worker; no network or student data.
const root = fileURLToPath(new URL('../', import.meta.url));
const bundle = await build({
  stdin: { contents: "export { LESSONS } from './src/lessons/index'; export { analyzeChallenge } from './src/validators/index';", resolveDir: root },
  bundle: true, write: false, platform: 'node', format: 'esm', alias: { '@': `${root}src` },
});
const { LESSONS, analyzeChallenge } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
if (process.argv.includes('--browser-fixture')) {
  // Local, git-ignored QA fixture; never includes credentials or student work.
  mkdirSync(new URL('../tmp/gameplay/', import.meta.url), { recursive: true });
  writeFileSync(new URL('../tmp/gameplay/browser-fixture.json', import.meta.url), JSON.stringify(LESSONS.flatMap(lesson => lesson.challenges.map(challenge => ({
    lesson: lesson.id, id: challenge.id, title: challenge.title, code: challenge.solution,
  })))));
}
const rows = LESSONS.flatMap(lesson => lesson.challenges.map(challenge => {
  const result = analyzeChallenge(challenge.solution, challenge);
  const empty = analyzeChallenge('int main() { return 0; }', challenge);
  const starter = analyzeChallenge(challenge.starterCode, challenge);
  return {
    area: lesson.id, challenge: challenge.id, title: challenge.title,
    hasMap: Boolean(challenge.world), samplePasses: result.isCorrect,
    emptyProgramRejected: !empty.isCorrect, starterPasses: starter.isCorrect,
    observation: challenge.kind === 'story', requiredTests: result.totalRequired,
    passedTests: result.passedRequired,
    dataSets: new Set(challenge.testCases.map(test => test.input ?? '')).size,
    events: result.worldEvents.length,
    actions: [...new Set(result.worldEvents.map(event => event.type))],
    finalPosition: result.finalWorld ? [result.finalWorld.col, result.finalWorld.row] : null,
    dangerHits: result.finalWorld?.dangerHits ?? 0,
    errors: result.diagnostics.filter(item => item.severity === 'error').map(item => item.message),
  };
}));
const failed = rows.filter(row => !row.hasMap || !row.samplePasses || !row.emptyProgramRejected || row.dangerHits > 0);
const report = { generatedAt: new Date().toISOString(), method: 'Local interpreter, every sample solution and empty-program negative control. Not a browser visual audit.', total: rows.length, passed: rows.length - failed.length, rows };
writeFileSync(new URL('../docs/gameplay-audit-2026-09-05.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
for (const row of rows) console.log(`${row.samplePasses && row.emptyProgramRejected ? 'PASS' : 'FAIL'} ${row.challenge}: ${row.passedTests}/${row.requiredTests}, ${row.events} events, danger=${row.dangerHits}`);
console.log(`Gameplay: ${report.passed}/${report.total}; details: docs/gameplay-audit-2026-09-05.json`);
if (failed.length) process.exitCode = 1;
