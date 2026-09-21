import json, glob
from collections import defaultdict

folderPath = '/Users/laugantriis/Library/Application Support/CrossOver/Bottles/Steam/drive_c/Program Files (x86)/Look Outside Backup/data/Map[0-9]*.json'

findings = defaultdict(list)

for path in sorted(glob.glob('LookOutsideMusicMod/data/Map[0-9]*.json')):
    d = json.load(open(path, encoding='utf-8'))
    for ev in d.get('events', []):
        if not ev:
            continue
        for p_idx, page in enumerate(ev.get('pages', [])):
            seen_battle = False
            for c in page.get('list', []):
                code = c.get('code')
                if code == 301:
                    seen_battle = True
                elif code == 132 and seen_battle:
                    name = c['parameters'][0].get('name')
                    if name in ('Tension', 'Tension_HorrorOST'):
                        findings[(ev.get('name'), name)].append((path, ev['id'], p_idx))

for (name, bgm), locs in sorted(findings.items()):
    files = sorted(set(l[0] for l in locs))
    print(f'{name!r} -> {bgm} : {len(locs)} page(s) across {len(files)} file(s)')
    for f in files:
        print('   ', f)