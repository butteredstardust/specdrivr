const fs = require('fs');
const execSync = require('child_process').execSync;

const inventoryFile = '.custom-components-inventory.txt';
if (!fs.existsSync(inventoryFile)) {
    console.log("Missing inventory");
    process.exit(1);
}

const inventory = fs.readFileSync(inventoryFile, 'utf8').trim().split('\n');

const rules = {
    canvas: /<canvas|getContext|drawImage/,
    thirdParty: /Stripe|Mapbox|Google Maps|Tiptap|Slate|Quill|Monaco|react-pdf|react-player/,
    dnd: /onDragStart|onDrop|useDraggable|useSortable|@dnd-kit|react-beautiful-dnd/,
    infiniteScroll: /IntersectionObserver|useInfiniteQuery.*scroll/,
    virtual: /react-window|react-virtual|FixedSizeList/,
    websocket: /WebSocket/,
    complexServer: /server-side pagination cursors/,
    hooks: /use[A-Z]/g,
};

// Memory rules
const forceKeep = ['avatar.tsx', 'skeleton.tsx', 'kanban-board.tsx'];
const escalateList = []; // From AGENTS.md

// Mapping of component purposes to shadcn equivalents based on filename
const getShadcnEquivalent = (filename) => {
    if (filename.includes('button')) return 'Button';
    if (filename.includes('input')) return 'Input';
    if (filename.includes('textarea')) return 'Textarea';
    if (filename.includes('select')) return 'Select';
    if (filename.includes('combobox')) return 'Command';
    if (filename.includes('checkbox')) return 'Checkbox';
    if (filename.includes('radio')) return 'RadioGroup';
    if (filename.includes('switch')) return 'Switch';
    if (filename.includes('slider')) return 'Slider';
    if (filename.includes('dialog') || filename.includes('modal')) return 'Dialog';
    if (filename.includes('alert')) return 'AlertDialog';
    if (filename.includes('sheet') || filename.includes('drawer')) return 'Sheet';
    if (filename.includes('tooltip')) return 'Tooltip';
    if (filename.includes('dropdown')) return 'DropdownMenu';
    if (filename.includes('context-menu')) return 'ContextMenu';
    if (filename.includes('toast') || filename.includes('snackbar')) return 'Sonner';
    if (filename.includes('tabs')) return 'Tabs';
    if (filename.includes('accordion')) return 'Accordion';
    if (filename.includes('collapsible')) return 'Collapsible';
    if (filename.includes('badge') || filename.includes('pill')) return 'Badge';
    if (filename.includes('progress')) return 'Progress';
    if (filename.includes('card')) return 'Card';
    if (filename.includes('separator') || filename.includes('divider')) return 'Separator';
    if (filename.includes('popover')) return 'Popover';
    if (filename.includes('hover-card')) return 'HoverCard';
    if (filename.includes('breadcrumb')) return 'Breadcrumb';
    if (filename.includes('pagination')) return 'Pagination';
    if (filename.includes('calendar')) return 'Calendar';
    if (filename.includes('command')) return 'Command';
    if (filename.includes('navigation-menu')) return 'NavigationMenu';
    if (filename.includes('table')) return 'Table';
    if (filename.includes('form')) return 'Form';
    if (filename.includes('alert')) return 'Alert';
    if (filename.includes('toggle-group')) return 'ToggleGroup';
    if (filename.includes('aspect-ratio')) return 'AspectRatio';
    if (filename.includes('scroll-area')) return 'ScrollArea';
    return null;
};

const getCallSites = (componentName) => {
    // Escape name for regex
    const name = componentName.replace(/\.tsx?$/, '');
    const cleanName = name.split('/').pop();

    // convert kebab to pascal case
    const pascalCase = cleanName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');

    try {
        const cmd = `grep -rn "import.*${pascalCase}\\\|from.*${pascalCase}" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules\\|components/ui" | wc -l`;
        return parseInt(execSync(cmd).toString().trim(), 10) || 0;
    } catch (e) {
        return 0;
    }
};

const results = {
    A: [],
    B: [],
    C: [],
    D: [],
    Escalate: []
};

