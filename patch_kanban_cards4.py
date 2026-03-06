import re

with open("src/components/task-card.tsx", "r") as f:
    content = f.read()

# Update hover styles on card
content = content.replace('className={cn(\n          "bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-sm)] shadow-[var(--shadow-card)] p-[var(--sp-3)] hover:border-l-[2px] hover:border-l-[#6366F1] hover:pl-[10px] cursor-pointer hover:bg-[var(--color-bg-hovered)] transition-all group",\n          isDragging && "z-50 shadow-2xl scale-[1.02]"\n        )}',
                          'className={cn(\n          "bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[10px] px-[12px] mb-[6px] shadow-[var(--shadow-card)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] hover:border-l-[2px] hover:border-l-[var(--brand-primary)] hover:pl-[10px] cursor-pointer transition-all group",\n          isDragging && "z-50 shadow-2xl scale-[1.02]"\n        )}')


with open("src/components/task-card.tsx", "w") as f:
    f.write(content)
