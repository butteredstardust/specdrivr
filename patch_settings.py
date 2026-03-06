import re

with open("src/app/(authenticated)/settings/page.tsx", "r") as f:
    content = f.read()

# Update Section container wrapping multiple items
content = content.replace("h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, color: '#44546F', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', marginTop: '20px' }}>",
                          "h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', marginTop: '20px' }}>")

content = content.replace("<span style={{ width: '3px', height: '12px', background: '#6366F1', borderRadius: '2px' }} />",
                          "<span style={{ width: '3px', height: '12px', background: 'var(--brand-primary)', borderRadius: '2px', flexShrink: 0 }} />")

content = content.replace("div style={{ background: '#FFFFFF', border: '1px solid #DFE1E6', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(9,30,66,0.10)' }}>",
                          "div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-card)', marginBottom: '8px' }}>")

content = content.replace("borderBottom: itemIndex < group.items.length - 1 ? '1px solid #F1F2F4' : 'none',",
                          "borderBottom: itemIndex < group.items.length - 1 ? '1px solid var(--bg-hovered)' : 'none',")

content = content.replace("background: item.label === 'Appearance' ? '' : '#FFFFFF'",
                          "")

content = content.replace("className={item.label === 'Appearance' ? 'cursor-pointer hover:bg-[#F8F9FF]' : ''}",
                          "")

content = content.replace("<div className=\"flex-shrink-0 w-[32px] h-[32px] rounded-[var(--radius-sm)] bg-[var(--color-bg-sunken)] border border-[var(--color-border-default)] flex items-center justify-center text-[var(--color-text-tertiary)]\" >",
                          "<div className=\"flex-shrink-0 w-[32px] h-[32px] rounded-[var(--radius-sm)] bg-[var(--bg-hovered)] flex items-center justify-center text-[var(--text-tertiary)]\" >")

content = content.replace("<h3 className=\"text-[14px] text-[var(--color-text-primary)] font-medium\">",
                          "<h3 className=\"text-[14px] text-[var(--text-primary)] font-medium\">")

content = content.replace("<p className=\"text-[12px] text-[var(--color-text-tertiary)] mt-[2px]\">",
                          "<p className=\"text-[12px] text-[var(--text-tertiary)] mt-[2px]\">")

content = content.replace("<span className=\"text-[13px] text-[var(--color-text-tertiary)] font-medium ml-[var(--sp-2)]\">",
                          "<span className=\"text-[13px] text-[var(--text-tertiary)] ml-[var(--sp-2)] font-mono text-right\">")

with open("src/app/(authenticated)/settings/page.tsx", "w") as f:
    f.write(content)
