import re

with open("src/components/kanban-board.tsx", "r") as f:
    content = f.read()

content = content.replace('"px-[6px] flex items-center h-[20px] rounded-[3px] text-[11px] font-bold uppercase tracking-[0.04em] whitespace-nowrap",', '"px-[6px] flex items-center h-[20px] rounded-[3px] text-[11px] font-bold uppercase tracking-[0.04em] whitespace-nowrap border-none",')

with open("src/components/kanban-board.tsx", "w") as f:
    f.write(content)
