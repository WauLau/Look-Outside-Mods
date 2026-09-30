/*:
 * @target MZ
 * @author WauLau
 * @plugindesc (v1.3) Additional functions and overrides to support the "Extended Soundtrack" mod for Look Outside.
 *
 * @help
 * ======================================================================================
 *
 * The plugin is intended as a mod and not an actual plugin for developer usage. The plugin contains
 * targeted overrides and functions to enable additional support for "Look Outside" version 2.3 specifically.
 *
 * Day/night music: songs are picked by variable 122 (<= 1 day, >= 2 night).
 * If the time of day changes while a day/night song is playing on the map,
 * it crossfades to the other song. Set up either:
 * - in data/WauLau_BgmReplacements.json (rules with a "night" song), which
 *   catches the game's own Play BGM commands and map autoplay, or
 * - with the "Play BGM (Day/Night)" plugin command in the event editor.
 *
 * @command playDayNightBgm
 * @text Play BGM (Day/Night)
 * @desc Plays the day or night song depending on the time of day (variable 122).
 *
 * @arg day
 * @text Day BGM
 * @desc Song played during the day.
 * @type file
 * @dir audio/bgm/
 * @require 1
 *
 * @arg night
 * @text Night BGM
 * @desc Song played at night. Empty: the day song is used.
 * @type file
 * @dir audio/bgm/
 * @require 1
 *
 * @arg volume
 * @text Volume
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @arg pitch
 * @text Pitch
 * @type number
 * @min 50
 * @max 150
 * @default 100
 *
 * @arg pan
 * @text Pan
 * @type number
 * @min -100
 * @max 100
 * @default 0
 *
 * @arg follow
 * @text Follow Time Changes
 * @desc Crossfade to the other song if the time of day changes while this one is playing.
 * @type boolean
 * @on Crossfade
 * @off Keep playing
 * @default true
 */

