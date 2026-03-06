import re

with open("tests/unit/ios-styles.test.ts", "r") as f:
    content = f.read()

content = content.replace("bg: 'bg-[#F1F5F9]',", "bg: 'bg-[var(--status-todo-bg)]',")
content = content.replace("text: 'text-[#475569]'", "text: 'text-[var(--status-todo-text)]'")
content = content.replace("bg: 'bg-[#DBEAFE]',", "bg: 'bg-[var(--status-inprogress-bg)]',")
content = content.replace("text: 'text-[#1D4ED8]'", "text: 'text-[var(--status-inprogress-text)]'")

with open("tests/unit/ios-styles.test.ts", "w") as f:
    f.write(content)
