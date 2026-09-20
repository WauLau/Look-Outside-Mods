// Run from game/data/: node gen-map-lookup.js > ../../map-id-lookup.md
const data = JSON.parse(require('fs').readFileSync('./MapInfos.json', 'utf8'));
const maps = data.filter(Boolean);
const byId = new Map(maps.map(m => [m.id, m]));

function path(m) {
  const parts = [m.name];
  let cur = m;
  const seen = new Set([cur.id]);
  while (cur.parentId && byId.has(cur.parentId) && !seen.has(cur.parentId)) {
    cur = byId.get(cur.parentId);
    parts.unshift(cur.name);
    seen.add(cur.id);
  }
  return parts.join(' / ');
}



maps.sort((a, b) => a.id - b.id);

console.log('## Map ID Lookup\n');
console.log('Generated from `game/data/MapInfos.json` (the file the editor\'s map tree is built from).');
console.log(`${maps.length} maps, IDs ${maps[0].id}-${maps[maps.length - 1].id}. Regenerate whenever you add/rename/move maps.\n`);
console.log('| ID | Name | Folder Path |');
console.log('|----|------|-------------|');
for (const m of maps) {
  console.log(`| ${m.id} | ${m.name} | ${path(m)} |`);
}
console.log('\n### Regenerating this list\n');
console.log('Run from the `game/data/` directory whenever maps change:\n');
console.log('```');
console.log('node gen-map-lookup.js > ../../map-id-lookup.md');
console.log('```');
console.log('\n(script itself lives wherever you saved it, e.g. a `scripts/` folder)');
