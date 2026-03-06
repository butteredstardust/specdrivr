import re

with open("src/app/(authenticated)/admin/users/page.tsx", "r") as f:
    content = f.read()

content = content.replace("tr className=\"border-b border-[var(--color-border-default)]\"",
                          "tr className=\"border-b border-[var(--border-default)] bg-[var(--bg-hovered)] h-[36px]\"")

content = content.replace("tr key={user.id} className=\"border-b border-[var(--color-border-default)] last:border-0 hover:bg-[var(--color-bg-hovered)] group transition-colors\"",
                          "tr key={user.id} className=\"h-[48px] border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-hovered)] transition-colors\"")

content = content.replace("style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}", "style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', opacity: 1 }}")

with open("src/app/(authenticated)/admin/users/page.tsx", "w") as f:
    f.write(content)
