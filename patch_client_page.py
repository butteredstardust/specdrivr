import re

with open("src/app/(authenticated)/projects/[id]/client-page.tsx", "r") as f:
    content = f.read()

# Update breadcrumbs and titles container
content = content.replace("bg-[#FFFFFF] border-b border-[#DFE1E6]", "bg-[var(--bg-surface)] border-b border-[var(--border-default)]")
content = content.replace("text-[#8590A2]", "text-[var(--text-tertiary)]")
content = content.replace("text-[#172B4D]", "text-[var(--text-primary)]")
content = content.replace("text-[#DFE1E6]", "text-[var(--border-strong)]")

# Update Tab classes
content = content.replace("const sharedClass = `relative flex items-center gap-[var(--sp-2)] h-[40px] px-[var(--sp-3)] text-[var(--font-size-sm)] font-medium transition-colors whitespace-nowrap mb-[-1px] ${isActive\n              ? 'text-[var(--color-brand-bold)] border-b-2 border-[var(--color-brand-bold)]'\n              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border-b-2 border-transparent'\n              }`;",
                          "const sharedClass = `relative flex items-center gap-[6px] h-[36px] px-[12px] text-[13px] font-medium transition-colors whitespace-nowrap mb-[-1px] ${isActive ? 'text-[var(--brand-primary)] border-b-2 border-[var(--brand-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-b-2 border-transparent'}`;")

with open("src/app/(authenticated)/projects/[id]/client-page.tsx", "w") as f:
    f.write(content)
