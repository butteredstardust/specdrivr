import re

with open("src/app/(authenticated)/projects/[id]/settings/client-page.tsx", "r") as f:
    content = f.read()

# Add !important to Database, Settings, GitBranch icons
content = content.replace("<Database size={14} color=\"#94A3B8\" />", "<Database size={12} className=\"text-[#94A3B8] !important\" />")
content = content.replace("<Settings size={14} color=\"#94A3B8\" />", "<Settings size={12} className=\"text-[#94A3B8] !important\" />")
content = content.replace("<GitBranch size={14} color=\"#94A3B8\" />", "<GitBranch size={12} className=\"text-[#94A3B8] !important\" />")

content = content.replace("<Key size={14} className=\"text-[var(--color-text-secondary)]\" />", "<Key size={12} className=\"text-[#94A3B8] !important\" />")

with open("src/app/(authenticated)/projects/[id]/settings/client-page.tsx", "w") as f:
    f.write(content)
