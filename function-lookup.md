### blockBattleStartEffect

bunchastuff.js overrides the stock engine method Scene_Map.prototype.launchBattle — the function that fires the instant the map hands off into the battle scene.

Compared to the vanilla RMMZ version (rmmz_scenes.js), which unconditionally calls stopAudioOnBattleStart() (cuts the map's BGM/BGS) and SoundManager.playBattleStart() (plays the "bwaa-battle-start" stinger SFX) every time a battle launches.

**blockBattleStartEffect == false** *(the normal/default state)*
The classic battle transition plays: map audio gets cut and the battle-start stinger sound fires.

  
**blockBattleStartEffect == true**
Map audio isnt cut and no battle stinger plays. The audio channel isn't touched and continues the music as if nothing happened.
