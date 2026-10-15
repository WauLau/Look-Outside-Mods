/*:
 * @target MZ
 * @author WauLau (based on GBCCoffee_StateTooltips by coffeenahc, https://coffeenahc.itch.io/)
 * @plugindesc (v3.0) Enables fully integrated tooltips for the game "Look Outside".
 *
 * @help
 * ======================================================================================
 *
 * Fully integrated tooltips for states, buffs, items, weapons, armor and
 * skills. Based on GBCCoffee_StateTooltips by coffeenahc
 * (https://coffeenahc.itch.io/) - attribution required per the original
 * plugin's free-tier terms of use.
 *
 * All hand-written tooltip text lives in data/WauLau_TooltipData.json, a file
 * only this plugin reads, so it never conflicts with other mods that edit the
 * database files.
 *
 * ======================================================================================
 * HOW TO USE
 * ======================================================================================
 *
 * 1.) States:
 * Hovering a battler's state icons (battle, party menu, status screen) shows
 * every state on that battler. Each state's text comes from the "states"
 * section of WauLau_TooltipData.json:
 *   "states": {
 *       "<stateId>": {
 *           "name": "Poison",              (editor label only)
 *           "text": ["line 1", "line 2"]   (one string per line)
 *       }
 *   }
 * A state with no entry shows just its icon and name. An entry with a "hide"
 * key is left out of the tooltip entirely.
 *
 * 2.) Weapons, armor, items and skills:
 * Hovering a row in the item, equip, skill, shop or battle action lists shows
 * a tooltip built automatically from the database: stats and traits, damage
 * and targets, recovery, inflicted/cured states, costs (HP, ammo, items),
 * break chance, granted skills, and more. Extra hand-written lines can be
 * added per entry in the "weapons", "armors", "items" and "skills" sections:
 *   "armors": {
 *       "<armorId>": {
 *           "_name": "Eyeball Hat",        (keys starting with "_" are ignored)
 *           "Label": ["line 1", "line 2"]  (any other key is shown, in order)
 *       }
 *   }
 * In battle, the Attack command has an icon on its right edge: hovering it
 * shows the actor's current attack skill.
 *
 * 3.) Gamepad:
 * Any gamepad button bound to "menu" or "menu/cancel" (gamepad Y by default)
 * shows and hides tooltips. Keyboard players use mouse hover - Esc/X stay
 * plain cancel keys and never toggle tooltips.
 *   - If an item/equip/skill/shop list has the cursor, it shows the tooltip
 *     for that row only. Moving to another row closes it.
 *   - Otherwise, it cycles through every state-bearing battler on screen,
 *     stepped with the Prev/Next buttons (plugin parameters below).
 * It turns itself off as soon as whatever it was showing leaves the screen.
 *
 * 4.) Dialogue shops:
 * Shops that sell through map events instead of the Shop scene (Eugene's,
 * common event 46, and Mutt's, common event 291) show the item's stat block in
 * a window in the bottom-left while the Buy dialogue runs. The message window
 * moves to the right of it and re-wraps its text to fit.
 *
 * ======================================================================================
 * ESCAPE CODES
 * ======================================================================================
 *
 * Usable inside any tooltip text (state text and the JSON extra lines):
 *   \C[x]           - text color (0-31)
 *   \I[x]           - icon, scaled to the current font size
 *   \TR / \TRT      - a state's remaining turns / "X turns remaining"
 *   \SR / \SRT      - a state's remaining steps / "X steps remaining"
 *   \B[1] / \B[0]   - bold sub-label on / off
 *   \BS[1] / \BS[0] - bold stat value on / off
 *   \BSD[1]/\BSD[0] - bold damage value on / off
 *   \IT[1] / \IT[0] - italic on / off
 *   \LB[1] / \LB[0] - section label on / off (slightly larger)
 *   \ST[1] / \ST[0] - subtitle on / off
 *   \TI[1] / \TI[0] - title on / off
 *   \DE[1] / \DE[0] - description text on / off (small italic)
 *   \>              - right-align the rest of the line, e.g. "Bleed\>15%"
 *   \JU             - start of a ", "-separated list, e.g.
 *                     "\B[1]Immune To:\B[0] \JU Poison, Blind, Sleep". If the
 *                     list doesn't fit on one line, the label moves to its own
 *                     line and the list wraps item by item, spread evenly
 *                     across the full width.
 *   {expression}    - math on the tooltip's battler, printed as a stat value,
 *                     e.g. {maxhp * 0.1}
 *
 * Stat names inside { } expressions (case-insensitive):
 *   hp, health                         - current HP
 *   maxhp, mhp                         - max HP
 *   mp, stamina, stm                   - current Stamina (MP)
 *   maxmp, maxstamina, maxstm, mstm    - max Stamina (MP)
 *   tp, ammo, currentammo              - current Ammo (TP)
 *   maxtp, maxammo                     - max Ammo (TP)
 *   atk                                - Attack
 *   def                                - Defense
 *   matk, ballistics, batk             - Ballistics (M.Atk)
 *   mdef, bulldefense, bdef            - Bull.Defense (M.Def)
 *   agi                                - Agility
 *   luk, lck, luck                     - Luck
 *   level, lv, lvl                     - Level (0 for enemies, which have no level)
 *   hit, hitrate                       - Hit rate (0-100 points, not the raw 0-1 ratio)
 *   eva, evasion                       - Evasion rate (0-100 points)
 *   cri, critrate                      - Critical rate (0-100 points)
 *   cev, critevasion                   - Critical evasion rate (0-100 points)
 *
 * An expression that isn't valid math, or uses an unknown stat name, prints
 * as "?" and logs a console warning with the offending text.
 *
 * @param enemyPercentOnly
 * @text Enemy Tooltips: Percent Only
 * @desc If ON, {expr} on an enemy only shows a % (from a "stat * 0.05" style multiplier) instead of the real computed number, to avoid leaking enemy stats.
 * @type boolean
 * @default true
 *
 * @param gamepadPrevButton
 * @text Gamepad Previous Button Index
 * @desc Standard Gamepad API button index that selects the previous battler while browsing state/buff tooltips. Unused while an item list has the tooltip instead (its own cursor handles that). Default 6 = Left Trigger.
 * @type number
 * @min 0
 * @max 17
 * @default 6
 *
 * @param gamepadNextButton
 * @text Gamepad Next Button Index
 * @desc Standard Gamepad API button index that selects the next battler while browsing state/buff tooltips. Unused while an item list has the tooltip instead (its own cursor handles that). Default 7 = Right Trigger.
 * @type number
 * @min 0
 * @max 17
 * @default 7
 */

var $tooltipData = null
DataManager.loadDataFile("$tooltipData", "WauLau_TooltipData.json")

