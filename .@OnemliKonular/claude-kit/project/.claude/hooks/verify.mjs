// Stop hook: before Claude is allowed to finish, run typecheck + lint + tests.
// - Runs only if code changed since the last green run (marker from mark-dirty.mjs).
// - On failure: exit 2 → stderr goes back to Claude and it keeps working.
// - After MAX_ATTEMPTS failures it lets Claude stop and warns the user (no infinite loop).
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const MAX_ATTEMPTS = 3;
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const marker = join(root, '.claude', '.needs-verify');

// Drain stdin (hook input) so the process exits cleanly.
process.stdin.resume();
process.stdin.on('data', () => {});
process.stdin.on('end', main);

function hasScript(pkgPath, name) {
  try {
    return Boolean(JSON.parse(readFileSync(pkgPath, 'utf8')).scripts?.[name]);
  } catch {
    return false;
  }
}

function buildSteps() {
  const steps = [];
  const rootPkg = join(root, 'package.json');
  steps.push(['typecheck', hasScript(rootPkg, 'typecheck') ? 'npm run typecheck' : 'npx tsc --noEmit']);
  if (existsSync(join(root, 'client', 'tsconfig.json'))) {
    steps.push(['typecheck:client', 'npx tsc --noEmit -p client']);
  }
  if (hasScript(rootPkg, 'lint')) steps.push(['lint', 'npm run lint']);
  steps.push(['test', process.env.VERIFY_TEST_CMD || 'npm test']);
  return steps;
}

function main() {
  if (!existsSync(marker)) process.exit(0); // nothing changed → nothing to verify

  const attempts = Number(readFileSync(marker, 'utf8') || '0');

  for (const [name, cmd] of buildSteps()) {
    try {
      execSync(cmd, { cwd: root, stdio: 'pipe', encoding: 'utf8', timeout: 540_000 });
    } catch (err) {
      const output = `${err.stdout || ''}\n${err.stderr || ''}`.trim().slice(-4000);
      const next = attempts + 1;

      if (next >= MAX_ATTEMPTS) {
        writeFileSync(marker, '0'); // reset so the next edit gets fresh attempts
        console.log(JSON.stringify({
          systemMessage: `verify: "${name}" still failing after ${MAX_ATTEMPTS} attempts. Human review needed.`,
        }));
        process.exit(0);
      }

      writeFileSync(marker, String(next));
      process.stderr.write(
        `VERIFY FAILED at step "${name}" (\`${cmd}\`), attempt ${next}/${MAX_ATTEMPTS}.\n` +
          `Fix the root cause (do not skip or delete tests), then finish again.\n\n${output}\n`,
      );
      process.exit(2);
    }
  }

  unlinkSync(marker); // all green
  process.exit(0);
}
