import json, glob, subprocess
from collections import defaultdict

folderDir = '/Users/laugantriis/Documents/RMMZ/Look Outside/LookOutsideMusicMod/audio/bgm/'
regex = [  ]
for path in sorted(glob.glob('LookOutsideMusicMod/audio/bgm/*_VaporWave.ogg')):
    name = (path.split('/')[-1])
    print ('File. ', {name}, 'path: ', path)
    subprocess.call("./recode.sh")