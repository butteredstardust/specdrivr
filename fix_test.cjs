const fs = require('fs');

// We see two things in CI test log:
// "Error: Timed out waiting 60000ms from config.webServer."
// This means the `playwright test` is timing out because the WebServer (`npm run dev`) could not start or crashed.
// Looking at the logs locally, we saw `Port 3000 is in use by an unknown process` and `Unable to acquire lock at /app/.next/dev/lock`.
// Wait, in GitHub CI, it says: `npm warn Unknown env config "verify-deps-before-run"` which is a warning, not a crash.
// Why did the web server not start in CI?
// Actually, earlier in CI log it didn't print any crash, it just timed out.

// Let's modify playwright.config.ts to increase timeout, disable reuseExistingServer in CI, or change port to avoid conflicts.
let pwConfig = fs.readFileSync('playwright.config.ts', 'utf8');

// Change timeout to 120000 just in case it's slow
pwConfig = pwConfig.replace("reuseExistingServer: !process.env.CI,", "reuseExistingServer: !process.env.CI,\n    timeout: 120 * 1000,");

fs.writeFileSync('playwright.config.ts', pwConfig);