;(() => {
    "use strict"

    //============================================================================//
    //                              PLUGIN SETUP                                  //
    //============================================================================//
    const pluginName = "WauLau_ExtendedSoundtrack"
    const params = PluginManager.parameters(pluginName)

    const WauLau = {}

    //============================================================================//
    //                                 OVERRIDES                                  //
    //============================================================================//

    // -------------------------TITLE/SPLASH BGM FADEIN--------------------------//
    const _Scene_Title_playTitleMusic = Scene_Title.prototype.playTitleMusic
    Scene_Title.prototype.playTitleMusic = function () {
        if (
            AudioManager._bgmBuffer &&
            AudioManager._bgmBuffer.name === "TheWindow_VaporWave"
        ) {
            return
        }
        AudioManager.playBgm({
            name: "TheWindow_VaporWave",
            volume: 90,
            pitch: 100,
            pan: 0,
            pos: 0,
        }) //fade in if the player is returning to title etc.
        AudioManager._bgmBuffer.fadeIn(3)
        AudioManager.stopBgs()
        AudioManager.stopMe()
    }

    //============================================================================//
    //                              DAY/NIGHT MUSIC                               //
    //============================================================================//

    /** Game variable holding the window/time-of-day state (<= 1 day, >= 2 night). */
    const WINDOW_STATE_VAR = 122
    /** Frames to wait for the old song's fade-out before starting the new one. */
    const DAY_NIGHT_FADE_FRAMES = 60

    /** @typedef {{ day: object, night: object }} DayNightPair */

    /**
     * @param {DayNightPair} pair
     * @returns {object} The song for the current time of day.
     */
    function dayNightSong(pair) {
        return $gameVariables.value(WINDOW_STATE_VAR) >= 2 ?
                pair.night
            :   pair.day
    }

    // ACTIVE PAIR -----
    // The last day/night pair that was played, kept on $gameSystem so it's in
    // save files. The crossfade only acts while one of its two songs is the
    // current BGM, so a stale pair (after other music took over) is harmless.
    /** @param {DayNightPair} pair */
    function setActiveDayNightPair(pair) {
        if ($gameSystem) $gameSystem._dayNightBgm = pair
    }

    /** Crossfade in progress: the song to start once the fade-out finishes. */
    let dayNightFade = { frames: 0, song: null }

    const _Scene_Map_update = Scene_Map.prototype.update
    Scene_Map.prototype.update = function () {
        _Scene_Map_update.call(this)
        this.updateDayNightBgm()
    }

    /**
     * Crossfades to the other song of the active pair when the time of day
     * changes while that pair's wrong song is playing. Any other music
     * (cutscenes, other maps) is left alone.
     */
    Scene_Map.prototype.updateDayNightBgm = function () {
        if (dayNightFade.frames > 0) {
            if (--dayNightFade.frames > 0) return
            // Something else started during the fade-out (transfer, event): let it play.
            if (!AudioManager._currentBgm) {
                AudioManager.playBgm(dayNightFade.song)
                AudioManager.fadeInBgm(1)
            }
            dayNightFade.song = null
            return
        }

        const pair = $gameSystem._dayNightBgm
        const current = AudioManager._currentBgm
        if (!pair || !current) return
        const wanted = dayNightSong(pair)
        const other = wanted === pair.day ? pair.night : pair.day
        if (current.name !== other.name || current.name === wanted.name) return

        AudioManager.fadeOutBgm(1)
        dayNightFade = { frames: DAY_NIGHT_FADE_FRAMES, song: wanted }
    }

    //---------------------------------------------------------------//
    // Plugin command: Play BGM (Day/Night)
    //---------------------------------------------------------------//
    PluginManager.registerCommand(pluginName, "playDayNightBgm", (args) => {
        const audio = {
            volume: Number(args.volume),
            pitch: Number(args.pitch),
            pan: Number(args.pan),
        }
        const pair = {
            day: { name: args.day, ...audio },
            night: { name: args.night || args.day, ...audio },
        }
        if (args.follow === "true") setActiveDayNightPair(pair)
        AudioManager.playBgm(dayNightSong(pair))
    })

    //============================================================================//
    //                            BGM REPLACEMENTS                                //
    //============================================================================//

    /** Rules file in data/, loaded alongside the database at boot. */
    const BGM_REPLACEMENTS_FILE = "WauLau_BgmReplacements.json"

    /**
     * Songs swapped out whenever they're played, from anywhere (Play BGM,
     * map autoplay, battle BGM, script calls). Loaded from the "replacements"
     * array in data/WauLau_BgmReplacements.json.
     *
     * - from:        Original song name to replace.
     * - to:          Audio fields to use instead. Omitted fields (volume,
     *                pitch, pan) keep the original's values.
     * - night:       Optional. Audio fields to use at night instead; makes the
     *                rule a day/night pair (day = `to`, or the original song
     *                if there's no `to`) that crossfades on time changes.
     * - map, event, commonEvent, troop: optional conditions. An omitted
     *   condition matches anything; a number or an array of numbers must
     *   match the current context.
     *     map         - $gameMap.mapId()
     *     event       - ID of the map event running the command. Event IDs
     *                   are per-map, so pair it with `map`. Also matches
     *                   common events that event calls.
     *     commonEvent - ID of the common event running the command.
     *     troop       - Troop ID, during battle (incl. the battle intro).
     *
     * The first matching rule wins, so list specific rules before general ones.
     * @type {Array<{from: string, to?: object, night?: object, map?: number|number[], event?: number|number[], commonEvent?: number|number[], troop?: number|number[]}>}
     */
    let BGM_REPLACEMENTS = []
    let bgmReplacementsLoaded = false

    const CONTEXT_KEYS = ["map", "event", "commonEvent", "troop"]

    //---------------------------------------------------------------//
    // Loading data/WauLau_BgmReplacements.json
    //---------------------------------------------------------------//

    // OWN LOADER -----
    // Not added to DataManager._databaseFiles: those get a "Test_" prefix in
    // battle/event tests, and a JSON syntax error there throws inside the XHR
    // callback, leaving the boot screen waiting forever. Here a missing or
    // broken file logs an error and the game runs without replacements.
    const _DataManager_loadDatabase = DataManager.loadDatabase
    DataManager.loadDatabase = function () {
        _DataManager_loadDatabase.call(this)
        loadBgmReplacements()
    }

    const _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded
    /** Boot also waits for the replacements file. */
    DataManager.isDatabaseLoaded = function () {
        return _DataManager_isDatabaseLoaded.call(this) && bgmReplacementsLoaded
    }

    /** Requests the rules file; sets BGM_REPLACEMENTS and bgmReplacementsLoaded when done. */
    function loadBgmReplacements() {
        const url = "data/" + BGM_REPLACEMENTS_FILE
        const xhr = new XMLHttpRequest()
        xhr.open("GET", url)
        xhr.overrideMimeType("application/json")
        xhr.onload = () => {
            if (xhr.status < 400) {
                BGM_REPLACEMENTS = parseBgmReplacements(xhr.responseText)
            } else {
                console.error(
                    `${pluginName}: couldn't load ${url} (${xhr.status})`
                )
            }
            bgmReplacementsLoaded = true
        }
        xhr.onerror = () => {
            console.error(`${pluginName}: couldn't load ${url}`)
            bgmReplacementsLoaded = true
        }
        xhr.send()
    }

    /**
     * Parses the rules file, dropping (and logging) rules that can't work.
     * @param {string} text - Raw file contents.
     * @returns {Array<object>} The valid rules, in file order.
     */
    function parseBgmReplacements(text) {
        let rules
        try {
            rules = JSON.parse(text).replacements
        } catch (e) {
            console.error(
                `${pluginName}: ${BGM_REPLACEMENTS_FILE} isn't valid JSON - ${e.message}`
            )
            return []
        }
        if (!Array.isArray(rules)) {
            console.error(
                `${pluginName}: ${BGM_REPLACEMENTS_FILE} needs a "replacements" array`
            )
            return []
        }
        return rules.filter((rule, i) => {
            const valid =
                !!rule &&
                typeof rule.from === "string" &&
                [rule.to, rule.night].some((audio) => audio && audio.name)
            if (!valid) {
                console.warn(
                    `${pluginName}: skipping replacements[${i}], needs "from" and a "to" or "night" with a "name"`,
                    rule
                )
            }
            return valid
        })
    }

    // CONTEXT TRACKING -----
    // AudioManager.playBgm doesn't know who called it, so the interpreter
    // executing a command is recorded here, and each interpreter is tagged
    // with the common event it was set up for. An interpreter only receives a
    // command list in setup(); the common event ID exists only at the three
    // places that start one (call, reserve, parallel), which set
    // pendingCommonEventId right before their setup() consumes it.
    /** @type {Game_Interpreter|null} */
    let runningInterpreter = null
    let pendingCommonEventId = 0

    const _Game_Interpreter_setup = Game_Interpreter.prototype.setup
    /** Tags the interpreter with the common event it's being set up for (0 if none). */
    Game_Interpreter.prototype.setup = function (list, eventId) {
        _Game_Interpreter_setup.call(this, list, eventId)
        this._commonEventId = pendingCommonEventId
        pendingCommonEventId = 0
    }

    const _Game_Interpreter_executeCommand =
        Game_Interpreter.prototype.executeCommand
    /** Records this interpreter as the one running while its command executes. */
    Game_Interpreter.prototype.executeCommand = function () {
        const previous = runningInterpreter
        runningInterpreter = this
        try {
            return _Game_Interpreter_executeCommand.call(this)
        } finally {
            runningInterpreter = previous
        }
    }

    const _Game_Interpreter_command117 = Game_Interpreter.prototype.command117
    /** Call Common Event: tags the child interpreter. */
    Game_Interpreter.prototype.command117 = function (params) {
        pendingCommonEventId = params[0]
        const result = _Game_Interpreter_command117.call(this, params)
        pendingCommonEventId = 0
        return result
    }

    const _Game_Interpreter_setupReservedCommonEvent =
        Game_Interpreter.prototype.setupReservedCommonEvent
    /** Reserved common events (items, skills, scripts): tags the map/troop interpreter. */
    Game_Interpreter.prototype.setupReservedCommonEvent = function () {
        pendingCommonEventId = $gameTemp._commonEventQueue[0] || 0
        const result = _Game_Interpreter_setupReservedCommonEvent.call(this)
        pendingCommonEventId = 0
        return result
    }

    const _Game_CommonEvent_update = Game_CommonEvent.prototype.update
    /** Parallel common events: tags the interpreter when it restarts its list. */
    Game_CommonEvent.prototype.update = function () {
        if (this._interpreter && !this._interpreter.isRunning()) {
            pendingCommonEventId = this._commonEventId
        }
        _Game_CommonEvent_update.call(this)
        pendingCommonEventId = 0
    }

    /**
     * Where the BGM is being played from right now.
     * @returns {{ map: number, event: number, commonEvent: number, troop: number }}
     */
    function currentBgmContext() {
        const interpreter = runningInterpreter
        // The battle BGM starts during the map's encounter effect, before
        // $gameParty.inBattle() is set, while Scene_Battle is the next scene.
        const inBattle =
            !!$gameParty &&
            ($gameParty.inBattle() || SceneManager.isNextScene(Scene_Battle))
        return {
            map: $gameMap ? $gameMap.mapId() : 0,
            event: interpreter ? interpreter._eventId : 0,
            commonEvent: interpreter ? interpreter._commonEventId || 0 : 0,
            troop: inBattle && $gameTroop ? $gameTroop._troopId : 0,
        }
    }

    /**
     * @param {object} rule - A BGM_REPLACEMENTS entry.
     * @param {object} context - From currentBgmContext().
     * @returns {boolean} true if every condition the rule sets matches.
     */
    function ruleMatchesContext(rule, context) {
        return CONTEXT_KEYS.every(
            (key) =>
                rule[key] === undefined ||
                [].concat(rule[key]).includes(context[key])
        )
    }

    /**
     * Applies a matched rule. Day/night rules also become the active pair.
     * @param {object} rule - A BGM_REPLACEMENTS entry.
     * @param {object} bgm - Audio object about to be played.
     * @returns {object} The audio object to play instead.
     */
    function applyRule(rule, bgm) {
        const day = rule.to ? { ...bgm, ...rule.to } : bgm
        if (!rule.night) return day
        const pair = { day, night: { ...bgm, ...rule.night } }
        setActiveDayNightPair(pair)
        return dayNightSong(pair)
    }

    /**
     * @param {object} bgm - Audio object about to be played.
     * @returns {object} The replacement audio object, or bgm unchanged.
     */
    function replacementFor(bgm) {
        if (!bgm || !bgm.name) return bgm
        const candidates = BGM_REPLACEMENTS.filter((r) => r.from === bgm.name)
        if (candidates.length === 0) return bgm
        const context = currentBgmContext()
        const rule = candidates.find((r) => ruleMatchesContext(r, context))
        return rule ? applyRule(rule, bgm) : bgm
    }

    // PLAY BGM INJECTION -----
    // Every BGM (Play BGM, autoplay incl. MUSH's parent-map autoplay, battle
    // BGM, replayBgm, script calls) ends up here. Swapping before the original
    // runs keeps isCurrentBgm, Save/Replay BGM and save files consistent with
    // the song that's actually playing.
    const _AudioManager_playBgm = AudioManager.playBgm
    AudioManager.playBgm = function (bgm, pos) {
        _AudioManager_playBgm.call(this, replacementFor(bgm), pos)
    }

    // checkIfBGM (bunchastuff.js) -----
    // Event scripts compare the current BGM against *original* song names,
    // e.g. checkIfBGM("Eviction_VaporWave") in CommonEvents.json. A playing
    // replacement (day or night) counts as its original.
    const _checkIfBGM = window.checkIfBGM
    if (typeof _checkIfBGM === "function") {
        window.checkIfBGM = function (bgmTrack) {
            if (_checkIfBGM(bgmTrack)) return true
            const current = AudioManager._currentBgm
            return (
                !!current &&
                BGM_REPLACEMENTS.some(
                    (r) =>
                        r.from === bgmTrack &&
                        [r.to, r.night].some(
                            (audio) => audio && audio.name === current.name
                        )
                )
            )
        }
    }
})()

//Called in splash screen event in RPGMAKER
function playTitleAtSplash() {
    AudioManager.playBgm($dataSystem.titleBgm)
    AudioManager._bgmBuffer.fadeIn(3.5)
    AudioManager.stopBgs()
    AudioManager.stopMe()
}
