import re

with open("src/lib/ios-styles.ts", "r") as f:
    content = f.read()

# Replace hardcoded colors with new CSS variables
content = content.replace("todo: { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]' }", "todo: { bg: 'bg-[var(--status-todo-bg)]', text: 'text-[var(--status-todo-text)]' }")
content = content.replace("running: { dot: 'bg-[#57D9A3]', bg: 'bg-[var(--status-done-bg)]', text: 'text-[var(--status-done-text)]' }", "running: { dot: 'bg-[#4ADE80]', bg: 'bg-[var(--status-done-bg)]', text: 'text-[var(--status-done-text)]' }")
content = content.replace("paused: { dot: 'bg-[#FFAB00]', bg: 'bg-[var(--status-paused-bg)]', text: 'text-[var(--status-paused-text)]' }", "paused: { dot: 'bg-[#F87171]', bg: 'bg-[var(--status-paused-bg)]', text: 'text-[var(--status-paused-text)]' }")

content = content.replace("admin: { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]' }", "admin: { bg: 'bg-[var(--role-admin-bg)]', text: 'text-[var(--role-admin-text)]' }")
content = content.replace("developer: { bg: 'bg-[#DBEAFE]', text: 'text-[#1D4ED8]' }", "developer: { bg: 'bg-[var(--role-dev-bg)]', text: 'text-[var(--role-dev-text)]' }")
content = content.replace("viewer: { bg: 'bg-[#EEF2FF]', text: 'text-[#4338CA]' }", "viewer: { bg: 'bg-[var(--role-viewer-bg)]', text: 'text-[var(--role-viewer-text)]' }")

with open("src/lib/ios-styles.ts", "w") as f:
    f.write(content)
