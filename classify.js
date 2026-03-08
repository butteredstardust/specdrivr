const fs = require('fs');

const inventory = fs.readFileSync('.custom-components-inventory.txt', 'utf8').trim().split('\n');

const rules = {
    canvas: /<canvas|getContext|drawImage/,
    thirdParty: /Stripe|Mapbox|Google Maps|Tiptap|Slate|Quill|Monaco|react-pdf|react-player/,
    dnd: /onDragStart|onDrop|useDraggable|useSortable|@dnd-kit|react-beautiful-dnd/,
    infiniteScroll: /IntersectionObserver|useInfiniteQuery/,
    virtual: /react-window|react-virtual|FixedSizeList/,
    websocket: /WebSocket/,
    complexServer: /server-side pagination cursors/,
    hooks: /use[A-Z]/g,
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
        console.log(`Missing: ${file}`);
        continue;
    }
    const content = fs.readFileSync(file, 'utf8');

    // Memory rule overrides
    if (file.includes('avatar.tsx') || file.includes('skeleton.tsx') || file.includes('kanban-board.tsx')) {
        results.D.push({ file, reason: 'Memory says keep custom implementations' });
        continue;
    }

    // Page/Layouts shouldn't be replaced by a single shadcn component, but they might need internals replaced (Bucket C/D)
    if (file.includes('page.tsx') || file.includes('layout.tsx')) {
        results.C.push({ file, reason: 'Page/Layout file, keep structure but refactor internals' });
        continue;
    }

    // Rule 0 checks
    if (rules.canvas.test(content)) { results.D.push({ file, reason: 'Canvas API' }); continue; }
    if (rules.thirdParty.test(content)) { results.D.push({ file, reason: 'Third-party SDK' }); continue; }
    if (rules.dnd.test(content)) { results.D.push({ file, reason: 'Drag-and-drop' }); continue; }
    if (rules.infiniteScroll.test(content)) { results.D.push({ file, reason: 'Infinite scroll' }); continue; }
    if (rules.virtual.test(content)) { results.D.push({ file, reason: 'Virtual list' }); continue; }
    if (rules.websocket.test(content)) { results.D.push({ file, reason: 'WebSocket' }); continue; }

    const hookMatches = content.match(rules.hooks);
    const uniqueHooks = new Set(hookMatches);
    if (uniqueHooks.size > 3 && !file.includes('page.tsx') && !file.includes('layout.tsx')) {
        // Just rough estimation
        // results.D.push({ file, reason: '> 3 hooks' }); continue;
    }

    const lines = content.split('\n').length;
    if (lines > 300) { // Rough estimation for > 150 lines of non-jsx logic
        results.D.push({ file, reason: '> 300 lines total' }); continue;
    }

    // Default everything else to C for now to inspect
    results.C.push({ file, reason: 'Needs internal refactor' });
}

console.log(JSON.stringify(results, null, 2));
