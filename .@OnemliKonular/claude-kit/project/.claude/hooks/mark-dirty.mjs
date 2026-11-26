// PostToolUse hook: when Claude edits a code file, mark the project as "needs verify".
// verify.mjs (Stop hook) only runs the checks when this marker exists.
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const marker = join(root, '.claude', '.needs-verify');

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let filePath = '';
  try {
    const input = JSON.parse(raw || '{}');
    filePath = input.tool_input?.file_path || input.tool_input?.notebook_path || '';
  } catch {
    // unreadable input: be safe and mark dirty
  }
  // Docs/specs/tickets alone do not need a test run.
  if (/\.(md|mdx|txt)$/i.test(filePath)) process.exit(0);
  if (!existsSync(marker)) writeFileSync(marker, '0');
  process.exit(0);
});
