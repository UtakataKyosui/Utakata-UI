import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  fingerprints,
  readEvidence,
  releaseEvidence,
  versionOnlyPackages,
} from './ci-evidence.mjs';
import { changedFiles, selectScope } from './ci-scope.mjs';
import {
  collectCandidates,
  isAncestor,
  maxReuseAgeMs,
} from './verified-runs.mjs';

export function gateRequired(gate, files, versionOnly = new Set()) {
  if (!files.length) return false;
  if (gate === 'checks') return true;
  if (gate === 'browser') return selectScope(files, false, versionOnly).browser;
  throw new Error(`Unknown gate: ${gate}`);
}

// A gate is reused only from a trusted main run that passed it on an ancestor
// commit whose diff to HEAD does not select it. Anything else reruns the gate.
export function selectReuse({
  head,
  gates,
  candidates,
  isAncestor,
  filesSince,
  now,
  versionOnlySince = () => new Set(),
}) {
  return Object.fromEntries(
    gates.map((gate) => {
      for (const candidate of candidates) {
        if (!candidate.satisfies.includes(gate)) continue;
        if (now - Date.parse(candidate.createdAt) > maxReuseAgeMs) continue;
        if (candidate.sha !== head && !isAncestor(candidate.sha, head))
          continue;
        if (
          gateRequired(
            gate,
            filesSince(candidate.sha),
            versionOnlySince(candidate.sha),
          )
        )
          continue;
        return [gate, { decision: 'reuse', ...candidate }];
      }
      return [gate, { decision: 'run' }];
    }),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const [workflow, gateList] = process.argv.slice(2);
  const gates = gateList.split(',');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  let decisions;
  if (process.env.FULL_VERIFICATION === 'true') {
    decisions = Object.fromEntries(gates.map((g) => [g, { decision: 'run' }]));
  } else {
    try {
      decisions = releaseEvidence(
        gates,
        fingerprints(),
        readEvidence(process.env.GITHUB_REPOSITORY),
      );
      const remaining = gates.filter((gate) => !decisions[gate]);
      if (remaining.length)
        Object.assign(
          decisions,
          selectReuse({
            head,
            gates: remaining,
            candidates: collectCandidates(
              process.env.GITHUB_REPOSITORY,
              workflow,
              false,
            ),
            isAncestor,
            filesSince: changedFiles,
            now: Date.now(),
            versionOnlySince: versionOnlyPackages,
          }),
        );
    } catch (error) {
      // Lookup failures never skip work.
      console.log(`Prior verification lookup failed: ${error.message}`);
      decisions = Object.fromEntries(
        gates.map((g) => [g, { decision: 'run' }]),
      );
    }
  }
  const output = Object.entries(decisions)
    .map(([gate, { decision }]) => `${gate}=${decision}`)
    .join('\n');
  const summary = Object.entries(decisions)
    .map(([gate, d]) =>
      d.decision === 'reuse'
        ? `- ${gate}: reused ${d.source} run ${d.id} attempt ${d.attempt} at ${d.sha}`
        : `- ${gate}: run in this workflow`,
    )
    .join('\n');
  console.log(output);
  console.log(summary);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### Prior verification\n${summary}\n`,
    );
}
