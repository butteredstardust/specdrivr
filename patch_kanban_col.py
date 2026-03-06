import re

with open("src/components/kanban-board.tsx", "r") as f:
    content = f.read()

# Update column container classes
content = content.replace("className=\"flex flex-col w-[272px] shrink-0 bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] p-[var(--sp-3)]\"",
                          "className=\"flex flex-col w-[272px] shrink-0 bg-[var(--bg-hovered)] border border-[var(--border-default)] rounded-[var(--radius-lg)] p-[10px] pb-2\"")

# Add Add task classes
with open("src/components/create-task-dialog.tsx", "r") as f:
    create_task = f.read()

create_task = create_task.replace("className=\"w-full flex items-center justify-start gap-2 px-[var(--sp-2)] py-[var(--sp-2)] rounded-[var(--radius-sm)] text-[14px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hovered)] hover:text-[#172B4D] transition-colors\"",
                                  "className=\"w-full h-[32px] flex items-center justify-start gap-2 px-[8px] rounded-[var(--radius-md)] text-[12px] text-[var(--text-tertiary)] bg-transparent border-none cursor-pointer hover:bg-[var(--border-default)] hover:text-[var(--text-secondary)] transition-colors\"")

with open("src/components/create-task-dialog.tsx", "w") as f:
    f.write(create_task)

with open("src/components/kanban-board.tsx", "w") as f:
    f.write(content)
