import re

with open("src/app/(authenticated)/projects/[id]/commits/client-page.tsx", "r") as f:
    content = f.read()

content = content.replace("className=\"!bg-[#2563EB] !text-[#FFFFFF] !opacity-100 font-medium text-[14px] h-[34px] px-[16px] border-none rounded-[6px] hover:!bg-[#1D4ED8]\"",
                          "className=\"!bg-[var(--brand-primary)] !text-[#FFFFFF] !opacity-100 font-medium text-[13px] h-[32px] px-[14px] border-none rounded-[var(--radius-md)] hover:!bg-[var(--brand-primary-hover)]\"")

with open("src/app/(authenticated)/projects/[id]/commits/client-page.tsx", "w") as f:
    f.write(content)
