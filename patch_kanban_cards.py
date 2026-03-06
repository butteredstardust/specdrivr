import re

with open("src/components/task-card.tsx", "r") as f:
    content = f.read()

# Update hover styles on card
content = content.replace("className={cn(\n        \"bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] p-[var(--sp-3)] cursor-grab hover:border-[var(--color-border-selected)] transition-all shadow-[var(--shadow-card)] relative group\",\n        isDragging && \"opacity-50\"\n      )}",
                          "className={cn(\n        \"bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[10px] pb-[12px] px-[12px] mb-[6px] cursor-grab hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)] hover:border-l-[2px] hover:border-l-[var(--brand-primary)] hover:pl-[10px] transition-all relative group\",\n        isDragging && \"opacity-50\"\n      )}")

# Monospace font task id
content = content.replace("className=\"text-[11px] font-bold text-[var(--color-text-tertiary)]\"",
                          "className=\"text-[11px] font-[400] text-[var(--text-tertiary)] font-mono\"")

# Update Title text color & size
content = content.replace("className=\"text-[13px] font-medium text-[var(--color-text-primary)] leading-snug line-clamp-3 mb-[var(--sp-3)]\"",
                          "className=\"text-[13px] font-[500] text-[var(--text-primary)] leading-snug line-clamp-3 mb-[var(--sp-3)]\"")

# Update status lozenge class
content = content.replace("className={cn(\n              \"px-[var(--sp-2)] py-[var(--sp-1)] rounded-[var(--radius-sm)] text-[11px] font-bold uppercase tracking-wider\",\n              taskStatusColors[status as keyof typeof taskStatusColors]?.bg || \"bg-[var(--status-todo-bg)]\",\n              taskStatusColors[status as keyof typeof taskStatusColors]?.text || \"text-[var(--status-todo-text)]\"\n            )}",
                          "className={cn(\n              \"h-[20px] px-[6px] rounded-[3px] border-none inline-flex items-center text-[11px] font-bold uppercase tracking-[0.04em]\",\n              taskStatusColors[status as keyof typeof taskStatusColors]?.bg || \"bg-[var(--status-todo-bg)]\",\n              taskStatusColors[status as keyof typeof taskStatusColors]?.text || \"text-[var(--status-todo-text)]\"\n            )}")

with open("src/components/task-card.tsx", "w") as f:
    f.write(content)
