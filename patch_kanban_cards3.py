import re

with open("src/components/task-card.tsx", "r") as f:
    content = f.read()

# Update status lozenge class
content = content.replace('className={cn(\n              "px-[var(--sp-2)] py-[var(--sp-1)] rounded-[var(--radius-sm)] text-[11px] font-bold uppercase tracking-wider",\n              taskStatusColors[status as keyof typeof taskStatusColors]?.bg || "bg-[var(--status-todo-bg)]",\n              taskStatusColors[status as keyof typeof taskStatusColors]?.text || "text-[var(--status-todo-text)]"\n            )}',
                          'className={cn(\n              "h-[20px] px-[6px] rounded-[3px] border-none inline-flex items-center text-[11px] font-bold uppercase tracking-[0.04em]",\n              taskStatusColors[status as keyof typeof taskStatusColors]?.bg || "bg-[var(--status-todo-bg)]",\n              taskStatusColors[status as keyof typeof taskStatusColors]?.text || "text-[var(--status-todo-text)]"\n            )}')

with open("src/components/task-card.tsx", "w") as f:
    f.write(content)
