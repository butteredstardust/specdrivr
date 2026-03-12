import { execSync } from 'child_process';
import fs from 'fs';

const REPORT_FILE = `documentation/HEALTH_CHECK_REPORT_${new Date().toISOString().split('T')[0]}.md`;

function runCommand(name, command) {
  console.log(`Running: ${name}...`);
  try {
    const output = execSync(command, { stdio: 'pipe', encoding: 'utf-8', env: { ...process.env, CI: 'true' } });
    return { name, success: true, output };
  } catch (error) {
    return { name, success: false, output: (error.stdout || '') + (error.stderr || '') || error.message };
  }
}

async function main() {
  const results = [];

  // 1. Forbidden Artifacts
  const forbiddenPatterns = [/fix-.*\.sh$/, /fix-.*\.cjs$/, /temp-.*\.ts$/, /.*\.tmp$/, /.*\.bak$/, /\.env\.local$/, /.*\.orig$/, /db_backup\.sql$/, /debug\.log$/];
  const rootFiles = fs.readdirSync('.');
  const foundForbidden = rootFiles.filter(file => forbiddenPatterns.some(pattern => pattern.test(file)));
  results.push({
    name: 'Forbidden Artifacts',
    success: foundForbidden.length === 0,
    output: foundForbidden.length === 0 ? 'No forbidden artifacts found.' : `Found: ${foundForbidden.join(', ')}`
  });

  // 2. Security Audit
  results.push(runCommand('Security Audit (pnpm audit)', 'pnpm.cmd audit --prod'));

  // 3. Auth Integrity (better-auth doctor) - TEMPORARILY DISABLED
  // if (fs.existsSync('src/lib/auth.ts')) {
  //   results.push(runCommand('Auth Integrity (better-auth doctor)', 'pnpm.cmd exec better-auth doctor'));
  // } else {
  //   results.push({ name: 'Auth Integrity (better-auth doctor)', success: true, output: 'src/lib/auth.ts not found, skipping.' });
  // }

  // 4. Linting
  results.push(runCommand('Linting (ESLint)', 'pnpm.cmd run lint'));

  // 5. Type Check
  results.push(runCommand('Type Check (TSC)', 'pnpm.cmd tsc --noEmit'));

  // 6. Unit Tests
  results.push(runCommand('Unit Tests (Vitest)', 'pnpm.cmd vitest run'));

  // 7. Dead Code Detection
  results.push(runCommand('Dead Code Detection (Knip)', 'pnpm.cmd exec knip --reporter json'));

  // Generate Report
  let report = `# Health Check Report - ${new Date().toLocaleString()}\n\n`;
  report += `## Summary\n`;
  const allPassed = results.every(r => r.success);
  report += allPassed ? `✅ **PASS**: All quality gates are green.\n\n` : `❌ **FAIL**: Some quality gates failed. See details below.\n\n`;

  results.forEach(res => {
    report += `### ${res.success ? '✅' : '❌'} ${res.name}\n`;
    report += `\`\`\`text\n${res.output.trim()}\n\`\`\`\n\n`;
  });

  fs.writeFileSync(REPORT_FILE, report);
  console.log(`Report generated: ${REPORT_FILE}`);
}

main();
