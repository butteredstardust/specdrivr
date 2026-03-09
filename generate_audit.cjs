const fs = require('fs');
const { execSync } = require('child_process');

const outPath = 'documentation/CODEBASE_AUDIT.md';
let out = '';

function append(text) {
    out += text + '\n';
}

append('# Codebase Audit');
append(`Generated: ${new Date().toISOString()}`);
append('');

append('## 1. Package Inventory');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
let nodeVersion = 'Not specified';
if (fs.existsSync('.nvmrc')) {
    nodeVersion = fs.readFileSync('.nvmrc', 'utf-8').trim();
} else if (pkg.engines && pkg.engines.node) {
    nodeVersion = pkg.engines.node;
}
append(`- Node version: ${nodeVersion}`);

let pkgManager = 'Not explicitly specified';
if (fs.existsSync('.npmrc')) {
    const npmrc = fs.readFileSync('.npmrc', 'utf-8');
    const match = npmrc.match(/packageManager=(.*)/i);
    if (match) pkgManager = match[1];
}
if (pkgManager === 'Not explicitly specified' && pkg.packageManager) {
    pkgManager = pkg.packageManager;
}
append(`- Package manager: ${pkgManager}`);
append('- Dependencies:');
if (pkg.dependencies) {
    Object.entries(pkg.dependencies).forEach(([k, v]) => append(`  - ${k}: ${v}`));
} else {
    append('  None');
}
append('- DevDependencies:');
if (pkg.devDependencies) {
    Object.entries(pkg.devDependencies).forEach(([k, v]) => append(`  - ${k}: ${v}`));
} else {
    append('  None');
}
append('- Scripts:');
if (pkg.scripts) {
    Object.entries(pkg.scripts).forEach(([k, v]) => append(`  - ${k}: ${v}`));
} else {
    append('  None');
}
append('');

append('## 2. File Tree');
append(fs.readFileSync('out_tree.txt', 'utf-8').trim());
append('');
append(fs.readFileSync('out_drizzle1.txt', 'utf-8').trim());
append(fs.readFileSync('out_drizzle2.txt', 'utf-8').trim());
append('');

append('## 3. Schema (src/db/schema.ts)');
if (fs.existsSync('src/db/schema.ts')) {
    append(fs.readFileSync('src/db/schema.ts', 'utf-8').trim());
} else {
    append('MISSING');
}
append('');

append('## 4. Lib Files');
const libFiles = [
    'src/lib/auth.ts',
    'src/lib/redis.ts',
    'src/lib/logger.ts',
    'src/lib/rbac.ts',
    'src/lib/rate-limiter.ts',
    'src/lib/lock-manager.ts',
    'src/lib/pricing.ts',
    'src/lib/env.ts',
    'src/lib/errors.ts',
    'src/lib/schemas.ts',
    'src/middleware.ts',
    'src/lib/db-helpers.ts'
];
libFiles.forEach(file => {
    append(`### ${file}`);
    if (fs.existsSync(file)) {
        append('EXISTS');
        append(fs.readFileSync(file, 'utf-8').trim());
    } else {
        append('MISSING');
    }
    append('');
});

append('### src/lib/schemas/');
if (fs.existsSync('src/lib/schemas')) {
    append('EXISTS');
    append(fs.readFileSync('out_schemas.txt', 'utf-8').trim());
} else {
    append('MISSING');
}
append('');

append('## 5. Repositories');
const repoFiles = [
    'src/repositories/base-repository.ts',
    'src/repositories/project-repository.ts',
    'src/repositories/task-repository.ts',
    'src/repositories/index.ts'
];
repoFiles.forEach(file => {
    append(`### ${file}`);
    if (fs.existsSync(file)) {
        append('EXISTS');
        append(fs.readFileSync(file, 'utf-8').trim());
    } else {
        append('MISSING');
    }
    append('');
});

append('## 6. Seed File');
if (fs.existsSync('src/db/seed.ts')) {
    append(fs.readFileSync('src/db/seed.ts', 'utf-8').trim());
} else {
    append('MISSING');
}
append('');

append('## 7. API Routes');
const apiRoutesCmd = fs.readFileSync('out_api.txt', 'utf-8').trim();
if (apiRoutesCmd) {
    const apiRoutes = apiRoutesCmd.split('\n');
    apiRoutes.forEach(file => {
        append(`### ${file}`);
        append(fs.readFileSync(file, 'utf-8').trim());
        append('');
    });
}

append('## 8. TypeScript Output');
append(fs.readFileSync('out_typecheck.txt', 'utf-8').trim());
append('');

append('## 9. Lint Output');
append(fs.readFileSync('out_lint.txt', 'utf-8').trim());
append('');

append('## 10. Migration State');
append(fs.readFileSync('out_migrate.txt', 'utf-8').trim());
append(fs.readFileSync('out_migrate_list.txt', 'utf-8').trim());
append('');

append('## 11. Environment');
let envContent = fs.readFileSync('out_env.txt', 'utf-8');

if (envContent !== 'no env file found\n') {
    const lines = envContent.split('\n');
    const redacted = lines.map(line => {
        if (line.includes('=')) {
            const parts = line.split('=');
            const key = parts[0];
            const val = parts.slice(1).join('=');
            if (val.length > 0 && !val.startsWith('http')) {
                return `${key}=[REDACTED]`;
            }
        }
        return line;
    });
    envContent = redacted.join('\n');
}
append(envContent.trim());
append('');

append('## 12. Next.js Config');
let nextConfig = 'MISSING';
if (fs.existsSync('next.config.mjs')) {
    nextConfig = fs.readFileSync('next.config.mjs', 'utf-8');
} else if (fs.existsSync('next.config.ts')) {
    nextConfig = fs.readFileSync('next.config.ts', 'utf-8');
} else if (fs.existsSync('next.config.js')) {
    nextConfig = fs.readFileSync('next.config.js', 'utf-8');
}
append(nextConfig.trim());
append('');

fs.writeFileSync(outPath, out);
console.log('Audit complete — documentation/CODEBASE_AUDIT.md written.');
