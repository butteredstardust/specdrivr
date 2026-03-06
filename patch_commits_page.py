import re

with open("src/app/(authenticated)/projects/[id]/commits/client-page.tsx", "r") as f:
    content = f.read()

content = content.replace("bg-[#FFFFFF] border-b border-[#DFE1E6]", "bg-[var(--bg-surface)] border-b border-[var(--border-default)]")
content = content.replace("text-[#8590A2]", "text-[var(--text-tertiary)]")
content = content.replace("text-[#172B4D]", "text-[var(--text-primary)]")
content = content.replace("text-[#DFE1E6]", "text-[var(--border-strong)]")

with open("src/app/(authenticated)/projects/[id]/commits/client-page.tsx", "w") as f:
    f.write(content)
