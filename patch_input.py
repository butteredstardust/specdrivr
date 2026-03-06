import re

with open("src/components/create-project-dialog.tsx", "r") as f:
    content = f.read()

# Update inputs
content = content.replace('const inputClasses = "w-full px-[var(--sp-3)] py-[var(--sp-2)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] text-[14px] focus:outline-none focus:border-[var(--color-border-selected)] transition-colors placeholder:text-[var(--color-text-tertiary)]";',
                          'const inputClasses = "w-full h-[32px] px-[12px] bg-[var(--bg-sunken)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[14px] focus:outline-none focus:border-[var(--border-focus)] focus:shadow-[0_0_0_2px_rgba(79,70,229,0.15)] focus:bg-[var(--bg-surface)] transition-colors placeholder:text-[var(--text-tertiary)]";')

with open("src/components/create-project-dialog.tsx", "w") as f:
    f.write(content)
