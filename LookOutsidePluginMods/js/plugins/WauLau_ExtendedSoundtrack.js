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
 * Conditional music: songs can be picked by the time of day (variable 122:
 * <= 1 day, >= 2 night) or by any switch/variable. If the condition changes
 * while such a song is playing on the map, it crossfades to the right one.
 * Set up either:
 * - in data/WauLau_BgmReplacements.json (rules with "night" or "variants"),
 *   which catches the game's own Play BGM commands and map autoplay, or
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
            AudioManager._bgmBuffer.name === "TheWindow_VaporWave" &&
            AudioManager._bgmBuffer._isPlaying
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
    //                     CONDITIONAL MUSIC (DAY/NIGHT, SWITCHES)                //
    //============================================================================//

    /** Game variable holding the window/time-of-day state (<= 1 day, >= 2 night). */
    const WINDOW_STATE_VAR = 122
    /** `when` condition for night songs. */
    const NIGHT_WHEN = { variable: WINDOW_STATE_VAR, ">=": 2 }
    /** Frames to wait for the old song's fade-out before starting the new one. */
    const VARIANT_FADE_FRAMES = 60

    /**
     * A song plus the alternatives that replace it while their condition holds.
     * @typedef {{ when: object|object[], audio: object }} BgmVariant
     * @typedef {{ base: object, variants: BgmVariant[] }} BgmVariantSet
     */

    //---------------------------------------------------------------//
    // Conditions
    //---------------------------------------------------------------//

    /** Comparisons a variable condition can use; several in one condition must all hold. */
    const VARIABLE_TESTS = {
        is: (value, target) => value === target,
        not: (value, target) => value !== target,
        ">": (value, target) => value > target,
        ">=": (value, target) => value >= target,
        "<": (value, target) => value < target,
        "<=": (value, target) => value <= target,
    }

    /**
     * Checks a `when` condition against the current game state.
     * - { "switch": 12 }                  switch 12 is ON
     * - { "switch": 12, "is": false }     switch 12 is OFF
     * - { "variable": 5, ">=": 2 }        variable 5 >= 2 (also is, not, >, <, <=)
     * - { "variable": 5, ">=": 2, "<": 5 } every comparison must hold
     * - [cond, cond]                      every condition must hold
     * @param {object|object[]} when
     * @returns {boolean}
     */
    function conditionsMet(when) {
        return [].concat(when).every((cond) => {
            if (cond.switch !== undefined) {
                const wanted = cond.is === undefined ? true : cond.is
                return $gameSwitches.value(cond.switch) === wanted
            }
            const value = $gameVariables.value(cond.variable)
            return Object.keys(VARIABLE_TESTS).every(
                (op) =>
                    cond[op] === undefined ||
                    VARIABLE_TESTS[op](value, cond[op])
            )
        })
    }

    /**
     * @param {*} when - A `when` value from the rules file.
     * @returns {boolean} true if every condition names a switch, or a variable
     *     with at least one comparison.
     */
    function isValidWhen(when) {
        const conditions = [].concat(when)
        return (
            conditions.length > 0 &&
            conditions.every(
                (cond) =>
                    !!cond &&
                    (typeof cond.switch === "number" ||
                        (typeof cond.variable === "number" &&
                            Object.keys(VARIABLE_TESTS).some(
                                (op) => cond[op] !== undefined
                            )))
            )
        )
    }

    //---------------------------------------------------------------//
    // Active variant set & live crossfade
    //---------------------------------------------------------------//

    /**
     * @param {BgmVariantSet} set
     * @returns {object} The first variant whose condition holds, else the base song.
     */
    function variantSong(set) {
        const variant = set.variants.find((v) => conditionsMet(v.when))
        return variant ? variant.audio : set.base
    }

    // ACTIVE SET -----
    // The last variant set that was played, kept on $gameSystem so it's in
    // save files. The crossfade only acts while one of its songs is the
    // current BGM, so a stale set (after other music took over) is harmless.
    /** @param {BgmVariantSet} set */
    function setActiveVariantSet(set) {
        if ($gameSystem) $gameSystem._variantBgm = set
    }

    /** @returns {BgmVariantSet|null} The active set; converts saves from v1.3 (day/night pairs). */
    function activeVariantSet() {
        const legacy = $gameSystem._dayNightBgm
        if (legacy) {
            setActiveVariantSet({
                base: legacy.day,
                variants: [{ when: NIGHT_WHEN, audio: legacy.night }],
            })
            delete $gameSystem._dayNightBgm
        }
        return $gameSystem._variantBgm || null
    }

    /** Crossfade in progress: the song to start once the fade-out finishes. */
    let variantFade = { frames: 0, song: null }

    const _Scene_Map_update = Scene_Map.prototype.update
    Scene_Map.prototype.update = function () {
        _Scene_Map_update.call(this)
        this.updateVariantBgm()
    }

    /**
     * Crossfades to the right song of the active set when a condition
     * (time of day, switch, variable) changes while another of its songs is
     * playing. Any other music (cutscenes, other maps) is left alone.
     */
    Scene_Map.prototype.updateVariantBgm = function () {
        if (variantFade.frames > 0) {
            if (--variantFade.frames > 0) return
            // Something else started during the fade-out (transfer, event): let it play.
            if (!AudioManager._currentBgm) {
                AudioManager.playBgm(variantFade.song)
                AudioManager.fadeInBgm(1)
            }
            variantFade.song = null
            return
        }

        const set = activeVariantSet()
        const current = AudioManager._currentBgm
        if (!set || !current) return
        const wanted = variantSong(set)
        if (current.name === wanted.name) return
        const songs = [set.base, ...set.variants.map((v) => v.audio)]
        if (!songs.some((song) => song.name === current.name)) return

        AudioManager.fadeOutBgm(1)
        variantFade = { frames: VARIANT_FADE_FRAMES, song: wanted }
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
        const set = {
            base: { name: args.day, ...audio },
            variants: [
                {
                    when: NIGHT_WHEN,
                    audio: { name: args.night || args.day, ...audio },
                },
            ],
        }
        if (args.follow === "true") setActiveVariantSet(set)
        AudioManager.playBgm(variantSong(set))
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
     * - from:        Original song name to replace, or "_battleBgm" for
     *                whatever battle BGM starts a battle (Change Battle BGM
     *                or the database default). A rule naming the song
     *                itself still wins if it's listed first.
     * - to:          Audio fields to use instead. Omitted fields (volume,
     *                pitch, pan) keep the original's values.
     * - variants:    Optional. Songs that play instead of `to` (or the
     *                original if there's no `to`) while their `when`
     *                condition holds: [{ "when": {...}, "name": ... }].
     *                The first variant whose condition holds plays; while
     *                one of the rule's songs plays on the map, it crossfades
     *                when the conditions change. See conditionsMet() for
     *                the `when` format.
     * - night:       Optional. Shorthand for a variant played at night
     *                (variable 122 >= 2), checked after `variants`.
     * - map, event, commonEvent, troop: optional conditions. An omitted
     *   condition matches anything; a number or an array of numbers must
     *   match the current context.
     *     map         - $gameMap.mapId()
     *     event       - ID of the map event running the command. Event IDs
     *                   are per-map, so pair it with `map`. Also matches
     *                   common events that event calls.
     *     commonEvent - ID of the common event running the command.
     *     troop       - Troop ID, during battle (incl. the battle intro).
     *     page        - 1-based page number (as in the editor) of the map
     *                   event or troop running the command. Pair it with
     *                   `map` + `event` or with `troop`. Also matches common
     *                   events that page calls. The battle intro BGM isn't
     *                   played by a page: `"page": 0` targets it (and any
     *                   other song not played from a page).
     *     channel     - 0 for the main BGM, 1+ for a MUSH_Audio_Engine
     *                   channel (its Play BGM and spatial BGM). Omitted =
     *                   the rule applies to both.
     *
     * The first matching rule wins, so list specific rules before general ones.
     * @type {Array<{from: string, to?: object, variants?: object[], night?: object, _variants: BgmVariant[], map?: number|number[], event?: number|number[], commonEvent?: number|number[], troop?: number|number[], page?: number|number[]}>}
     */
    let BGM_REPLACEMENTS = []
    let bgmReplacementsLoaded = false

    /**
     * Songs played when a map event or troop page starts or finishes, even
     * if the page plays no BGM itself (e.g. a talk page whose song carries
     * over into the fight). Loaded from the "pageBgm" array in the same file.
     *
     * - play:  Audio fields of the song to play (volume 90, pitch 100, pan 0
     *          if omitted). Played like a Play BGM from that page, so
     *          replacement rules still apply to it.
     * - at:    "start" (default; before the page's first command) or "end"
     *          (after its last command, or Exit Event Processing).
     * - troop, or map + event: required, which troop/event this is for.
     * - page:  Optional, 1-based page number(s); omitted = any page.
     * - when:  Optional condition, same format as a variant's `when`.
     *
     * The first matching entry plays. A song that's already playing keeps
     * playing without restarting.
     * @type {Array<{play: object, at?: string, map?: number|number[], event?: number|number[], troop?: number|number[], page?: number|number[], when?: object|object[]}>}
     */
    let PAGE_BGM = []

    const CONTEXT_KEYS = [
        "map",
        "event",
        "commonEvent",
        "troop",
        "page",
        "channel",
    ]

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

    /** Requests the rules file; sets BGM_REPLACEMENTS, PAGE_BGM and bgmReplacementsLoaded when done. */
    function loadBgmReplacements() {
        const url = "data/" + BGM_REPLACEMENTS_FILE
        const xhr = new XMLHttpRequest()
        xhr.open("GET", url)
        xhr.overrideMimeType("application/json")
        xhr.onload = () => {
            if (xhr.status < 400) {
                BGM_REPLACEMENTS = parseBgmReplacements(xhr.responseText)
                PAGE_BGM = parsePageBgm(xhr.responseText)
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
            if (isFillerEntry(rule)) return false
            if (!rule || typeof rule.from !== "string") {
                console.warn(
                    `${pluginName}: skipping replacements[${i}], needs "from"`,
                    rule
                )
                return false
            }
            rule._variants = parseVariants(rule, i)
            const valid =
                (!!rule.to && !!rule.to.name) || rule._variants.length > 0
            if (!valid) {
                console.warn(
                    `${pluginName}: skipping replacements[${i}], needs a "to", "night" or "variants" with a "name"`,
                    rule
                )
            }
            return valid
        })
    }

    /**
     * @param {*} entry - An array item from the rules file.
     * @returns {boolean} true for comments (a string or an array of strings)
     *     and empty `{}` placeholders, which are skipped without a warning.
     */
    function isFillerEntry(entry) {
        if (typeof entry === "string") return true
        if (Array.isArray(entry)) {
            return entry.every((line) => typeof line === "string")
        }
        return (
            !!entry &&
            typeof entry === "object" &&
            Object.keys(entry).length === 0
        )
    }

    /**
     * Parses the file's optional "pageBgm" array, dropping (and logging)
     * entries that can't work. JSON errors are already reported by
     * parseBgmReplacements().
     * @param {string} text - Raw file contents.
     * @returns {Array<object>} The valid entries, in file order.
     */
    function parsePageBgm(text) {
        let entries
        try {
            entries = JSON.parse(text).pageBgm
        } catch (e) {
            return []
        }
        if (entries === undefined) return []
        if (!Array.isArray(entries)) {
            console.error(`${pluginName}: "pageBgm" needs to be an array`)
            return []
        }
        return entries.filter((entry, i) => {
            if (isFillerEntry(entry)) return false
            const valid =
                !!entry &&
                !!entry.play &&
                !!entry.play.name &&
                (entry.troop !== undefined || entry.event !== undefined) &&
                [undefined, "start", "end"].includes(entry.at) &&
                (entry.when === undefined || isValidWhen(entry.when))
            if (!valid) {
                console.warn(
                    `${pluginName}: skipping pageBgm[${i}], needs "play" with a "name", a "troop" or "event", "at" of "start"/"end", and a valid "when" if set`,
                    entry
                )
            }
            return valid
        })
    }

    /**
     * Collects a rule's conditional songs: its "variants" in file order, then
     * "night" as a variant for the time of day.
     * @param {object} rule - A rule from the file.
     * @param {number} i - Rule index, for warnings.
     * @returns {Array<{when: object|object[], audio: object}>} Valid variants.
     */
    function parseVariants(rule, i) {
        const variants = []
        for (const variant of [].concat(rule.variants || [])) {
            if (!variant || !variant.name || !isValidWhen(variant.when)) {
                console.warn(
                    `${pluginName}: skipping a variant of replacements[${i}], needs a "name" and a valid "when"`,
                    variant
                )
                continue
            }
            const { when, ...audio } = variant
            variants.push({ when, audio })
        }
        if (rule.night && rule.night.name) {
            variants.push({ when: NIGHT_WHEN, audio: rule.night })
        }
        return variants
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
    /**
     * Tags the interpreter with the common event it's being set up for and
     * the map event/troop page it runs (0 if none).
     */
    Game_Interpreter.prototype.setup = function (list, eventId) {
        _Game_Interpreter_setup.call(this, list, eventId)
        this._commonEventId = pendingCommonEventId
        this._pageNumber = eventPageNumber(list, eventId)
        // Only the interpreter running the page list itself fires pageBgm;
        // called common events inherit _pageNumber below but not this.
        this._ownsPage = this._pageNumber > 0
        pendingCommonEventId = 0
        playPageBgm(this, "start")
    }

    const _Game_Interpreter_terminate = Game_Interpreter.prototype.terminate
    /** Runs when a list finishes (incl. Exit Event Processing): fires "end" pageBgm. */
    Game_Interpreter.prototype.terminate = function () {
        const endsPage = !!this._list && this._ownsPage
        _Game_Interpreter_terminate.call(this)
        if (endsPage) playPageBgm(this, "end")
    }

    const _Game_Interpreter_setupChild = Game_Interpreter.prototype.setupChild
    /** Called common events inherit the calling page, like they inherit the event ID. */
    Game_Interpreter.prototype.setupChild = function (list, eventId) {
        _Game_Interpreter_setupChild.call(this, list, eventId)
        this._childInterpreter._pageNumber = this._pageNumber || 0
    }

    // PAGE LOOKUP -----
    // setup() only receives the page's command list, not its index. Map
    // events and troops hand over the page's own list array, so the page is
    // found by identity. Looked up once at setup: a page switch mid-run
    // (e.g. Control Self Switch) moves _pageIndex but not the running list.
    /**
     * @param {Array<object>} list - Command list passed to setup().
     * @param {number} eventId - Map event ID (0 for troops/common events).
     * @returns {number} 1-based page number as shown in the editor, or 0.
     */
    function eventPageNumber(list, eventId) {
        let pageLists = []
        if (eventId > 0) {
            const event = $gameMap.event(eventId)
            if (event) {
                pageLists = [event.event().pages]
                // TemplateEvent: event() returns the template; original pages can also run.
                if (event.getOriginalPages)
                    pageLists.push(event.getOriginalPages())
            }
        } else if ($gameParty.inBattle()) {
            pageLists = [$gameTroop.troop().pages]
        }
        for (const pages of pageLists) {
            const index = pages.findIndex((page) => page.list === list)
            if (index >= 0) return index + 1
        }
        return 0
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
     * Plays the first matching pageBgm entry for an interpreter's page.
     * @param {Game_Interpreter} interpreter - Interpreter whose page starts/ends.
     * @param {"start"|"end"} at
     */
    function playPageBgm(interpreter, at) {
        if (!interpreter._ownsPage || PAGE_BGM.length === 0) return
        const context = currentBgmContext(interpreter)
        // A page that ends the battle (Abort Battle, last enemy killed) shouldn't start a song.
        if (
            context.troop &&
            (BattleManager.isAborting() || BattleManager.isBattleEnd())
        ) {
            return
        }
        const entry = PAGE_BGM.find(
            (e) =>
                (e.at || "start") === at &&
                ruleMatchesContext(e, context) &&
                (e.when === undefined || conditionsMet(e.when))
        )
        if (!entry) return
        // Played as if from the page, so replacement rules see its context.
        const previous = runningInterpreter
        runningInterpreter = interpreter
        try {
            AudioManager.playBgm({
                volume: 90,
                pitch: 100,
                pan: 0,
                ...entry.play,
            })
        } finally {
            runningInterpreter = previous
        }
    }

    /**
     * Where the BGM is being played from right now.
     * @param {Game_Interpreter|null} [interpreter] - Defaults to the one executing a command.
     * @returns {{ map: number, event: number, commonEvent: number, troop: number, page: number, channel: number }}
     */
    function currentBgmContext(interpreter = runningInterpreter) {
        // The battle BGM starts twice, both before $gameParty.inBattle() is
        // set: during the map's encounter effect (Scene_Battle is the next
        // scene) and again in Scene_Battle.start (unless switch 11).
        const inBattle =
            !!$gameParty &&
            ($gameParty.inBattle() ||
                SceneManager.isNextScene(Scene_Battle) ||
                SceneManager._scene instanceof Scene_Battle)
        return {
            map: $gameMap ? $gameMap.mapId() : 0,
            event: interpreter ? interpreter._eventId : 0,
            commonEvent: interpreter ? interpreter._commonEventId || 0 : 0,
            troop: inBattle && $gameTroop ? $gameTroop._troopId : 0,
            page: interpreter ? interpreter._pageNumber || 0 : 0,
            channel: 0,
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
     * Applies a matched rule. Rules with variants also become the active set.
     * @param {object} rule - A BGM_REPLACEMENTS entry.
     * @param {object} bgm - Audio object about to be played.
     * @returns {object} The audio object to play instead.
     */
    function applyRule(rule, bgm, track = true) {
        const base = rule.to ? { ...bgm, ...rule.to } : bgm
        if (rule._variants.length === 0) return base
        const set = {
            base,
            variants: rule._variants.map((v) => ({
                when: v.when,
                audio: { ...bgm, ...v.audio },
            })),
        }
        if (track) setActiveVariantSet(set)
        return variantSong(set)
    }

    /**
     * @param {object} bgm - Audio object about to be played.
     * @param {number} [channel] - MUSH channel (1+), or 0 for the main BGM.
     *     Only the main BGM's variants crossfade live; a MUSH channel picks
     *     its variant once, when it starts.
     * @returns {object} The replacement audio object, or bgm unchanged.
     */
    function replacementFor(bgm, channel = 0) {
        if (!bgm || !bgm.name) return bgm
        const candidates = BGM_REPLACEMENTS.filter(
            (r) =>
                r.from === bgm.name || (playingBattleBgm && isBattleBgmRule(r))
        )
        if (candidates.length === 0) return bgm
        const context = { ...currentBgmContext(), channel }
        const rule = candidates.find((r) => ruleMatchesContext(r, context))
        return rule ? applyRule(rule, bgm, channel === 0) : bgm
    }

    // BATTLE BGM -----
    // Every battle song (encounter effect, Scene_Battle.start, battle test)
    // goes through BattleManager.playBattleBgm, whatever $gameSystem's battle
    // BGM currently is. While it runs, `"from": "_battleBgm"` rules apply.
    /** Name for `from` that matches whatever battle BGM is playing (any case). */
    const BATTLE_BGM_FROM = "_battleBgm"
    let playingBattleBgm = false

    /** @param {object} rule - A BGM_REPLACEMENTS entry. */
    function isBattleBgmRule(rule) {
        return rule.from.toLowerCase() === BATTLE_BGM_FROM.toLowerCase()
    }

    const _BattleManager_playBattleBgm = BattleManager.playBattleBgm
    BattleManager.playBattleBgm = function () {
        playingBattleBgm = true
        try {
            _BattleManager_playBattleBgm.call(this)
        } finally {
            playingBattleBgm = false
        }
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

    //---------------------------------------------------------------//
    // MUSH_Audio_Engine channel BGM
    //---------------------------------------------------------------//

    // MUSH CHANNELS -----
    // MUSH plays extra BGMs on numbered channels (1+) next to the main BGM,
    // through AudioManager.playMushBgm: its "Play BGM" command, spatial BGMs
    // and save loading. Same rules as the main BGM; `"channel"` tells them
    // apart (0 = main BGM). Saves store the playing (replaced) name, so a
    // loaded channel isn't swapped again.
    if (AudioManager.playMushBgm) {
        const _AudioManager_playMushBgm = AudioManager.playMushBgm
        AudioManager.playMushBgm = function (bgm, channel, ...rest) {
            const replaced = replacementFor(bgm, Number(channel))
            _AudioManager_playMushBgm.call(this, replaced, channel, ...rest)
        }

        // SPATIAL BGM -----
        // The spatial source object, not the played audio, is what MUSH keeps:
        // every player step re-applies its pitch/volume, and saves store it.
        // So the swap happens on the object before it's tracked, and the
        // AddSpacialBgm command then plays the already-replaced filename.
        // A rule's `to.volume` becomes the source's max volume (at its center).
        const _Game_Player_addSpacialBGM = Game_Player.prototype.addSpacialBGM
        Game_Player.prototype.addSpacialBGM = function (obj) {
            const original = {
                name: obj.filename,
                pitch: obj.pitch,
                volume: obj.maxVolume,
                pan: 0,
            }
            const replaced = replacementFor(original, Number(obj.channel))
            if (replaced !== original) {
                obj.filename = replaced.name
                obj.pitch = replaced.pitch
                obj.maxVolume = replaced.volume
            }
            _Game_Player_addSpacialBGM.call(this, obj)
        }
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
                        [r.to, ...r._variants.map((v) => v.audio)].some(
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