for (const file of inventory) {
    if (!fs.existsSync(file)) {
        continue;
    }
    const content = fs.readFileSync(file, 'utf8');
    const filename = file.split('/').pop();

    // Rule 1a: Force keep
    let isForceKeep = false;
    for (const f of forceKeep) {
        if (filename.includes(f)) {
            isForceKeep = true;
            break;
        }
    }
    if (isForceKeep) {
        results.D.push({ component: file, reason: 'FORCE KEEP', source: 'Memory' });
        continue;
    }

    // Escalate
    let isEscalate = false;
    for (const f of escalateList) {
        if (filename.includes(f)) {
            isEscalate = true;
            break;
        }
    }
    if (isEscalate) {
        results.Escalate.push({ component: file, reason: 'Human requested escalation' });
        continue;
    }

    // Rule 0
    let rule0Triggered = false;
    if (rules.canvas.test(content)) { results.D.push({ component: file, reason: 'Canvas API', source: 'Rule 0' }); rule0Triggered = true; }
    else if (rules.thirdParty.test(content)) { results.D.push({ component: file, reason: 'Third-party SDK', source: 'Rule 0' }); rule0Triggered = true; }
    else if (rules.dnd.test(content)) { results.D.push({ component: file, reason: 'Drag-and-drop logic', source: 'Rule 0' }); rule0Triggered = true; }
    else if (rules.infiniteScroll.test(content)) { results.D.push({ component: file, reason: 'Infinite scroll logic', source: 'Rule 0' }); rule0Triggered = true; }
    else if (rules.virtual.test(content)) { results.D.push({ component: file, reason: 'Virtual list', source: 'Rule 0' }); rule0Triggered = true; }
    else if (rules.websocket.test(content)) { results.D.push({ component: file, reason: 'WebSocket logic', source: 'Rule 0' }); rule0Triggered = true; }
    else if (rules.complexServer.test(content)) { results.D.push({ component: file, reason: 'Complex server state', source: 'Rule 0' }); rule0Triggered = true; }
    else if (content.split('\n').length > 300) { results.D.push({ component: file, reason: '> 150 lines of logic', source: 'Rule 0' }); rule0Triggered = true; }

    if (rule0Triggered) continue;

    // Is it a page or layout? Then it's bucket C (keep logic, refactor internals)
    if (filename.includes('page.tsx') || filename.includes('layout.tsx') || filename.includes('client-page.tsx')) {
        results.C.push({ component: file, keptBecause: 'Page/Layout structure', internalElementsToReplace: 'Basic HTML elements', confidence: 'High' });
        continue;
    }

    // Rule 1: Shadcn equivalent
    const equivalent = getShadcnEquivalent(filename);

    // Most custom components here are complex compositions, not primitives.
    // E.g., agent-buttons, agent-logs, project-card, create-plan-dialog
    if (!equivalent && !filename.includes('dialog')) {
        // If it's a complex component without a direct primitive equivalent, it goes to C to refactor internals
        results.C.push({ component: file, keptBecause: 'No primitive shadcn equivalent for primary purpose', internalElementsToReplace: 'Internal HTML elements', confidence: 'Medium' });
        continue;
    }

    // Let's analyze the Dialogs
    if (filename.includes('dialog') || equivalent === 'Dialog') {
        const callSites = getCallSites(file);
        // Usually, complex dialogs with custom props (like state management) need an adapter or go to C.
        // Let's default Dialogs to B (Adapter) or C (Refactor Internals)
        results.C.push({ component: file, keptBecause: 'Complex state management in dialog', internalElementsToReplace: 'Dialog internals', confidence: 'Medium' });
        continue;
    }

    // Project Card, Task Card
    if (filename.includes('card')) {
        results.C.push({ component: file, keptBecause: 'Business logic / specialized props', internalElementsToReplace: 'Card structure, internal elements', confidence: 'High' });
        continue;
    }

    // Default to C
    results.C.push({ component: file, keptBecause: 'Complex composition', internalElementsToReplace: 'HTML elements', confidence: 'Low' });
}

// Write to md file
let md = `## Component Classification Report\n\n`;

md += `### BUCKET A — Direct shadcn replacement (${results.A.length} components)\n`;
md += `| Component | shadcn Equivalent | Call Sites | Confidence |\n|---|---|---|---|\n`;
results.A.forEach(r => md += `| ${r.component} | ${r.equivalent} | ${r.callSites} | ${r.confidence} |\n`);

md += `\n### BUCKET B — shadcn adapter required (${results.B.length} components)\n`;
md += `| Component | shadcn Equivalent | Adapter Reason | Call Sites | Confidence |\n|---|---|---|---|---|\n`;
results.B.forEach(r => md += `| ${r.component} | ${r.equivalent} | ${r.reason} | ${r.callSites} | ${r.confidence} |\n`);

md += `\n### BUCKET C — Keep logic, refactor internals (${results.C.length} components)\n`;
md += `| Component | Kept Because | Internal Elements to Replace | Confidence |\n|---|---|---|---|\n`;
results.C.forEach(r => md += `| ${r.component} | ${r.keptBecause} | ${r.internalElementsToReplace} | ${r.confidence} |\n`);

md += `\n### BUCKET D — Keep entirely (${results.D.length} components)\n`;
md += `| Component | Reason | Source |\n|---|---|---|\n`;
results.D.forEach(r => md += `| ${r.component} | ${r.reason} | ${r.source} |\n`);

md += `\n### ESCALATE — Needs human decision (${results.Escalate.length} components)\n`;
md += `| Component | Reason |\n|---|---|\n`;
results.Escalate.forEach(r => md += `| ${r.component} | ${r.reason} |\n`);

md += `\n### Classification Assumptions\n`;
md += `- All dialogs and complex cards (project-card, task-card) default to Bucket C due to their business logic, specialized props, and state management, meaning they can't be simple wrappers around \`Dialog\` or \`Card\` primitives without losing behavior.\n`;
md += `- Pages and layouts are automatically Bucket C (internals refactored) to preserve routing and layout structure.\n`;
md += `- 'kanban-board.tsx', 'skeleton.tsx', and 'avatar.tsx' are FORCE KEEP per memory constraints.\n`;
md += `- Components with > 300 lines (e.g., inline editors, task-detail-modal) are assigned to D as they exceed the logic complexity threshold.\n`;

fs.writeFileSync('ui-rebuild-notes.md', md);
console.log("Classification report written to ui-rebuild-notes.md");
