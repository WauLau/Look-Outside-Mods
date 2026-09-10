/*:
 * @target MZ
 * @author WauLau (based on GBCCoffee_StateTooltips by coffeenahc, https://coffeenahc.itch.io/)
 * @plugindesc (v2.0) Popup tooltip when hovering a state icon during battle, with JSON-driven text, stat expressions, bold/italic and color codes.
 *
 * @help
 * ======================================================================================
 *
 * Merge of GBCCoffee_StateTooltips (by coffeenahc) and this mod's own stat-expression /
 * formatting add-on into a single plugin, now sourcing tooltip text from
 * data/Tooltips.json instead of state note tags - so tooltip content lives in a file
 * that only this feature touches, and doesn't conflict with other mods that also edit
 * States.json for unrelated reasons.
 *
 * Original plugin credit: coffeenahc (https://coffeenahc.itch.io/) - attribution
 * required per the original plugin's free-tier terms of use.
 *
 * ======================================================================================
 * HOW TO USE
 * ======================================================================================
 *
 * 1.) For states:
 * Edit data/Tooltips.json directly. Structure:
 *   { "states": { "<stateId>": "tooltip text for that state" } }
 * Since this is now a plain JSON string value (not a note tag), you only need normal
 * JSON string escaping: a literal backslash is "\\", a line break can just be written
 * as "\n" in the JSON and it becomes a real line break, no more pressing Enter inside
 * a single-line note field. A state with no entry falls back to the default
 * icon + name display.
 *
 * 2.) For buffs/debuffs:
 * Edit the text from this plugin's parameters, same as before.
 *OK
 * Escape codes recognized inside tooltip text:
 *   \C[x]           - change text color (0-31)
 *   \I[x]           - display icon
 *   \TR             - remaining turns for a state
 *   \TRT            - "X turns remaining" / "X turn remaining"
 *   \SR             - remaining steps for a state
 *   \SRT            - "X steps remaining" / "X step remaining"
 *   \BR             - remaining turns for a buff/debuff
 *   \B[1] / \B[0]   - turn bold on / off (also switches to Bold Color / back to Text Color)
 *   \IT[1] / \IT[0] - turn italic on / off
 *   {expression}    - evaluate a math expression against the tooltip's battler and
 *                     print the result in Expression Color. Example:
 *                       {maxhp * 0.1}
 *
 * Recognized stat names inside { } expressions (case-insensitive):
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
 * Any expression that isn't valid math, or references an unrecognized stat name,
 * prints as "?" in the tooltip and logs a warning to the console with the offending
 * text, so bad entries are easy to spot while testing.
 *
 * All of this (bold/italic, colors, {expressions}) only applies inside this plugin's
 * own Window_StateTooltip - it does not change any other window in the game.
 *
 * @param offsetX
 * @text Tooltip x offset
 * @desc Offset the tooltip by x units
 * @type Number
 * @default 0
 *
 * @param offsetY
 * @text Tooltip y offset
 * @desc Offset the tooltip by y units
 * @type Number
 * @default 0
 *
 * @param decimalPlaces
 * @text Decimal Places
 * @desc How many decimal places to round {expression} results to.
 * @type number
 * @min 0
 * @default 0
 *
 * @param expressionColor
 * @text Expression Color
 * @desc Text color index (0-31, same as \C[x]) used for {expression} results.
 * @type number
 * @min 0
 * @max 31
 * @default 8
 *
 * @param textColor
 * @text Text Color
 * @desc Text color index (0-31, same as \C[x]) used for any normal text.
 * @type number
 * @min 0
 * @max 31
 * @default 1
 *
 * @param boldColor
 * @text Bold Color
 * @desc Text color index (0-31, same as \C[x]) used for any bolded text.
 * @type number
 * @min 0
 * @max 31
 * @default 0
 *
 * @param enemyPercentOnly
 * @text Enemy Tooltips: Percent Only
 * @desc If ON, {expr} on an enemy only shows a % (from a "stat * 0.05" style multiplier) instead of the real computed number, to avoid leaking enemy stats.
 * @type boolean
 * @default true
 *
 * @param maxWidth
 * @text Max Tooltip Width
 * @desc Widest a single tooltip line is allowed to get (in pixels) before it wraps to a new line.
 * @type number
 * @min 50
 * @default 400
 *
 * @param gamepadToggleButton
 * @text Gamepad Toggle Button Index
 * @desc Standard Gamepad API button index that toggles controller tooltip browsing on/off. Default 8 = Back/Select (unused by the engine).
 * @type number
 * @min 0
 * @max 17
 * @default 8
 *
 * @param gamepadPrevButton
 * @text Gamepad Previous Button Index
 * @desc Standard Gamepad API button index that selects the previous battler while tooltip browsing is on. Default 6 = Left Trigger.
 * @type number
 * @min 0
 * @max 17
 * @default 6
 *
 * @param gamepadNextButton
 * @text Gamepad Next Button Index
 * @desc Standard Gamepad API button index that selects the next battler while tooltip browsing is on. Default 7 = Right Trigger.
 * @type number
 * @min 0
 * @max 17
 * @default 7
 *
 * @param buffTooltipTexts
 * @text Buffs Tooltip Texts
 *
 * @param hpBuff
 * @text HP Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent buffTooltipTexts
 * @default \}\I[32]\C[1]HP Buff: \C[3](Turns: \BR)
 *
 * @param mpBuff
 * @text MP Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent buffTooltipTexts
 * @default \}\I[33]\C[1]MP Buff: \C[3](Turns: \BR)
 *
 * @param atkBuff
 * @text Atk Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent buffTooltipTexts
 * @default \}\I[34]\C[1]Atk Buff: \C[3](Turns: \BR)
 *
 * @param defBuff
 * @text Def Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent buffTooltipTexts
 * @default \}\I[35]\C[1]Def Buff: \C[3](Turns: \BR)
 *
 * @param matkBuff
 * @text M.Atk Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent buffTooltipTexts
 * @default \}\I[36]\C[1]M.Atk Buff: \C[3](Turns: \BR)
 *
 * @param mdefBuff
 * @text M.Def Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent buffTooltipTexts
 * @default \}\I[37]\C[1]M.Def Buff: \C[3](Turns: \BR)
 *
 * @param agiBuff
 * @text Agi Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent buffTooltipTexts
 * @default \}\I[38]\C[1]Agi Buff: \C[3](Turns: \BR)
 *
 * @param lukBuff
 * @text Luk Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent buffTooltipTexts
 * @default \}\I[39]\C[1]Luk Buff: \C[3](Turns: \BR)
 *
 * @param debuffTooltipTexts
 * @text Debuffs Tooltip Texts
 *
 * @param hpDebuff
 * @text HP Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent debuffTooltipTexts
 * @default \}\I[48]\C[1]HP Debuff: \C[3](Turns: \BR)
 *
 * @param mpDebuff
 * @text MP Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent debuffTooltipTexts
 * @default \}\I[49]\C[1]MP Debuff: \C[3](Turns: \BR)
 *
 * @param atkDebuff
 * @text Atk Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent debuffTooltipTexts
 * @default \}\I[50]\C[1]Atk Debuff: \C[3](Turns: \BR)
 *
 * @param defDebuff
 * @text Def Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent debuffTooltipTexts
 * @default \}\I[51]\C[1]Def Debuff: \C[3](Turns: \BR)
 *
 * @param matkDebuff
 * @text M.Atk Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent debuffTooltipTexts
 * @default \}\I[52]\C[1]M.Atk Debuff: \C[3](Turns: \BR)
 *
 * @param mdefDebuff
 * @text M.Def Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent debuffTooltipTexts
 * @default \}\I[53]\C[1]M.Def Debuff: \C[3](Turns: \BR)
 *
 * @param agiDebuff
 * @text Agi Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent debuffTooltipTexts
 * @default \}\I[54]\C[1]Agi Debuff: \C[3](Turns: \BR)
 *
 * @param lukDebuff
 * @text Luk Buff
 * @type text
 * @desc Text to display on the tooltip for this buff
 * @parent debuffTooltipTexts
 * @default \}\I[55]\C[1]Luk Debuff: \C[3](Turns: \BR)
 */

