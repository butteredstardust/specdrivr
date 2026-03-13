#!/usr/bin/env node
/**
 * Hook Audit Logging Script
 *
 * Logs hook execution, bypass attempts, and configuration changes
 * to detect tampering and ensure accountability.
 *
 * Usage (called from hooks):
 *   node scripts/audit-hooks.js pre-commit [user] [status] [details]
 *   node scripts/audit-hooks.js pre-push [user] [status] [branch] [bypass_method]
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import os from "os";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, "..");
const auditDir = path.join(projectRoot, ".husky", "audit");

// Ensure audit directory exists
if (!existsSync(auditDir)) {
  mkdirSync(auditDir, { recursive: true });
}

/**
 * Get current git user and branch
 */
function getGitInfo() {
  try {
    const user = execSync("git config user.name", { encoding: "utf-8" }).trim();
    const email = execSync("git config user.email", {
      encoding: "utf-8",
    }).trim();
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf-8",
    }).trim();

    return { user, email, branch };
  } catch {
    return { user: "unknown", email: "unknown", branch: "unknown" };
  }
}

/**
 * Get commit information
 */
function getCommitInfo() {
  try {
    const cmd = execSync('git log -1 --format="%h %s"', {
      encoding: "utf-8",
    }).trim();
    return cmd;
  } catch {
    return "unknown";
  }
}

/**
 * Check if git is being run with --no-verify
 */
function checkBypassAttempt() {
  // This is primarily for educational purposes
  // --no-verify is a valid git feature, but we track it
  const gitCmd = process.env.GIT_COMMAND ? process.env.GIT_COMMAND : "";
  const hasNoVerify = gitCmd.includes("--no-verify");
  return hasNoVerify ? "git --no-verify" : "none";
}

/**
 * Check git config for bypass methods
 */
function checkConfigBypass() {
  const bypasses = [];

  try {
    const hooksPath = execSync("git config --get core.hooksPath", {
      encoding: "utf-8",
    }).trim();
    if (hooksPath && hooksPath !== ".husky") {
      bypasses.push(`core.hooksPath=${hooksPath}`);
    }
  } catch {
    // Not set, which is fine
  }

  try {
    const templateDir = execSync("git config --get init.templateDir", {
      encoding: "utf-8",
    }).trim();
    if (templateDir) {
      bypasses.push(`init.templateDir=${templateDir}`);
    }
  } catch {
    // Not set
  }

  return bypasses.join("; ") || "none";
}

/**
 * Log pre-commit event
 */
function logPreCommit(user, status, details = "") {
  const timestamp = new Date().toISOString();
  const gitInfo = getGitInfo();
  const commitInfo = getCommitInfo();
  const bypassMethod = checkBypassAttempt();
  const configBypass = checkConfigBypass();

  const logEntry = {
    timestamp,
    event: "pre-commit",
    user,
    email: gitInfo.email,
    branch: gitInfo.branch,
    commit_hash: commitInfo.split(" ")[0] || "unknown",
    commit_message: commitInfo.split(" ").slice(1).join(" ") || "unknown",
    status, // 'passed' | 'failed' | 'bypassed'
    bypass_method: bypassMethod,
    config_bypass: configBypass,
    files_changed: details || "unknown",
    hostname: os.hostname(),
    platform: os.platform(),
  };

  const logFile = path.join(
    auditDir,
    `pre-commit-${new Date().toISOString().split("T")[0]}.log`,
  );
  appendFileSync(logFile, JSON.stringify(logEntry) + "\n");

  // Log to console if hook was bypassed
  if (status === "bypassed" && bypassMethod !== "none") {
    console.error(
      "⚠️  WARNING: Pre-commit checks were bypassed with --no-verify",
    );
    console.error("   This usage is logged for security purposes.");
  }

  if (configBypass !== "none") {
    console.error(
      `⚠️  WARNING: Git config has bypass settings: ${configBypass}`,
    );
  }
}

/**
 * Log pre-push event
 */
function logPrePush(user, status, details = "", bypassMethodArg = "") {
  const timestamp = new Date().toISOString();
  const gitInfo = getGitInfo();
  const bypassMethod = bypassMethodArg || checkBypassAttempt();
  const configBypass = checkConfigBypass();

  // Parse details (should be in format: "commits:X,files:Y,branch:Z")
  const detailsObj = {};
  try {
    details.split(",").forEach((part) => {
      const [key, value] = part.split(":");
      detailsObj[key] = value;
    });
  } catch {
    detailsObj.raw = details;
  }

  const logEntry = {
    timestamp,
    event: "pre-push",
    user,
    email: gitInfo.email,
    branch: gitInfo.branch,
    remote_branch: detailsObj.branch || "unknown",
    commits_count: detailsObj.commits || "unknown",
    files_changed: detailsObj.files || "unknown",
    status, // 'passed' | 'failed' | 'bypassed'
    bypass_method: bypassMethod,
    config_bypass: configBypass,
    hostname: os.hostname(),
    platform: os.platform(),
  };

  const logFile = path.join(
    auditDir,
    `pre-push-${new Date().toISOString().split("T")[0]}.log`,
  );
  appendFileSync(logFile, JSON.stringify(logEntry) + "\n");

  // Log to console if hook was bypassed
  if (status === "bypassed" && bypassMethod !== "none") {
    console.error(
      "⚠️  WARNING: Pre-push checks were bypassed with --no-verify",
    );
    console.error("   This usage is logged for security purposes.");
  }

  if (configBypass !== "none") {
    console.error(
      `⚠️  WARNING: Git config has bypass settings: ${configBypass}`,
    );
  }
}

/**
 * Show recent audit logs
 */
function showLogs() {
  const today = new Date().toISOString().split("T")[0];
  const preCommitFile = path.join(auditDir, `pre-commit-${today}.log`);
  const prePushFile = path.join(auditDir, `pre-push-${today}.log`);

  console.log("Recent Hook Audit Logs\n");

  for (const [event, file] of [
    ["pre-commit", preCommitFile],
    ["pre-push", prePushFile],
  ]) {
    console.log(`${event}:`);
    if (existsSync(file)) {
      const lines = readFileSync(file, "utf-8").trim().split("\n");
      if (lines.length > 0 && lines[0] !== "") {
        lines.slice(-5).forEach((line) => {
          const entry = JSON.parse(line);
          const status = entry.status === "bypassed" ? "⚠️  BYPASSED" : "✓";
          console.log(
            `  ${entry.timestamp} | ${entry.user} | branch=${entry.branch} | ${status}`,
          );
        });
      } else {
        console.log("  (no entries)");
      }
    } else {
      console.log("  (no log file)");
    }
    console.log("");
  }
}

// Main
const command = process.argv[2];

if (!command || command === "show") {
  showLogs();
  process.exit(0);
}

// Called from hooks
const event = process.argv[2]; // 'pre-commit' or 'pre-push'
const user = process.argv[3] || getGitInfo().user;
const status = process.argv[4] || "unknown";
const details = process.argv[5] || "";
const bypassMethodArg = process.argv[6] || "";

try {
  switch (event) {
    case "pre-commit":
      logPreCommit(user, status, details);
      break;
    case "pre-push":
      logPrePush(user, status, details, bypassMethodArg);
      break;
    default:
      console.error(`Unknown event: ${event}`);
      process.exit(1);
  }
} catch (error) {
  // Don't fail the hook if logging fails
  console.error("Warning: Failed to log audit entry:", error.message);
  process.exit(0);
}