;(() => {
    "use strict"

    //============================================================================//
    //                              PLUGIN SETUP                                  //
    //============================================================================//

    // PLUGIN NAME -----
    // Must match this file's registered name in plugins.js (its filename).
    const pluginName = "WauLau_LookAtTooltips"
    const params = PluginManager.parameters(pluginName)

    /** Offset of a cursor-following tooltip from the mouse position. */
    const TOOLTIP_CURSOR_OFFSET_X = 0
    const TOOLTIP_CURSOR_OFFSET_Y = 0

    /** Decimal places for evaluated {expression} values. */
    const decimalPlaces = 0

    const enemyPercentOnly = params.enemyPercentOnly !== "false"
    const maxTooltipWidth = 500
    const maxBattleItemTooltipWidth = 600
    const maxShopInfoWidth = 204

    // ------------------------ESCAPE CHARACTER VARIABLES------------------------//
    // FAKE BOLD -----
    // The loaded custom font only registers a "normal" weight, so a plain
    // fontBold request has no bold face to fall back on. Bold is faked with
    // a heavier outline instead, set in processEscapeCharacter at the same
    // time as fontBold/color, so the engine's own _drawTextOutline picks it up.
    const BOLD_OUTLINE_WIDTH = 3
    const NORMAL_OUTLINE_WIDTH = 1
    const NORMAL_SPACING_WIDTH = "0px"
    const BOLD_SPACING_WIDTH = "2px"
    const NORMAL_OUTLINE_COLOR = "rgba(0, 0, 0, 0)"

    const TEXT_SIZE_NORMAL = 16
    const TEXT_SIZE_BOLD = 14
    const TEXT_SIZE_LABEL = 17
    const TEXT_SIZE_SUBTITLE = 19
    const TEXT_SIZE_TITLE = 21
    const TEXT_SIZE_DESCRIPTION = 14
    /** Pixels taken off the gap between tooltip lines (see calcTextHeight). */
    const TOOLTIP_LINE_SPACING_TRIM = 4
    /** Pixels every tooltip line is inset from the contents' left edge, so outlines (bold especially) aren't clipped (see renderEntries). */
    const TOOLTIP_LEFT_PADDING = 6

    /** Font size added on top of every TEXT_SIZE_* in the dialogue shop window. */
    const shopFontOffset = 3

    // COLORS -----
    // Each is either a windowskin index (0-31, like \C[n]) or a "#rrggbb"
    // string - resolveTextColor turns either into a CSS color at draw time,
    // since the windowskin isn't loaded yet when this file runs.
    // textColor must stay an index: \C[${textColor}] strings are built from it.
    const textColor = 0
    const titleColor = 10
    const descColor = 26
    const subtitleColor = 18
    const baseColor = "#dee7f3"
    const statColor = "#bfd2fb"
    const statDmgColor = 8
    const statDmgOutlineColor = 10
    const boldOutlineColor = 12
    const labelOutlineColor = boldOutlineColor
    /** Windowskin index -> hex color cache (see hexColorMapManager). @type {Map<number, string>} */
    const M_hexColorMap = new Map()

    // Registers new gamepad symbols on buttons 6/7 (triggers), which the
    // engine's own Input.gamepadMapper leaves unused. Configurable via plugin
    // parameters only, not through an in-game rebind menu. The show/hide
    // button is the existing "menu" symbol, gamepad only (see GAMEPAD-ONLY
    // TOGGLE).
    Input.gamepadMapper[Number(params.gamepadPrevButton || 6)] = "TooltipPrev"
    Input.gamepadMapper[Number(params.gamepadNextButton || 7)] = "TooltipNext"

    /**
     * @param {RPG.State} state - database state object
     * @returns {object|undefined} the state's entry in $tooltipData.states, if any
     */
    function stateTooltipEntry(state) {
        return (
            $tooltipData && $tooltipData.states && $tooltipData.states[state.id]
        )
    }

    /**
     * A state whose JSON entry has a "hide" key is left out of tooltips
     * entirely (no name header either).
     * @param {RPG.State} state - database state object
     * @returns {boolean}
     */
    function isStateTooltipHidden(state) {
        const entry = stateTooltipEntry(state)
        return !!entry && Object.hasOwn(entry, "hide")
    }

    /**
     * Builds the tooltip text for a state from data/WauLau_TooltipData.json.
     * @param {RPG.State} state - database state object
     * @param {Game_Battler} battler - battler the tooltip is being shown for
     * @returns {string|null} formatted tooltip text, or null if the state has no JSON entry
     */
    function stateTooltipText(state, battler) {
        const entry = stateTooltipEntry(state)
        if (!entry || !entry.text) return null
        const rawText =
            Array.isArray(entry.text) ? entry.text.join("\n") : entry.text
        // {expression}s are resolved on the body only, before the name
        // header is attached.
        const text = evaluateTooltipExpressions(battler, rawText)
        return `\\ST[1]${state.name}\\ST[0]\\I[${state.iconIndex}]\\C[${textColor}]\n${text}`
    }

    const statAliases = {
        hp: (battler) => battler.hp,
        health: (battler) => battler.hp,
        maxhp: (battler) => battler.mhp,
        mhp: (battler) => battler.mhp,
        mp: (battler) => battler.mp,
        stamina: (battler) => battler.mp,
        stm: (battler) => battler.mp,
        maxmp: (battler) => battler.mmp,
        maxstamina: (battler) => battler.mmp,
        maxstm: (battler) => battler.mmp,
        mstm: (battler) => battler.mmp,
        tp: (battler) => battler.tp,
        ammo: (battler) => battler.tp,
        currentammo: (battler) => battler.tp,
        maxtp: (battler) => (battler.maxTp ? battler.maxTp() : 100),
        maxammo: (battler) => (battler.maxTp ? battler.maxTp() : 100),
        atk: (battler) => battler.atk,
        def: (battler) => battler.def,
        matk: (battler) => battler.mat,
        ballistics: (battler) => battler.mat,
        batk: (battler) => battler.mat,
        mdef: (battler) => battler.mdf,
        bulldefense: (battler) => battler.mdf,
        bdef: (battler) => battler.mdf,
        agi: (battler) => battler.agi,
        lck: (battler) => battler.luk,
        luk: (battler) => battler.luk,
        luck: (battler) => battler.luk,
        // hit/eva/cri/cev are 0-1 ratios internally; scaled to 0-100 points here
        // so formulas like {hit * 0.5} read as plain percentages.
        hit: (battler) => battler.hit * 100,
        hitrate: (battler) => battler.hit * 100,
        eva: (battler) => battler.eva * 100,
        evasion: (battler) => battler.eva * 100,
        cri: (battler) => battler.cri * 100,
        critrate: (battler) => battler.cri * 100,
        cev: (battler) => battler.cev * 100,
        critevasion: (battler) => battler.cev * 100,
        level: (battler) =>
            typeof battler.level === "number" ? battler.level : 0,
        lv: (battler) =>
            typeof battler.level === "number" ? battler.level : 0,
        lvl: (battler) =>
            typeof battler.level === "number" ? battler.level : 0,
    }

    const aliasNames = Object.keys(statAliases).sort(
        (a, b) => b.length - a.length
    )

    function resolveExpression(battler, expr) {
        let resolved = expr
        for (const name of aliasNames) {
            const regex = new RegExp(`\\b${name}\\b`, "gi")
            resolved = resolved.replace(regex, () => statAliases[name](battler))
        }
        return resolved
    }

    /** @param {Game_Battler} battler @returns {boolean} */
    function isEnemyBattler(battler) {
        return !!(battler.isEnemy && battler.isEnemy())
    }

    /**
     * Converts a "statName * 0.05" style expression into a percent string,
     * without evaluating the stat itself - used to keep enemy stats hidden
     * when Enemy Tooltips: Percent Only is on.
     * @param {string} expr - raw expression text, before stat names are resolved
     * @returns {string|null} formatted percent, or null if expr isn't that shape
     */
    function enemyPercentExpression(expr) {
        const match = expr
            .trim()
            .match(/^[a-zA-Z_]+\s*\*\s*([+-]?[0-9]*\.?[0-9]+)$/)
        if (!match) return null
        const percent = parseFloat(match[1]) * 100
        return `${percent.toFixed(decimalPlaces)}%`
    }

    /**
     * Replaces every {expression} in a tooltip's text with its evaluated,
     * colored result. Invalid expressions print as "?" and log a warning.
     * @param {Game_Battler} battler - battler the tooltip is being shown for
     * @param {string} text - raw text containing zero or more {expression} spans
     * @returns {string}
     */
    function evaluateTooltipExpressions(battler, text) {
        return text.replace(/\{([^{}]+)\}/g, (_, expr) => {
            try {
                if (enemyPercentOnly && isEnemyBattler(battler)) {
                    const percentText = enemyPercentExpression(expr)
                    if (percentText === null) {
                        throw new Error(
                            `Enemy Tooltips: Percent Only is ON, but "${expr}" isn't a simple "stat * number" expression, so it can't be converted to a percent - reword this entry`
                        )
                    }
                    return `\\BS[1]${percentText}\\BS[0]`
                }

                const resolved = resolveExpression(battler, expr)
                if (!/^[0-9+\-*/().\s]+$/.test(resolved)) {
                    throw new Error(
                        `Unrecognized stat name in expression: ${expr}`
                    )
                }
                const value = Function(`"use strict"; return (${resolved});`)()
                if (typeof value !== "number" || Number.isNaN(value)) {
                    throw new Error(
                        `Expression did not evaluate to a number: ${expr}`
                    )
                }
                return `\\BS[1]${value.toFixed(decimalPlaces)}\\BS[0]`
            } catch (e) {
                console.warn(
                    `${pluginName}: Failed to evaluate tooltip expression "{${expr}}" - ${e.message}`
                )
                return "?"
            }
        })
    }

    //============================================================================//
    //                        GAMEPAD TOOLTIP BROWSING                            //
    //============================================================================//

    // Shared state for gamepad-driven tooltip browsing. Only one scene is ever
    // active at a time, so a single object is fine - reset whenever a scene
    // that supports tooltips is (re)created.
    //
    // mode: 'battler' cycles state/buff icons by hand with Prev/Next;
    // 'item' shows the one row an item/equip/shop list's cursor was on
    // when the button was pressed.
    const gamepadTooltip = {
        active: false,
        mode: null,
        battlers: [],
        index: 0,
        itemWindow: null,
        /** List row the item tooltip was opened for; leaving it closes the tooltip. */
        row: -1,
        // Kept separate from the mouse-hover system's this._tooltipHoveredItem
        // (see updateGamepadItemTooltip/updateItemTooltipHover below) so mouse
        // and gamepad tracking can't overwrite each other's selection.
        lastItem: null,
    }

    function resetGamepadTooltip() {
        gamepadTooltip.active = false
        gamepadTooltip.mode = null
        gamepadTooltip.itemWindow = null
        gamepadTooltip.row = -1
        gamepadTooltip.lastItem = null
    }

    //--------------------------GAMEPAD-ONLY TOGGLE---------------------------//
    // The toggle is whatever Input.isTriggered("menu") accepts: buttons mapped
    // to "menu", and - since the engine treats "menu" as escape-compatible -
    // buttons mapped to "escape" (Mano_InputConfig's "menu/cancel"). On the
    // keyboard those same symbols are Esc/X/Insert/Numpad 0, which already
    // mean cancel, and keyboard players get mouse hover only. So the toggle
    // counts a press only when it came from a gamepad button mapped to one of
    // TOGGLE_SYMBOLS (read from gamepadMapper at press time, so rebinds apply).

    /** Gamepad symbols that toggle tooltips - the ones that trigger "menu". */
    const TOGGLE_SYMBOLS = ["menu", "escape"]

    /** True for the one frame a gamepad toggle button went down. */
    let gamepadMenuTriggered = false

    const _Input_update = Input.update
    Input.update = function () {
        gamepadMenuTriggered = false
        _Input_update.call(this)
    }

    const _Input_updateGamepadState = Input._updateGamepadState
    /** Flags a fresh press of any gamepad button mapped to a TOGGLE_SYMBOLS symbol. */
    Input._updateGamepadState = function (gamepad) {
        const lastState = this._gamepadStates[gamepad.index] || []
        _Input_updateGamepadState.call(this, gamepad)
        const newState = this._gamepadStates[gamepad.index] || []
        for (let i = 0; i < newState.length; i++) {
            if (
                newState[i] &&
                !lastState[i] &&
                TOGGLE_SYMBOLS.includes(this.gamepadMapper[i])
            ) {
                gamepadMenuTriggered = true
            }
        }
    }

    //---------------------------MOUSE OWNERSHIP------------------------------//
    // TouchInput.x/y is only the last place the mouse was seen - it never
    // expires, and TouchInput.clear() (on window focus loss) resets it to
    // 0,0. Hit-testing it unconditionally makes a resting or stale cursor
    // "hover" rows/icons while playing on gamepad or keyboard.
    // So hover is only honored while the mouse owns input: it takes over on
    // a real move (new position), click, or wheel, and loses it on any new
    // keyboard/gamepad press or a focus loss. Global across scenes, so a
    // menu opened by gamepad starts with mouse hover off.

    let mouseInUse = false
    let lastMouseX = -1
    let lastMouseY = -1

    /** @returns {boolean} true while the mouse (not keyboard/gamepad) is driving hover. */
    function isMouseInUse() {
        return mouseInUse
    }

    /** Per-frame, right after input polling: decides who owns hover this frame. */
    function updateMouseOwnership() {
        // SYNTHETIC MOVES -----
        // Chromium can fire mousemove without the cursor moving, so a
        // hover only counts if the position actually changed.
        const moved =
            (TouchInput.isMoved() || TouchInput.isHovered()) &&
            (TouchInput.x !== lastMouseX || TouchInput.y !== lastMouseY)
        lastMouseX = TouchInput.x
        lastMouseY = TouchInput.y
        if (
            moved ||
            TouchInput.isTriggered() ||
            TouchInput.isCancelled() ||
            TouchInput.wheelY !== 0
        ) {
            mouseInUse = true
        } else if (Input._latestButton && Input._pressedTime === 0) {
            mouseInUse = false
        }
    }

    const _SceneManager_updateInputData = SceneManager.updateInputData
    SceneManager.updateInputData = function () {
        _SceneManager_updateInputData.call(this)
        updateMouseOwnership()
    }

    const _TouchInput_clear = TouchInput.clear
    /** Focus loss resets the cursor to 0,0 - that position is never a real hover. */
    TouchInput.clear = function () {
        _TouchInput_clear.call(this)
        mouseInUse = false
    }

    //============================================================================//
    //                   TOOLTIP ANCHOR / WINDOW LOOKUP HELPERS                   //
    //============================================================================//

    /**
     * Checks whether a window is currently on screen and open, so a stale
     * reference can't keep a tooltip anchored to something that's been hidden.
     * @param {Window_Base} win
     * @returns {boolean}
     */
    function isWindowUsableForTooltip(win) {
        if (!win.visible) return false
        if (win.isOpen && !win.isOpen()) return false
        return true
    }

    // Actor icons come from two rendering strategies depending on the window:
    //   - Window_MenuStatus/Window_Status draw icons straight onto their own
    //     bitmap (see Window_StatusBase.prototype.drawActorIcons below),
    //     tracked via _tooltipIconRects.
    //   - Window_BattleStatus instead creates a real Sprite_StateIcon per
    //     actor (the same class enemies use), stored in that window's
    //     _additionalSprites under "actor<id>-stateIcon".
    // Enemies always use the sprite route via the spriteset.
    /**
     * Finds the Sprite_StateIcon currently showing a battler's icon, if any.
     * @param {Scene_Base} scene
     * @param {Game_Battler} battler
     * @returns {Sprite_StateIcon|null}
     */
    function findStateIconSprite(scene, battler) {
        if (
            scene instanceof Scene_Battle &&
            battler.isEnemy &&
            battler.isEnemy()
        ) {
            const spriteset = scene._spriteset
            const enemySprites = spriteset && spriteset._enemySprites
            const enemySprite =
                enemySprites && enemySprites.find((s) => s._battler === battler)
            return (enemySprite && enemySprite._stateIconSprite) || null
        }
        if (battler.isActor && battler.isActor()) {
            const layer = scene._windowLayer
            if (!layer) return null
            const key = `actor${battler.actorId()}-stateIcon`
            for (const child of layer.children) {
                if (
                    child instanceof Window_StatusBase &&
                    child._additionalSprites &&
                    child._additionalSprites[key] instanceof Sprite_StateIcon &&
                    isWindowUsableForTooltip(child)
                ) {
                    return child._additionalSprites[key]
                }
            }
        }
        return null
    }

    /**
     * Lists every battler with a tooltip currently available on screen: in
     * menus, anyone recorded in a window's _tooltipIconRects or shown via a
     * Sprite_StateIcon; in battle, every party/troop member with an active icon.
     * @param {Scene_Base} scene
     * @returns {Game_Battler[]}
     */
    function collectTooltipBattlers(scene) {
        if (scene instanceof Scene_Battle) {
            return $gameParty
                .battleMembers()
                .concat($gameTroop.members())
                .filter(
                    (b) =>
                        b.allIcons().length > 0 &&
                        battlerTooltipStillValid(scene, b)
                )
        }
        const battlers = []
        const seen = new Set()
        const layer = scene._windowLayer
        if (layer) {
            for (const child of layer.children) {
                if (
                    !(child instanceof Window_StatusBase) ||
                    !isWindowUsableForTooltip(child)
                ) {
                    continue
                }
                if (child._tooltipIconRects) {
                    for (const rects of Object.values(
                        child._tooltipIconRects
                    )) {
                        for (const rect of rects) {
                            if (
                                !seen.has(rect.battler) &&
                                rect.battler.allIcons().length > 0
                            ) {
                                seen.add(rect.battler)
                                battlers.push(rect.battler)
                            }
                        }
                    }
                }
                if (child._additionalSprites) {
                    for (const sprite of Object.values(
                        child._additionalSprites
                    )) {
                        if (
                            sprite instanceof Sprite_StateIcon &&
                            sprite._battler &&
                            !seen.has(sprite._battler) &&
                            sprite._battler.allIcons().length > 0
                        ) {
                            seen.add(sprite._battler)
                            battlers.push(sprite._battler)
                        }
                    }
                }
            }
        }
        return battlers
    }

    /**
     * Per-frame validity gate for gamepad battler browsing: true only while
     * the battler's icon is still being shown by something currently on screen.
     * @param {Scene_Base} scene
     * @param {Game_Battler} battler
     * @returns {boolean}
     */
    function battlerTooltipStillValid(scene, battler) {
        if (!battler) return false
        // In battle, dead and hidden (not yet appeared) battlers are skipped.
        // isAlive() covers both: it's isAppeared() && !isDeathStateAffected().
        if (
            scene instanceof Scene_Battle &&
            !battler.isActor() &&
            !battler.isAlive()
        )
            return false
        const iconSprite = findStateIconSprite(scene, battler)
        if (iconSprite) return iconSprite.visible !== false
        const layer = scene._windowLayer
        if (!layer) return false
        const actorId =
            battler.isActor && battler.isActor() ? battler.actorId() : null
        for (const child of layer.children) {
            if (child instanceof Window_StatusBase && child._tooltipIconRects) {
                const rects = child._tooltipIconRects[actorId]
                if (rects && rects[0]) {
                    return isWindowUsableForTooltip(child)
                }
            }
        }
        return false
    }

    /**
     * Screen position (plus size, for flipping above/below) to anchor a
     * battler's tooltip to, mirroring where mouse hover would point.
     * @param {Scene_Base} scene
     * @param {Game_Battler} battler
     * @returns {{x:number,y:number,width:number,height:number}|null} null if no anchor was found
     */
    function anchorPositionFor(scene, battler) {
        const iconSprite = findStateIconSprite(scene, battler)
        if (iconSprite) {
            const point = iconSprite.worldTransform.apply(new Point(0, 0))
            return {
                x: point.x,
                y: point.y,
                width: iconSprite.width,
                height: iconSprite.height,
            }
        }
        const layer = scene._windowLayer
        if (layer) {
            const actorId =
                battler.isActor && battler.isActor() ? battler.actorId() : null
            for (const child of layer.children) {
                if (
                    child instanceof Window_StatusBase &&
                    child._tooltipIconRects &&
                    isWindowUsableForTooltip(child)
                ) {
                    const rects = child._tooltipIconRects[actorId]
                    if (rects && rects[0] && child._contentsSprite) {
                        const point =
                            child._contentsSprite.worldTransform.apply(
                                new Point(rects[0].x, rects[0].y)
                            )
                        return {
                            x: point.x,
                            y: point.y,
                            width: rects[0].width,
                            height: rects[0].height,
                        }
                    }
                }
            }
        }
        return null
    }

    //============================================================================//
    //                     SCENE TOOLTIP SUPPORT INSTALLATION                     //
    //============================================================================//
    // Shared implementation for both Scene_Battle and Scene_MenuBase (Scene_Menu,
    // Scene_Item, Scene_Skill, Scene_Equip etc. all inherit from the latter).
    // Each function below is attached to both prototypes directly further down,
    // so "Go to Definition"/"Find References" on this.foo() calls resolve to a
    // real prototype member instead of a dynamically-assigned property.

    /**
     * Creates this scene's tooltip window (hidden by default) and resets
     * gamepad-browsing state for it.
     * @param {Scene_Base} scene
     */
    function createTooltipWindow(scene) {
        scene._stateTooltip = new Window_StateTooltip()
        scene.addChild(scene._stateTooltip)
        resetGamepadTooltip()
        // Party portraits load up front, so a battler tooltip's header
        // portrait is usually ready the first time it's drawn.
        for (const actor of $gameParty.members()) {
            if (actor.faceName()) ImageManager.loadFace(actor.faceName())
        }
    }

    /**
     * Shows a battler's state/buff tooltip. If a tooltip for something else
     * is still up, that one fully closes first and this battler opens after
     * (see {@link updateTooltipSwap}).
     * @param {Scene_Base} scene
     * @param {Game_Battler} battler
     * @returns {boolean} true if shown now, false if queued behind a close
     */
    function showTooltip(scene, battler) {
        const tooltip = scene._stateTooltip
        // SWAP -----
        // openness > 0, not isOpen(): a tooltip that's still opening has to
        // close too. The same battler while closing just reopens in place.
        const showingOther =
            scene._tooltipItemMode || tooltip._battler !== battler
        if (tooltip.openness > 0 && showingOther) {
            hideTooltip(scene)
            scene._tooltipSwapBattler = battler
            // Hands the tooltip over from the item system now, so its own
            // "nothing hovered" check can't hide it and cancel this swap.
            scene._tooltipItemMode = false
            scene._tooltipHoveredItem = null
            return false
        }

        // allMembers(), not members(): in battle members() is only the
        // battle members, and a reserve actor is still a party member.
        if ($gameParty.allMembers().includes(battler)) {
            tooltip.frontSpriteHue = -104
            tooltip.backSpriteHue = -34
            tooltip.backSpriteOpacity = 120
        } else {
            tooltip.frontSpriteHue = 0
            tooltip.backSpriteHue = -105
            tooltip.backSpriteOpacity = 185
        }
        tooltip.backOpacity = 255

        scene._tooltipSwapBattler = null
        // Undoes a wider battle item width (see showItemTooltip).
        tooltip._maxTextWidth = maxTooltipWidth
        tooltip.setup(battler)
        scene._stateTooltip.visible = true
        scene._stateTooltip.tooltipActive = true
        scene._tooltipItemMode = false
        scene._tooltipHoveredItem = null

        // Re-adding an already-added child moves it to the front of the
        // render order, so the tooltip draws above any window created after it.
        scene.addChild(scene._stateTooltip)
        return true
    }

    /**
     * Closes the tooltip and cancels a queued battler swap.
     * @param {Scene_Base} scene
     */
    function hideTooltip(scene) {
        scene._stateTooltip.close()
        scene._stateTooltip.tooltipActive = false
        scene._tooltipSwapBattler = null
    }

    /**
     * Per-frame: opens a battler queued by {@link showTooltip} once the
     * previous tooltip has fully closed, anchoring it for gamepad browsing
     * (mouse tooltips follow the cursor on their own).
     * @param {Scene_Base} scene
     */
    function updateTooltipSwap(scene) {
        const battler = scene._tooltipSwapBattler
        if (!battler || scene._stateTooltip.openness > 0) return
        showTooltip(scene, battler)
        if (gamepadTooltip.active && gamepadTooltip.mode === "battler") {
            positionTooltipAt(scene, anchorPositionFor(scene, battler))
        }
    }

    /**
     * Shows a weapon/armor/item tooltip.
     * @param {Scene_Base} scene
     * @param {RPG.BaseItem} item
     */
    function showItemTooltip(scene, item) {
        scene._tooltipSwapBattler = null
        // Set before setupItem, which wraps the text to it. Battle's
        // item/skill tooltips sit above the action list, so they get more room.
        scene._stateTooltip._maxTextWidth =
            scene instanceof Scene_Battle ?
                maxBattleItemTooltipWidth
            :   maxTooltipWidth
        scene._stateTooltip.setupItem(item, scene, "Tooltip")
        scene._stateTooltip.visible = true
        scene._stateTooltip.tooltipActive = true
        scene._stateTooltip.backOpacity = 255
        scene._stateTooltip.frontSpriteHue = -10
        scene._stateTooltip.backSpriteHue = 64
        scene._stateTooltip.backSpriteOpacity = 195
        scene._tooltipItemMode = true
        scene.addChild(scene._stateTooltip)
    }

    /** Turns gamepad tooltip browsing off and hides the tooltip. @param {Scene_Base} scene */
    function deactivateGamepadTooltip(scene) {
        resetGamepadTooltip()
        scene._tooltipItemMode = false
        scene._tooltipHoveredItem = null
        hideTooltip(scene)
    }

    const TOOLTIP_ANCHOR_GAP_Y = 4
    const TOOLTIP_ANCHOR_GAP_X = -2
    /**
     * Positions the tooltip window just below an anchor rect, flipping
     * above it when there isn't enough room, or centering it on screen
     * when no anchor was found.
     * @param {Scene_Base} scene
     * @param {{x:number,y:number,width:number,height:number}|null} anchor
     */
    function positionTooltipAt(scene, anchor) {
        const tw = scene._stateTooltip.width
        const th = scene._stateTooltip.height

        let x, y
        if (anchor) {
            x = anchor.x + TOOLTIP_ANCHOR_GAP_X

            // FLIP ABOVE/BELOW -----
            const below = anchor.y + (anchor.height || 0) - TOOLTIP_ANCHOR_GAP_Y
            const above = anchor.y + TOOLTIP_ANCHOR_GAP_Y - th
            if (below + th <= Graphics.boxHeight) {
                y = below
            } else if (above >= 0) {
                y = above
            } else {
                // Neither side fully fits - clamp to whichever is closest.
                y =
                    (
                        Math.abs(Graphics.boxHeight - (below + th)) >
                        Math.abs(above)
                    ) ?
                        above
                    :   below
            }
        } else {
            x = (Graphics.boxWidth - tw) / 2
            y = (Graphics.boxHeight - th) / 2
        }

        scene._stateTooltip.x = Math.max(0, Math.min(x, Graphics.boxWidth - tw))
        scene._stateTooltip.y = Math.max(
            0,
            Math.min(y, Graphics.boxHeight - th)
        )
    }

    /**
     * Shows and anchors the tooltip for whichever battler gamepadTooltip.index
     * currently points at.
     * @param {Scene_Base} scene
     */
    function selectGamepadTooltipBattler(scene) {
        const battler = gamepadTooltip.battlers[gamepadTooltip.index]
        // A queued swap is anchored by updateTooltipSwap once it opens;
        // until then the closing tooltip stays at the previous battler.
        if (showTooltip(scene, battler)) {
            positionTooltipAt(scene, anchorPositionFor(scene, battler))
        }
    }

    /**
     * Prefers item mode when an item/equip/shop list has the cursor (the
     * tooltip is for that row only, so Prev/Next don't apply); otherwise
     * falls back to cycling battler icons by hand.
     * @param {Scene_Base} scene
     */
    function activateGamepadTooltip(scene) {
        const itemWindow = findActiveItemWindow(scene)
        if (itemWindow) {
            gamepadTooltip.active = true
            gamepadTooltip.mode = "item"
            gamepadTooltip.itemWindow = itemWindow
            gamepadTooltip.row = itemWindow.index()
            gamepadTooltip.lastItem = null
            updateGamepadItemTooltip(scene)
            return
        }
        const battlers = collectTooltipBattlers(scene)
        if (battlers.length > 0) {
            gamepadTooltip.active = true
            gamepadTooltip.mode = "battler"
            gamepadTooltip.battlers = battlers
            gamepadTooltip.index = 0
            selectGamepadTooltipBattler(scene)
        }
    }

    /**
     * Shows the tooltip for the row gamepadTooltip.row, and dismisses it
     * once the cursor leaves that row, the row's item changes, or the
     * window stops being the active, on-screen list.
     * @param {Scene_Base} scene
     */
    function updateGamepadItemTooltip(scene) {
        const win = gamepadTooltip.itemWindow
        if (!win || !win.active || !isWindowUsableForTooltip(win)) {
            deactivateGamepadTooltip(scene)
            return
        }

        const index = win.index()
        const item = index >= 0 ? win.itemAt(index) : null

        // LEFT ROW -----
        // The tooltip belongs to the row it was opened on. Moving off it
        // (or the row's item changing, e.g. after equipping) dismisses it,
        // and it stays closed until the button is pressed again.
        if (
            index !== gamepadTooltip.row ||
            !item ||
            (gamepadTooltip.lastItem && item !== gamepadTooltip.lastItem)
        ) {
            deactivateGamepadTooltip(scene)
            return
        }

        // OPEN -----
        // A tooltip still up from before (mid-close, or a mouse one) fully
        // closes first. openness > 0, not isOpen(): one that's still
        // opening has to close too.
        if (!gamepadTooltip.lastItem) {
            if (scene._stateTooltip.openness > 0) {
                if (scene._stateTooltip.tooltipActive) hideTooltip(scene)
                return
            }
            gamepadTooltip.lastItem = item
            showItemTooltip(scene, item)
        }
        // Battle anchors item tooltips to the whole list window instead
        // (see positionTooltipAboveWindow, driven from Scene_Battle.update).
        if (!(scene instanceof Scene_Battle)) {
            positionTooltipAt(scene, anchorPositionForItemRow(win, index))
        }
    }

    const TOOLTIP_WINDOW_GAP_Y = 4
    /**
     * Battle-only anchor for item/skill tooltips: sits just above the list
     * window (dropping below it only when there's no room above), aligned
     * to whichever edge - left or right - the selected row is on.
     * @param {Scene_Base} scene
     * @param {Window_Selectable} win - the list window the tooltip's item is from
     * @param {number} index - row the tooltip's item is on (-1 aligns right)
     */
    function positionTooltipAboveWindow(scene, win, index) {
        const tw = scene._stateTooltip.width
        const th = scene._stateTooltip.height
        // World coords: the tooltip lives on the scene, the list inside
        // _windowLayer, which may be offset from the scene origin.
        const origin = win.worldTransform.apply(new Point(0, 0))

        // ROW SIDE -----
        // Measured from the row's own rect rather than index % maxCols, so
        // it holds for any column count (rect x is relative to the
        // contents area, hence the padding).
        let alignLeft = false
        if (index >= 0) {
            const rect = win.itemRect(index)
            const rowCenter = win.padding + rect.x + rect.width / 2
            alignLeft = rowCenter < win.width / 2
        }

        const x = alignLeft ? origin.x : origin.x + win.width - tw
        let y = origin.y - th - TOOLTIP_WINDOW_GAP_Y
        if (y < 0) y = origin.y + win.height + TOOLTIP_WINDOW_GAP_Y

        scene._stateTooltip.x = Math.max(0, Math.min(x, Graphics.boxWidth - tw))
        scene._stateTooltip.y = Math.max(
            0,
            Math.min(y, Graphics.boxHeight - th)
        )
    }

    /**
     * Per-frame gamepad-browsing driver: handles the toggle button, then
     * (while active) either defers to item-list tracking or validates/steps
     * through battlers with Prev/Next.
     * @param {Scene_Base} scene
     */
    function updateGamepadTooltip(scene) {
        // TOGGLE BUTTON -----
        // Gamepad "menu" only (see GAMEPAD-ONLY TOGGLE): it has no use inside
        // menus and battle, while its keyboard keys are cancel.
        if (gamepadMenuTriggered) {
            if (gamepadTooltip.active) {
                deactivateGamepadTooltip(scene)
            } else {
                activateGamepadTooltip(scene)
            }
            return
        }

        if (!gamepadTooltip.active) return

        if (gamepadTooltip.mode === "item") {
            updateGamepadItemTooltip(scene)
            return
        }

        // Re-checked every frame so a battler's tooltip is dismissed the
        // moment whatever was showing its icons stops being on screen.
        if (
            !battlerTooltipStillValid(
                scene,
                gamepadTooltip.battlers[gamepadTooltip.index]
            )
        ) {
            deactivateGamepadTooltip(scene)
            return
        }

        if (Input.isTriggered("TooltipNext")) {
            stepGamepadTooltipBattler(scene, 1)
        } else if (Input.isTriggered("TooltipPrev")) {
            stepGamepadTooltipBattler(scene, -1)
        }
    }

    /**
     * Moves gamepad battler browsing to the next/previous battler that is
     * still valid (see battlerTooltipStillValid), skipping any that died or
     * vanished since browsing started. Stays put if no other one is valid.
     * @param {Scene_Base} scene
     * @param {1|-1} step - direction to cycle in
     */
    function stepGamepadTooltipBattler(scene, step) {
        const battlers = gamepadTooltip.battlers
        const count = battlers.length
        for (let i = 1; i < count; i++) {
            const index = (gamepadTooltip.index + step * i + count * i) % count
            if (battlerTooltipStillValid(scene, battlers[index])) {
                gamepadTooltip.index = index
                selectGamepadTooltipBattler(scene)
                return
            }
        }
    }

    // -----------------------------MOUSE ITEM HOVER------------------------------//
    // Scans every item/equip/shop list window in this scene for the row the
    // mouse is over, using each window's own hitIndex()/itemAt(), collected
    // once per frame at the scene level so multiple visible lists (e.g. the
    // equip screen's slot + picker lists) can't fight over the tooltip.
    // Only touches item-mode tooltips (_tooltipItemMode), so this never
    // fights the separate state/buff icon-hover system above. Nothing counts
    // as hovered unless the mouse owns input (see MOUSE OWNERSHIP), and the
    // mouse takes over from gamepad browsing only once it also lands on a
    // real item, so a move into empty space can't interrupt gamepad mode.

    /** Frames the mouse must rest on a row before its tooltip opens. */
    const TOOLTIP_HOVER_DELAY_FRAMES = 15

    /** @param {Scene_Base} scene */
    function updateItemTooltipHover(scene) {
        let hoveredItem = null
        let hoveredWindow = null
        let hoveredIndex = -1
        const layer = scene._windowLayer
        if (layer && isMouseInUse()) {
            for (const child of layer.children) {
                if (
                    !isItemHoverWindow(child) ||
                    !isWindowUsableForTooltip(child)
                ) {
                    continue
                }
                const index = tooltipHitIndex(child)
                if (index >= 0) {
                    const item = child.itemAt(index)
                    if (item) {
                        hoveredItem = item
                        hoveredWindow = child
                        hoveredIndex = index
                    }
                }
            }
        }
        // Kept while nothing is hovered, so a closing tooltip has a window
        // to stay anchored to (battle only - see Scene_Battle.update).
        if (hoveredWindow) {
            scene._tooltipHoveredWindow = hoveredWindow
            scene._tooltipHoveredIndex = hoveredIndex
        }

        // With the mouse not in use hoveredItem is null, so a mouse tooltip
        // still up closes below (nothing hovered) and none can reopen.
        if (gamepadTooltip.active) {
            if (!hoveredItem) return
            resetGamepadTooltip()
        }

        if (hoveredItem) {
            // SWAP IN PROGRESS -----
            // The old tooltip is still closing: keep tracking whatever is
            // hovered now, and open that item's tooltip (no delay) the frame
            // the close finishes - so the one that opens is always the new one.
            if (scene._tooltipSwapItem) {
                scene._tooltipSwapItem = hoveredItem
                if (scene._stateTooltip.openness > 0) return
                scene._tooltipSwapItem = null
                scene._tooltipHoveredItem = hoveredItem
                showItemTooltip(scene, hoveredItem)
                return
            }
            if (hoveredItem === scene._tooltipHoveredItem) {
                return // already showing it
            }
            // openness > 0, not isOpen(): a tooltip that's still opening
            // counts as up too, or a fast switch would skip the close.
            if (scene._tooltipItemMode && scene._stateTooltip.openness > 0) {
                // hideTooltip, not close(): it clears tooltipActive, which
                // the window's own update() would otherwise reopen from.
                scene._tooltipSwapItem = hoveredItem
                scene._tooltipPendingItem = null
                hideTooltip(scene)
            } else if (hoveredItem !== scene._tooltipPendingItem) {
                // New hover (or moved to another item mid-wait): restart the countdown.
                scene._tooltipPendingItem = hoveredItem
                scene._tooltipDelayFrames = TOOLTIP_HOVER_DELAY_FRAMES
            } else if (--scene._tooltipDelayFrames <= 0) {
                scene._tooltipPendingItem = null
                scene._tooltipHoveredItem = hoveredItem
                showItemTooltip(scene, hoveredItem)
            }
        } else {
            scene._tooltipPendingItem = null // cancels any wait in progress
            scene._tooltipSwapItem = null // the closing tooltip just stays closed
            if (scene._tooltipHoveredItem) {
                scene._tooltipHoveredItem = null
                if (scene._tooltipItemMode) {
                    scene._tooltipItemMode = false
                    hideTooltip(scene)
                }
            }
        }
    }

    //============================================================================//
    //                       ITEM/EQUIP/SHOP LIST HELPERS                         //
    //============================================================================//

    // Explicit allow-list of the item/equip/shop windows this feature targets.
    // Window_EquipItem and Window_ShopSell both extend Window_ItemList.
    /** @param {Window_Selectable} win @returns {boolean} */
    function isItemHoverWindow(win) {
        return (
            win instanceof Window_ItemList ||
            win instanceof Window_EquipSlot ||
            win instanceof Window_ShopBuy ||
            win instanceof Window_SkillList ||
            win instanceof Window_ActorCommand ||
            !!win._wdItemList
        )
    }

    /**
     * Row the mouse is over for tooltip purposes. Windows may narrow this
     * with their own tooltipHitIndex() (e.g. only an icon), without touching
     * the hitIndex() the engine uses for selecting rows.
     * @param {Window_Selectable} win
     * @returns {number} row index, or -1
     */
    function tooltipHitIndex(win) {
        return typeof win.tooltipHitIndex === "function" ?
                win.tooltipHitIndex()
            :   win.hitIndex()
    }

    //---------------------------WD_ITEMUSE SELECTOR--------------------------//
    // PRIVATE CLASSES -----
    // WD_ItemUse is minified inside its own closure: its list window (local
    // "m") and the item array it draws from (local "n") are unreachable from
    // here, and only the scene is exported, as SceneManager.Scene_WdItems.
    // Its rows are also JSON.parse(JSON.stringify()) copies tagged with
    // itemCategory, which fail DataManager.isItem's identity check.
    // So while the scene builds its list window, JSON.parse results are
    // recorded, the copies the window ended up with are picked out, and the
    // window gets an itemAt() that maps each copy back to its database object.

    const WD_CATEGORY_TABLES = {
        Item: () => $dataItems,
        Weapon: () => $dataWeapons,
        Armor: () => $dataArmors,
    }
    // Item 400 "Nothing": the selector's cancel-like row, never tooltipped.
    const WD_NOTHING_ITEM_ID = 400

    /**
     * Picks WD_ItemUse's row list out of everything JSON.parse returned while
     * its window was built. Modes 1-4 parse one whole inventory array (equip
     * copies are pushed into it); mode 5 parses and pushes each row on its own.
     * Unrelated parses (e.g. from text drawing) never get an itemCategory.
     * @param {Array} parsed - JSON.parse results, in call order
     * @param {number} expected - the window's maxItems()
     * @returns {Array|null} the window's rows, or null if they can't be matched
     */
    function findWdItemRows(parsed, expected) {
        const isRow = (obj) => !!obj && typeof obj.itemCategory === "string"
        const whole = parsed.find(
            (obj) =>
                Array.isArray(obj) &&
                obj.length === expected &&
                obj.every(isRow)
        )
        if (whole) return whole
        const rows = parsed.filter((obj) => !Array.isArray(obj) && isRow(obj))
        return rows.length === expected ? rows : null
    }

    const WdItemScene = SceneManager.Scene_WdItems
    if (WdItemScene) {
        const _WdItemScene_createWdItemWindow =
            WdItemScene.prototype.createWdItemWindow
        WdItemScene.prototype.createWdItemWindow = function () {
            const parsed = []
            const _JSON_parse = JSON.parse
            JSON.parse = function () {
                const result = _JSON_parse.apply(this, arguments)
                parsed.push(result)
                return result
            }
            try {
                _WdItemScene_createWdItemWindow.call(this)
            } finally {
                JSON.parse = _JSON_parse
            }

            const win = this._wdItemWindow
            const rows = win && findWdItemRows(parsed, win.maxItems())
            if (!rows) return
            win._wdItemList = rows
            /** @param {number} index @returns {RPG.BaseItem|null} */
            win.itemAt = function (index) {
                const row = this._wdItemList[index]
                if (
                    row &&
                    row.itemCategory === "Item" &&
                    row.id === WD_NOTHING_ITEM_ID
                ) {
                    return null
                }
                const table = row && WD_CATEGORY_TABLES[row.itemCategory]
                return table ? table()[row.id] || null : null
            }
        }
    }

    /**
     * The active item/equip/shop list with a real selection, if any - the one
     * gamepad tooltip browsing should track instead of cycling battlers.
     * @param {Scene_Base} scene
     * @returns {Window_Selectable|null}
     */
    function findActiveItemWindow(scene) {
        const layer = scene._windowLayer
        if (!layer) return null
        for (const child of layer.children) {
            if (
                isItemHoverWindow(child) &&
                child.active &&
                isWindowUsableForTooltip(child) &&
                child.index() >= 0 &&
                // SPARSE ROWS -----
                // The actor command list only has a tooltip on its Attack
                // row; on any other row the button keeps browsing battlers.
                (!(child instanceof Window_ActorCommand) ||
                    child.itemAt(child.index()))
            ) {
                return child
            }
        }
        return null
    }

    //--------------------------ACTOR COMMAND ATTACK ROW--------------------------//
    // The battle Attack command is the actor's attack skill (attackSkillId()
    // covers weapon Attack Skill traits and Grinning Beast's claws). Its row
    // gets an icon on the right edge: hovering that icon (not the whole row,
    // which still just selects it) shows the skill's tooltip, and on gamepad
    // the tooltip button shows it while the Attack row has the cursor.

    const ATTACK_TOOLTIP_ICON = 155

    /**
     * The attack skill for the Attack row, null for every other row.
     * @param {number} index
     * @returns {RPG.Skill|null}
     */
    Window_ActorCommand.prototype.itemAt = function (index) {
        if (!this._actor || this.commandSymbol(index) !== "attack") return null
        return $dataSkills[this._actor.attackSkillId()] || null
    }

    /**
     * Contents-space rect of the tooltip icon at the right edge of a row.
     * @param {number} index
     * @returns {Rectangle}
     */
    Window_ActorCommand.prototype.attackTooltipIconRect = function (index) {
        const rect = this.itemLineRect(index)
        const iw = Math.floor(ImageManager.iconWidth * 0.7)
        const ih = Math.floor(ImageManager.iconHeight * 0.7)
        return new Rectangle(
            rect.x + rect.width - iw,
            rect.y + Math.floor(rect.height / 2) - Math.floor(ih / 2),
            iw,
            ih
        )
    }
    Window_ActorCommand.prototype.drawIconCustomSize = function (
        iconIndex,
        x,
        y,
        iWidth = 32,
        iHeight = 32
    ) {
        const bitmap = ImageManager.loadSystem("IconSet")
        const pw = ImageManager.iconWidth
        const ph = ImageManager.iconHeight
        const sx = (iconIndex % 16) * pw
        const sy = Math.floor(iconIndex / 16) * ph
        const dw = iWidth
        const dh = iHeight
        this.contents.blt(bitmap, sx, sy, pw, ph, x, y, dw, dh)
    }

    const _Window_ActorCommand_drawItem = Window_ActorCommand.prototype.drawItem
    /** Adds the tooltip icon to the Attack row. */
    Window_ActorCommand.prototype.drawItem = function (index) {
        _Window_ActorCommand_drawItem.call(this, index)
        if (this.commandSymbol(index) !== "attack") return
        const rect = this.attackTooltipIconRect(index)
        this.changePaintOpacity(true)
        this.drawIconCustomSize(
            ATTACK_TOOLTIP_ICON,
            rect.x,
            rect.y,
            rect.width,
            rect.height
        )
    }

    /**
     * Tooltip hover is the Attack row's icon only (see tooltipHitIndex).
     * Same local-space math as Window_Selectable.hitTest.
     * @returns {number} the Attack row's index while its icon is hovered, else -1
     */
    Window_ActorCommand.prototype.tooltipHitIndex = function () {
        const index = this.findSymbol("attack")
        if (index < 0) return -1
        const touchPos = new Point(TouchInput.x, TouchInput.y)
        const localPos = this.worldTransform.applyInverse(touchPos)
        if (!this.innerRect.contains(localPos.x, localPos.y)) return -1
        const cx = this.origin.x + localPos.x - this.padding
        const cy = this.origin.y + localPos.y - this.padding
        return this.attackTooltipIconRect(index).contains(cx, cy) ? index : -1
    }

    /**
     * Screen position/size of a list row, for anchoring an item tooltip.
     * @param {Window_Selectable} win
     * @param {number} index - row index
     * @returns {{x:number,y:number,width:number,height:number}|null}
     */
    function anchorPositionForItemRow(win, index) {
        if (!win._contentsSprite) return null
        const rect = win.itemRect(index)
        // Top-left corner - positionTooltipAt adds width/height itself.
        const point = win._contentsSprite.worldTransform.apply(
            new Point(rect.x, rect.y)
        )
        return {
            x: point.x,
            y: point.y,
            width: rect.width,
            height: rect.height,
        }
    }

    //============================================================================//
    //                  SCENE_BATTLE / SCENE_MENUBASE ATTACHMENT                  //
    //============================================================================//
    // Attaches every method above directly onto each scene's own prototype
    // (instead of through a shared install-function parameter) so "Go to
    // Definition" and "Find References" on this.foo() calls resolve correctly.

    const _Scene_Battle_createAllWindows =
        Scene_Battle.prototype.createAllWindows
    /** Creates the tooltip window after battle's own windows finish building. */
    Scene_Battle.prototype.createAllWindows = function () {
        _Scene_Battle_createAllWindows.call(this)
        createTooltipWindow(this)
    }

    const _Scene_Battle_update = Scene_Battle.prototype.update
    /** Per-frame: drives gamepad browsing, mouse item-hover, and cursor-follow. */
    Scene_Battle.prototype.update = function () {
        _Scene_Battle_update.call(this)
        updateGamepadTooltip(this)
        updateItemTooltipHover(this)
        updateTooltipSwap(this)
        // Zero width/height tells positionTooltipAt to flip above/below right
        // at the cursor point, rather than past the far edge of an icon/row.
        // FREEZE ON CLOSE -----
        // A closing tooltip (tooltipActive false) stays put - otherwise one
        // dismissed by gamepad would snap to the mouse for its close animation.
        if (!this._stateTooltip.visible || !this._stateTooltip.tooltipActive) {
            return
        }
        // BATTLE MENU ANCHOR -----
        // Item/skill tooltips sit above the action list, on the selected
        // row's side, for mouse and gamepad alike, instead of following the
        // cursor/row.
        if (this._tooltipItemMode) {
            const [win, index] =
                gamepadTooltip.active ?
                    [gamepadTooltip.itemWindow, gamepadTooltip.row]
                :   [this._tooltipHoveredWindow, this._tooltipHoveredIndex]
            if (win) positionTooltipAboveWindow(this, win, index)
        } else if (!gamepadTooltip.active && isMouseInUse()) {
            positionTooltipAt(this, {
                x: TouchInput.x + TOOLTIP_CURSOR_OFFSET_X,
                y: TouchInput.y + TOOLTIP_CURSOR_OFFSET_Y,
                width: 0,
                height: 0,
            })
        }
    }

    /** Delegates to {@link activateGamepadTooltip}. */
    Scene_Battle.prototype.activateGamepadTooltip = function () {
        activateGamepadTooltip(this)
    }
    /** Delegates to {@link deactivateGamepadTooltip}. */
    Scene_Battle.prototype.deactivateGamepadTooltip = function () {
        deactivateGamepadTooltip(this)
    }
    /** Delegates to {@link updateGamepadTooltip}. */
    Scene_Battle.prototype.updateGamepadTooltip = function () {
        updateGamepadTooltip(this)
    }
    /** Delegates to {@link positionTooltipAt}. */
    Scene_Battle.prototype.positionTooltipAt = function (anchor) {
        positionTooltipAt(this, anchor)
    }
    /** Delegates to {@link selectGamepadTooltipBattler}. */
    Scene_Battle.prototype.selectGamepadTooltipBattler = function () {
        selectGamepadTooltipBattler(this)
    }
    /** Delegates to {@link updateGamepadItemTooltip}. */
    Scene_Battle.prototype.updateGamepadItemTooltip = function () {
        updateGamepadItemTooltip(this)
    }
    /** Delegates to {@link createTooltipWindow}. */
    Scene_Battle.prototype.createTooltipWindow = function () {
        createTooltipWindow(this)
    }
    /** Delegates to {@link showTooltip}. */
    Scene_Battle.prototype.showTooltip = function (battler) {
        showTooltip(this, battler)
    }
    /** Delegates to {@link hideTooltip}. */
    Scene_Battle.prototype.hideTooltip = function () {
        hideTooltip(this)
    }
    /** Delegates to {@link showItemTooltip}. */
    Scene_Battle.prototype.showItemTooltip = function (item) {
        showItemTooltip(this, item)
    }
    /** Delegates to {@link updateItemTooltipHover}. */
    Scene_Battle.prototype.updateItemTooltipHover = function () {
        updateItemTooltipHover(this)
    }

    const _Scene_MenuBase_create = Scene_MenuBase.prototype.create
    /** Creates the tooltip window after the menu scene's own windows finish building. */
    Scene_MenuBase.prototype.create = function () {
        _Scene_MenuBase_create.call(this)
        createTooltipWindow(this)
    }

    const _Scene_MenuBase_update = Scene_MenuBase.prototype.update
    /** Per-frame: drives gamepad browsing, mouse item-hover, and cursor-follow. */
    Scene_MenuBase.prototype.update = function () {
        _Scene_MenuBase_update.call(this)
        updateGamepadTooltip(this)
        updateItemTooltipHover(this)
        updateTooltipSwap(this)
        // See FREEZE ON CLOSE in Scene_Battle.prototype.update.
        if (
            this._stateTooltip.visible &&
            this._stateTooltip.tooltipActive &&
            !gamepadTooltip.active &&
            isMouseInUse()
        ) {
            positionTooltipAt(this, {
                x: TouchInput.x + TOOLTIP_CURSOR_OFFSET_X,
                y: TouchInput.y + TOOLTIP_CURSOR_OFFSET_Y,
                width: 0,
                height: 0,
            })
        }
    }

    /** Delegates to {@link activateGamepadTooltip}. */
    Scene_MenuBase.prototype.activateGamepadTooltip = function () {
        activateGamepadTooltip(this)
    }
    /** Delegates to {@link deactivateGamepadTooltip}. */
    Scene_MenuBase.prototype.deactivateGamepadTooltip = function () {
        deactivateGamepadTooltip(this)
    }
    /** Delegates to {@link updateGamepadTooltip}. */
    Scene_MenuBase.prototype.updateGamepadTooltip = function () {
        updateGamepadTooltip(this)
    }
    /** Delegates to {@link positionTooltipAt}. */
    Scene_MenuBase.prototype.positionTooltipAt = function (anchor) {
        positionTooltipAt(this, anchor)
    }
    /** Delegates to {@link selectGamepadTooltipBattler}. */
    Scene_MenuBase.prototype.selectGamepadTooltipBattler = function () {
        selectGamepadTooltipBattler(this)
    }
    /** Delegates to {@link updateGamepadItemTooltip}. */
    Scene_MenuBase.prototype.updateGamepadItemTooltip = function () {
        updateGamepadItemTooltip(this)
    }
    /** Delegates to {@link createTooltipWindow}. */
    Scene_MenuBase.prototype.createTooltipWindow = function () {
        createTooltipWindow(this)
    }
    /** Delegates to {@link showTooltip}. */
    Scene_MenuBase.prototype.showTooltip = function (battler) {
        showTooltip(this, battler)
    }
    /** Delegates to {@link hideTooltip}. */
    Scene_MenuBase.prototype.hideTooltip = function () {
        hideTooltip(this)
    }
    /** Delegates to {@link showItemTooltip}. */
    Scene_MenuBase.prototype.showItemTooltip = function (item) {
        showItemTooltip(this, item)
    }
    /** Delegates to {@link updateItemTooltipHover}. */
    Scene_MenuBase.prototype.updateItemTooltipHover = function () {
        updateItemTooltipHover(this)
    }

    //============================================================================//
    //                   ENGINE / MOD COMPATIBILITY GUARDS                        //
    //============================================================================//
    // Not tooltip-related - these patches only exist because this feature now
    // runs extra per-frame work in scenes other custom scripts didn't expect.

    // GUARD: Sprite_Battler.updatePosition ---------------------------------//
    // bunchastuff.js's updatePosition() override reads this._battler
    // unconditionally, but Sprite_Battler.prototype.setHome calls
    // updatePosition() directly without going through the normal guarded
    // update chain. Wraps whatever updatePosition() is installed by load time
    // so a missing battler is a silent no-op instead of a crash.
    const _Sprite_Battler_updatePosition_battlerGuard =
        Sprite_Battler.prototype.updatePosition
    Sprite_Battler.prototype.updatePosition = function () {
        if (!this._battler) return
        _Sprite_Battler_updatePosition_battlerGuard.call(this)
    }

    // GUARD: Sprite_Damage.setup --------------------------------------------//
    // regenDamageResistFix.js reads BattleManager._action.calcElementRate()
    // with no null-check, but _action is only set during a normal battle
    // action - regen/DoT ticks and conversation-battle damage pop-ups don't
    // go through that flow. Wraps whatever setup() is installed by load time
    // and substitutes a neutral stand-in (calcElementRate() => 1) only when
    // _action is missing, for the duration of that one call.
    const _Sprite_Damage_setup_actionGuard = Sprite_Damage.prototype.setup
    Sprite_Damage.prototype.setup = function (target) {
        const hadAction = !!BattleManager._action
        if (!hadAction) {
            BattleManager._action = { calcElementRate: () => 1 }
        }
        try {
            _Sprite_Damage_setup_actionGuard.call(this, target)
        } finally {
            if (!hadAction) {
                BattleManager._action = null
            }
        }
    }

    //============================================================================//
    //                           STATE ICON HOVER                                 //
    //============================================================================//

    // DRAWN ICONS -----
    // Window_MenuStatus and Window_Status (the party list and the detailed
    // character screen) don't use Sprite_StateIcon at all - Window_StatusBase's
    // drawActorIcons() draws icons straight onto the window's bitmap, so there's
    // no sprite for the mouse-enter/exit hooks below to attach to. Each drawn
    // icon's rect is recorded per actor here, then hit-tested by hand against
    // the window's _contentsSprite transform (the same technique
    // Sprite_StateIcon.isBeingTouched uses on a sprite).
    const _Window_StatusBase_drawActorIcons =
        Window_StatusBase.prototype.drawActorIcons
    Window_StatusBase.prototype.drawActorIcons = function (actor, x, y, width) {
        _Window_StatusBase_drawActorIcons.call(this, actor, x, y, width)
        this._tooltipIconRects = this._tooltipIconRects || {}
        const iconWidth = ImageManager.iconWidth
        const iconHeight = ImageManager.iconHeight
        const icons = actor
            .allIcons()
            .slice(0, Math.floor((width || 144) / iconWidth))
        this._tooltipIconRects[actor.actorId()] = icons.map((_icon, i) => ({
            x: x + i * iconWidth,
            y: y + 2,
            width: iconWidth,
            height: iconHeight,
            battler: actor,
        }))
    }

    const _Window_StatusBase_update = Window_StatusBase.prototype.update
    /** Per-frame: hit-tests the recorded icon rects (see DRAWN ICONS). */
    Window_StatusBase.prototype.update = function () {
        _Window_StatusBase_update.call(this)
        this.updateTooltipIconHover()
    }

    /** Shows/hides the tooltip for whichever drawn icon the mouse is over. */
    Window_StatusBase.prototype.updateTooltipIconHover = function () {
        if (!this._tooltipIconRects || !sceneHasTooltipSupport()) return
        // HIDDEN WINDOW -----
        // A window can be hidden without ever losing the mouse (e.g.
        // Scene_Battle.commandSkill hides the party status window when the
        // skill list opens). Without this check, the stale mouse position
        // would keep matching the last-hovered rect and the tooltip would
        // show through the window on top.
        if (!isWindowUsableForTooltip(this)) {
            if (this._tooltipHoveredBattler) {
                this._tooltipHoveredBattler = null
                SceneManager._scene.hideTooltip()
            }
            return
        }

        const touchPos = new Point(TouchInput.x, TouchInput.y)
        const localPos =
            this._contentsSprite.worldTransform.applyInverse(touchPos)

        // Without mouse ownership nothing is hovered, so a mouse tooltip
        // still up closes below - before a same-frame gamepad toggle opens.
        const iconRects =
            isMouseInUse() ? Object.values(this._tooltipIconRects) : []
        let hoveredBattler = null
        for (const rects of iconRects) {
            for (const rect of rects) {
                if (
                    localPos.x >= rect.x &&
                    localPos.x < rect.x + rect.width &&
                    localPos.y >= rect.y &&
                    localPos.y < rect.y + rect.height
                ) {
                    hoveredBattler = rect.battler
                    break
                }
            }
            if (hoveredBattler) break
        }

        if (hoveredBattler !== this._tooltipHoveredBattler) {
            this._tooltipHoveredBattler = hoveredBattler
            resetGamepadTooltip()
            if (hoveredBattler && hoveredBattler.allIcons().length > 0) {
                SceneManager._scene.showTooltip(hoveredBattler)
            } else {
                SceneManager._scene.hideTooltip()
            }
        }
    }

    // SPRITE ICONS -----
    // Enemies and the battle status window show state icons as real
    // Sprite_StateIcon objects, which get mouse enter/exit hooks here.

    const _Sprite_StateIcon_initialize = Sprite_StateIcon.prototype.initialize
    Sprite_StateIcon.prototype.initialize = function () {
        _Sprite_StateIcon_initialize.call(this)
        this._hovered = false
    }

    const _Sprite_StateIcon_update = Sprite_StateIcon.prototype.update
    Sprite_StateIcon.prototype.update = function () {
        _Sprite_StateIcon_update.call(this)
        this.processTouch()
    }

    /** Fires onMouseEnter/onMouseExit as the mouse moves on/off the icon. */
    Sprite_StateIcon.prototype.processTouch = function () {
        if (isMouseInUse() && this.isBeingTouched()) {
            if (!this._hovered && TouchInput.isHovered()) {
                this._hovered = true
                this.onMouseEnter()
            }
        } else {
            if (this._hovered) {
                this.onMouseExit()
            }
            this._hovered = false
        }
    }

    /** @returns {boolean} true while the mouse position is inside the icon */
    Sprite_StateIcon.prototype.isBeingTouched = function () {
        const touchPos = new Point(TouchInput.x, TouchInput.y)
        const localPos = this.worldTransform.applyInverse(touchPos)
        return this.hitTest(localPos.x, localPos.y)
    }

    Sprite_StateIcon.prototype.hitTest = function (x, y) {
        const rect = new Rectangle(
            -this.anchor.x * this.width,
            -this.anchor.y * this.height,
            this.width,
            this.height
        )
        return rect.contains(x, y)
    }

    /** Duck-typed check for whether the current scene has tooltip support installed. @returns {boolean} */
    function sceneHasTooltipSupport() {
        return typeof SceneManager._scene.showTooltip === "function"
    }

    Sprite_StateIcon.prototype.onMouseEnter = function () {
        if (sceneHasTooltipSupport()) {
            if (this._battler && this._battler.allIcons().length > 0) {
                resetGamepadTooltip()
                SceneManager._scene.showTooltip(this._battler)
            }
        }
    }

    Sprite_StateIcon.prototype.onMouseExit = function () {
        if (sceneHasTooltipSupport()) {
            SceneManager._scene.hideTooltip()
        }
    }

    //============================================================================//
    //                          WINDOW_STATETOOLTIP                               //
    //============================================================================//

    function Window_StateTooltip() {
        this.initialize(...arguments)
    }

    Window_StateTooltip.prototype = Object.create(Window_Selectable.prototype)
    Window_StateTooltip.prototype.constructor = Window_StateTooltip

    const _Window_openness = Object.getOwnPropertyDescriptor(
        Window.prototype,
        "openness"
    )
    Object.defineProperty(Window_StateTooltip.prototype, "openness", {
        get: function () {
            return _Window_openness.get.call(this)
        },
        set: function (value) {
            _Window_openness.set.call(this, value) // vertical scale + y offset
            // Undo the engine's centering offset so the frame unrolls
            // downward from its top edge instead of from its middle.
            if (this._openFromTop) this._container.y = 0
        },
        configurable: true,
    })
    Window_StateTooltip.prototype.initialize = function () {
        Window_Selectable.prototype.initialize.call(
            this,
            new Rectangle(0, 0, 0, 0)
        )
        this.visible = false
        this.tooltipActive = false
        this.opacity = 0
        this.contentsOpacity = 0
        this.fadeSpeed = 42
        this.fadeSpeedMin = 28
        this._minTooltipWidthFinal = 250
        this.frontSpriteHue = 0
        this.backSpriteHue = 0
        this.backSpriteOpacity = 255
        /** Widest a line may get before wrapping; per-window so the shop window can differ. */
        this._maxTextWidth = maxTooltipWidth
        /** Pixels taken off every line's spacing (see calcTextHeight); per-window so the shop window can keep matching the message window. */
        this._lineSpacingTrim = TOOLTIP_LINE_SPACING_TRIM
        /** If true, shows/hides via open()/close() (openness) instead of fading. */
        this._useOpenAnimation = true
        /** If true, the open animation unrolls from the top edge instead of the center. */
        this._openFromTop = true
        this.openness = this._useOpenAnimation ? 0 : 255
        /** Characters typed per frame once open; 0 draws everything instantly. */
        this._charsPerFrame = 0
        /** @type {{text:string, x:number, y:number, state:RPG.State|null}[]} */
        this._typewriterQueue = []
        /** @type {object|null} textState of the entry currently being typed */
        this._typewriterState = null
    }
    // FADE DIRECTION -----
    // tooltipActive (what the tooltip should be doing) picks the direction;
    // opacity only decides when that fade is done. Checking opacity < 255
    // first would let fade-in win every frame of a fade-out, bouncing the
    // opacity back up before it could ever reach 0.
    Window_StateTooltip.prototype.update = function () {
        Window_Selectable.prototype.update.call(this)
        this.updateTypewriter()
        this.setHue()
        // Open-animation windows are driven by open()/close() instead, which
        // Window_Base.update already animates via openness.
        if (this._useOpenAnimation) {
            if (!this.tooltipActive) {
                this.close()
                if (this.openness > 0) return
                this.opacity = 0
                this.visible = false
                return
            } else {
                this.opacity = 255
                this.visible = true
                this.open()
                return
            }
        }
        if (!this.visible) return
        if (this.tooltipActive) {
            if (this.opacity < 255) this.updateFadeIn()
        } else {
            this.updateFadeOut()
        }
    }

    Window_StateTooltip.prototype.updateFadeIn = function () {
        const alpha =
            this.opacity +
            Math.min(
                Math.max(
                    (1 - Math.log10(Math.max(this.opacity, 1)) / 10) *
                        this.fadeSpeed,
                    this.fadeSpeedMin
                ),
                255
            )
        this.opacity = alpha
        this.contentsOpacity = alpha
    }

    Window_StateTooltip.prototype.updateFadeOut = function () {
        const alpha =
            this.opacity -
            Math.max(
                Math.max(
                    (1 - Math.log10(Math.max(255 - this.opacity, 1)) / 10) *
                        (this.fadeSpeed * 1.8),
                    this.fadeSpeedMin
                ),
                0
            )
        this.opacity = alpha
        this.contentsOpacity = alpha
        if (this.opacity <= 0) {
            this.opacity = 0
            this.visible = false
        }
    }
    /**
     * Applies backSpriteHue/frontSpriteHue (-360..360) and backSpriteOpacity
     * to the background and frame sprites.
     */
    Window_StateTooltip.prototype.setHue = function () {
        this._backSprite.setHue(this.backSpriteHue)
        this._frameSprite.setHue(this.frontSpriteHue)
        this._backSprite.children[0].opacity = this.backSpriteOpacity
    }

    // --------------------------------TEXT WRAPPING-------------------------------//
    // The base engine doesn't wrap text by width, so long lines are
    // word-wrapped here: real \n characters are inserted where the next word
    // would exceed maxWidth, measured with textSizeEx (which runs the escape
    // codes, so icons and size changes are measured as drawn).
    // CARRIED STYLE -----
    // Drawing keeps font state across \n, but textSizeEx starts every
    // measurement from the reset font. So each line is measured with every
    // size/style code before it prefixed - otherwise a line continuing
    // e.g. a \DE[1] description would be measured at normal size.

    /** Zero-width escape codes that change glyph size/spacing (see processEscapeCharacter). */
    const WRAP_STYLE_CODE_REGEX =
        /\\(?:BSD|BI|BS|B|IT|LB|ST|TI|DE|FS)\[\d+\]|\\[{}]/gi

    /** @param {string} text @returns {string} every size/style code in text, in order */
    function styleCodesIn(text) {
        return (text.match(WRAP_STYLE_CODE_REGEX) || []).join("")
    }

    /**
     * @param {Window_Base} win
     * @param {string} line - single line, no \n
     * @param {number} maxWidth - pixels
     * @param {string} [carried=""] - style codes still active from earlier lines
     * @returns {string} the line with \n inserted at wrap points
     */
    function wrapLine(win, line, maxWidth, carried = "") {
        const justifyAt = line.indexOf(JUSTIFY_CODE)
        if (justifyAt !== -1) {
            return wrapJustifiedLine(win, line, justifyAt, maxWidth, carried)
        }

        const alignAt = line.indexOf("\\>")
        if (alignAt !== -1) {
            const column = wrapRightAlignedLine(
                win,
                line,
                alignAt,
                maxWidth,
                carried
            )
            if (column !== null) return column
        }

        const words = line.split(" ")
        let wrapped = ""
        let current = ""
        let lineStart = carried
        for (const word of words) {
            const candidate = current ? `${current} ${word}` : word
            if (
                current &&
                win.textSizeEx(lineStart + candidate).width > maxWidth
            ) {
                wrapped += (wrapped ? "\n" : "") + current
                lineStart += styleCodesIn(current)
                current = word
            } else {
                current = candidate
            }
        }
        wrapped += (wrapped ? "\n" : "") + current
        return wrapped
    }

    // RIGHT-ALIGNED COLUMN -----
    // A "Label:\>value" line that's too long wraps only its value, inside
    // the column right of the label, and every continuation line starts
    // with \>[labelWidth] - so it stays right-aligned and never runs back
    // under the label (see processRightAlign):
    //   |Inflicts:     Bleed3, Bleed2|
    //   |                     Bleed1|

    /** Narrowest value column worth keeping; below it the line wraps normally. */
    const RIGHT_ALIGN_MIN_COLUMN = 48

    /**
     * @param {Window_Base} win
     * @param {string} line - single line, no \n, containing \> at alignAt
     * @param {number} alignAt - index of the first \> in line
     * @param {number} maxWidth - pixels
     * @param {string} carried - style codes still active from earlier lines
     * @returns {string|null} the wrapped line, or null to wrap it normally
     *   (the label leaves too little room for a value column)
     */
    function wrapRightAlignedLine(win, line, alignAt, maxWidth, carried) {
        const label = line.slice(0, alignAt)
        const value = line.slice(alignAt + 2)
        const labelWidth = Math.ceil(win.textSizeEx(carried + label).width)
        const columnWidth = maxWidth - labelWidth - RIGHT_ALIGN_MIN_GAP
        if (columnWidth < RIGHT_ALIGN_MIN_COLUMN) return null

        const valueLines = wrapLine(
            win,
            value,
            columnWidth,
            carried + styleCodesIn(label)
        ).split("\n")
        return (
            `${label}\\>${valueLines[0]}` +
            valueLines
                .slice(1)
                .map((valueLine) => `\n\\>[${labelWidth}]${valueLine}`)
                .join("")
        )
    }

    // JUSTIFIED LIST (\JU) -----
    // "Label:\>\JU A, B, C" marks a ", "-separated list (\JU needs a space
    // or another non-letter after it, or the next word joins the code).
    // If the whole line fits, it's kept as written, minus the \JU. If not,
    // the label (anything before \JU, trailing \> dropped) moves to its own
    // line and the list wraps item by item, never inside an item. Every
    // wrapped row but the last gets \JG gaps, which processJustifyGap
    // widens at draw time so the row ends flush at the right edge:
    //   |Cures:                          |
    //   |Poison,   Blind,   Bleed1,   Burn|
    //   |Acid, Sleep                      |

    const JUSTIFY_CODE = "\\JU"
    const JUSTIFY_SEPARATOR = ", "

    /**
     * @param {Window_Base} win
     * @param {string} line - single line, no \n, containing \JU at justifyAt
     * @param {number} justifyAt - index of \JU in line
     * @param {number} maxWidth - pixels
     * @param {string} carried - style codes still active from earlier lines
     * @returns {string} the line, or its label and justified rows joined by \n
     */
    function wrapJustifiedLine(win, line, justifyAt, maxWidth, carried) {
        const before = line.slice(0, justifyAt)
        const list = line.slice(justifyAt + JUSTIFY_CODE.length).trim()
        const plain = before + list
        if (win.textSizeEx(carried + plain).width <= maxWidth) return plain

        const label = before.replace(/\\>\s*$/, "")
        let rowStart = carried + styleCodesIn(label)
        const rows = []
        let current = []
        for (const item of list.split(JUSTIFY_SEPARATOR)) {
            const candidate = current.concat(item).join(JUSTIFY_SEPARATOR)
            if (
                current.length &&
                win.textSizeEx(rowStart + candidate).width > maxWidth
            ) {
                rows.push(current)
                rowStart += styleCodesIn(current.join(JUSTIFY_SEPARATOR))
                current = [item]
            } else {
                current.push(item)
            }
        }
        rows.push(current)

        const body = rows.map((row, i) =>
            row.join(i < rows.length - 1 ? ",\\JG " : JUSTIFY_SEPARATOR)
        )
        return (label ? [label, ...body] : body).join("\n")
    }

    /** Word-wraps every line of text. @param {Window_Base} win @param {string} text @param {number} maxWidth @returns {string} */
    function wrapTooltipText(win, text, maxWidth) {
        let carried = ""
        return text
            .split("\n")
            .map((line) => {
                const wrapped = wrapLine(win, line, maxWidth, carried)
                carried += styleCodesIn(line)
                return wrapped
            })
            .join("\n")
    }

    // --------------------------------ENTRY RENDERING-----------------------------//

    /** Side length of a battler tooltip's header portrait (face cells are 144px). */
    const TOOLTIP_PORTRAIT_SIZE = 48
    /** Space between the header portrait and the name text. */
    const TOOLTIP_PORTRAIT_GAP = 6

    /**
     * Shared by setup() and setupItem(): measures every entry's wrapped size,
     * sizes the window from the total, then draws each entry at its offset.
     * An entry with a face gets its portrait at the left, its text shifted
     * right of it and centered vertically against it.
     * A fitWidth entry never widens the window: it's left out of the width
     * calculation, then wrapped to whatever width the other entries (or the
     * minimum width) settled on.
     * @param {Array<{state:RPG.State|null, text:string, face?:{name:string,index:number}|null, fitWidth?:boolean}>} rawEntries
     */
    Window_StateTooltip.prototype.renderEntries = function (rawEntries) {
        /** Wraps an entry to maxWidth (including its indent) and measures it. */
        const measureEntry = (entry, maxWidth) => {
            const faceSize = entry.face ? TOOLTIP_PORTRAIT_SIZE : 0
            const indent = faceSize ? faceSize + TOOLTIP_PORTRAIT_GAP : 0
            const wrappedText = wrapTooltipText(
                this,
                entry.text,
                maxWidth - indent
            )
            const size = this.textSizeEx(wrappedText)
            return {
                ...entry,
                text: wrappedText,
                indent,
                textHeight: size.height,
                width: size.width + indent,
                height: Math.max(size.height, faceSize),
            }
        }

        // FIT-WIDTH ENTRIES -----
        // Two passes: every normal entry is measured first (null holds a
        // fitWidth entry's slot so order is kept), then the fitWidth ones
        // are wrapped to the resulting w.
        const sizedEntries = rawEntries.map((entry) =>
            entry.fitWidth ? null : measureEntry(entry, this._maxTextWidth)
        )

        // MIN WIDTH -----
        // _minTooltipWidthFinal is a whole-window width, so it's converted
        // back to a text width here. That one text width drives both the
        // window size and _rightAlignEdge below - widening only the window
        // would leave \> values stopping at the widest line's end instead.
        // LEFT PADDING -----
        // Text drawn at contents x 0 loses whatever its outline strokes left
        // of that (bold's heavier outline visibly clips), so every entry -
        // portrait, text, and _rightAlignEdge with it - is shifted right by
        // TOOLTIP_LEFT_PADDING, and the window widened to match.
        const left = TOOLTIP_LEFT_PADDING
        const chrome = this.padding * 3 + left
        const w = Math.max(
            ...sizedEntries.filter(Boolean).map((e) => e.width),
            this._minTooltipWidthFinal - chrome,
            0
        )
        const entries = rawEntries.map(
            (entry, i) => sizedEntries[i] || measureEntry(entry, w)
        )
        const h = entries.reduce((sum, e) => sum + e.height, 0)

        this.width = w + chrome
        this.height = h + this.padding * 2
        if (!this.tooltipActive && !this._useOpenAnimation) {
            this.opacity = 0
            this.contentsOpacity = 0
        } else if (this._useOpenAnimation) {
            this.opacity = 255
            this.contentsOpacity = 255
        }

        this.createContents()
        this._rightAlignEdge = left + w

        this._typewriterQueue = []
        this._typewriterState = null
        let y = 0
        for (const entry of entries) {
            if (entry.face) this.drawTooltipPortrait(entry.face, left, y)
            const textY = y + Math.floor((entry.height - entry.textHeight) / 2)
            const textX = left + entry.indent
            if (this._charsPerFrame > 0) {
                this._typewriterQueue.push({
                    text: entry.text,
                    x: textX,
                    y: textY,
                    state: entry.state || null,
                })
            } else {
                this._state = entry.state || null
                this.drawTextEx(entry.text, textX, textY, this.width)
            }
            y += entry.height
        }
    }

    // --------------------------------TYPEWRITER----------------------------------//
    // Same idea as Window_Message.updateMessage: the normal drawTextEx loop
    // (processCharacter + flushTextState), spread over frames. Starts once the
    // window is fully open, like message text does.

    /** Types _charsPerFrame visible characters; OK/cancel/click finishes instantly. */
    Window_StateTooltip.prototype.updateTypewriter = function () {
        if (!this.isTyping() || !this.isOpen()) return
        const skip =
            Input.isTriggered("ok") ||
            Input.isTriggered("cancel") ||
            TouchInput.isTriggered()
        let budget = skip ? Infinity : this._charsPerFrame
        while (budget > 0 && this.isTyping()) {
            if (!this._typewriterState) this.startNextTypewriterEntry()
            const textState = this._typewriterState
            while (budget > 0 && textState.index < textState.text.length) {
                // Escape codes and \n cost nothing, so a frame always ends
                // having drawn _charsPerFrame real characters.
                const c = textState.text[textState.index]
                this.processCharacter(textState)
                if (c.charCodeAt(0) >= 0x20) budget--
            }
            this.flushTextState(textState)
            if (textState.index >= textState.text.length) {
                this._typewriterState = null
            }
        }
    }

    /** Pops the next queued entry and builds its textState (as drawTextEx would). */
    Window_StateTooltip.prototype.startNextTypewriterEntry = function () {
        const entry = this._typewriterQueue.shift()
        this._state = entry.state
        this.resetFontSettings()
        this._typewriterState = this.createTextState(
            entry.text,
            entry.x,
            entry.y,
            this.width
        )
    }

    /** @returns {boolean} true while any text is still waiting to be typed */
    Window_StateTooltip.prototype.isTyping = function () {
        return !!this._typewriterState || this._typewriterQueue.length > 0
    }

    /**
     * Builds and renders a battler's full tooltip (name header + states).
     * @param {Game_Battler} battler
     */
    Window_StateTooltip.prototype.setup = function (battler) {
        this._battler = battler
        this._item = null

        // Hidden states are dropped before mapping; a state with no JSON
        // entry still gets a name-only header.
        const stateEntries = this._battler
            .states()
            .filter((state) => !isStateTooltipHidden(state))
            .map((state) => ({
                state,
                text:
                    stateTooltipText(state, this._battler) ||
                    `\x1bST[1]${state.name}\x1bST[0]\x1bI[${state.iconIndex}]`,
            }))

        // Battler's own name always leads the tooltip, with the actor's
        // face portrait beside it when they have one (enemies don't).
        const nameEntry = {
            state: null,
            text: `\x1bTI[1]${battler.name()}\x1bTI[0]`,
            face: null,
        }
        if (battler.isActor() && battler.faceName()) {
            nameEntry.face = {
                name: battler.faceName(),
                index: battler.faceIndex(),
            }
            // PORTRAIT LOADING -----
            // A face sheet that isn't loaded yet would blt as nothing, so
            // this redraws once it arrives - unless the window has moved on
            // to another battler or an item by then.
            const bitmap = ImageManager.loadFace(nameEntry.face.name)
            if (!bitmap.isReady()) {
                bitmap.addLoadListener(() => {
                    if (this._battler === battler) this.setup(battler)
                })
            }
        }
        if (stateEntries.length > 0)
            this.renderEntries([nameEntry].concat(stateEntries))
    }

    /**
     * Draws a face sheet cell scaled down to TOOLTIP_PORTRAIT_SIZE square.
     * @param {{name:string, index:number}} face
     * @param {number} x
     * @param {number} y
     */
    Window_StateTooltip.prototype.drawTooltipPortrait = function (face, x, y) {
        const bitmap = ImageManager.loadFace(face.name)
        const pw = ImageManager.faceWidth
        const ph = ImageManager.faceHeight
        const sx = (face.index % 4) * pw
        const sy = Math.floor(face.index / 4) * ph
        const size = TOOLTIP_PORTRAIT_SIZE
        this.contents.blt(bitmap, sx, sy, pw, ph, x, y, size, size)
    }

    //============================================================================//
    //                                DATA LOOKUPS                                //
    //============================================================================//

    /**
     * Icon per element ID, in $dataSystem.elements order: (none), Crushing,
     * Slashing, Piercing, Fire, Acid, Blast, Bullet, Armor Piercing, Flesh,
     * Cold, Shock, Shadow.
     * @type {number[]}
     */
    const elementIconIDs = [
        0, 148, 149, 150, 11, 12, 47, 233, 297, 1087, 21, 23, 1183,
    ]

    /**
     * Param ID (0-9: Max HP ... Luck, then Hit and Evasion) -> icon index.
     * @type {Map<number, number>}
     */
    const paramIconMap = new Map([
        [0, 515], //MaxHP - Heart
        [1, 23], //MaxSTM - Bolt
        [2, 678], //ATK - Knife
        [3, 859], //DEF - Shield
        [4, 192], //B.ATK - Gun
        [5, 852], //B.DEF - Military Helmet
        [6, 86], //Agility - Motorbike
        [7, 580], //Luck - Dice
        [8, 40], //Hit Rate - Eye
        [9, 861], //Evasion - Target
    ])
    /**
     * Param trait (TRAIT_PARAM) dataId 0-7 -> icon index.
     * @type {Map<number, number>}
     */
    const traitParamIconMap = new Map([
        [0, 515], //MaxHP - Heart
        [1, 23], //MaxSTM - Bolt
        [2, 678], //ATK - Knife
        [3, 859], //DEF - Shield
        [4, 192], //B.ATK - Gun
        [5, 852], //B.DEF - Military Helmet
        [6, 86], //Agility - Motorbike
        [7, 580], //Luck - Dice
    ])
    /**
     * Ex-param trait (TRAIT_XPARAM) dataId 0-9 -> icon index (0 = no icon).
     * @type {Map<number, number>}
     */
    const exParamIconMap = new Map([
        [0, 40], //Hit Rate - Eye
        [1, 861], //Evasion - Target
        [2, 275], //Crit - Laser
        [3, 1098], //Crit Evasion - Boot
        [4, 0], //Magic Evasion
        [5, 0], //Magic Reflection
        [6, 733], //Counter - Target
        [7, 0], //HP Regen
        [8, 0], //STM Regen
        [9, 0], //Ammo Regen
    ])

    /**
     * States that come in numbered variants (e.g. Bleed 1/2/3), merged into
     * one entry like "Bleed 1,2,3" (see mergeStateVariations).
     * Key: the group's display name. Value: variant state ID -> its label,
     * in the order the labels are listed.
     * @type {Map<string, Object<number, string>>}
     */
    const stateVariationsMap = new Map([
        ["Bleed", { 11: "1", 12: "2", 13: "3" }],
        ["Disease", { 60: "1", 61: "2", 62: "3" }],
        ["Swarm", { 170: "1", 171: "2", 172: "3" }],
        ["Philpower", { 230: "1", 231: "2", 232: "3" }],
        ["Scriv", { 305: "1", 306: "2", 307: "3", 308: "4", 309: "5" }],
        ["Sharpen", { 311: "1", 312: "2", 313: "3", 314: "4", 315: "5" }],
        ["Spinal Control", { 275: "UL", 276: "UR", 277: "LL", 278: "LR" }],
        ["Petrifying", { 270: "1", 271: "2", 272: "3" }],
    ])

    /**
     * Reverse lookup built once from stateVariationsMap: state id -> which
     * group it belongs to, its label, and its position within the group.
     * @type {Map<number, {group: string, label: string, order: number}>}
     */
    const stateVariationById = new Map()
    for (const [group, variants] of stateVariationsMap) {
        Object.entries(variants).forEach(([stateId, label], order) => {
            stateVariationById.set(Number(stateId), { group, label, order })
        })
    }

    /**
     * Short display name for a param, in engine order: Max HP, Max STM,
     * Attack, Defense, Ballistics, Bull.Defense, Agility, Luck, then Hit and
     * Evasion. Used for both item params and param traits (TRAIT_PARAM).
     * @param {number} paramId
     * @returns {string|null}
     */
    function paramNameShort(paramId) {
        switch (paramId) {
            case 0:
                return "MaxHP"
            case 1:
                return "MaxSTM"
            case 2:
                return "Atk"
            case 3:
                return "Def"
            case 4:
                return "Ball."
            case 5:
                return "B.Def"
            case 6:
                return "Agi"
            case 7:
                return "Luck"
            case 8:
                return "Hit"
            case 9:
                return "Eva"
            default:
                return null
        }
    }
    /**
     * Short display name for an ex-param trait (TRAIT_XPARAM dataId, engine
     * order: Hit, Eva, Cri, Cev, Mev, Mrf, Cnt, Hrg, Mrg, Trg).
     * @param {number} xparamId
     * @returns {string|null}
     */
    function xparamNameShort(xparamId) {
        switch (xparamId) {
            case 0:
                return "Hit"
            case 1:
                return "Eva"
            case 2:
                return "Crit"
            case 3:
                return "Crit.Eva"
            case 4:
                return "M.Eva"
            case 5:
                return "M.Ref"
            case 6:
                return "Counter%"
            case 7:
                return `HP Regen`
            case 8:
                return `STM Regen`
            case 9:
                return `Ammo Regen`
            default:
                return null
        }
    }

    /**
     * Readable target description for an item/skill scope.
     * @param {number} scope - RPG.UsableItem.scope
     * @returns {string} "" for scope 0 (no target)
     */
    function itemScopeLine(scope) {
        switch (scope) {
            case 0:
                scope = ""
                break
            case 1:
                scope = "\\BS[1]1\\BS[0] Enemy"
                break
            case 2:
                scope = "\\BS[1]All\\BS[0] Enemies"
                break
            case 3:
                scope = "\\BS[1]1\\BS[0] Random Enemy"
                break
            case 4:
                scope = "\\BS[1]2\\BS[0] Random Enemies"
                break
            case 5:
                scope = "\\BS[1]3\\BS[0] Random Enemies"
                break
            case 6:
                scope = "\\BS[1]4\\BS[0] Random Enemies"
                break
            case 7:
                scope = "\\BS[1]1\\BS[0] Party Member"
                break
            case 8:
                scope = "\\BS[1]All\\BS[0] Party Members"
                break
            case 9:
                scope = "\\BS[1]1\\BS[0] Dead Party Member"
                break
            case 10:
                scope = "\\BS[1]All\\BS[0] Dead Party Members"
                break
            case 11:
                scope = "\\BS[1]User\\BS[0]"
                break
            case 12:
                scope = "\\BS[1]1\\BS[0] Party Member"
                break
            case 13:
                scope = "\\BS[1]All\\BS[0] Party Members"
                break
            case 14:
                scope = "\\BS[1]Everyone\\BS[0]"
                break
        }
        return scope
    }

    const MAX_ITEM_TYPES = 2

    /**
     * Item type labels in priority order - itemTypeLine shows the first
     * MAX_ITEM_TYPES that match. Every rule is tested independently, so
     * unlike switch fallthrough, a match never forces the rules below it.
     * @type {Array<[string, function(string[], RPG.Item): boolean]>}
     */
    const ITEM_TYPE_RULES = [
        ["Crafting Item", (tags) => tags.includes("CRAFT")],
        [
            "Food",
            (tags) =>
                ["FOOD", "SNACK", "SANDWICH"].some((t) => tags.includes(t)),
        ],
        ["Cooking Ingredient", (tags) => tags.includes("COOK")],
        ["Coin", (tags) => tags.includes("COIN")],
        ["Healing", (tags) => tags.includes("MEDICAL")],
        ["Combat Item", (_, item) => item.occasion === 1],
        ["Valuable", (tags) => tags.includes("VALUABLES")],
        ["Planetary Disc", (tags) => tags.includes("DISCOBJ")],
    ]

    /** Finds the best suited item type(s) based on the item's types
     * @param {string[]} arr - an array with all of the item types
     * @param {RPG.Item} item
     * @returns {string} up to MAX_ITEM_TYPES labels joined by " & ", or the
     *   description's leading [bracket] note / "Item" if none match
     */
    function itemTypeLine(arr, item) {
        if (!Array.isArray(arr)) return "Item"
        const itemTypes = ITEM_TYPE_RULES.filter(([, test]) => test(arr, item))
            .map(([label]) => label)
            .slice(0, MAX_ITEM_TYPES)
        if (itemTypes.length > 0) return itemTypes.join(" & ")
        return getTextFromLeadingBracketNote(item.description) || "Item"
    }

    const skillTypeIdMap = [
        {
            "Video Game Skill": [
                401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413,
                414, 415, 416, 417, 418, 419, 420, 421,
            ],
        },
        { "Aster Skill": [851, 852, 853, 854, 855, 856, 857] },
        { "Audrey Skill": [611, 612, 614, 621] },
        { "Machine Skill": [613, 615, 616, 617, 618, 619, 620, 622, 623] },
        {
            "Dan Skill": [
                349, 350, 351, 352, 353, 354, 355, 356, 357, 358, 359, 360, 361,
                362, 363, 364, 366, 367,
            ],
        },
        { "Ernest Skill": [552, 553, 554] },
        { "Ernest Song": [557, 558, 559, 560, 561] },
        { "Hellen Skill": [72, 73, 74, 75, 76, 77, 78] },
        { "Fallow Will Skill": [511, 512, 513, 514] },
        { "Joel Skill": [132, 133, 134, 135, 136, 138, 139] },
        { "Leigh Skill": [64, 65, 66, 67, 68, 69] },
        { "Lyle Skill": [438, 439, 440, 441, 442, 443] },
        { "Monty Skill": [142, 144, 145, 146, 147, 148, 149] },
        { "Morton Skill": [159, 160, 161, 162] },
        {
            "Fidget Item": [
                163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175,
                176, 177,
            ],
        },
        { "Papineau Skill": [111, 112, 113] },
        { "Phillipe Skill": [652, 653, 654, 655, 656, 657] },
        { "\\N[8] Skill": [54, 522, 523, 524, 525, 526, 527, 528, 529] },
        { "Roaches Skill": [382, 383, 384, 385, 386, 387, 388, 389, 391, 393] },
        {
            "Shadow Skill": [
                321, 322, 323, 324, 325, 326, 327, 328, 329, 330, 331, 332, 333,
                334, 335, 336, 337, 338, 339, 340, 341,
            ],
        },
        {
            "Sophie Skill": [
                179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189,
            ],
        },
        { "Xaria Skill": [151, 152, 153, 154, 155, 156, 157] },
        {
            "Weapon Skill": [
                5, 22, 36, 87, 92, 105, 106, 191, 201, 202, 203, 204, 205, 206,
                209, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 225, 226,
                227, 228, 229, 230, 231, 234, 390, 467, 468, 469, 470, 471, 599,
                637, 663, 664, 665, 666, 667, 681, 682, 683, 684, 685, 708, 709,
                710, 716, 718, 719, 753, 757, 926, 963, 1035, 1036, 1037, 1038,
                1039, 1040, 1041, 1042, 1043, 1044, 1045,
            ],
        },
        {
            "Equipment Skill": [
                90, 110, 117, 436, 461, 492, 707, 736, 739, 740, 741, 742, 743,
                744, 745, 873, 882, 887, 888,
            ],
        },
        {
            Reload: [
                271, 272, 273, 274, 275, 276, 277, 278, 279, 280, 281, 282, 283,
                284, 285, 286, 287, 288, 289, 290, 291, 292, 293, 306, 307,
            ],
        },
        { "Word Skill": [874, 875, 876, 877, 878, 879, 880] },
    ]
    /**
     * Skill ID -> skill type label, flattened once from skillTypeIdMap so a
     * hover is a single lookup. An ID listed under two labels keeps the
     * later one.
     * @type {Map<number, string>}
     */
    const skillTypeById = new Map(
        skillTypeIdMap.flatMap((group) =>
            Object.entries(group).flatMap(([label, ids]) =>
                ids.map((id) => [id, label])
            )
        )
    )
    /**
     * Stand-in "b" for tooltip damage formulas: an enemy with 0 in every
     * stat and no states. Formulas call methods on b (isStateAffected,
     * isActor, ...), so those exist too - any call missing here throws and
     * the damage line is simply left out.
     */
    const dummyTarget = {
        isStateAffected: () => false,
        isActor: () => false,
        isEnemy: () => true,
        isAlive: () => true,
        isDead: () => false,
        hpRate: () => 1,
        mpRate: () => 1,
        roachSwarmRatio: () => 1,
        vocabBonus: () => 1,
        agi: 0,
        atk: 0,
        cev: 0,
        cnt: 0,
        cri: 0,
        def: 0,
        eva: 0,
        exr: 0,
        fdr: 0,
        grd: 0,
        hit: 0,
        hp: 0,
        hrg: 0,
        level: 1,
        luk: 0,
        mat: 0,
        mcr: 0,
        mdf: 0,
        mdr: 0,
        mev: 0,
        mhp: 0,
        mmp: 0,
        mp: 0,
        mrf: 0,
        mrg: 0,
        pdr: 0,
        pha: 0,
        rec: 0,
        tcr: 0,
        tgr: 0,
        tp: 0,
        trg: 0,
    }

    //============================================================================//
    //                   ITEM/WEAPON/ARMOR TOOLTIP CONTENT                        //
    //============================================================================//

    // -----------------------------STAT BLOCK & TRAITS----------------------------//

    /**
     * "Stats" section for a weapon/armor: non-zero base params, then the
     * param/ex-param/sp-param, Attack Times+ and Action Times+ traits.
     * @param {RPG.Weapon|RPG.Armor} item
     * @returns {string[]|null}
     */
    function itemStatBlockLines(item) {
        const lines = []

        for (let i = 0; i < 8; i++) {
            const value = item.params[i]
            if (!value) continue
            const sign = value > 0 ? "+" : ""
            const icon = paramIconMap.get(i)
            lines.push(
                `\\I[${icon}]\\BS[1]\\IT[1]${paramNameShort(i)}\\BS[0]\\IT[0]\\>\\BS[1]${sign}${value}\\BS[0]`
            )
        }

        for (const t of item.traits) {
            if (!t.code) continue
            let name = ""
            let icon = ""
            let percent = 0
            let sign = ""
            let unit = "%"
            if (t.code === Game_BattlerBase.TRAIT_ATTACK_TIMES) {
                // Flat extra hits, added to the wearer's attack skill only
                // (see itemRepeats).
                if (!t.value) continue
                name = "Attacks"
                icon = 627
                percent = t.value
                sign = percent > 0 ? "+" : ""
                unit = ""
            } else if (t.code === Game_BattlerBase.TRAIT_ACTION_PLUS) {
                // Chance per turn of one extra action (Game_Battler.makeActionTimes).
                if (!t.value) continue
                name = "Extra Action"
                icon = 141
                percent = Math.round(t.value * 100)
            } else if (t.code === Game_BattlerBase.TRAIT_SPARAM) {
                switch (t.dataId) {
                    case 0:
                        name = "Target Rate"
                        icon = 13
                        break
                    case 6:
                        name = "Dmg Taken"
                        icon = 73
                        break
                    case 7:
                        name = "B.Dmg Taken"
                        icon = 73
                        break
                    default:
                        continue
                }

                percent = Math.round(t.value * 100)
                sign = percent > 0 ? "+" : ""
            } else if (t.code === Game_BattlerBase.TRAIT_PARAM) {
                if (t.value === 0) continue
                name = paramNameShort(t.dataId)
                icon = traitParamIconMap.get(t.dataId)
                percent = Math.round(t.value * 100) - 100
                sign = percent > 0 ? "+" : ""
                if (!name) continue
            } else if (t.code === Game_BattlerBase.TRAIT_XPARAM) {
                if (t.value === 0) continue
                name = xparamNameShort(t.dataId)
                icon = exParamIconMap.get(t.dataId)
                percent = Math.round(t.value * 100)
                sign = percent > 0 ? "+" : ""
                if (!name || name === "Hit Rate") continue
            } else continue

            lines.push(
                `\\I[${icon}]\\BS[1]\\IT[1]${name}\\IT[0]\\BS[0]\\>\\BS[1]${sign}${percent}${unit}\\BS[0]`
            )
        }

        if (lines.length === 0) return null
        lines.splice(0, 0, `\\LB[1]Stats\\LB[0]`)
        return lines
    }

    //============================================================================//
    //                                WEAPON DATA                                 //
    //============================================================================//

    // Two-handed weapons have no dedicated flag in this project - they work
    // by sealing the "Ranged" equip slot (TRAIT_EQUIP_SEAL), looked up by
    // name in case the equip type list is ever reordered.
    /** @param {RPG.Weapon} item @returns {boolean} */
    function isTwoHandedWeapon(item) {
        const rangedEtypeId = $dataSystem.equipTypes.indexOf("Ranged")
        if (rangedEtypeId < 0) return false
        return item.traits.some(
            (t) =>
                t.code === Game_BattlerBase.TRAIT_EQUIP_SEAL &&
                t.dataId === rangedEtypeId
        )
    }

    /**
     * A weapon's damage-type + handedness line, from its TRAIT_ATTACK_ELEMENT
     * traits (a weapon may carry more than one element).
     * @param {RPG.Weapon} item
     * @returns {string}
     */
    function weaponDamageLine(item) {
        const elementNames = item.traits
            .filter((t) => t.code === Game_BattlerBase.TRAIT_ATTACK_ELEMENT)
            .map((t) => $dataSystem.elements[t.dataId])
            .filter(Boolean)
        const handedness = isTwoHandedWeapon(item) ? "2H" : "1H"
        if (elementNames.length === 0) return `\\ST[1]${handedness}\\ST[0]`
        return `\\ST[1]${handedness} ${elementNames.join("/")}\\ST[0]`
    }

    /**
     * Chance-to-inflict lines from the weapon's TRAIT_ATTACK_STATE traits.
     * @param {RPG.Weapon} item
     * @returns {string[]|null}
     */
    function weaponAttackStateLines(item) {
        const inflictions = item.traits
            .filter((t) => t.code === Game_BattlerBase.TRAIT_ATTACK_STATE)
            .map((t) => ({
                stateId: t.dataId,
                value: Math.round(t.value * 100),
            }))
        // mergeAll: variants usually have falling chances (e.g. Bleed 1/2/3 at
        // 30/10/5%), so they're merged into one "30/10/5%" line regardless.
        const lines = mergeStateVariations(inflictions, { mergeAll: true }).map(
            ({ state, name, values }) =>
                `\\I[${state.iconIndex}]\\BS[1]\\IT[1]${name}\\IT[0]\\BS[0]\\>\\BS[1]${formatVariantValues(values)}%\\BS[0]`
        )
        if (lines.length === 0) return null
        lines.splice(0, 0, `\\LB[1]On Hit:\\LB[0]`)
        return lines
    }

    //============================================================================//
    //                                 ARMOR DATA                                 //
    //============================================================================//

    /** Armor's equip slot label (e.g. "Body Gear"). @param {RPG.Armor} item @returns {string|null} */
    function armorSlotLine(item) {
        const name = $dataSystem.equipTypes[item.etypeId]
        // Ranged gear is armor in this project - armor types 5 "Firearm",
        // 6 "Two Handed Ranged", 8 "Slingshot".
        if (item.atypeId === 5) {
            return `\\ST[1]1H Ranged\\ST[0]`
        }
        if (item.atypeId === 6) {
            return `\\ST[1]2H Ranged\\ST[0]`
        }
        if (item.atypeId === 8) {
            return `\\ST[1]1H Slingshot\\ST[0]`
        }
        switch (true) {
            case name === "Accessory":
                return `\\ST[1]Accessory\\ST[0]`
            case name === "Jewelry":
                return `\\ST[1]Jewelry\\ST[0]`
            default:
                return name ?
                        `\\ST[1]${name} Gear\\ST[0]`
                    :   `\\ST[1]Gear\\ST[0]`
        }
    }

    /**
     * State-rate deviations from normal (TRAIT_STATE_RATE, value !== 1).
     * @param {RPG.Armor} item
     * @returns {string[]|null}
     */
    function armorStateRateLines(item) {
        const statusEffects = mergeStateVariations(
            item.traits
                .filter(
                    (t) =>
                        t.code === Game_BattlerBase.TRAIT_STATE_RATE &&
                        t.value !== 1
                )
                .map((t) => ({
                    stateId: t.dataId,
                    value: Math.round((t.value - 1) * 100),
                }))
        )
        // Counted after merging, so "Bleed 1,2,3" only counts as one line.
        const compact = statusEffects.length >= 6
        const lines = statusEffects.map(({ state, name, value }) => {
            const sign = value > 0 ? "+" : ""
            return compact ?
                    `\\BS[1]${sign}${value}%\\BS[0]\\BS[1]\\IT[1]${name}\\I[${state.iconIndex}]\\IT[0]\\BS[0]`
                :   `\\I[${state.iconIndex}]\\BS[1]\\IT[1]${name}\\IT[0]\\BS[0]\\>\\BS[1]${sign}${value}%\\BS[0]`
        })
        if (lines.length === 0) return null
        lines.splice(0, 0, `\\LB[1]Status Effects\\LB[0]`)
        return lines
    }

    /**
     * Full state immunities (TRAIT_STATE_RESIST): a label line, then the
     * state names comma-joined on one line.
     * @param {RPG.Armor} item
     * @returns {string[]|null}
     */
    function armorStateResistLine(item) {
        const resisted = item.traits
            .filter((t) => t.code === Game_BattlerBase.TRAIT_STATE_RESIST)
            .map((t) => ({ stateId: t.dataId, value: null }))
        const names = mergeStateVariations(resisted).map(
            ({ state, name }) => `\\I[${state.iconIndex}]\\BS[1]${name}\\BS[0]`
        )
        if (names.length === 0) return null
        return [`\\LB[1]Immune against\\LB[0]`, `\\JU ${names.join(", ")}`]
    }

    /**
     * Incoming elemental damage adjustments (TRAIT_ELEMENT_RATE, value !== 1).
     * Up to 3 get a right-aligned line each; more are listed as one \JU list.
     * @param {RPG.Armor} item
     * @returns {string[]|null}
     */
    function armorElementRateLines(item) {
        const adjustments = item.traits
            .filter(
                (t) =>
                    t.code === Game_BattlerBase.TRAIT_ELEMENT_RATE &&
                    t.value !== 1
            )
            .map((t) => {
                const percent = Math.round((t.value - 1) * 100)
                return {
                    icon: elementIconIDs[t.dataId] || 0,
                    name: `${$dataSystem.elements[t.dataId]} DMG`,
                    value: `${percent > 0 ? "+" : ""}${percent}%`,
                }
            })
        if (adjustments.length === 0) return null
        const header = `\\LB[1]Damage Adjust\\LB[0]`
        if (adjustments.length > 3) {
            const list = adjustments.map(
                (a) => `\\I[${a.icon}]${a.name} \\BS[1]${a.value}\\BS[0]`
            )
            return [header, `\\JU ${list.join(", ")}`]
        }
        return [header].concat(
            adjustments.map(
                (a) =>
                    `\\BS[1]\\I[${a.icon}]\\IT[1]${a.name}\\IT[0]\\BS[0]\\>\\BS[1]${a.value}\\BS[0]`
            )
        )
    }

    //============================================================================//
    //                             ITEM & SKILL DATA                              //
    //============================================================================//

    // ------------------------RECOVERY / STATE EFFECT LINES-----------------------//
    // Items and skills describe their effects through their effects list.
    // Recover HP/STM and add/remove state are shown here, weapon on-hit
    // states by itemAttackStateLines; other effect types (gain TP, grow,
    // learn skill, common event, ...) only show through the JSON extra lines.

    /**
     * Subtitle line naming an item's type: from its note tags (including the
     * WD_Items tag's words) matched against ITEM_TYPE_RULES, else the
     * description's leading [bracket] text.
     * @param {RPG.Item} item
     * @returns {string}
     */
    function grabLeadingBracketNoteForItem(item) {
        let itemType = ""
        const metaObj = item.meta
        const contendersArr = [""]
        // Meta keys are case-sensitive as typed in the note box, so WD_Items
        // is found case-insensitively and read back through its real key.
        let wdKey = null
        for (const [key, value] of Object.entries(metaObj)) {
            if (key.toUpperCase() === "WD_ITEMS") {
                wdKey = key
                continue
            }
            // A bare <tag> is meta value true, not a string.
            if (typeof value !== "string") continue
            const match = value.match(/[a-zA-Z]*/)
            if (!match[0]) continue
            contendersArr.push(match[0].toUpperCase())
        }

        if (wdKey && typeof metaObj[wdKey] === "string") {
            for (const entry of metaObj[wdKey].split(" ")) {
                if (entry !== "") contendersArr.push(entry.toUpperCase())
            }
        }

        itemType = itemTypeLine(contendersArr, item)

        const capitalizedItemType =
            String(itemType).charAt(0).toUpperCase() +
            String(itemType).slice(1).toLowerCase()
        return `\\ST[1]${capitalizedItemType}\\ST[0]`
    }

    /**
     * Formats a combined "rate% + flat" recovery/loss amount.
     * @param {number} rate - fraction of max (e.g. 0.1 for 10%)
     * @param {number} flat
     * @param {string} label - e.g. "Health"
     * @returns {[string, string]|[]} [verb, formatted line], or [] if both are 0
     */
    function recoverAmountLine(rate, flat, label) {
        const parts = []
        if (rate) parts.push(`${Math.round(Math.abs(rate) * 100)}%`)
        if (flat) parts.push(`${Math.abs(flat)}`)
        if (parts.length === 0) return []
        const isLoss = rate < 0 || (rate === 0 && flat < 0)
        const verb = isLoss ? "Lose" : "Recover"
        if (label === "HP") {
            return [
                `${verb}`,
                `\\BS[1]${parts.join(" + ")}\\BS[0]\\C[11] ${label}\\C[${textColor}]`,
            ]
        } else if (label === "STM") {
            return [
                `${verb}`,
                `\\BS[1]${parts.join(" + ")}\\BS[0]\\C[23] ${label}\\C[${textColor}]`,
            ]
        } else {
            return [`${verb}`, `\\BS[1]${parts.join(" + ")}\\BS[0] ${label}`]
        }
    }

    /** Combined "Recover:"/"Lose:" lines for an item's HP/STM effects. @param {RPG.Item} item @returns {string[]} */
    function itemRecoverLines(item) {
        let hpRate = 0,
            hpFlat = 0,
            hasHp = false
        let mpRate = 0,
            mpFlat = 0,
            hasMp = false
        for (const effect of item.effects) {
            if (effect.code === Game_Action.EFFECT_RECOVER_HP) {
                hasHp = true
                hpRate += effect.value1
                hpFlat += effect.value2
            } else if (effect.code === Game_Action.EFFECT_RECOVER_MP) {
                hasMp = true
                mpRate += effect.value1
                mpFlat += effect.value2
            }
        }

        const basic = $dataSystem.terms.basic
        let recoverLines = []
        let loseLines = []
        if (hasHp) {
            const [verb, line] = recoverAmountLine(hpRate, hpFlat, basic[3])
            if (verb === "Lose") loseLines.push(line)
            else recoverLines.push(line)
        }
        if (hasMp) {
            const [verb, line] = recoverAmountLine(mpRate, mpFlat, basic[5])
            if (verb === "Lose") loseLines.push(line)
            else recoverLines.push(line)
        }
        if (loseLines.length !== 0) {
            if (loseLines.length <= 2) {
                const oneliner = [
                    `\\LB[1]Lose:\\LB[0]\\>${loseLines.join(", ")}`,
                ]
                loseLines = oneliner
            } else {
                loseLines.splice(0, 0, `\\LB[1]Lose:\\LB[0]`)
            }
        }
        if (recoverLines.length !== 0) {
            if (recoverLines.length <= 2) {
                const oneliner = [
                    `\\LB[1]Recover:\\LB[0]\\>${recoverLines.join(", ")}`,
                ]
                recoverLines = oneliner
            } else {
                recoverLines.splice(0, 0, `\\LB[1]Recover:\\LB[0]`)
            }
        }

        return recoverLines.concat(loseLines)
    }

    /**
     * One "Verb: A, B, C" \JU list line for a set of states, or - when
     * several have a chance below 100% - a header plus one right-aligned
     * "State ... 50%" line each. Variant states are merged (Bleed 1,2,3) and
     * icon-less (internal) states are skipped.
     * @param {string} verb - e.g. "Inflicts" / "Cures"
     * @param {Map<number, number>} stateChances - stateId -> chance (0-1)
     * @returns {string[]}
     */
    function groupedStateLines(verb, stateChances) {
        let hasChances = false
        const combined = []
        const expanded = []
        const entries = [...stateChances].map(([stateId, chance]) => ({
            stateId,
            value: Math.round(chance * 100),
        }))
        // mergeAll, same as weaponAttackStateLines: variants with different
        // chances still merge, into e.g. "50/40% Bleed 1,2".
        const mergedEntries = mergeStateVariations(entries, { mergeAll: true })
        for (const { state, name, values } of mergedEntries) {
            // iconIndex 0 marks a purely internal/bookkeeping state - skip it,
            // same convention Game_BattlerBase.allIcons() uses.
            if (state.iconIndex === 0) continue
            const prefix =
                values.every((v) => v >= 100) ? "" : (
                    `${formatVariantValues(values)}%`
                )
            if (prefix !== "") {
                hasChances = true
                combined.push(
                    `\\I[${state.iconIndex}]${name}\\BS[1](${prefix})\\BS[0]`
                )
                expanded.push(
                    `\\I[${state.iconIndex}]${name}\\>\\BS[1]${prefix}\\BS[0]`
                )
            } else {
                combined.push(`\\I[${state.iconIndex}]${name}`)
                expanded.push(
                    `\\I[${state.iconIndex}]${name}\\>\\BS[1]100%\\BS[0]`
                )
            }
        }
        if (combined.length === 0) return []
        const lines = []
        if (hasChances && combined.length > 1) {
            lines.push(`\\LB[1]${verb}:\\LB[0]`, ...expanded)
        } else {
            lines.push(`\\LB[1]${verb}:\\LB[0]\\>\\JU ${combined.join(", ")}`)
        }

        return lines
    }

    /**
     * "Grants:" (the <ApplyState:n> note tag), "Cures:" and "Inflicts:"
     * lines for an item/skill. Duplicate effects on the same state keep only
     * the highest chance.
     * @param {RPG.UsableItem} item
     * @returns {string[]}
     */
    function itemStateEffectLines(item) {
        const addChances = new Map()
        const removeChances = new Map()
        const grantSelf = new Map()
        const applyStateMatch = /<ApplyState:(\d+)>/.exec(item.note)
        if (applyStateMatch) grantSelf.set(parseInt(applyStateMatch[1]), 1)
        for (const effect of item.effects) {
            // dataId 0 on EFFECT_ADD_STATE means "whatever the user's weapon
            // inflicts on attack" rather than a specific state - shown by
            // itemAttackStateLines instead.
            if (
                effect.code === Game_Action.EFFECT_ADD_STATE &&
                effect.dataId > 0
            ) {
                addChances.set(
                    effect.dataId,
                    Math.max(addChances.get(effect.dataId) || 0, effect.value1)
                )
            } else if (effect.code === Game_Action.EFFECT_REMOVE_STATE) {
                removeChances.set(
                    effect.dataId,
                    Math.max(
                        removeChances.get(effect.dataId) || 0,
                        effect.value1
                    )
                )
            }
        }

        return groupedStateLines("Grants", grantSelf)
            .concat(groupedStateLines("Cures", removeChances))
            .concat(groupedStateLines("Inflicts", addChances))
    }

    /**
     * The database object that makes a skill an actor's attack skill: the
     * first state/actor/class/equip with an Attack Skill trait for it (e.g. a
     * rifle for Buttstroke, Grinning Beast for Claw). Plain Attack has no
     * trait, so it falls back to the main weapon.
     * @param {Game_Actor} user
     * @param {number} skillId - the user's attackSkillId()
     * @returns {RPG.BaseItem|RPG.State|RPG.Class|null} null when unarmed
     */
    function attackSkillSource(user, skillId) {
        const granter = user
            .traitObjects()
            .find((obj) =>
                obj.traits.some(
                    (t) =>
                        t.code === Game_BattlerBase.TRAIT_ATTACK_SKILL &&
                        t.dataId === skillId
                )
            )
        if (granter) return granter
        if (user.hasNoWeapons())
            return { name: "Unarmed Attack", iconIndex: 531 }
        return (user.weapons && user.weapons()[0]) || null
    }

    /**
     * Subtitle label for a skill: the granting weapon/gear/state for the
     * user's attack skill, "Firearm Skill" for ammo-using skills, else its
     * skillTypeById entry, else its database skill type.
     * @param {RPG.Skill} item
     * @param {Scene_Base|null} scene - used to find the acting actor
     * @returns {{text: string, isAttackSkill: boolean, icon: number}}
     */
    function getSkillInfo(item, scene) {
        if (/<ammoUse/.test(item.note)) {
            return { text: "Firearm Skill", isAttackSkill: false, icon: 0 }
        }
        // ATTACK SKILL -----
        // Same test as Game_Action.isAttack, so every source counts:
        // weapon/ranged-gear traits, states that force one, the class.
        const user = formulaUserFor(scene)
        if (user && item === $dataSkills[user.attackSkillId()]) {
            const source = attackSkillSource(user, item.id)
            if (source) {
                return {
                    text: source.name,
                    icon: source.iconIndex || 0,
                    isAttackSkill: true,
                }
            }
        }
        const mapped = skillTypeById.get(item.id)
        if (mapped) return { text: mapped, isAttackSkill: false, icon: 0 }
        return {
            text:
                item.stypeId === 0 ?
                    "Skill"
                :   $dataSystem.skillTypes[item.stypeId],
            isAttackSkill: false,
            icon: 0,
        }
    }

    /**
     * Target + damage lines for a skill/item's damage formula ("Target 1
     * Enemy making One Attack to it" / "Attack Deals X DMG"), or "Restores X
     * HP" for HP/STM recover types. Empty when there's no formula or it can't
     * be evaluated outside a real action.
     * @param {RPG.UsableItem} item
     * @param {Scene_Base|null} scene - used to find the acting actor
     * @returns {string[]}
     */
    function itemDamageLine(item, scene) {
        const type = item.damage.type
        if (!type || !item.damage.formula) return []

        const dmg = evalDamageFormula(item, scene)
        if (dmg === 0) {
            const target = itemTargetLine(item)
            return target === "" ? [] : `\\LB[1]Target:\\LB[0]\\>${target}`
        }

        // elementId -1 is "Normal Attack" (the weapon's element), 0 is none.
        const elementId = item.damage.elementId
        const elementDmg =
            elementId > 0 && $dataSystem.elements[elementId] ?
                ` ${$dataSystem.elements[elementId]}`
            :   ""
        const dmgSpreadStr = getVarianceSpread(dmg, item.damage.variance)

        // RECOVER TYPES -----
        // 3 = HP recover, 4 = MP (STM) recover.
        if (type === 3 || type === 4) {
            const label = $dataSystem.terms.basic[type === 3 ? 3 : 5]
            return [`Restores \\BS[1]${dmgSpreadStr}\\BS[0] ${label}`]
        }

        // 2 = MP damage, 6 = MP drain.
        const resource =
            type === 2 || type === 6 ? ` ${$dataSystem.terms.basic[5]}` : ""
        const repeats = itemRepeats(item, scene)
        const target = itemTargetLine(item)
        const targetStr = target ? `Target ${target}` : ""
        const lead = target ? `${targetStr} making` : "Making"
        const attacks =
            repeats <= 1 ?
                "\\BS[1]One Attack\\BS[0]"
            :   `\\BS[1]${repeats} Attacks\\BS[0]`
        const dealing = `\\BSD[1]${dmgSpreadStr}\\BSD[0]\\BS[1]${elementDmg}${resource}\\BS[0] DMG`
        if (isSingleTargetScope(item.scope)) {
            return [
                `${lead} ${attacks} to it`,
                `${repeats <= 1 ? "Attack Deals" : "Each Attack Deals"} ${dealing}`,
            ]
        }
        return [`${lead} ${attacks} to each`, `Each Attack Deals ${dealing}`]
    }

    /**
     * Attacks per use, counted like {@link Game_Action.prototype.numRepeats}:
     * the item's own Repeat, plus the user's Attack Times+ traits (weapons,
     * armor, states) when the item is that user's attack skill.
     * @param {RPG.UsableItem} item
     * @param {Scene_Base|null} scene - used to find the acting actor
     * @returns {number}
     */
    function itemRepeats(item, scene) {
        let repeats = item.repeats
        const user = formulaUserFor(scene)
        if (
            user &&
            DataManager.isSkill(item) &&
            item === $dataSkills[user.attackSkillId()]
        ) {
            repeats += user.attackTimesAdd()
        }
        return Math.floor(repeats)
    }

    /** "Target ..." text for the damage line, or "" for scope 0 (no target). @param {RPG.UsableItem} item @returns {string} */
    function itemTargetLine(item) {
        const scopeLine = itemScopeLine(item.scope)
        return scopeLine ? `${scopeLine}` : ""
    }

    /**
     * The actor a tooltip's damage formula is evaluated for: the actor
     * choosing a command in battle, else the menu scene's actor, else the
     * party leader.
     * @param {Scene_Base|null} scene
     * @returns {Game_Actor|null}
     */
    function formulaUserFor(scene) {
        if (scene instanceof Scene_Battle) return BattleManager.actor()
        if (scene && scene._actor) return scene._actor
        return $gameParty.leader() || null
    }

    /**
     * Evaluates an item's damage formula like
     * {@link Game_Action.prototype.evalDamageFormula}, against a 0-stat dummy
     * target. Recover types (3/4) come back positive - callers word them as
     * healing.
     * @param {RPG.UsableItem} item
     * @param {Scene_Base|null} [scene=null] - used to find the user (see formulaUserFor)
     * @returns {number} the damage, or 0 if it can't be evaluated
     */
    function evalDamageFormula(item, scene = null) {
        const user = formulaUserFor(scene)
        if (!user) return 0
        try {
            // SANDBOXED USER -----
            // Formulas are live code (e.g. Mosquito Stab calls a.gainHp), so
            // eval only ever sees a throwaway copy of the real actor.
            const a = JsonEx.makeDeepCopy(user) // eslint-disable-line no-unused-vars
            const b = dummyTarget // eslint-disable-line no-unused-vars
            const v = $gameVariables._data // eslint-disable-line no-unused-vars
            const value = Math.max(eval(item.damage.formula), 0)
            return isNaN(value) ? 0 : Math.floor(value)
        } catch (e) {
            return 0
        }
    }

    /**
     * Damage range after variance, as "min~max" (same amplitude as
     * {@link Game_Action.prototype.applyVariance}), or just the value when
     * variance is 0.
     * @param {number} damage
     * @param {number} variance - percent
     * @returns {string}
     */
    function getVarianceSpread(damage, variance) {
        const amp = Math.floor(Math.max((Math.abs(damage) * variance) / 100, 0))
        if (amp === 0) return `${Math.floor(damage)}`
        const dmgMin = damage - amp
        const dmgMax = damage + amp
        return `${Math.floor(dmgMin)}~${Math.floor(dmgMax)}`
    }

    // ---------------------------STATE VARIANT MERGING----------------------------//
    /**
     * Merges variant states (see stateVariationsMap) into one entry named
     * e.g. "Bleed 1,2,3". By default only variants sharing the same value
     * merge; with mergeAll, a group always merges and each variant's value
     * is kept in `values` (in label order) for display like "30/10/5".
     * Non-variant states pass through unchanged. Entries keep first-seen
     * order; a merged entry takes its first variant's place, but the icon
     * of its lowest variant (so "Bleed 1,2,3" shows Bleed1's icon).
     * @param {{stateId: number, value: *}[]} entries - value must already be
     *   display-rounded (e.g. an integer percent) so equal values compare
     *   equal; pass null to always merge a group's variants
     * @param {{mergeAll?: boolean}} [options]
     * @returns {{state: RPG.State, name: string, value: *, values: *[]}[]}
     *   value is the lowest variant's value; values has one per variant
     */
    function mergeStateVariations(entries, { mergeAll = false } = {}) {
        const merged = []
        /** "group" or "group|value" -> the merged entry being built for it */
        const groups = new Map()
        for (const { stateId, value } of entries) {
            const state = $dataStates[stateId]
            if (!state) continue
            const variation = stateVariationById.get(stateId)
            if (!variation) {
                merged.push({ state, name: state.name, value, values: [value] })
                continue
            }
            const key =
                mergeAll ? variation.group : `${variation.group}|${value}`
            let group = groups.get(key)
            if (!group) {
                group = {
                    state,
                    name: state.name,
                    value,
                    values: [],
                    variants: [],
                }
                groups.set(key, group)
                merged.push(group)
            }
            group.variants.push({ ...variation, state, value })
        }
        for (const group of groups.values()) {
            const variants = group.variants.sort((a, b) => a.order - b.order)
            delete group.variants
            group.state = variants[0].state
            group.value = variants[0].value
            group.values = variants.map((v) => v.value)
            // A lone variant keeps its own database name (e.g. "Bleed2").
            group.name =
                variants.length < 2 ?
                    variants[0].state.name
                :   `${variants[0].group} ${variants.map((v) => v.label).join(",")}`
        }
        return merged
    }

    /**
     * Formats a merged entry's per-variant values: "30" if they're all equal,
     * otherwise "30/10/5" in label order.
     * @param {*[]} values
     * @returns {string}
     */
    function formatVariantValues(values) {
        return new Set(values).size === 1 ? String(values[0]) : values.join("/")
    }

    //============================================================================//
    //                     NOTETAG & CUSTOM MECHANIC LINES                        //
    //============================================================================//
    // Lines for mechanics that live in notetags read by other plugins
    // (bunchastuff.js, HPConsumeSkill.js) or in effects/traits the stock
    // builders above don't cover.

    /**
     * A numeric notetag value.
     * @param {RPG.BaseItem} item
     * @param {string} key - meta key, case-sensitive as typed in the note box
     * @returns {number|null} null when the tag is missing, bare, or not a number
     */
    function metaNumber(item, key) {
        const raw = item.meta && item.meta[key]
        if (typeof raw !== "string") return null
        const value = parseFloat(raw)
        return Number.isNaN(value) ? null : value
    }

    /** True for scopes that hit exactly one battler (one random enemy included). @param {number} scope @returns {boolean} */
    function isSingleTargetScope(scope) {
        return [1, 3, 7, 9, 11, 12].includes(scope)
    }

    // -------------------------------WEAPON BREAKING------------------------------//
    // durabilityCheck() in bunchastuff.js rolls, per hit, roughly
    // fragile% x skill breakRate x crit x warm-up x luck, gated by a
    // difficulty threshold. Only the weapon's base chance and the skill's
    // multiplier are shown - safe hits, break results and the rest stay hidden.

    /** Base break chance from a weapon's <fragile:n> tag. @param {RPG.Weapon} item @returns {string[]} */
    function weaponBreakChanceLine(item) {
        const fragile = metaNumber(item, "fragile")
        if (!fragile) return []
        return [`\\LB[1]Break Chance:\\LB[0]\\>\\BS[1]${fragile}%\\BS[0]`]
    }

    /**
     * A skill's <breakRate:n> multiplier on the weapon's break chance.
     * Hidden at 1x (plain Attack), "None" at 0.
     * @param {RPG.Skill} item
     * @returns {string[]}
     */
    function skillBreakRateLine(item) {
        const rate = metaNumber(item, "breakRate")
        if (rate === null || rate === 1) return []
        const value = rate === 0 ? "None" : `${rate}x`
        return [`\\LB[1]Break Multiplier:\\LB[0]\\>\\BS[1]${value}\\BS[0]`]
    }

    // ------------------------------EQUIPMENT SKILLS------------------------------//

    /** Skills a weapon/armor teaches while equipped (TRAIT_SKILL_ADD). @param {RPG.EquipItem} item @returns {string[]} */
    function equipGrantedSkillLines(item) {
        const seen = new Set()
        const names = []
        for (const t of item.traits) {
            if (t.code !== Game_BattlerBase.TRAIT_SKILL_ADD) continue
            if (seen.has(t.dataId)) continue
            seen.add(t.dataId)
            const skill = $dataSkills[t.dataId]
            if (!skill || !skill.name) continue
            // \I[0] still reserves an icon's width, so iconless skills skip
            // it - as do skills on the generic icon 77.
            const icon =
                skill.iconIndex && skill.iconIndex !== 77 ?
                    `\\I[${skill.iconIndex}]`
                :   ""
            names.push(`${icon}${skill.name}`)
        }
        if (names.length === 0) return []
        return [`\\LB[1]Skills:\\LB[0]`, `\\JU ${names.join(", ")}`]
    }

    // --------------------------------SKILL COSTS---------------------------------//

    /**
     * HP cost from HPConsumeSkill's tags: <hp_cost:n> flat plus
     * <hp_ratio:r> of the user's *current* HP (Game_BattlerBase.skillHpCost).
     * @param {RPG.Skill} item
     * @returns {string|null}
     */
    function skillHpCostPart(item) {
        const flat = metaNumber(item, "hp_cost") || 0
        const ratio = metaNumber(item, "hp_ratio") || 0
        if (!flat && !ratio) return null
        const parts = []
        if (flat) parts.push(`${flat}`)
        if (ratio) parts.push(`${Math.round(ratio * 100)}% Current`)
        return `\\BS[1]\\C[20]${parts.join(" + ")}\\BS[0]\\C[21] ${$dataSystem.terms.basic[3]}\\C[${textColor}]`
    }

    /**
     * Ammo and item costs the skill list doesn't draw: <ammoUse:n> (gun
     * ammo, see hasAmmoForShoot) and <UseItemId:n>. UseItemId is spent in
     * Game_Action.apply, which runs once per target.
     * @param {RPG.Skill} item
     * @returns {string[]}
     */
    function skillCostLines(item) {
        const parts = []
        const hpPart = skillHpCostPart(item)
        if (hpPart) parts.push(hpPart)
        const ammo = metaNumber(item, "ammoUse")
        if (ammo) parts.push(`\\BS[1]${ammo}\\BS[0] Ammo`)
        const usedItem = $dataItems[metaNumber(item, "UseItemId")]
        if (usedItem) {
            const amount =
                isSingleTargetScope(item.scope) ? "1" : "1 per Target"
            parts.push(
                `\\BS[1]${amount}\\BS[0] \\I[${usedItem.iconIndex}]${usedItem.name}`
            )
        }
        if (parts.length === 0) return []
        if (parts.length === 1) {
            return [`\\LB[1]Costs:\\LB[0]\\>${parts[0]}`]
        }
        return [`\\LB[1]Costs:\\LB[0]`, parts.join(", ")]
    }

    // -------------------------------SKILL EXTRAS---------------------------------//

    /** Per-hit success chance when below 100%. @param {RPG.UsableItem} item @returns {string[]} */
    function itemSuccessRateLine(item) {
        if (item.successRate >= 100) return []
        return [`\\LB[1]Success:\\LB[0]\\>\\BS[1]${item.successRate}%\\BS[0]`]
    }

    /** Dan's stream viewer change from <viewerChange:n> (bunchastuff.js, var 568). @param {RPG.Skill} item @returns {string[]} */
    function skillViewerChangeLine(item) {
        const change = metaNumber(item, "viewerChange")
        if (!change) return []
        const sign = change > 0 ? "+" : ""
        return [`\\LB[1]Viewers:\\LB[0]\\>\\BS[1]${sign}${change}\\BS[0]`]
    }

    /**
     * On-hit states for an "Add State: Normal Attack" effect (dataId 0),
     * resolved against the user's current attack states the same way
     * Game_Action.itemEffectAddAttackState does: effect chance x
     * attackStatesRate. Nothing is shown when the user inflicts nothing.
     * @param {RPG.UsableItem} item
     * @param {Scene_Base|null} scene - used to find the acting actor
     * @returns {string[]}
     */
    function itemAttackStateLines(item, scene) {
        const effect = item.effects.find(
            (e) => e.code === Game_Action.EFFECT_ADD_STATE && e.dataId === 0
        )
        if (!effect) return []
        const user = formulaUserFor(scene)
        if (!user) return []
        const inflictions = user
            .attackStates()
            .filter((id) => $dataStates[id] && $dataStates[id].iconIndex)
            .map((id) => ({
                stateId: id,
                value: Math.round(
                    effect.value1 * user.attackStatesRate(id) * 100
                ),
            }))
            .filter((entry) => entry.value > 0)
        const lines = mergeStateVariations(inflictions, { mergeAll: true }).map(
            ({ state, name, values }) =>
                `\\I[${state.iconIndex}]\\BS[1]\\IT[1]${name}\\IT[0]\\BS[0]\\>\\BS[1]${formatVariantValues(values)}%\\BS[0]`
        )
        if (lines.length === 0) return []
        lines.splice(0, 0, `\\LB[1]On Hit:\\LB[0]`)
        return lines
    }

    // ------------------------------DESCRIPTION & JSON----------------------------//

    /**
     * The contents of a description's leading "[Snack]"-style bracket.
     * @param {string} text
     * @returns {string} "" when there's no leading bracket
     */
    function getTextFromLeadingBracketNote(text) {
        const match = text.match(/(\[(\w*)\].*|.*)/)
        return match[2] ? match[2] : ""
    }

    /**
     * Hand-written extra lines for an entry from data/WauLau_TooltipData.json
     * (every key except "_"-prefixed ones, in order; arrays become one line
     * per element).
     * @param {'weapons'|'armors'|'items'|'skills'} kind
     * @param {RPG.BaseItem} item
     * @returns {string[]}
     */
    function getAdditionalJsonItemProps(kind, item) {
        const entry =
            $tooltipData && $tooltipData[kind] && $tooltipData[kind][item.id]
        if (!entry) return []
        // Keys starting with "_" (e.g. "_name") are editor-only labels.
        return Object.entries(entry)
            .filter(([key]) => !key.startsWith("_"))
            .map(([, value]) =>
                Array.isArray(value) ? value.join("\n") : value
            )
    }

    //============================================================================//
    //                        TOOLTIP ENTRY AND PROCESSING                        //
    //============================================================================//

    /**
     * Database category of a tooltip item - also its section key in
     * WauLau_TooltipData.json.
     * @param {RPG.BaseItem} item
     * @returns {'weapons'|'armors'|'items'|'skills'|null}
     */
    function itemTooltipKind(item) {
        return (
            DataManager.isWeapon(item) ? "weapons"
            : DataManager.isArmor(item) ? "armors"
            : DataManager.isItem(item) ? "items"
            : DataManager.isSkill(item) ? "skills"
            : null
        )
    }

    /** \I[n] for a real icon, "" for icon 0 (\I[0] would still reserve an icon's width). @param {number} iconIndex @returns {string} */
    function iconCode(iconIndex) {
        return iconIndex ? `\\I[${iconIndex}]` : ""
    }

    /**
     * Capitalizes the first letter of every word, including words right
     * after an escape code's "]" (e.g. "\BS[0]enemy").
     * @param {string} text
     * @returns {string}
     */
    function capitalizeWords(text) {
        return text.replace(
            /(^\w|\s\w|\]\w)(\S*)/g,
            (_, m1, m2) => m1.toUpperCase() + m2
        )
    }

    /**
     * Tooltip text for a weapon/armor/item/skill: title line, then every
     * stat/effect line for its kind, then its JSON extra lines.
     * @param {RPG.BaseItem} item
     * @param {string} type - "Tooltip", or "Shop" for the dialogue shop
     *   window (no title line; "" when there's nothing beyond the subtitle)
     * @param {Scene_Base|null} [scene=null] - used to find the acting actor
     * @returns {string|null} null for anything that isn't a database item/skill
     */
    function itemTooltipEntryText(item, type, scene = null) {
        const kind = itemTooltipKind(item)
        if (!kind) return null
        let skillInfo = null
        let topLines
        if (kind === "weapons") {
            const damageLine = weaponDamageLine(item)
            topLines = (damageLine ? [damageLine] : [])
                .concat(itemStatBlockLines(item))
                .concat(weaponAttackStateLines(item))
                .concat(weaponBreakChanceLine(item))
                .concat(equipGrantedSkillLines(item))
                .concat(getAdditionalJsonItemProps(kind, item))
        } else if (kind === "armors") {
            const slotLine = armorSlotLine(item)
            const resistLine = armorStateResistLine(item)
            topLines = (slotLine ? [slotLine] : [])
                .concat(itemStatBlockLines(item))
                .concat(armorStateRateLines(item))
                .concat(armorElementRateLines(item))
                .concat(resistLine || [])
                .concat(equipGrantedSkillLines(item))
                .concat(getAdditionalJsonItemProps(kind, item))
        } else if (kind === "items") {
            topLines = [grabLeadingBracketNoteForItem(item)]
                .concat(itemDamageLine(item, scene))
                .concat(itemRecoverLines(item))
                .concat(itemStateEffectLines(item))
                .concat(itemSuccessRateLine(item))
                .concat(getAdditionalJsonItemProps(kind, item))
        } else {
            skillInfo = getSkillInfo(item, scene)
            topLines = [
                `\\ST[1]${skillInfo.text}\\ST[0]${iconCode(skillInfo.icon)}`,
            ]
                .concat(itemDamageLine(item, scene))
                .concat(skillCostLines(item))
                .concat(itemRecoverLines(item))
                .concat(itemStateEffectLines(item))
                .concat(itemAttackStateLines(item, scene))
                .concat(itemSuccessRateLine(item))
                .concat(skillViewerChangeLine(item))
                .concat(skillBreakRateLine(item))
                .concat(getAdditionalJsonItemProps(kind, item))
        }
        const statLines = topLines.filter((line) => line !== null)

        if (type.toUpperCase() === "SHOP") {
            return statLines.length > 1 ?
                    capitalizeWords(statLines.join("\n"))
                :   ""
        }
        // An attack skill's subtitle already shows its source's icon.
        const titleIcon =
            skillInfo && skillInfo.isAttackSkill ? 0 : item.iconIndex
        return capitalizeWords(
            `\\TI[1]${item.name}${iconCode(titleIcon)}\\TI[0]\n${statLines.join("\n")}`
        )
    }

    /**
     * Builds and renders a weapon/armor/item/skill tooltip.
     * @param {RPG.BaseItem} item
     * @param {Scene_Base|null} [scene=null] - used to find the acting actor
     * @param {string} [type="Tooltip"] - "Tooltip", or "Shop" for the dialogue shop window
     * @returns {boolean} false if there was nothing worth showing (nothing was
     *   drawn, so the window still holds the previous contents and should stay hidden)
     */
    Window_StateTooltip.prototype.setupItem = function (
        item,
        scene = null,
        type = "Tooltip"
    ) {
        this._battler = null
        this._item = item

        const text = itemTooltipEntryText(item, type, scene)

        if (text === "") return false
        const entries = [{ state: null, text: text || item.name }]

        this.renderEntries(entries)
        return true
    }

    // --------------------------------ESCAPE CODES--------------------------------//

    /** Resolves the state turn/step codes \TR, \TRT, \SR and \SRT. */
    Window_StateTooltip.prototype.convertEscapeCharacters = function (text) {
        let t = Window_Base.prototype.convertEscapeCharacters.call(this, text)

        if (this._battler && this._state) {
            let turnRemain = this._battler._stateTurns[this._state.id]
            if (this._state.autoRemovalTiming == 1) {
                turnRemain += 1
            }
            if (turnRemain <= 0) turnRemain = "∞"
            t = t.replace(
                /\x1bTRT/gi,
                `\x1bDE[1]${
                    turnRemain === 1 ?
                        `${turnRemain} turn remaining`
                    :   `${turnRemain} turns remaining`
                }\x1bDE[0]`
            )
            t = t.replace(/\x1bTR/gi, turnRemain)

            // Only actors count steps (Game_Actor._stateSteps); enemies fall
            // back to the state's full step count.
            const actorSteps =
                this._battler._stateSteps &&
                this._battler._stateSteps[this._state.id]
            const stepsRemain =
                actorSteps !== undefined ? actorSteps : (
                    this._state.stepsToRemove
                )
            t = t.replace(
                /\x1bSRT/gi,
                `\x1bDE[1]${
                    stepsRemain === 1 ?
                        `${stepsRemain} step remaining`
                    :   `${stepsRemain} steps remaining`
                }\x1bDE[0]`
            )
            t = t.replace(/\x1bSR/gi, stepsRemain)
        }

        return t
    }

    /**
     * A windowskin color index as a CSS color, cached in M_hexColorMap.
     * Strings ("#rrggbb") pass through unchanged. Only call once the
     * windowskin has loaded (i.e. while drawing).
     * @param {number|string} index - 0-31, or a "#rrggbb" string
     * @returns {string}
     */
    function hexColorMapManager(index) {
        if (typeof index === "string") return index
        if (M_hexColorMap.has(index)) return M_hexColorMap.get(index)

        if (index > 31 || index < 0) {
            console.error(
                `[LookAtTooltips] Passed a color index outside of the range of 0-31 when trying to convert to hex. Passed index was: ${index}. Returning #ffffff`
            )
            return "#ffffff"
        }

        const hex = ColorManager.textColor(index)

        M_hexColorMap.set(index, hex)

        return hex
    }
    /**
     * A color constant (see COLORS) as a CSS color: a "#rrggbb" string as-is,
     * a windowskin index through hexColorMapManager.
     * @param {number|string} value
     * @returns {string}
     */
    function resolveTextColor(value) {
        return typeof value === "string" ? value : hexColorMapManager(value)
    }
    /**
     * This plugin's escape codes on top of the engine's: the [1]/[0] style
     * toggles \BI, \BS, \BSD, \B (bold variants), \IT (italic), \LB (label),
     * \ST (subtitle), \TI (title), \DE (description), plus \> (right-align),
     * \JU/\JG (justified lists) and text-sized icons \I/\J.
     * @param {string} code
     * @param {object} textState
     */
    Window_StateTooltip.prototype.processEscapeCharacter = function (
        code,
        textState
    ) {
        switch (code) {
            case "BI": {
                const on = !!this.obtainEscapeParam(textState)
                this.contents.fontBold = on
                this.changeTextColor(
                    resolveTextColor(on ? statColor : textColor)
                )
                this.contents.outlineWidth =
                    on ? BOLD_OUTLINE_WIDTH : NORMAL_OUTLINE_WIDTH
                this.contents.outlineColor =
                    on ?
                        `${hexColorMapManager(boldOutlineColor)}`
                    :   NORMAL_OUTLINE_COLOR
                this.contents._context.letterSpacing =
                    on ? BOLD_SPACING_WIDTH : NORMAL_SPACING_WIDTH
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_BOLD)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
                break
            }

            case "BS": {
                const on = !!this.obtainEscapeParam(textState)
                this.contents.fontBold = on
                this.changeTextColor(
                    resolveTextColor(on ? statColor : textColor)
                )
                this.contents.outlineWidth =
                    on ? BOLD_OUTLINE_WIDTH : NORMAL_OUTLINE_WIDTH
                this.contents.outlineColor =
                    on ?
                        `${hexColorMapManager(boldOutlineColor)}`
                    :   NORMAL_OUTLINE_COLOR
                this.contents._context.letterSpacing =
                    on ? BOLD_SPACING_WIDTH : NORMAL_SPACING_WIDTH
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_BOLD)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
                break
            }
            case "BSD": {
                const on = !!this.obtainEscapeParam(textState)
                this.contents.fontBold = on
                this.changeTextColor(
                    resolveTextColor(on ? statDmgColor : textColor)
                )
                this.contents.outlineWidth =
                    on ? BOLD_OUTLINE_WIDTH : NORMAL_OUTLINE_WIDTH
                this.contents.outlineColor =
                    on ?
                        `${hexColorMapManager(statDmgOutlineColor)}AF`
                    :   NORMAL_OUTLINE_COLOR
                this.contents._context.letterSpacing =
                    on ? BOLD_SPACING_WIDTH : NORMAL_SPACING_WIDTH
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_BOLD)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
                break
            }
            case "B": {
                const on = !!this.obtainEscapeParam(textState)
                this.contents.fontBold = on
                this.changeTextColor(
                    resolveTextColor(on ? statColor : textColor)
                )
                this.contents.outlineWidth =
                    on ? BOLD_OUTLINE_WIDTH : NORMAL_OUTLINE_WIDTH
                this.contents.outlineColor =
                    on ?
                        `${hexColorMapManager(boldOutlineColor)}`
                    :   NORMAL_OUTLINE_COLOR
                this.contents._context.letterSpacing =
                    on ? BOLD_SPACING_WIDTH : NORMAL_SPACING_WIDTH
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_BOLD)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
                break
            }
            case "IT": {
                this.contents.fontItalic = !!this.obtainEscapeParam(textState)
                break
            }
            case "LB": {
                const on = !!this.obtainEscapeParam(textState)
                this.changeTextColor(
                    resolveTextColor(on ? baseColor : textColor)
                )
                this.contents.outlineWidth = on ? 5 : NORMAL_OUTLINE_WIDTH
                this.contents.outlineColor =
                    on ?
                        `${hexColorMapManager(labelOutlineColor)}`
                    :   NORMAL_OUTLINE_COLOR
                this.contents._context.letterSpacing =
                    on ? BOLD_SPACING_WIDTH : NORMAL_SPACING_WIDTH
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_LABEL)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
                break
            }
            case "ST": {
                const on = !!this.obtainEscapeParam(textState)
                this.changeTextColor(
                    resolveTextColor(on ? subtitleColor : textColor)
                )
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_SUBTITLE)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
                break
            }
            case "TI": {
                const on = !!this.obtainEscapeParam(textState)
                this.changeTextColor(
                    resolveTextColor(on ? titleColor : textColor)
                )
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_TITLE)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
                break
            }
            case "DE": {
                const on = !!this.obtainEscapeParam(textState)
                this.changeTextColor(
                    resolveTextColor(on ? descColor : textColor)
                )
                if (on) {
                    this.contents.fontItalic = true
                    this.contents.fontSize = this.textSize(
                        TEXT_SIZE_DESCRIPTION
                    )
                } else {
                    this.contents.fontItalic = false
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
                break
            }
            case ">": {
                this.processRightAlign(textState)
                break
            }
            // \JU is consumed by wrapJustifiedLine - one reaching drawing is a no-op.
            case "JU": {
                break
            }
            case "JG": {
                this.processJustifyGap(textState)
                break
            }
            // Handled here instead of in default, which resets the font -
            // icons size themselves from the current font (see processDrawIcon).
            case "I": {
                this.processDrawIcon(
                    this.obtainEscapeParam(textState),
                    textState
                )
                break
            }
            case "J": {
                this.processDrawIconNspc(
                    this.obtainEscapeParam(textState),
                    textState
                )
                break
            }
            default:
                this.contents.fontBold = false
                this.contents.fontItalic = false
                this.contents.outlineWidth = NORMAL_OUTLINE_WIDTH
                this.contents.outlineColor = NORMAL_OUTLINE_COLOR
                this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                Window_Base.prototype.processEscapeCharacter.call(
                    this,
                    code,
                    textState
                )
        }
    }

    // TEXT-SIZED ICONS (\I, \J) -----------------------------
    // The engine always draws icons at the full 32x32 IconSet size, which
    // towers over the small tooltip fonts. Here an icon is scaled to the
    // current font size (+ TOOLTIP_ICON_SIZE_OFFSET), centered on the line,
    // with the engine's 2px-per-side padding scaled down to match. Measuring
    // passes advance x by the same amount, so wrapping and window width agree.

    /** Pixels added to the font size to get an icon's drawn size. */
    const TOOLTIP_ICON_SIZE_OFFSET = 4

    /** @returns {number} drawn icon size in px for the current font */
    Window_StateTooltip.prototype.tooltipIconSize = function () {
        return Math.max(20, this.contents.fontSize + TOOLTIP_ICON_SIZE_OFFSET)
    }

    /**
     * Draws iconIndex scaled to size x size, vertically centered on the
     * current line.
     * @param {number} iconIndex
     * @param {object} textState
     * @param {number} x - left edge of the icon
     * @param {number} size
     */
    Window_StateTooltip.prototype.drawTooltipIcon = function (
        iconIndex,
        textState,
        x,
        size
    ) {
        const bitmap = ImageManager.loadSystem("IconSet")
        const pw = ImageManager.iconWidth
        const ph = ImageManager.iconHeight
        const sx = (iconIndex % 16) * pw
        const sy = Math.floor(iconIndex / 16) * ph
        const lineHeight = textState.height || this.lineHeight()
        const y = textState.y + Math.floor((lineHeight - size) / 2)
        this.contents.blt(bitmap, sx, sy, pw, ph, x, y, size, size)
    }

    /** \I: text-sized icon with padding on both sides. */
    Window_StateTooltip.prototype.processDrawIcon = function (
        iconIndex,
        textState
    ) {
        const size = this.tooltipIconSize()
        const pad = Math.max(3, Math.round((size * 2) / ImageManager.iconWidth))
        if (textState.drawing) {
            this.drawTooltipIcon(iconIndex, textState, textState.x + pad, size)
        }
        textState.x += size + pad * 2
    }

    /** \J (bunchastuff): text-sized icon with no padding. */
    Window_StateTooltip.prototype.processDrawIconNspc = function (
        iconIndex,
        textState
    ) {
        const size = this.tooltipIconSize()
        if (textState.drawing) {
            this.drawTooltipIcon(iconIndex, textState, textState.x, size)
        }
        textState.x += size
    }

    // RIGHT-ALIGN (\>) -----------------------------
    // Measuring passes (textSizeEx, drawing === false) run before the window
    // width is known, so \> only reserves RIGHT_ALIGN_MIN_GAP there - that
    // gap is what makes the line count as "left + gap + right" wide when
    // renderEntries sizes the window. The drawing pass then jumps x so the
    // rest of the line ends at _rightAlignEdge (the widest line's width).
    // \>[n] is the same, but never starts left of n px into the line - the
    // form wrapLine gives a wrapped right-aligned value's continuation
    // lines, n being the width of the label before the original \>.
    const RIGHT_ALIGN_MIN_GAP = 24

    /**
     * Handles \> and \>[n]: pushes the rest of the current line flush to the
     * right edge, never left of n px from the line's start.
     * @param {object} textState
     */
    Window_StateTooltip.prototype.processRightAlign = function (textState) {
        // "" (no [n]) for a plain \>.
        const minX = Number(this.obtainEscapeParam(textState)) || 0
        textState.x = Math.max(textState.x, textState.startX + minX)
        if (!textState.drawing) {
            textState.x += RIGHT_ALIGN_MIN_GAP
            return
        }
        const lineEnd = textState.text.indexOf("\n", textState.index)
        const rest = textState.text.slice(
            textState.index,
            lineEnd === -1 ? undefined : lineEnd
        )
        const restWidth = this.measureRestOfLine(textState, rest)
        // Contents-space edge, not relative to startX: entries indented by
        // a portrait already have that indent counted in _rightAlignEdge.
        const edge = this._rightAlignEdge || this.contentsWidth()
        textState.x = Math.max(
            textState.x + RIGHT_ALIGN_MIN_GAP,
            edge - restWidth
        )
    }

    // JUSTIFY GAP (\JG) -----------------------------
    // Inserted by wrapJustifiedLine between the items of a wrapped list row.
    // Measuring passes leave it zero-width (the row is measured at its plain
    // ", " spacing). The drawing pass shares the row's leftover width - edge
    // minus the row's natural end - evenly over the gaps still to come, so
    // every gap recomputes from where the previous one left x and the last
    // one lands the row flush on _rightAlignEdge, rounding included.

    /** Handles \JG: widens this gap by its share of the row's free space. @param {object} textState */
    Window_StateTooltip.prototype.processJustifyGap = function (textState) {
        if (!textState.drawing) return
        const lineEnd = textState.text.indexOf("\n", textState.index)
        const rest = textState.text.slice(
            textState.index,
            lineEnd === -1 ? undefined : lineEnd
        )
        const gapsLeft = 1 + (rest.match(/\x1bJG/gi) || []).length
        const edge = this._rightAlignEdge || this.contentsWidth()
        const free =
            edge - textState.x - this.measureRestOfLine(textState, rest)
        if (free > 0) textState.x += Math.floor(free / gapsLeft)
    }

    /**
     * Measures already-converted text starting from the current font state
     * (unlike textSizeEx, which resets it first), then restores that state
     * so drawing continues exactly where it left off.
     * @param {object} textState - the live drawing state to copy from
     * @param {string} rest - escape-converted text, no \n
     * @returns {number} pixel width
     */
    Window_StateTooltip.prototype.measureRestOfLine = function (
        textState,
        rest
    ) {
        const c = this.contents
        const saved = {
            fontSize: c.fontSize,
            fontBold: c.fontBold,
            fontItalic: c.fontItalic,
            textColor: c.textColor,
            outlineWidth: c.outlineWidth,
            outlineColor: c.outlineColor,
            letterSpacing: c._context.letterSpacing,
        }
        const probe = {
            ...textState,
            text: rest,
            index: 0,
            x: 0,
            startX: 0,
            buffer: this.createTextBuffer(false),
            drawing: false,
            outputWidth: 0,
        }
        this.processAllText(probe)
        c.fontSize = saved.fontSize
        c.fontBold = saved.fontBold
        c.fontItalic = saved.fontItalic
        c.textColor = saved.textColor
        c.outlineWidth = saved.outlineWidth
        c.outlineColor = saved.outlineColor
        c._context.letterSpacing = saved.letterSpacing
        return probe.outputWidth
    }

    // FONT SIZE OFFSET -----
    // Every TEXT_SIZE_* constant is the *tooltip* size; each window adds its
    // own _fontSizeOffset on top (0 for tooltips, shopFontOffset for the
    // dialogue shop window). All font-size writes - drawing, measuring, and
    // line-height lookahead - go through here so they always agree.
    /**
     * @param {number} baseSize - one of the TEXT_SIZE_* constants
     * @returns {number} that size adjusted for this window
     */
    Window_StateTooltip.prototype.textSize = function (baseSize) {
        return baseSize + (this._fontSizeOffset || 0)
    }

    Window_StateTooltip.prototype.resetFontSettings = function () {
        Window_Base.prototype.resetFontSettings.call(this)
        this.contents.fontBold = false
        this.contents.fontItalic = false
        this.contents.outlineWidth = NORMAL_OUTLINE_WIDTH
        this.contents.outlineColor = NORMAL_OUTLINE_COLOR
        this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
    }

    // LINE-HEIGHT FIX -----------------------------
    // The engine's own maxFontSizeInLine only recognizes \{, \}, and \FS[n]
    // when pre-measuring a line's height, so it doesn't know \TI/\ST/\LB/\DE
    // change size too - lines using them would draw correctly but get the
    // wrong vertical space reserved around them. Reimplemented here with the
    // same lookahead and the same sizes processEscapeCharacter applies. The
    // bold codes only ever shrink the font, so they never raise the maximum.
    /** @param {string} line @returns {number} */
    Window_StateTooltip.prototype.maxFontSizeInLine = function (line) {
        let maxFontSize = this.contents.fontSize
        const regExp = /\x1b({|}|FS|TI|ST|LB|DE)(\[(\d+)])?/gi
        for (;;) {
            const array = regExp.exec(line)
            if (!array) break
            const code = String(array[1]).toUpperCase()
            const on = !!Number(array[3])
            if (code === "{") {
                this.makeFontBigger()
            } else if (code === "}") {
                this.makeFontSmaller()
            } else if (code === "FS") {
                this.contents.fontSize = parseInt(array[3])
            } else if (code === "TI") {
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_TITLE)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
            } else if (code === "ST") {
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_SUBTITLE)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
            } else if (code === "LB") {
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_LABEL)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
            } else if (code === "DE") {
                if (on) {
                    this.contents.fontSize = this.textSize(
                        TEXT_SIZE_DESCRIPTION
                    )
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
            }
            if (this.contents.fontSize > maxFontSize) {
                maxFontSize = this.contents.fontSize
            }
        }
        return maxFontSize
    }

    // LINE-SPACING MATCH -----------------------------
    // The engine derives line spacing as lineHeight() - mainFontSize(),
    // assuming a window's base text is the main font size. Tooltip base text
    // is the smaller TEXT_SIZE_NORMAL, so every plain tooltip line came out
    // shorter than a message window line. Deriving the spacing from
    // TEXT_SIZE_NORMAL instead makes a plain line exactly lineHeight() tall -
    // the same as Window_Message - while bigger/smaller lines (\TI, \LB, \DE)
    // keep the same spacing around their own font size. Uses this window's
    // offset size, so shop lines keep matching the message window beside it.
    // _lineSpacingTrim then tightens tooltips below that (0 for the shop).
    /** @param {object} textState @returns {number} */
    Window_StateTooltip.prototype.calcTextHeight = function (textState) {
        const lineSpacing =
            this.lineHeight() -
            this.textSize(TEXT_SIZE_NORMAL) -
            (this._lineSpacingTrim || 0)
        const lastFontSize = this.contents.fontSize
        const lines = textState.text.slice(textState.index).split("\n")
        const textHeight = this.maxFontSizeInLine(lines[0]) + lineSpacing
        this.contents.fontSize = lastFontSize
        return textHeight
    }

    /** The tooltip never scrolls, so it never shows scroll arrows. */
    Window_StateTooltip.prototype.updateArrows = function () {
        this.downArrowVisible = false
        this.upArrowVisible = false
    }

    //============================================================================//
    //                        DIALOGUE SHOP INFO WINDOW                           //
    //============================================================================//
    // "Dialogue shops" aren't Scene_Shop: each item is a map event that runs
    // the Buy choice as ordinary messages. While one is open, a fixed window in
    // the bottom-left shows the same stat block the item tooltips use. Each
    // shop is recognized by the common event its item events call:
    //   - Eugene's: the event stores its $dataItems/$dataWeapons/$dataArmors
    //     object in variable 481, then calls common event 46 (BuyItemTable),
    //     which runs the whole Buy/Haggle/Leave dialogue itself.
    //   - Mutt's (Map056): the event calls common event 291 (MuttSpecialPrice),
    //     which only adjusts the price in variable 7 - the event page itself
    //     runs the Buy choice and grants the item, so the item is read from
    //     that page's first Change Items/Weapons/Armors command.

    const DIALOGUE_SHOP_ITEM_VAR_ID = 481
    /** Characters the shop window types per frame (Window_Message types 1). */
    const SHOP_TYPEWRITER_CHARS_PER_FRAME = 1

    /**
     * Common events that open a dialogue shop, by ID.
     * - findItem: the item on sale, given the interpreter that called the
     *   common event (its _index is still on the Call Common Event command).
     * - followsCaller: false if the shop lasts while the common event itself
     *   runs; true if it lasts through the calling event page's Buy choice.
     * @type {Object<number, {findItem: function(Game_Interpreter): (RPG.BaseItem|null), followsCaller: boolean}>}
     */
    const DIALOGUE_SHOP_TRIGGERS = {
        46: {
            findItem: () => $gameVariables.value(DIALOGUE_SHOP_ITEM_VAR_ID),
            followsCaller: false,
        },
        291: {
            findItem: (caller) => findGrantedItem(caller._list, caller._index),
            followsCaller: true,
        },
    }

    /**
     * The dialogue shop currently open, or null.
     * - interpreter/list: the shop is open while interpreter is still running list.
     * - endIndex: index of the Buy choice's closing End command in list (the
     *   shop closes once the interpreter moves past it), or -1 to run to the end.
     * @type {{item: RPG.BaseItem, interpreter: Game_Interpreter, list: Array, endIndex: number}|null}
     */
    let dialogueShop = null

    /**
     * The first item/weapon/armor a command list grants, from fromIndex on.
     * @param {Array} list - An event page or common event command list.
     * @param {number} fromIndex
     * @returns {RPG.BaseItem|null}
     */
    function findGrantedItem(list, fromIndex) {
        for (let i = fromIndex; i < list.length; i++) {
            const { code, parameters } = list[i]
            // parameters[1]: 0 = Increase, 1 = Decrease.
            if (parameters[1] !== 0) continue
            if (code === 126) return $dataItems[parameters[0]]
            if (code === 127) return $dataWeapons[parameters[0]]
            if (code === 128) return $dataArmors[parameters[0]]
        }
        return null
    }

    /**
     * Index of the End command (404) closing the first Show Choices (102)
     * at or after fromIndex, or -1 if there's none.
     * @param {Array} list
     * @param {number} fromIndex
     * @returns {number}
     */
    function findChoiceEnd(list, fromIndex) {
        const start = list.findIndex((c, i) => i >= fromIndex && c.code === 102)
        if (start < 0) return -1
        const indent = list[start].indent
        return list.findIndex(
            (c, i) => i > start && c.code === 404 && c.indent === indent
        )
    }

    /**
     * Runs whenever a common event is started, before its first command executes.
     * @param {number} commonEventId - Index into $dataCommonEvents.
     * @param {string} source - "call" (Common Event command in an event page)
     *   or "reserve" (item/skill effect or script; runs once the map interpreter is free).
     * @param {Game_Interpreter|null} caller - The interpreter running the Call
     *   Common Event command ("call" only; reserved events have no caller).
     */
    function onCommonEventStart(commonEventId, source, caller) {
        const trigger = DIALOGUE_SHOP_TRIGGERS[commonEventId]
        if (!trigger || !caller) return
        const item = trigger.findItem(caller)
        if (!item || !item.name) return
        const interpreter =
            trigger.followsCaller ? caller : caller._childInterpreter
        dialogueShop = {
            item,
            interpreter,
            list: interpreter._list,
            endIndex:
                trigger.followsCaller ?
                    findChoiceEnd(interpreter._list, interpreter._index)
                :   -1,
        }
    }

    // COMMON EVENT ID -----
    // Once running, an interpreter only holds the command list - setupChild's
    // eventId is the *calling map event's* ID, not the common event's. The
    // common event ID is only available at these two entry points.
    const _Game_Interpreter_command117 = Game_Interpreter.prototype.command117
    /** Reports the common event after the original has built its child interpreter. */
    Game_Interpreter.prototype.command117 = function (params) {
        const result = _Game_Interpreter_command117.call(this, params)
        onCommonEventStart(params[0], "call", this)
        return result
    }

    const _Game_Temp_reserveCommonEvent = Game_Temp.prototype.reserveCommonEvent
    Game_Temp.prototype.reserveCommonEvent = function (commonEventId) {
        onCommonEventStart(commonEventId, "reserve", null)
        _Game_Temp_reserveCommonEvent.call(this, commonEventId)
    }

    const _Scene_Map_createAllWindows = Scene_Map.prototype.createAllWindows
    /** Creates the dialogue shop info window after the map's own windows. */
    Scene_Map.prototype.createAllWindows = function () {
        _Scene_Map_createAllWindows.call(this)
        this.createDialogueShopInfoWindow()
    }

    /** Creates the hidden dialogue shop info window (positioned each frame). */
    Scene_Map.prototype.createDialogueShopInfoWindow = function () {
        const win = new Window_StateTooltip()
        this._dialogueShopInfo = win
        win._maxTextWidth = maxShopInfoWidth
        win._fontSizeOffset = shopFontOffset
        win._lineSpacingTrim = 0
        // Open/close like the message window (expand/squish from the center,
        // not the tooltips' top-down unroll) and type its text out.
        win._openFromTop = false
        win._charsPerFrame = SHOP_TYPEWRITER_CHARS_PER_FRAME
        win.move(0, 0, 0, 0)
        // addChild, not addWindow - same as the tooltips, so it draws above
        // the window layer instead of being masked by the message window.
        this.addChild(this._dialogueShopInfo)
    }

    const _Scene_Map_update = Scene_Map.prototype.update
    /** Per-frame: keeps the dialogue shop info window in sync. */
    Scene_Map.prototype.update = function () {
        _Scene_Map_update.call(this)
        this.updateDialogueShopInfo()
    }

    // SHOP CLOSE DETECTION -----
    // The shop closes the frame its interpreter stops running the list it
    // opened on, or moves past endIndex. Comparing the list, not just
    // isRunning(), matters for Mutt's: those pages are autorun, and when one
    // ends, Game_Map.updateInterpreter starts the next autorun page (set up
    // by the same page's self switch) on the *same* map interpreter within the
    // same frame, so isRunning() never reads false in between.
    /**
     * @param {NonNullable<typeof dialogueShop>} shop
     * @returns {boolean}
     */
    function isDialogueShopOver(shop) {
        const { interpreter, list, endIndex } = shop
        return (
            interpreter._list !== list ||
            (endIndex >= 0 && interpreter._index > endIndex)
        )
    }

    /** Shows or hides the info window to match dialogueShop, restoring the message window on close. */
    Scene_Map.prototype.updateDialogueShopInfo = function () {
        if (dialogueShop && isDialogueShopOver(dialogueShop)) {
            dialogueShop = null
            this._messageWindow.restoreDialogueShopLayout()
        }
        const hasContent = !!dialogueShop && this.syncDialogueShopInfo()
        // Same contract as the tooltips: the window's own update() opens or
        // closes it from tooltipActive - calling open()/close() here instead
        // would just be undone by that update() the next frame.
        this._dialogueShopInfo.frontSpriteHue = 0
        this._dialogueShopInfo.backSpriteHue = 0
        this._dialogueShopInfo.backOpacity = 192
        this._dialogueShopInfo.tooltipActive = hasContent
    }

    /**
     * Renders the info window for the current shop item (only when the item
     * changed) and pins it to the bottom-left. Also called from
     * Window_Message.startMessage, which can run the same frame the shop
     * opens - before this scene's own update has rendered anything.
     * @returns {boolean} false if the item has nothing worth showing - the
     *   window should stay hidden and the message window keep its full width
     */
    Scene_Map.prototype.syncDialogueShopInfo = function () {
        const win = this._dialogueShopInfo
        if (win._item !== dialogueShop.item) {
            win._hasShopContent = win.setupItem(dialogueShop.item, null, "Shop")
            win._fullHeight = win.height
            win._shopHeight = null
        }
        if (!win._hasShopContent) return false
        this.placeDialogueShopInfo()
        return true
    }

    /**
     * Pins the info window to the bottom-left at the height decided by
     * Window_Message.fitBesideDialogueShopInfo, or at its own content height
     * before any shop message has started.
     */
    Scene_Map.prototype.placeDialogueShopInfo = function () {
        const win = this._dialogueShopInfo
        win.height =
            win._shopHeight || Math.min(win._fullHeight, Graphics.boxHeight)
        // Window layer coordinates, since this window is a direct scene child.
        win.x = this._windowLayer.x
        win.y = this._windowLayer.y + Graphics.boxHeight - win.height
    }

    //------------------MESSAGE WINDOW BESIDE THE INFO WINDOW-------------------//
    // While a dialogue shop is open, the message window shares the bottom
    // strip with the info window: it starts at the info window's right edge,
    // its text is re-wrapped to the narrower width, and it grows upward by
    // whole lines if the wrapped text no longer fits in its normal 4 rows.

    const MESSAGE_BASE_ROWS = 4
    // Within this many pixels, the message window snaps to the info window's
    // height so the two don't leave a thin uneven gap along the top.
    const MESSAGE_SNAP_DISTANCE = 24

    /** @type {Window_Base|null} */
    let messageMeasureWindow = null

    // MEASURE WINDOW -----
    // Window_Message's own textSizeEx would run message-only escape codes as
    // side effects while measuring (\. and \| start waits, \$ opens the gold
    // window). A plain Window_Base ignores those and uses the same main font.
    /** @returns {Window_Base} */
    function getMessageMeasureWindow() {
        if (!messageMeasureWindow) {
            messageMeasureWindow = new Window_Base(
                new Rectangle(0, 0, 100, 100)
            )
        }
        return messageMeasureWindow
    }

    /**
     * Expands \V[n] (two passes, same as the engine, for variables holding
     * \V codes) and word-wraps every message line to maxWidth. Variables are
     * expanded first because a line like "\V[482]" is a single "word" that
     * holds a whole multi-word, multi-line description.
     * @param {string[]} texts - $gameMessage._texts
     * @param {number} maxWidth - pixels
     * @returns {string[]} the re-wrapped lines
     */
    function wrapMessageTexts(texts, maxWidth) {
        const expandVariables = (text) =>
            text.replace(/\\V\[(\d+)\]/gi, (_, id) =>
                $gameVariables.value(Number(id))
            )
        const expanded = expandVariables(expandVariables(texts.join("\n")))
        return wrapTooltipText(
            getMessageMeasureWindow(),
            expanded,
            maxWidth
        ).split("\n")
    }

    // $GAMEMESSAGE EDIT POINT -----
    // Window_Message copies $gameMessage.allText() into its own textState
    // inside startMessage, so _texts has to be rewritten before the original
    // runs - edits made after that never reach the screen.
    const _Window_Message_startMessage = Window_Message.prototype.startMessage
    /** Fits the window beside the dialogue shop info window before drawing starts. */
    Window_Message.prototype.startMessage = function () {
        const scene = SceneManager._scene
        if (
            dialogueShop &&
            scene instanceof Scene_Map &&
            scene.syncDialogueShopInfo()
        ) {
            this.fitBesideDialogueShopInfo(scene._dialogueShopInfo)
            scene.placeDialogueShopInfo()
        }
        _Window_Message_startMessage.call(this)
    }

    // SHARED HEIGHT ORDER -----
    // Both heights are decided here, in one pass, because each depends on
    // the other: the message's natural height (from its re-wrapped lines)
    // comes first, the info window is at least that tall, and the message
    // then snaps up to the info window if they're within
    // MESSAGE_SNAP_DISTANCE. Wrapping only needs the info window's width,
    // which is already final, so there's no real circular dependency.
    /**
     * Narrows the window to the space right of infoWin, re-wraps
     * $gameMessage's text to match, and sets both windows' heights. The
     * original rect is saved once so restoreDialogueShopLayout can undo it.
     * @param {Window_StateTooltip} infoWin
     */
    Window_Message.prototype.fitBesideDialogueShopInfo = function (infoWin) {
        if (!this._dialogueShopBaseRect) {
            this._dialogueShopBaseRect = new Rectangle(
                this.x,
                this.y,
                this.width,
                this.height
            )
        }
        const base = this._dialogueShopBaseRect
        const width = Graphics.boxWidth - infoWin.width
        const textWidth =
            width - this.padding * 2 - this.newLineX({ rtl: false })
        $gameMessage._texts = wrapMessageTexts($gameMessage._texts, textWidth)

        const extraLines = Math.max(
            0,
            $gameMessage._texts.length - MESSAGE_BASE_ROWS
        )
        const messageHeight = Math.min(
            base.height + extraLines * this.lineHeight(),
            Graphics.boxHeight
        )
        const shopHeight = Math.min(
            Math.max(infoWin._fullHeight, messageHeight),
            Graphics.boxHeight
        )
        infoWin._shopHeight = shopHeight
        const height =
            shopHeight - messageHeight < MESSAGE_SNAP_DISTANCE ?
                shopHeight
            :   messageHeight
        // y is recomputed by updatePlacement inside the original startMessage.
        this.move(infoWin.width, this.y, width, height)
        this.createContents()
    }

    /** Puts the window back to the rect saved by fitBesideDialogueShopInfo, if any. */
    Window_Message.prototype.restoreDialogueShopLayout = function () {
        const base = this._dialogueShopBaseRect
        if (!base) return
        this.move(base.x, this.y, base.width, base.height)
        this.createContents()
        this._dialogueShopBaseRect = null
    }
})()
