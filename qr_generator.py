import segno
import re

data = "\n".join([
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:Bandilla;Ivan",
    "FN:Ivan Bandilla",
    "ADR:;;;City of Calamba;Laguna;4027;Philippines",
    "TEL;WORK;VOICE:",
    "TEL;CELL:+639760473359",
    "TEL;FAX:",
    "EMAIL;WORK;INTERNET:c.ivanbandilla+portfolio+contact@gmail.com",
    "URL:https://ivan-dev.vercel.app",
    "END:VCARD",
])
q = segno.make(data)
# save vector SVG (overwrites the file)
out = 'contact_qr.svg'
q.save(out, scale=10, dark='black', light=None)

# add viewBox if missing (uses the written width/height)
with open(out, 'r', encoding='utf-8') as f:
    svg = f.read()

if 'viewBox' not in svg:
    m = re.search(r'(<svg\b[^>]*?)\swidth="([\d.]+)"\s+height="([\d.]+)"([^>]*>)', svg, flags=re.IGNORECASE)
    if m:
        w = m.group(2)
        h = m.group(3)
        replacement = f'{m.group(1)} width="{w}" height="{h}" viewBox="0 0 {w} {h}"{m.group(4)}'
        svg = svg[:m.start()] + replacement + svg[m.end():]
        with open(out, 'w', encoding='utf-8') as f:
            f.write(svg)

print("Saved contact_qr.svg")