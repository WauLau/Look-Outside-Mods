### blockBattleStartEffect

bunchastuff.js overrides the stock engine method Scene\_Map.prototype.launchBattle — the function that fires the instant the map hands off into the battle scene.

Compared to the vanilla RMMZ version (rmmz\_scenes.js), which unconditionally calls stopAudioOnBattleStart() (cuts the map's BGM/BGS) and SoundManager.playBattleStart() (plays the "bwaa-battle-start" stinger SFX) every time a battle launches.

**blockBattleStartEffect == false** _(the normal/default state)_  
The classic battle transition plays: map audio gets cut and the battle-start stinger sound fires.

**blockBattleStartEffect == true**  
Map audio isnt cut and no battle stinger plays. The audio channel isn't touched and continues the music as if nothing happened.

ffmpeg -i LookOutsideMusicMod/audio/bgm/TheWindow\_VaporWave.ogg -vn -map 0:a -c:a copy LookOutsideMusicMod/audio/bgm/TheWindow\_VaporWave\_fixed.ogg

ffprobe -hide\_banner LookOutsideMusicMod/audio/bgm/TheWindow\_VaporWave\_fixed.ogg 2>&1 | grep -E "Duration|Stream #|bitrate"
