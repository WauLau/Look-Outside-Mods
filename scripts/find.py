import json, glob
count = 0
files = set()
paths = []
for path in glob.glob('/Users/laugantriis/Library/Application Support/CrossOver/Bottles/Steam/drive_c/Program Files (x86)/Look Outside Backup/data/Map[0-9]*.json'):
    d = json.load(open(path, encoding='utf-8'))
    identifier = ['Shadow Man']
    for ev in d.get('events', []):
        if not ev:
            continue
        if all(name not in (ev.get('name') or '') for name in identifier):
            continue
        for page in ev.get('pages', []):
            for c in page.get('list', []):
                if c.get('code') == 132:
                    name = c['parameters'][0].get('name')
                    if name in ('Tension', 'Tension_HorrorOST'):
                        count += 1
                        files.add(path)
                        paths.append(path)
print('occurrences:', count, '| files:', len(files))
for file in paths:
    print('Path; ', file)
print('occurrences:', count, '| files:', len(files))