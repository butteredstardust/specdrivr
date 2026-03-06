import re

with open("src/components/project-card.tsx", "r") as f:
    content = f.read()

content = content.replace("boxShadow: '0 1px 2px rgba(9,30,66,0.20), 0 0 1px rgba(9,30,66,0.25)',", "boxShadow: 'var(--shadow-card)',")
content = content.replace("background: '#FFFFFF',", "background: 'var(--bg-surface)',")
content = content.replace("border: '1px solid #DFE1E6',", "border: '1px solid var(--border-default)',")
content = content.replace("color: '#172B4D',", "color: 'var(--text-primary)',")
content = content.replace("color: '#8590A2',", "color: 'var(--text-tertiary)',")

# fix left accent stripes class
content = content.replace("className=\"absolute left-0 top-0 bottom-0 w-[3px]\"", "className=\"absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[8px]\"")
content = content.replace("style={{ background: accentColor, borderRadius: '8px 0 0 8px' }}", "style={{ background: accentColor }}")

with open("src/components/project-card.tsx", "w") as f:
    f.write(content)

with open("src/app/(authenticated)/page.tsx", "r") as f:
    content = f.read()

content = content.replace("gap-[12px]", "gap-[16px]")
content = content.replace("accentColor=\"#2563EB\"", "accentColor=\"#4F46E5\"")

with open("src/app/(authenticated)/page.tsx", "w") as f:
    f.write(content)
