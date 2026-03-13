#!/usr/bin/env node
/**
 * Hook Integrity Verification Script
 *
 * This script verifies that husky hooks have not been modified or tampered with.
 * It generates or verifies checksums of hook files to detect unauthorized changes.
 *
 * Usage:
 *   node scripts/verify-hooks.js generate    # Generate checksums
 *   node scripts/verify-hooks.js verify      # Verify checksums (exit 1 on mismatch)
 *   node scripts/verify-hooks.js check-git   # Check git config for hook bypasses
 */

import { createHash } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const checksumFile = path.join(projectRoot, '.husky', 'hooks-checksum.txt');
const hookDir = path.join(projectRoot, '.husky');

// Critical hook files to monitor
const criticalHooks = ['pre-push', 'pre-commit'];

/**
 * Generate SHA256 checksum for a file
 */
function generateChecksum(filePath) {
  try {
    const rawContent = readFileSync(filePath, 'utf-8');
    // Normalize line endings to LF for consistent checksums across platforms
    const content = rawContent.replace(/\r\n/g, '\n');
    return createHash('sha256').update(content).digest('hex');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Load existing checksums
 */
function loadChecksums() {
  if (!existsSync(checksumFile)) {
    return {};
  }

  try {
    const content = readFileSync(checksumFile, 'utf-8');
    const checksums = {};

    content.split('\n').forEach((line) => {
      const match = line.match(/^(.{64}) \*(.+)$/);
      if (match) {
        checksums[match[2]] = match[1];
      }
    });

    return checksums;
  } catch (error) {
    console.error('Error loading checksums:', error.message);
    return {};
  }
}

/**
 * Save checksums to file
 */
function saveChecksums(checksums) {
  const content =
    Object.entries(checksums)
      .map(([file, checksum]) => `${checksum} *${file}`)
      .join('\n') + '\n';

  writeFileSync(checksumFile, content, 'utf-8');
}

/**
 * Generate checksums for all hook files
 */
function generate() {
  console.log('Generating hook checksums...');

  const checksums = {};
  let failed = false;

  for (const hook of criticalHooks) {
    const hookPath = path.join(hookDir, hook);
    if (existsSync(hookPath)) {
      const checksum = generateChecksum(hookPath);
      if (checksum) {
        checksums[hook] = checksum;
        console.log(`  ✓ ${hook}: ${checksum.substring(0, 16)}...`);
      } else {
        console.error(`  ✗ Failed to generate checksum for ${hook}`);
        failed = true;
      }
    } else {
      console.error(`  ✗ Hook file not found: ${hookPath}`);
      failed = true;
    }
  }

  if (!failed) {
    saveChecksums(checksums);
    console.log(`\n✅ Checksums saved to ${checksumFile}`);
  } else {
    console.error('\n❌ Failed to generate some checksums');
    process.exit(1);
  }
}

/**
 * Verify checksums match current hook files
 */
function verify() {
  const expectedChecksums = loadChecksums();

  if (Object.keys(expectedChecksums).length === 0) {
    console.error('❌ No checksums found. Run "node scripts/verify-hooks.js generate" first.');
    process.exit(1);
  }

  console.log('Verifying hook integrity...\n');

  let failed = false;

  for (const [filename, expectedChecksum] of Object.entries(expectedChecksums)) {
    const filePath = path.join(hookDir, filename);

    if (!existsSync(filePath)) {
      console.error(`  ✗ Hook file missing: ${filename}`);
      failed = true;
      continue;
    }

    const actualChecksum = generateChecksum(filePath);

    if (actualChecksum !== expectedChecksum) {
      console.error(`  ✗ ${filename}: CHECKSUM MISMATCH!`);
      console.error(`    Expected: ${expectedChecksum}`);
      console.error(`    Actual:   ${actualChecksum}`);
      failed = true;
    } else {
      console.log(`  ✓ ${filename}: OK`);
    }
  }

  // Check for extra hook files
  const expectedFiles = Object.keys(expectedChecksums);
  const actualFiles = criticalHooks.filter((hook) => existsSync(path.join(hookDir, hook)));

  for (const file of actualFiles) {
    if (!expectedFiles.includes(file)) {
      console.error(`  ✗ Unexpected hook file found: ${file}`);
      failed = true;
    }
  }

  if (failed) {
    console.error('\n❌ Hook integrity check FAILED!');
    console.error('\n⚠️  WARNING: Hook files have been modified.');
    console.error('This could indicate:');
    console.error('  1. Legitimate hook updates (run generate to update checksums)');
    console.error('  2. Unauthorized modification or tampering');
    console.error('  3. Filesystem corruption or git checkout issues');
  } else {
    console.log('\n✅ All hook integrity checks passed!');
  }

  process.exit(failed ? 1 : 0);
}

/**
 * Check git configuration for hook bypass attempts
 */
function checkGitConfig() {
  console.log('Checking git configuration for hook bypasses...\n');

  let issues = 0;

  try {
    // Check core.hooksPath
    const hooksPath = execSync('git config --get core.hooksPath', {
      encoding: 'utf-8',
    }).trim();
    // Allow .husky or .husky/_ (husky's internal structure)
    if (hooksPath && hooksPath !== '.husky' && hooksPath !== '.husky/_') {
      console.error(`  ✗ WARNING: git core.hooksPath is set to '${hooksPath}' instead of '.husky'`);
      console.error('    Run: git config --unset core.hooksPath');
      issues++;
    } else {
      console.log(`  ✓ core.hooksPath: OK (${hooksPath || 'default'})`);
    }
  } catch {
    // Config not set, which is fine
    console.log('  ✓ core.hooksPath: OK (not set, using default)');
  }

  try {
    // Check init.templateDir
    const templateDir = execSync('git config --get init.templateDir', {
      encoding: 'utf-8',
    }).trim();
    if (templateDir) {
      console.error(`  ✗ WARNING: init.templateDir is set to '${templateDir}'`);
      console.error('    This could bypass hooks. Run: git config --unset init.templateDir');
      issues++;
    } else {
      console.log('  ✓ init.templateDir: OK (not set)');
    }
  } catch {
    console.log('  ✓ init.templateDir: OK (not set)');
  }

  // Check if .husky directory exists and is executable
  if (!existsSync(hookDir)) {
    console.error(`  ✗ CRITICAL: .husky directory does not exist at ${hookDir}`);
    issues++;
  } else {
    console.log('  ✓ .husky directory: exists');
  }

  // Check pre-push hook exists and is executable
  const prePushPath = path.join(hookDir, 'pre-push');
  if (!existsSync(prePushPath)) {
    console.error(`  ✗ CRITICAL: pre-push hook is missing`);
    issues++;
  } else {
    console.log('  ✓ pre-push hook: exists');
  }

  // Check pre-commit hook exists and is executable
  const preCommitPath = path.join(hookDir, 'pre-commit');
  if (!existsSync(preCommitPath)) {
    console.error(`  ✗ CRITICAL: pre-commit hook is missing`);
    issues++;
  } else {
    console.log('  ✓ pre-commit hook: exists');
  }

  // Check husky installation
  try {
    execSync('pnpm husky --version', { stdio: 'ignore' });
    console.log('  ✓ husky: installed');
  } catch {
    console.error(`  ✗ WARNING: husky may not be installed`);
    issues++;
  }

  if (issues > 0) {
    console.error(`\n❌ Found ${issues} configuration issue(s) that could bypass hooks`);
    process.exit(1);
  } else {
    console.log('\n✅ Git configuration looks good!');
    process.exit(0);
  }
}

// Main
const command = process.argv[2];

switch (command) {
  case 'generate':
    generate();
    break;
  case 'verify':
    verify();
    break;
  case 'check-git':
    checkGitConfig();
    break;
  default:
    console.log('Usage: node scripts/verify-hooks.js <command>');
    console.log('');
    console.log('Commands:');
    console.log('  generate    Generate checksums for current hook files');
    console.log('  verify      Verify hook files match saved checksums');
    console.log('  check-git   Check git configuration for bypass attempts');
    console.log('');
    process.exit(1);
}
