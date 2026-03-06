import re

# Update admin/users table
with open("src/app/(authenticated)/admin/users/page.tsx", "r") as f:
    content = f.read()

content = content.replace('"inline-flex items-center h-[20px] px-[6px] rounded-[3px] border-none text-[11px] font-bold uppercase tracking-[0.04em] whitespace-nowrap",\n                    user.isActive ? "bg-[#DCFFF1] text-[#216E4E]" : "bg-[#F1F2F4] text-[#44546F]"', '"inline-flex items-center h-[20px] px-[6px] rounded-[3px] border-none text-[11px] font-bold uppercase tracking-[0.04em] whitespace-nowrap",\n                    user.isActive ? "bg-[var(--status-done-bg)] text-[var(--status-done-text)]" : "bg-[var(--status-todo-bg)] text-[var(--status-todo-text)]"')
content = content.replace("w-[28px] h-[28px] shrink-0 rounded-full bg-[#E9F2FF] flex items-center justify-center text-[#0C66E4] text-[11px] font-semibold uppercase", "w-[28px] h-[28px] shrink-0 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center text-[var(--brand-primary)] text-[11px] font-semibold uppercase")

with open("src/app/(authenticated)/admin/users/page.tsx", "w") as f:
    f.write(content)
