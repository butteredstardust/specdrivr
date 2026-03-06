import re

with open("src/app/(authenticated)/projects/[id]/settings/client-page.tsx", "r") as f:
    content = f.read()

content = content.replace('className="text-[#94A3B8] !important"', 'className="!text-[#94A3B8]"')

with open("src/app/(authenticated)/projects/[id]/settings/client-page.tsx", "w") as f:
    f.write(content)