var $dataTooltips = null
DataManager.loadDataFile("$dataTooltips", "Tooltips.json")
;(() => {
    "use strict"

    const pluginName = "WauLau_StateTooltips"
    const params = PluginManager.parameters(pluginName)

    const WauLau = {}
    WauLau.StateTooltips = {}
    WauLau.StateTooltips.offsetX = parseInt(params.offsetX)
    WauLau.StateTooltips.offsetY = parseInt(params.offsetY)
    WauLau.StateTooltips.paramNames = [
        "hp",
        "mp",
        "atk",
        "def",
        "matk",
        "mdef",
        "agi",
        "luk",
    ]
    WauLau.StateTooltips.buffTexts = WauLau.StateTooltips.paramNames.map(
        (p) => params[`${p}Buff`]
    )
    WauLau.StateTooltips.debuffTexts = WauLau.StateTooltips.paramNames.map(
        (p) => params[`${p}Debuff`]
    )

    const decimalPlaces = Number(params.decimalPlaces || 0)
    const expressionColor = Number(params.expressionColor || 8)
    const textColor = Number(params.textColor || 1)
    const boldColor = Number(params.boldColor || 0)
    const enemyPercentOnly = params.enemyPercentOnly !== "false"
    const maxTooltipWidth = Number(params.maxWidth || 400)

    // Buttons 6/7/8 (triggers + back/select) aren't used by the engine's own
    // Input.gamepadMapper (js/rmmz_core.js:5727 only defines 0-5 and 12-15),
    // so registering new symbols here is safe and doesn't collide with the
    // menu's existing pageup/pagedown (LB/RB) tab-switching. This is dev-time
    // configurable via these plugin parameters, not an in-game rebind menu -
    // wiring into Mano_InputConfig's own rebind UI would mean hand-editing its
    // fragile nested extendsMapper JSON, which risks breaking that plugin's
    // whole config screen for a feature this self-contained doesn't need.
    Input.gamepadMapper[Number(params.gamepadToggleButton || 8)] =
        "ToggleTooltip"
    Input.gamepadMapper[Number(params.gamepadPrevButton || 6)] = "TooltipPrev"
    Input.gamepadMapper[Number(params.gamepadNextButton || 7)] = "TooltipNext"

    function stateTooltipText(state, battler) {
        const entry =
            $dataTooltips &&
            $dataTooltips.states &&
            $dataTooltips.states[state.id]
        if (!entry || !entry.text) return null
        const rawText =
            Array.isArray(entry.text) ? entry.text.join("\n") : entry.text
        // Resolve {expression}s in the body ONLY, before the \{name\} header
        // (which uses the engine's make-font-bigger/smaller codes, not our
        // expression syntax) gets attached - otherwise the scanner below would
        // also see that header's braces and mistake the state's name for a
        // broken math expression.
        const text = evaluateTooltipExpressions(battler, rawText)
        return `\\I[${state.iconIndex}]\\C[1]\\{${state.name}\\}\\C[${textColor}]\n${text}`
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
        // hit/eva/cri/cev are stored as 0-1 ratios internally (e.g. 0.95 for
        // 95%), unlike atk/def/etc which are plain numbers - scale to a
        // 0-100 "points" value so formulas like {hit * 0.5} read sensibly.
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

    function isEnemyBattler(battler) {
        return !!(battler.isEnemy && battler.isEnemy())
    }

    // Only handles the common "statName * 0.05" shape, checked against the raw
    // expression text before any stat name is resolved to a real value - so an
    // enemy's actual stat never gets touched at all, just the literal multiplier
    // already written in the tooltip text.
    function enemyPercentExpression(expr) {
        const match = expr
            .trim()
            .match(/^[a-zA-Z_]+\s*\*\s*([+-]?[0-9]*\.?[0-9]+)$/)
        if (!match) return null
        const percent = parseFloat(match[1]) * 100
        return `${percent.toFixed(decimalPlaces)}%`
    }

    function evaluateTooltipExpressions(battler, text) {
        return text.replace(/\{([^{}]+)\}/g, (fullMatch, expr) => {
            try {
                if (enemyPercentOnly && isEnemyBattler(battler)) {
                    const percentText = enemyPercentExpression(expr)
                    if (percentText === null) {
                        throw new Error(
                            `Enemy Tooltips: Percent Only is ON, but "${expr}" isn't a simple "stat * number" expression, so it can't be converted to a percent - reword this entry`
                        )
                    }
                    return `\x1bC[${expressionColor}]${percentText}\x1bC[${textColor}]`
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
                return `\x1bC[${expressionColor}]${value.toFixed(decimalPlaces)}\x1bC[${textColor}]`
            } catch (e) {
                console.warn(
                    `${pluginName}: Failed to evaluate tooltip expression "{${expr}}" - ${e.message}`
                )
                return "?"
            }
        })
    }

    // Gamepad tooltip-browsing state. Only one scene is ever active at a time,
    // so a single shared object is fine - it gets reset whenever a scene that
    // supports tooltips is (re)created.
    const gamepadTooltip = { active: false, battlers: [], index: 0 }

    // Menu case: any Window_StatusBase-derived window (Window_MenuStatus,
    // Window_Status, ...) already records _tooltipIconRects per actor as a
    // side effect of drawing (added for the menu hover fix) - reuse that as
    // the list of "battlers with a tooltip available" instead of rediscovering
    // it a different way. Battle case: just every party/troop member with an
    // active icon.
    function collectTooltipBattlers(scene) {
        if (scene instanceof Scene_Battle) {
            return $gameParty
                .battleMembers()
                .concat($gameTroop.members())
                .filter((b) => b.allIcons().length > 0)
        }
        const battlers = []
        const seen = new Set()
        const layer = scene._windowLayer
        if (layer) {
            for (const child of layer.children) {
                if (
                    child instanceof Window_StatusBase &&
                    child._tooltipIconRects
                ) {
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
            }
        }
        return battlers
    }

    // Screen position to anchor the tooltip to for a given battler, mirroring
    // where mouse hover would already be pointing: the enemy's own icon sprite
    // in battle, or the first recorded icon rect in whichever menu window is
    // showing that battler. Returns null if neither can be found (scene layout
    // this project doesn't use yet), in which case the caller falls back to a
    // fixed position rather than crashing.
    function anchorPositionFor(scene, battler) {
        if (
            scene instanceof Scene_Battle &&
            battler.isEnemy &&
            battler.isEnemy()
        ) {
            const spriteset = scene._spriteset
            const enemySprites = spriteset && spriteset._enemySprites
            const enemySprite =
                enemySprites && enemySprites.find((s) => s._battler === battler)
            if (enemySprite && enemySprite._stateIconSprite) {
                return enemySprite._stateIconSprite.worldTransform.apply(
                    new Point(0, 0)
                )
            }
        }
        const layer = scene._windowLayer
        if (layer) {
            const actorId =
                battler.isActor && battler.isActor() ? battler.actorId() : null
            for (const child of layer.children) {
                if (
                    child instanceof Window_StatusBase &&
                    child._tooltipIconRects
                ) {
                    const rects = child._tooltipIconRects[actorId]
                    if (rects && rects[0] && child._contentsSprite) {
                        return child._contentsSprite.worldTransform.apply(
                            new Point(rects[0].x, rects[0].y)
                        )
                    }
                }
            }
        }
        return null
    }

    // Installs the same tooltip window/show/hide/follow-cursor plumbing onto any
    // scene class. createHookName is whichever lifecycle method that scene uses
    // to finish building its windows (Scene_Battle: "createAllWindows",
    // Scene_MenuBase: "create") - so this same logic covers battle and every
    // menu screen (Scene_Menu, Scene_Status, Scene_Item, Scene_Skill, Scene_Equip,
    // etc, since they all inherit from Scene_MenuBase) without duplicating it.
    function installTooltipSupport(sceneProto, createHookName) {
        const _create = sceneProto[createHookName]
        sceneProto[createHookName] = function () {
            _create.call(this)
            this.createTooltipWindow()
        }

        const _update = sceneProto.update
        sceneProto.update = function () {
            _update.call(this)
            this.updateGamepadTooltip()

            if (this._stateTooltip.visible && !gamepadTooltip.active) {
                this._stateTooltip.x =
                    TouchInput.x + WauLau.StateTooltips.offsetX
                this._stateTooltip.y =
                    TouchInput.y + WauLau.StateTooltips.offsetY

                this._stateTooltip.x = Math.max(
                    0,
                    Math.min(
                        this._stateTooltip.x,
                        Graphics.boxWidth - this._stateTooltip.width
                    )
                )
                this._stateTooltip.y = Math.max(
                    0,
                    Math.min(
                        this._stateTooltip.y,
                        Graphics.boxHeight - this._stateTooltip.height
                    )
                )
            }
        }

        sceneProto.updateGamepadTooltip = function () {
            if (Input.isTriggered("ToggleTooltip")) {
                if (gamepadTooltip.active) {
                    gamepadTooltip.active = false
                    this.hideTooltip()
                } else {
                    const battlers = collectTooltipBattlers(this)
                    if (battlers.length > 0) {
                        gamepadTooltip.active = true
                        gamepadTooltip.battlers = battlers
                        gamepadTooltip.index = 0
                        this.selectGamepadTooltipBattler()
                    }
                }
                return
            }

            if (!gamepadTooltip.active) return

            if (Input.isTriggered("TooltipNext")) {
                gamepadTooltip.index =
                    (gamepadTooltip.index + 1) % gamepadTooltip.battlers.length
                this.selectGamepadTooltipBattler()
            } else if (Input.isTriggered("TooltipPrev")) {
                gamepadTooltip.index =
                    (gamepadTooltip.index -
                        1 +
                        gamepadTooltip.battlers.length) %
                    gamepadTooltip.battlers.length
                this.selectGamepadTooltipBattler()
            }
        }

        sceneProto.selectGamepadTooltipBattler = function () {
            const battler = gamepadTooltip.battlers[gamepadTooltip.index]
            this.showTooltip(battler)
            const anchor = anchorPositionFor(this, battler)
            const x = anchor ? anchor.x : Graphics.boxWidth / 2
            const y = anchor ? anchor.y : Graphics.boxHeight / 2
            this._stateTooltip.x = Math.max(
                0,
                Math.min(x, Graphics.boxWidth - this._stateTooltip.width)
            )
            this._stateTooltip.y = Math.max(
                0,
                Math.min(y, Graphics.boxHeight - this._stateTooltip.height)
            )
        }

        sceneProto.createTooltipWindow = function () {
            this._stateTooltip = new Window_StateTooltip()
            this.addChild(this._stateTooltip)
            gamepadTooltip.active = false
        }

        sceneProto.showTooltip = function (battler) {
            this._stateTooltip.setup(battler)
            this._stateTooltip.visible = true
            // Re-adding an already-added child moves it to the front of the
            // render order, so the tooltip always draws above any window
            // created after it, regardless of scene-specific creation order.
            this.addChild(this._stateTooltip)
        }

        sceneProto.hideTooltip = function () {
            this._stateTooltip.visible = false
        }
    }

    installTooltipSupport(Scene_Battle.prototype, "createAllWindows")
    installTooltipSupport(Scene_MenuBase.prototype, "create")

    // Window_MenuStatus and Window_Status (the party list and the detailed
    // character screen) don't use Sprite_StateIcon at all - Window_StatusBase's
    // drawActorIcons() just draws icons straight onto the window's bitmap with
    // drawIcon(), so there's no sprite object for the mouse-enter/exit hooks
    // above to attach to. Record each drawn icon's screen rect per actor here,
    // then hit-test them by hand against the window's own contents sprite
    // transform (the same technique Sprite_StateIcon.isBeingTouched uses, just
    // applied to the window's internal _contentsSprite instead of a sprite).
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
    Window_StatusBase.prototype.update = function () {
        _Window_StatusBase_update.call(this)
        this.updateTooltipIconHover()
    }

    Window_StatusBase.prototype.updateTooltipIconHover = function () {
        if (!this._tooltipIconRects || !sceneHasTooltipSupport()) return

        const touchPos = new Point(TouchInput.x, TouchInput.y)
        const localPos =
            this._contentsSprite.worldTransform.applyInverse(touchPos)

        let hoveredBattler = null
        for (const rects of Object.values(this._tooltipIconRects)) {
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
            gamepadTooltip.active = false
            if (hoveredBattler && hoveredBattler.allIcons().length > 0) {
                SceneManager._scene.showTooltip(hoveredBattler)
            } else {
                SceneManager._scene.hideTooltip()
            }
        }
    }

    let gbccoffee_statetooltips_spritestateicon_initialize =
        Sprite_StateIcon.prototype.initialize
    Sprite_StateIcon.prototype.initialize = function () {
        gbccoffee_statetooltips_spritestateicon_initialize.call(this)
        this._hovered = false
    }

    let gbccoffee_statetooltips_spritestateicon_update =
        Sprite_StateIcon.prototype.update
    Sprite_StateIcon.prototype.update = function () {
        gbccoffee_statetooltips_spritestateicon_update.call(this)
        this.processTouch()
    }

    Sprite_StateIcon.prototype.processTouch = function () {
        if (this.isBeingTouched()) {
            if (!this._hovered && TouchInput.isHovered()) {
                this._hovered = true
                this.onMouseEnter()
            }
        } else {
            if (this._hovered) {
                this.onMouseExit()
            }
            this._pressed = false
            this._hovered = false
        }
    }

    Sprite_StateIcon.prototype.isPressed = function () {
        return this._pressed
    }

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

    // Duck-typed rather than checking specific scene classes, so this works in
    // battle and every menu screen that installTooltipSupport() was applied to
    // (and any future scene it gets added to later) without listing them here.
    function sceneHasTooltipSupport() {
        return typeof SceneManager._scene.showTooltip === "function"
    }

    Sprite_StateIcon.prototype.onMouseEnter = function () {
        if (sceneHasTooltipSupport()) {
            if (this._battler && this._battler.allIcons().length > 0) {
                gamepadTooltip.active = false
                SceneManager._scene.showTooltip(this._battler)
            }
        }
    }

    Sprite_StateIcon.prototype.onMouseExit = function () {
        if (sceneHasTooltipSupport()) {
            SceneManager._scene.hideTooltip()
        }
    }

    function Window_StateTooltip() {
        this.initialize(...arguments)
    }

    Window_StateTooltip.prototype = Object.create(Window_Selectable.prototype)
    Window_StateTooltip.prototype.constructor = Window_StateTooltip

    Window_StateTooltip.prototype.initialize = function () {
        Window_Selectable.prototype.initialize.call(
            this,
            new Rectangle(0, 0, 0, 0)
        )
        this.visible = false
    }

    // Window_Base.prototype.flushTextState (js/rmmz_windows.js:266) never
    // actually wraps text by width in the base engine - that's only ever done
    // by Window_Message's own shouldBreakHere/canBreakHere, which this window
    // doesn't use. So a long line with no manual break in it just keeps
    // extending forever. Word-wrap it ourselves: measure candidate lines with
    // the window's own textSizeEx (which correctly ignores non-printing escape
    // codes like \B[1] or \C[x] since it runs the same text pipeline drawing
    // does), and insert a real newline wherever adding the next word would
    // exceed maxTooltipWidth. Inserting an actual \n (rather than treating
    // each wrapped segment as a separate draw call) keeps bold/color state
    // correctly carried across the break, same as any other line break.
    function wrapLine(win, line, maxWidth) {
        const words = line.split(" ")
        let wrapped = ""
        let current = ""
        for (const word of words) {
            const candidate = current ? `${current} ${word}` : word
            if (current && win.textSizeEx(candidate).width > maxWidth) {
                wrapped += (wrapped ? "\n" : "") + current
                current = word
            } else {
                current = candidate
            }
        }
        wrapped += (wrapped ? "\n" : "") + current
        return wrapped
    }

    function wrapTooltipText(win, text, maxWidth) {
        return text
            .split("\n")
            .map((line) => wrapLine(win, line, maxWidth))
            .join("\n")
    }

    Window_StateTooltip.prototype.setup = function (battler) {
        this._battler = battler

        this._buffTexts = []
        for (let i = 0; i < this._battler.buffLength(); i++) {
            let bd = { isBuffDebuff: true, param: i }
            if (this._battler.isBuffAffected(i)) {
                bd.text = WauLau.StateTooltips.buffTexts[i]
                this._buffTexts.push(bd)
            } else if (this._battler.isDebuffAffected(i)) {
                bd.text = WauLau.StateTooltips.debuffTexts[i]
                this._buffTexts.push(bd)
            }
        }

        const stateEntries = this._battler.states().map((state) => {
            const text = stateTooltipText(state, this._battler)
            return {
                state,
                buff: null,
                text: text || `\\}\\I[${state.iconIndex}]\\C[1]${state.name}`,
            }
        })
        const buffEntries = this._buffTexts.map((buff) => ({
            state: null,
            buff,
            text: buff.text,
        }))

        // The battler's own name always leads the tooltip, so it's clear at a
        // glance whose effects are being shown - important now that this
        // window can show up for any party member or enemy, not just whoever
        // the mouse happens to be over.
        const nameEntry = {
            state: null,
            buff: null,
            text: `\\B[1]\\{${battler.name()}\\}\\B[0]`,
        }

        // Measure every entry's actual (possibly multi-line) size once, then
        // reuse those same measurements for both sizing the window and placing
        // each entry - so the two can never disagree with each other again.
        const entries = [nameEntry]
            .concat(stateEntries, buffEntries)
            .map((entry) => {
                const wrappedText = wrapTooltipText(
                    this,
                    entry.text,
                    maxTooltipWidth
                )
                const size = this.textSizeEx(wrappedText)
                return {
                    ...entry,
                    text: wrappedText,
                    width: size.width,
                    height: size.height,
                }
            })

        const w = Math.max(0, ...entries.map((e) => e.width))
        const h = entries.reduce((sum, e) => sum + e.height, 0)

        this.width = w + this.padding * 3
        this.height = h + this.padding * 2

        this.createContents()

        let y = 0
        for (const entry of entries) {
            this._state = entry.state
            this._buff = entry.buff
            this.drawTextEx(entry.text, 0, y, this.width)
            y += entry.height
        }
    }

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
                turnRemain === 1 ?
                    `${turnRemain} turn remaining`
                :   `${turnRemain} turns remaining`
            )
            t = t.replace(/\x1bTR/gi, turnRemain)

            let stepsRemain = this._state.stepsToRemove
            t = t.replace(
                /\x1bSRT/gi,
                turnRemain === 1 ?
                    `${stepsRemain} step remaining`
                :   `${stepsRemain} steps remaining`
            )
            t = t.replace(/\x1bSR/gi, stepsRemain)
        }

        if (this._battler && this._buff) {
            let turnRemain = this._battler._buffTurns[this._buff.param] + 1
            t = t.replace(/\x1bBR/gi, turnRemain)
            t = t.replace(
                /\x1bTRT/gi,
                turnRemain === 1 ?
                    `${turnRemain} turn remaining`
                :   `${turnRemain} turns remaining`
            )
        }

        return `\x1bC[${textColor}]${t}\x1bC[0]`
    }

    Window_StateTooltip.prototype.processEscapeCharacter = function (
        code,
        textState
    ) {
        switch (code) {
            case "B": {
                const on = !!this.obtainEscapeParam(textState)
                this.contents.fontBold = on
                this.processColorChange(on ? boldColor : textColor)
                break
            }
            case "IT":
                this.contents.fontItalic = !!this.obtainEscapeParam(textState)
                break
            default:
                Window_Base.prototype.processEscapeCharacter.call(
                    this,
                    code,
                    textState
                )
        }
    }

    Window_StateTooltip.prototype.resetFontSettings = function () {
        Window_Base.prototype.resetFontSettings.call(this)
        this.contents.fontBold = false
        this.contents.fontItalic = false
    }

    Window_Scrollable.prototype.updateArrows = function () {}

    // The loaded custom font only registers a single "normal" weight face
    // (see FontManager.startLoading), so the engine's own Bold-via-CSS-font-
    // string request has no bold face to fall back on and renders unchanged.
    // Fake it by drawing the fill text twice with a 1px offset instead.
    // fontBold is never set true anywhere else in this project, so this is
    // effectively scoped to this plugin's own tooltip text.
    const _Bitmap_drawTextBody = Bitmap.prototype._drawTextBody
    Bitmap.prototype._drawTextBody = function (text, tx, ty, maxWidth) {
        _Bitmap_drawTextBody.call(this, text, tx, ty, maxWidth)
        //        if (this.fontBold) {
        //            _Bitmap_drawTextBody.call(this, text, tx + 1, ty, maxWidth)
        //        }
    }
})()
