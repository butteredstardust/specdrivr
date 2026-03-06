import re

with open("src/components/project-card.tsx", "r") as f:
    content = f.read()

# Update hover styles on the row
content = content.replace("className=\"group flex items-center min-h-[48px] px-[16px] border-b border-[var(--color-border-default)] hover:bg-[#F8F9FF] hover:border-l-[2px] hover:border-l-[#2563EB] hover:pl-[14px] transition-all last:border-b-0\"",
                          "className=\"group flex items-center h-[44px] px-[16px] border-b border-[var(--border-default)] hover:bg-[var(--bg-hovered)] hover:border-l-[2px] hover:border-l-[var(--brand-primary)] hover:pl-[14px] transition-all last:border-b-0\"")

content = content.replace("w-[8px] h-[8px]", "w-[6px] h-[6px]")
content = content.replace("text-[#8590A2]", "text-[var(--text-tertiary)]")

with open("src/components/project-card.tsx", "w") as f:
    f.write(content)

with open("src/components/dashboard-project-list.tsx", "r") as f:
    content = f.read()

content = content.replace("background: '#FFFFFF',", "background: 'var(--bg-surface)',")
content = content.replace("border: '1px solid #DFE1E6',", "border: '1px solid var(--border-default)',")
content = content.replace("boxShadow: '0 1px 2px rgba(9,30,66,0.15)'", "boxShadow: 'var(--shadow-card)'")

with open("src/components/dashboard-project-list.tsx", "w") as f:
    f.write(content)
