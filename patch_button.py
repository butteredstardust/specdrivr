import re

with open("src/components/ui/button.tsx", "r") as f:
    content = f.read()

# Update base classes for button
content = content.replace("const baseClasses = 'inline-flex items-center justify-center gap-[var(--sp-2)] font-medium rounded-[var(--radius-md)] transition-[background,color] disabled:opacity-50 disabled:cursor-not-allowed outline-none border-none cursor-pointer text-[12px]';",
                          "const baseClasses = 'inline-flex items-center justify-center gap-[var(--sp-2)] font-medium transition-[background,color] disabled:!bg-[#C7D2FE] disabled:!text-[#4338CA] disabled:!opacity-100 disabled:cursor-not-allowed outline-none border-none cursor-pointer text-[13px] rounded-[var(--radius-md)]';")

# Update primary class variant
content = content.replace("primary: 'bg-[var(--color-brand-bold)] text-white hover:bg-[var(--color-brand-bolder)]',",
                          "primary: 'bg-[var(--brand-primary)] text-[#fff] hover:bg-[var(--brand-primary-hover)]',")

# Update ghost variant
content = content.replace("ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hovered)] hover:text-[var(--color-text-primary)]',",
                          "ghost: 'bg-transparent text-[var(--text-tertiary)] hover:bg-[var(--bg-hovered)] hover:text-[var(--text-primary)]',")

# Update secondary variant just in case
content = content.replace("secondary: 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hovered)] hover:border-[var(--color-border-bold)] border-solid',",
                          "secondary: 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-hovered)] border-solid',")

content = content.replace("large: 'h-[36px] px-[var(--sp-4)] text-[14px]',",
                          "large: 'h-[36px] px-[14px] text-[14px]',")

content = content.replace("medium: 'h-[32px] px-[var(--sp-3)]',",
                          "medium: 'h-[32px] px-[14px]',")

content = content.replace("small: 'h-[28px] px-[var(--sp-2)]',",
                          "small: 'h-[28px] px-[14px]',")

content = content.replace("icon: 'w-[32px] h-[32px] p-0',",
                          "icon: 'w-[28px] h-[28px] p-0 rounded-[var(--radius-sm)]',")

with open("src/components/ui/button.tsx", "w") as f:
    f.write(content)
