/*
 * @target MZ
 * @author WauLau
 * @plugindesc (v1.3) Additional functions and overrides to support the "Extended Soundtrack" mod for Look Outside.
 *
 * @help
 * ======================================================================================
 *
 * The plugin is intended as a mod and not an actual plugin for developer usage. The plugin contains
 * targeted overrides and functions to enable additional support for "Look Outside" version 2.3 specifically.
 */

;(() => {
    "use strict"

    //============================================================================//
    //                              PLUGIN SETUP                                  //
    //============================================================================//
    const pluginName = "WauLau_LookAtTooltips"
    const params = PluginManager.parameters(pluginName)

    const WauLau = {}

    //============================================================================//
    //                                 OVERRIDES                                  //
    //============================================================================//

    // -------------------------TITLE/SPLASH BGM FADEIN--------------------------//
    const _Scene_Title_playTitleMusic = Scene_Title.prototype.playTitleMusic
    Scene_Title.prototype.playTitleMusic = function () {
        if (AudioManager._bgmBuffer) {
            if (AudioManager._bgmBuffer.name !== "TheWindow_VaporWave") {
                AudioManager.playBgm($dataSystem.titleBgm) //fade in if the player is returning to title etc.
                AudioManager._bgmBuffer.fadeIn(3)
            }
        }
        AudioManager.stopBgs()
        AudioManager.stopMe()
    }
})()

//Called in splash screen event in RPGMAKER
function playTitleAtSplash() {
    AudioManager.playBgm($dataSystem.titleBgm)
    AudioManager._bgmBuffer.fadeIn(3.5)
    AudioManager.stopBgs()
    AudioManager.stopMe()
}
