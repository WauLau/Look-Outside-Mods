/*:
 * @target MZ
 * @author WauLau (based on GBCCoffee_StateTooltips by coffeenahc, https://coffeenahc.itch.io/)
 * @plugindesc (v2.2) Popup tooltip when hovering a state icon, or a weapon/armor row in the item, equip, or shop screens, with JSON-driven text, stat expressions, bold/italic and color codes. Also supports gamepad browsing for both.
 *
 * @help
 * ======================================================================================
 *
 * Merge of GBCCoffee_StateTooltips (by coffeenahc) and this mod's own stat-expression /
 * formatting add-on into a single plugin, now sourcing tooltip text from
 * data/WauLau_Tooltips.json instead of state note tags - so tooltip content lives in a file
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
 * Edit data/WauLau_Tooltips.json directly. Structure:
 *   { "states": { "<stateId>": "tooltip text for that state" } }
 * Since this is now a plain JSON string value (not a note tag), you only need normal
 * JSON string escaping: a literal backslash is "\\", a line break can just be written
 * as "\n" in the JSON and it becomes a real line break, no more pressing Enter inside
 * a single-line note field. A state with no entry falls back to the default
 * icon + name display.
 *
 * 2.) For buffs/debuffs:
 * Edit the text from this plugin's parameters, same as before.
 *
 * 3.) For weapons/armor/items:
 * Hovering a weapon, armor, or consumable item row in the Item screen, the
 * Equip screen (both the equipped-slot list and the picker list), or the
 * shop's buy/sell lists shows a tooltip built automatically from that
 * item's own database fields, plus optional flavor text:
 *   - Weapons: non-zero params (this project's renamed stat terms, e.g.
 *     "Ballistics" instead of "M.Atk"), damage type + 1H/2H (from the
 *     Attack Element / "seals Ranged" traits), and any Attack State.
 *   - Armor: equip slot, non-zero params, State Rate/State Resist/Element
 *     Rate deviations from normal, and any non-zero EX-param (Hit,
 *     Evasion, Critical Rate, regen, etc).
 *   - Regular items: Recover HP/STM (rate + flat combined) and any
 *     Add State/Remove State effect, grouped by chance. States with no
 *     icon (this project's convention for a purely internal/bookkeeping
 *     state, e.g. a hidden "already used" flag) are skipped.
 * That flavor text comes from data/WauLau_ItemTooltips.json:
 *   { "weapons": { "<weaponId>": { "text": "..." } },
 *     "armors": { "<armorId>": { "text": "..." } },
 *     "items": { "<itemId>": { "text": "..." } } }
 * Same JSON string rules as the states file above. If an item has no entry
 * there, its database "description" field is used instead, so items that
 * already have one written don't need to be duplicated into this file.
 *
 * 4.) Gamepad/controller support:
 * The dash button (gamepad X / keyboard Shift) shows and hides tooltips in
 * battle and menu screens, where dashing isn't possible. What it shows
 * depends on what's focused when you press it:
 *   - If an item/equip/shop list currently has the cursor, it shows the
 *     tooltip for that row only. Moving to another row closes it, and it
 *     stays closed until the button is pressed again.
 *   - Otherwise, it cycles through every state/buff-bearing battler on
 *     screen (same as hovering their icons with a mouse), stepped with the
 *     Prev/Next buttons below.
 * Pressing the button again turns it off. It also turns itself off
 * automatically the moment whatever it was showing stops being on screen -
 * e.g. opening the skill/item list in battle, or moving to a different
 * screen that closes the window a tooltip was anchored to - so it can't get
 * stuck showing on top of whatever opens next.
 *
 * 5.) Dialogue shops:
 * Shops that sell through map events instead of the Shop scene show the item's
 * stat block in a fixed window in the bottom-left while the Buy dialogue runs:
 *   - Eugene's (common event 46, BuyItemTable): for as long as that common
 *     event runs. The item is read from variable 481, which each shop item
 *     event sets before calling 46.
 *   - Mutt's (common event 291, MuttSpecialPrice): from that call until the
 *     calling event's Buy choice ends. The item is the first one that event
 *     page grants with Change Items/Weapons/Armors.
 * Meanwhile the message window moves to the right of it: narrowed to the
 * remaining width, its text re-wrapped to fit, and grown upward by whole
 * lines if the wrapped text needs more than its usual 4 rows.
 *
 * Escape codes recognized inside tooltip text:
 *   \C[x]           - change text color (0-31)
 *   \I[x]           - display icon
 *   \TR             - remaining turns for a state
 *   \TRT            - "X turns remaining" / "X turn remaining"
 *   \SR             - remaining steps for a state
 *   \SRT            - "X steps remaining" / "X step remaining"
 *   \BR             - remaining turns for a buff/debuff
 *   \B[1] / \B[0]   - subheader on / off: bold + a size bump (same size bump as \{ \}
 *                     below), plus switching to Bold Color / back to Text Color
 *   \IT[1] / \IT[0] - turn italic on / off
 *   \>              - right-align the rest of the line, e.g. "Bleed\>15%" draws
 *                     "Bleed" on the left and "15%" flush right (one per line)
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
 * @param labelColor
 * @text Label/Inline-Header Color
 * @desc Text color index (0-31, same as \C[x]) used for any labels.
 * @type number
 * @min 0
 * @max 31
 * @default 22
 *
 *
 * @param titleColor
 * @text Title Color
 * @desc Text color index (0-31, same as \C[x]) used for any Titles.
 * @type number
 * @min 0
 * @max 31
 * @default 10
 *
 * @param descColor
 * @text Description Color
 * @desc Text color index (0-31, same as \C[x]) used for any Descriptions.
 * @type number
 * @min 0
 * @max 31
 * @default 26
 *
 * @param subtitleColor
 * @text Subtitle Color
 * @desc Text color index (0-31, same as \C[x]) used for any Subtitles.
 * @type number
 * @min 0
 * @max 31
 * @default 18
 *
 * @param inlineColor
 * @text Inline Text Color
 * @desc Text color index (0-31, same as \C[x]) used for any Inline Text.
 * @type number
 * @min 0
 * @max 31
 * @default 0
 *
 * @param statColor
 * @text Stat Color
 * @desc Text color index (0-31, same as \C[x]) used for any Stats calculated from Expressions.
 * @type number
 * @min 0
 * @max 31
 * @default 1
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
 * @param shopMaxWidth
 * @text Max Shop Window Width
 * @desc Same as Max Tooltip Width, but for the dialogue shop info window (the message window gets the remaining screen width).
 * @type number
 * @min 50
 * @default 320
 *
 * @param shopFontOffset
 * @text Shop Window Font Offset
 * @desc Added to every tooltip font size (normal, bold, label, title, etc.) in the dialogue shop info window only. Negative values shrink it.
 * @type number
 * @min -10
 * @default 0
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
DataManager.loadDataFile("$dataTooltips", "WauLau_StateTooltips.json")

var $dataItemTooltips = null
DataManager.loadDataFile("$dataItemTooltips", "WauLau_ItemTooltips.json")
;(() => {
    "use strict"

    //============================================================================//
    //                              PLUGIN SETUP                                  //
    //============================================================================//

    // IMPORTANT CALLOUT -----------------------------
    // Must match this file's own registered plugin name in plugins.js
    // (its filename).
    //
    // Setup plugin to work with RPGMaker MZ, including plugin definitions and
    // Parameters
    const pluginName = "WauLau_LookAtTooltips"
    const params = PluginManager.parameters(pluginName)

    const WauLau = {}
    WauLau.StateTooltips = {}
    WauLau.StateTooltips.offsetX = parseInt(params.offsetX) || 0
    WauLau.StateTooltips.offsetY = parseInt(params.offsetY) || 0
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

    const enemyPercentOnly = params.enemyPercentOnly !== "false"
    const maxTooltipWidth = Number(params.maxWidth || 500)
    const maxShopInfoWidth = Number(params.shopMaxWidth || 204)

    // ------------------------ESCAPE CHARACTER VARIABLES------------------------//
    // Outline width/color for the fake-bold effect (see FONT-BOLD FIX below) -
    // set directly here, at the same time as fontBold/color, rather than
    // derived later from a single shared color when the outline is actually
    // drawn - so each bold variant's outline matches ITS OWN color (inline/
    // stat/bold) instead of every \B/\BI/\BS style sharing one outline color.
    const BOLD_OUTLINE_WIDTH = 3
    const NORMAL_OUTLINE_WIDTH = 1
    const NORMAL_SPACING_WIDTH = "0px"
    const BOLD_SPACING_WIDTH = "2px"
    const NORMAL_OUTLINE_COLOR = "rgba(0, 0, 0, 0)"

    const TEXT_SIZE_NORMAL = 16
    const TEXT_SIZE_BOLD = TEXT_SIZE_NORMAL
    const TEXT_SIZE_LABEL = 18
    const TEXT_SIZE_SUBTITLE = 20
    const TEXT_SIZE_TITLE = 22
    const TEXT_SIZE_DESCRIPTION = 14

    const shopFontOffset = Number(params.shopFontOffset || 3)

    const textColor = Number(params.textColor || 0)
    const boldColor = Number(params.boldColor || 0)
    const labelColor = Number(params.labelColor || 22)
    const titleColor = Number(params.titleColor || 10)
    const descColor = Number(params.descColor || 26)
    const subtitleColor = Number(params.subtitleColor || 18)
    const inlineColor = Number(params.inlineColor || 1)
    const statColor = Number(params.statColor || 1)
    const boldOutlineColor = Number(params.boldOutlineColor || 12)
    let M_hexColorMap = new Map() //Map containing index colors as hex colors as <Index : Hex>

    // Registers new gamepad symbols on buttons 6/7 (triggers), which the
    // engine's own Input.gamepadMapper leaves unused. Configurable via plugin
    // parameters only, not through an in-game rebind menu. The show/hide
    // button reuses the existing "shift" symbol instead (see TOGGLE BUTTON).
    Input.gamepadMapper[Number(params.gamepadPrevButton || 6)] = "TooltipPrev"
    Input.gamepadMapper[Number(params.gamepadNextButton || 7)] = "TooltipNext"

    /**
     * Builds the tooltip body text for a state from data/WauLau_Tooltips.json.
     * @param {RPG.State} state - database state object
     * @param {Game_Battler} battler - battler the tooltip is being shown for
     * @returns {string|null} formatted tooltip text, or null if the state has no JSON entry
     */
    function stateTooltipText(state, battler) {
        const entry =
            $dataTooltips &&
            $dataTooltips.states &&
            $dataTooltips.states[state.id]
        if (!entry || !entry.text) return null
        const rawText =
            Array.isArray(entry.text) ? entry.text.join("\n") : entry.text
        // {expression}s are resolved on the body only, before the \{name\}
        // header (engine font-size codes, not expression syntax) is attached.
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
        return text.replace(/\{([^{}]+)\}/g, (fullMatch, expr) => {
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
        /** Set on gamepad dismiss: mouse hover stays off until the mouse moves. */
        waitForMouseMove: false,
    }

    function resetGamepadTooltip() {
        gamepadTooltip.active = false
        gamepadTooltip.mode = null
        gamepadTooltip.itemWindow = null
        gamepadTooltip.row = -1
        gamepadTooltip.lastItem = null
        gamepadTooltip.waitForMouseMove = false
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
            // For party members
            tooltip.frontSpriteHue = -104
            tooltip.backSpriteHue = -34
            tooltip.backSpriteOpacity = 120
        } else {
            // For enemies/non party members
            tooltip.frontSpriteHue = -0
            tooltip.backSpriteHue = -105
            tooltip.backSpriteOpacity = 185
        }
        tooltip.backOpacity = 255

        scene._tooltipSwapBattler = null
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

    /** Scene_MenuBase.hideTooltip() - also cancels a queued battler swap.
     * @param {Scene_Base} scene
     * @function hideTooltip
     * @memberof Scene_MenuBase
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
        scene._stateTooltip.setupItem(item, "Tooltip")
        scene._stateTooltip.visible = true
        scene._stateTooltip.tooltipActive = true
        scene._stateTooltip.backOpacity = 255
        scene._stateTooltip.frontSpriteHue = -10
        scene._stateTooltip.backSpriteHue = 64
        scene._stateTooltip.backSpriteOpacity = 195
        //scene._stateTooltip.openness = 0
        scene._tooltipItemMode = true
        scene.addChild(scene._stateTooltip)
    }

    /** Turns gamepad tooltip browsing off and hides the tooltip. @param {Scene_Base} scene */
    function deactivateGamepadTooltip(scene) {
        resetGamepadTooltip()
        gamepadTooltip.waitForMouseMove = true
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
            // // X-AXIS
            // const right = anchor.x + (anchor.width || 0) - TOOLTIP_ANCHOR_GAP_X
            // const left = anchor.x + TOOLTIP_ANCHOR_GAP_X - tw
            // if (right + tw <= Graphics.boxWidth) {
            //     x = right
            // } else if (left >= 0) {
            //     x = left
            // } else {
            //     // Neither side fully fits - clamp to whichever is closest.
            //     x =
            //         (
            //             Math.abs(Graphics.boxWidth - (right + th)) >
            //             Math.abs(left)
            //         ) ?
            //             right
            //         :   left
            // }
            // Y-AXIS
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
            x = Graphics.boxWidth / 2
            y = Graphics.boxHeight / 2
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
        positionTooltipAt(scene, anchorPositionForItemRow(win, index))
    }

    /**
     * Per-frame gamepad-browsing driver: handles the toggle button, then
     * (while active) either defers to item-list tracking or validates/steps
     * through battlers with Prev/Next.
     * @param {Scene_Base} scene
     */
    function updateGamepadTooltip(scene) {
        // TOGGLE BUTTON -----
        // "shift" is the dash symbol (gamepad X / keyboard Shift). Dashing
        // only happens on the map, and this only runs in battle/menu scenes,
        // so the button is free here. Using the symbol (not a raw button
        // index) keeps it following any rebind of dash.
        if (Input.isTriggered("menu")) {
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
            gamepadTooltip.index =
                (gamepadTooltip.index + 1) % gamepadTooltip.battlers.length
            selectGamepadTooltipBattler(scene)
        } else if (Input.isTriggered("TooltipPrev")) {
            gamepadTooltip.index =
                (gamepadTooltip.index - 1 + gamepadTooltip.battlers.length) %
                gamepadTooltip.battlers.length
            selectGamepadTooltipBattler(scene)
        }
    }

    // -----------------------------MOUSE ITEM HOVER------------------------------//
    // Scans every item/equip/shop list window in this scene for the row the
    // mouse is over, using each window's own hitIndex()/itemAt(), collected
    // once per frame at the scene level so multiple visible lists (e.g. the
    // equip screen's slot + picker lists) can't fight over the tooltip.
    // Only touches item-mode tooltips (_tooltipItemMode), so this never
    // fights the separate state/buff icon-hover system above. The mouse
    // takes over from gamepad browsing only once it has actually moved
    // (TouchInput.isMoved()/isHovered()) AND landed on a real item, so a
    // resting cursor or a move into empty space can't interrupt gamepad mode.

    /** @param {Scene_Base} scene */
    function updateItemTooltipHover(scene) {
        const mouseActive = TouchInput.isMoved() || TouchInput.isHovered()

        let hoveredItem = null
        const layer = scene._windowLayer
        if (layer) {
            for (const child of layer.children) {
                if (
                    !isItemHoverWindow(child) ||
                    !isWindowUsableForTooltip(child)
                ) {
                    continue
                }
                const index = child.hitIndex()
                if (index >= 0) {
                    const item = child.itemAt(index)
                    if (item) hoveredItem = item
                }
            }
        }

        // A resting mouse over a list row would otherwise reopen its own
        // tooltip right after a gamepad dismiss, so after gamepad use the
        // mouse has to actually move onto an item to take over again.
        if (gamepadTooltip.active || gamepadTooltip.waitForMouseMove) {
            if (!mouseActive || !hoveredItem) return
            resetGamepadTooltip()
        }

        const TOOLTIP_HOVER_DELAY_FRAMES = 15

        if (hoveredItem) {
            // SWAP IN PROGRESS -----
            // The old tooltip is still closing: keep tracking whatever is
            // hovered now, and open that item's tooltip (no delay) the frame
            // the close finishes - so the one that opens is always the new one.
            if (scene._tooltipSwapItem) {
                scene._tooltipSwapItem = hoveredItem
                if (scene._stateTooltip.openness > 0) return
                console.log("Swap closed - Open new")
                scene._tooltipSwapItem = null
                scene._tooltipHoveredItem = hoveredItem
                showItemTooltip(scene, hoveredItem)
                return
            }
            if (hoveredItem === scene._tooltipHoveredItem) {
                console.log("Same - Return")
                return // already showing it
            }
            // openness > 0, not isOpen(): a tooltip that's still opening
            // counts as up too, or a fast switch would skip the close.
            if (scene._tooltipItemMode && scene._stateTooltip.openness > 0) {
                console.log("TT Already Up - Close, then swap")
                // hideTooltip, not close(): it clears tooltipActive, which
                // the window's own update() would otherwise reopen from.
                scene._tooltipSwapItem = hoveredItem
                scene._tooltipPendingItem = null
                scene._tooltipDelayFrames = 8
                hideTooltip(scene)
            } else if (hoveredItem !== scene._tooltipPendingItem) {
                // New hover (or moved to another item mid-wait): restart the countdown.
                console.log("New hover - Start cooldown")
                scene._tooltipPendingItem = hoveredItem
                scene._tooltipDelayFrames = TOOLTIP_HOVER_DELAY_FRAMES
            } else if (--scene._tooltipDelayFrames <= 0) {
                console.log("Delay finished - Show tt")
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
            win instanceof Window_ShopBuy
        )
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
                child.index() >= 0
            ) {
                return child
            }
        }
        return null
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

    //---------------------------SHOP STATUS PAGING---------------------------//
    // SHIFT CONFLICT -----
    // Window_ShopStatus pages through party members on "shift", the same
    // symbol as the tooltip button. The status window updates (inside the
    // scene's window layer) before updateGamepadTooltip runs, so checking
    // only for an already-open tooltip would still page on the opening
    // press. Instead, shift is blocked whenever the tooltip code will
    // claim it: a tooltip is up, or an item list is ready to open one.
    // Clicking the status window still pages.

    const _Window_ShopStatus_isPageChangeRequested =
        Window_ShopStatus.prototype.isPageChangeRequested
    /** Ignores shift while the tooltip button owns it; touch paging is unchanged. */
    Window_ShopStatus.prototype.isPageChangeRequested = function () {
        const scene = SceneManager._scene
        const tooltipOwnsShift =
            gamepadTooltip.active || !!findActiveItemWindow(scene)
        if (tooltipOwnsShift && Input.isTriggered("shift")) {
            return TouchInput.isTriggered() && this.isTouchedInsideFrame()
        }
        return _Window_ShopStatus_isPageChangeRequested.call(this)
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
        if (
            this._stateTooltip.visible &&
            this._stateTooltip.tooltipActive &&
            !gamepadTooltip.active
        ) {
            positionTooltipAt(this, {
                x: TouchInput.x + WauLau.StateTooltips.offsetX,
                y: TouchInput.y + WauLau.StateTooltips.offsetY,
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
            !gamepadTooltip.active
        ) {
            positionTooltipAt(this, {
                x: TouchInput.x + WauLau.StateTooltips.offsetX,
                y: TouchInput.y + WauLau.StateTooltips.offsetY,
                width: 0,
                height: 0,
            })
        }
    }

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
        // A window can go from visible to hidden without ever losing the mouse
        // (e.g. Scene_Battle.commandSkill/commandItem in rmmz_scenes.js hides
        // the party status window when the skill/item list opens) - without
        // this check, the stale TouchInput position from before it was hidden
        // would keep matching the last-hovered rect and the tooltip would show
        // right through the new window on top of it.
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
            resetGamepadTooltip()
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
        /** If true, shows/hides via open()/close() (openness) instead of fading. */
        this._useOpenAnimation = true
        /** If true, the open animation unrolls from the top edge instead of the center. */
        this._openFromTop = true
        this.openness = this._useOpenAnimation ? 0 : 255
        /** Characters typed per frame once open; 0 draws everything instantly. */
        this._charsPerFrame = 0
        /** @type {{text:string, x:number, y:number, state:RPG.State|null, buff:object|null}[]} */
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
    /** Hue-rotates the background and frame (-360..360).
     * @param {number} hueBack the hue shift for the background sprites
     * @param {number} hueFront the hue shift for the front sprites
     */
    Window_StateTooltip.prototype.setHue = function () {
        this._backSprite.setHue(this.backSpriteHue)
        this._frameSprite.setHue(this.frontSpriteHue)
        this._backSprite.children[0].opacity = this.backSpriteOpacity
    }

    // --------------------------------TEXT WRAPPING-------------------------------//
    // The base engine doesn't wrap text by width outside Window_Message, so
    // long lines are word-wrapped here: real \n characters are inserted where
    // the next word would exceed maxWidth, measured with textSizeEx (which
    // ignores escape codes) so bold/color state carries correctly across breaks.

    /**
     * @param {Window_Base} win
     * @param {string} line - single line, no \n
     * @param {number} maxWidth - pixels
     * @returns {string} the line with \n inserted at wrap points
     */
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

    /** Word-wraps every line of text. @param {Window_Base} win @param {string} text @param {number} maxWidth @returns {string} */
    function wrapTooltipText(win, text, maxWidth) {
        return text
            .split("\n")
            .map((line) => wrapLine(win, line, maxWidth))
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
     * @param {Array<{state:RPG.State|null, buff:object|null, text:string, face?:{name:string,index:number}|null}>} rawEntries
     */
    Window_StateTooltip.prototype.renderEntries = function (rawEntries) {
        const entries = rawEntries.map((entry) => {
            const faceSize = entry.face ? TOOLTIP_PORTRAIT_SIZE : 0
            const indent = faceSize ? faceSize + TOOLTIP_PORTRAIT_GAP : 0
            const wrappedText = wrapTooltipText(
                this,
                entry.text,
                this._maxTextWidth - indent
            )
            const size = this.textSizeEx(wrappedText)
            console.debug("Wrapped and final text", wrappedText)
            return {
                ...entry,
                text: wrappedText,
                indent,
                textHeight: size.height,
                width: size.width + indent,
                height: Math.max(size.height, faceSize),
            }
        })

        // MIN WIDTH -----
        // _minTooltipWidthFinal is a whole-window width, so it's converted
        // back to a text width here. That one text width drives both the
        // window size and _rightAlignEdge below - widening only the window
        // would leave \> values stopping at the widest line's end instead.
        const w = Math.max(
            ...entries.map((e) => e.width),
            this._minTooltipWidthFinal - this.padding * 3,
            0
        )
        const h = entries.reduce((sum, e) => sum + e.height, 0)

        this.width = w + this.padding * 3
        this.height = h + this.padding * 2
        if (!this.tooltipActive && !this._useOpenAnimation) {
            this.opacity = 0
            this.contentsOpacity = 0
        } else if (this._useOpenAnimation) {
            this.opacity = 255
            this.contentsOpacity = 255
        }

        this.createContents()
        this._rightAlignEdge = w

        this._typewriterQueue = []
        this._typewriterState = null
        let y = 0
        for (const entry of entries) {
            if (entry.face) this.drawTooltipPortrait(entry.face, 0, y)
            const textY = y + Math.floor((entry.height - entry.textHeight) / 2)
            if (this._charsPerFrame > 0) {
                this._typewriterQueue.push({
                    text: entry.text,
                    x: entry.indent,
                    y: textY,
                    state: entry.state || null,
                    buff: entry.buff || null,
                })
            } else {
                this._state = entry.state || null
                this._buff = entry.buff || null
                this.drawTextEx(entry.text, entry.indent, textY, this.width)
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
        this._buff = entry.buff
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
     * Builds and renders a battler's full tooltip (name header + states + buffs/debuffs).
     * @param {Game_Battler} battler
     */
    Window_StateTooltip.prototype.setup = function (battler) {
        this._battler = battler
        this._item = null

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
                text:
                    text ||
                    `\x1bST[1]${state.name}\x1bST[0]\x1bI[${state.iconIndex}]`,
            }
        })
        const buffEntries = this._buffTexts.map((buff) => ({
            state: null,
            buff,
            text: buff.text,
        }))

        // Battler's own name always leads the tooltip, with the actor's
        // face portrait beside it when they have one (enemies don't).
        const nameEntry = {
            state: null,
            buff: null,
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

        this.renderEntries([nameEntry].concat(stateEntries, buffEntries))
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

    /**A map tying the 10 parameters to a fitting icon from System/IconSet.png.
     * The key is the id of the parameter and the value is the id of the icon.
     * */
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
    /**A map tying the 8 trait parameters to a fitting icon from System/IconSet.png.
     * The key is the id of the parameter and the value is the id of the icon.
     * */
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
    /**A map tying the 10 EXparameters to a fitting icon from System/IconSet.png.
     * The key is the id of the EXparameter and the value is the id of the icon.
     * */
    const exParamIconMap = new Map([
        [0, 40], //Hit Rate - Eye
        [1, 861], //Evasion - Target
        [2, 275], //Crit - Laser
        [3, 1098], //Crit Evasion - Boot
        [4, 0], //Magic Evasion - null
        [5, 0], //Magic Deflect - null
        [6, 733], //Counter - Target
        [7, 0], //Hp regen - null
        [8, 0], //Stm regen - null
        [9, 0], //Amm0 regen - null
    ])

    /** A map containing all the states who have multiple variations
     * (eg. Bleed which has Bleed 1,2 & 3 or Spinal Control).
     * The key is the display name for the whole group, and the value is an
     * object mapping each variant's state id to its display-ready label, in
     * the order the labels should be listed.
     * */
    const stateVariationsMap = new Map([
        ["Bleed", { 11: "1", 12: "2", 13: "3" }], //Bleed
        ["Disease", { 60: "1", 61: "2", 62: "3" }], //Disease
        ["Swarm", { 170: "1", 171: "2", 172: "3" }], //Swarm
        ["Philpower", { 230: "1", 231: "2", 232: "3" }], //Philpower
        ["Scriv", { 305: "1", 306: "2", 307: "3", 308: "4", 309: "5" }], //Scriv
        ["Sharpen", { 311: "1", 312: "2", 313: "3", 314: "4", 315: "5" }], //Sharpen
        ["Spinal Control", { 275: "UL", 276: "UR", 277: "LL", 278: "LR" }], //Spinal Control
        ["Petrifying", { 270: "1", 271: "2", 272: "3" }], //Petrifying
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
     * Display a shortened name for a trait param (TRAIT.PARAM [21] dataId, fixed engine order:
     * Max HP, Max MP, Attack, Defense, M.Attack, M.Defense, Agility, Luck).
     * @param {number} paramId
     * @returns {string|null}
     */
    function traitParamNameShort(paramId) {
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
            default:
                return null
        }
    }

    /**
     * Display a shortened name for a param (TERMS.PARAM dataId, fixed engine order:
     * Hit, Eva, Cri, Cev, Mev, Mrf, Cnt, Hrg, Mrg, Trg). Hit/Evasion and the
     * HP/MP/TP regen labels pull this project's renamed terms.
     * @param {number} xparamId
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
     * Display a shortened name for an xparam (TRAIT_XPARAM dataId, fixed engine order:
     * Hit, Eva, Cri, Cev, Mev, Mrf, Cnt, Hrg, Mrg, Trg). Hit/Evasion and the
     * HP/MP/TP regen labels pull this project's renamed terms.
     * @param {number} xparamId
     * @returns {string|null}
     */
    function xparamNameShort(xparamId) {
        const terms = $dataSystem.terms
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

    /** Returns a ready to read string for the item scope for an item
     * @param {number} scope - the scope to get a string for
     * @returns {string}
     */
    function itemScopeLine(scope) {
        switch (scope) {
            case 0:
                scope = ""
                break
            case 1:
                scope = "One Enemy"
                break
            case 2:
                scope = "All Enemies"
                break
            case 3:
                scope = "1 Random Enemy"
                break
            case 4:
                scope = "2 Random Enemies"
                break
            case 5:
                scope = "3 Random Enemies"
                break
            case 6:
                scope = "4 Random Enemies"
                break
            case 7:
                scope = "One Party Member"
                break
            case 8:
                scope = "All Party Members"
                break
            case 9:
                scope = "One Dead Party Member"
                break
            case 10:
                scope = "All Dead Party Members"
                break
            case 11:
                scope = "Player"
                break
            case 12:
                scope = "One Party Member"
                break
            case 13:
                scope = "All Party Members"
                break
            case 14:
                scope = "All Party Members and Enemies"
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

    //============================================================================//
    //                   ITEM/WEAPON/ARMOR TOOLTIP CONTENT                        //
    //============================================================================//

    // -----------------------------STAT BLOCK & TRAITS----------------------------//

    /**
     * Non-zero base params and xparams for a weapon/armor, using this
     * project's renamed param labels from $dataSystem.terms.params.
     * @param {RPG.Weapon|RPG.Armor} item
     * @returns {string[]|null}
     */
    function itemStatBlockLines(item) {
        const paramNames = $dataSystem.terms.params
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
            if (t.code === Game_BattlerBase.TRAIT_SPARAM) {
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
                if (!name) return null
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
                `\\I[${icon}]\\BS[1]\\IT[1]${name}\\IT[0]\\BS[0]\\>\\BS[1]${sign}${percent}%\\BS[0]`
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
        if (item.atypeId === 5) {
            return `\\ST[1]1H Ranged\\ST[0]`
        }
        if (item.atypeId === 6) {
            return `\\ST[1]2H Ranged\\ST[0]`
        }
        if (item.atypeId === 8) {
            return `\\ST[1]1H Slingshot\\ST[0]`
        }
        return name ? `\\ST[1]${name} Gear\\ST[0]` : null
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
        return [`\\LB[1]Immune against\\LB[0]`, names.join(", ")]
    }

    /**
     * Incoming elemental damage adjustments (TRAIT_ELEMENT_RATE, value !== 1).
     * @param {RPG.Armor} item
     * @returns {string[]|null}
     */
    function armorElementRateLines(item) {
        const lines = []
        for (const trait of item.traits.values()) {
            let elementName = ""
            let percent = ""
            let sign = ""
            let valid = false
            let shouldAbandon = false
            for (const [key, value] of Object.entries(trait)) {
                if (shouldAbandon) break
                switch (key) {
                    case "code": {
                        if (value === Game_BattlerBase.TRAIT_ELEMENT_RATE) {
                            valid = true
                        } else shouldAbandon = true
                        break
                    }
                    case "dataId": {
                        elementName = $dataSystem.elements[value]
                        break
                    }
                    case "value": {
                        if (value === 0) break
                        percent = Math.round((value - 1) * 100)
                        sign = percent > 0 ? "+" : ""
                        break
                    }
                    default: {
                    }
                }
            }
            if (valid)
                lines.push(
                    `\\BS[1]\\IT[1]${elementName} DMG\\IT[0]\\BS[0]\\>\\BS[1]${sign}${percent}%\\BS[0]`
                )
        }
        if (lines.length === 0) return null
        let combined = []
        if (lines.length > 3) {
            combined = [`\\LB[1]Damage Adjust\\LB[0]`, `${lines.join(`, `)}`]
        } else {
            combined = lines
            combined.splice(0, 0, `\\LB[1]Damage Adjust\\LB[0]`)
        }
        return combined
    }

    //============================================================================//
    //                                 ITEM DATA                                  //
    //============================================================================//

    // ------------------------RECOVERY / STATE EFFECT LINES-----------------------//
    // Consumable items describe their effects entirely through their effects
    // list rather than a params array. Only recover HP/STM and add/remove
    // state are covered; other effect types (gain TP, buffs, learn skill, ...)
    // are left out.

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
                `\\BS[1]\\C[20]${parts.join(" + ")}\\BS[0]\\C[21] ${label}\\C[${textColor}]`,
            ]
        } else if (label === "STM") {
            return [
                `${verb}`,
                `\\BS[1]\\C[22]${parts.join(" + ")}\\BS[0]\\C[23] ${label}\\C[${textColor}]`,
            ]
        } else {
            return [`${verb}`, `\\BS[1]${parts.join(" + ")}\\BS[0] ${label}`]
        }
    }
    function itemDamageLines(item) {
        const itemDmg = item.damage
        if (!itemDmg.type || itemDmg.type === 0 || itemDmg.type > 6) return null
        const elementDmg = $dataSystem.elements[itemDmg.elementId]
        const dmg = itemDmg.formula.match(/^\S*/)
        if (elementDmg === null || elementDmg === 0 || dmg === "") return null
        let scope = itemScopeLine(item.scope)
        return `Deals \\BS[1]${dmg}\\BS[0] ${elementDmg} DMG to \\BS[1]${scope}\\BS[0]`
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
        const recoverLines = []
        const loseLines = []
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
        if (loseLines.length !== 0)
            loseLines.splice(0, 0, `\\LB[1]Lose:\\LB[0]`)
        if (recoverLines.length !== 0)
            recoverLines.splice(0, 0, `\\LB[1]Recover:\\LB[0]`)

        if (recoverLines.length === 0) return loseLines
        if (loseLines.length === 0) return recoverLines

        const combined = recoverLines.concat(loseLines)
        if (combined.length === 0) return []

        return combined
    }

    /**
     * Groups add/remove-state effects by chance into one comma-joined line
     * per verb (e.g. "Cures: A, B, C"), skipping duplicate effects on the
     * same state by keeping only the highest chance.
     * @param {string} verb - e.g. "Inflicts" / "Cures"
     * @param {Map<number, number>} stateChances - stateId -> chance (0-1)
     * @returns {string[]}
     */
    function groupedStateLines(verb, stateChances) {
        const combined = []
        const entries = [...stateChances].map(([stateId, chance]) => ({
            stateId,
            value: Math.round(chance * 100),
        }))
        for (const { state, name, value } of mergeStateVariations(entries)) {
            // iconIndex 0 marks a purely internal/bookkeeping state - skip it,
            // same convention Game_BattlerBase.allIcons() uses.
            if (state.iconIndex === 0) continue
            const prefix = value >= 100 ? "" : `\\BS[1]${value}%\\BS[0] `
            combined.push(`\\I[${state.iconIndex}]${prefix}${name}`)
        }
        if (combined.length === 0) return []
        combined.splice(0, 0, `\\LB[1]${verb}:\\LB[0]`)
        return combined
    }

    /** Add/remove-state effect lines for an item. @param {RPG.Item} item @returns {string[]} */
    function itemStateEffectLines(item) {
        const addChances = new Map()
        const removeChances = new Map()
        for (const effect of item.effects) {
            // dataId 0 on EFFECT_ADD_STATE means "whatever the user's weapon
            // inflicts on attack" rather than a specific state - skipped.
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
        // groupedStateLines() returns [header, ...stateNames] - keep the header
        // on its own line and comma-join the state names after it.
        const inflictions = groupedStateLines("Inflicts", addChances)
        const cures = groupedStateLines("Cures", removeChances)
        const lines = []
        if (inflictions.length > 0) {
            lines.push(inflictions[0], `${inflictions.slice(1).join(", ")}`)
        }
        if (cures.length > 0) {
            lines.push(cures[0], `${cures.slice(1).join(", ")}`)
        }
        return lines
    }

    // ---------------------------------GLOBAL---------------------------------- //
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

    // -------------------------------FLAVOR TEXT----------------------------------//

    // Strips a hand-written leading "[Crush]"-style bracket from a weapon/item
    // description, since weaponDamageLine() now derives that from trait data.
    /** @param {string} text @returns {string} */
    function stripLeadingBracketNote(text) {
        return text.replace(/^\s*\[[^\]]*\]\s*/, "")
    }
    // Grabs a hand-written leading "[Crush]"-style bracket from a weapon/item
    // description, and returns its contents without the brackets
    /** @param {string} text @returns {string} */
    function getTextFromLeadingBracketNote(text) {
        const match = text.match(/(\[(\w*)\].*|.*)/)
        return match[2] ? match[2] : ""
    }

    /** Grab the first WD_Itemsobject from the items 'note',
     * or try and grab an item type from its bracket in its description.
     * @param {RPG.Item} item The item database object
     * @returns {string} The item type */
    function grabLeadingBracketNoteForItem(item) {
        let itemType = ""
        const metaObj = item.meta
        const contendersArr = [""]
        if (Object.values(metaObj).length > 0) {
            /** The keys of the Meta object IN UPPERCASE for string searches, remember to use uppercase then. @type String[]*/
            const metaKeysCaseFormat = Object.keys(metaObj).map((k) =>
                k.toUpperCase()
            )

            for (const [key, value] of Object.entries(metaObj)) {
                if (key.toUpperCase() === "WD_ITEMS") {
                    continue
                }
                const match = value.match(/[a-zA-Z]*/)
                if (!match[0]) continue
                contendersArr.push(match[0].toUpperCase())
            }

            if (metaKeysCaseFormat.includes("WD_ITEMS")) {
                const WD_ItemStr = metaObj.WD_Items
                const WD_ItemArr = WD_ItemStr.split(" ")
                    .filter((e) => e !== "")
                    .map((e) => contendersArr.push(e.toUpperCase()))
            }
        }

        itemType = itemTypeLine(contendersArr, item)

        const capitalizedItemType =
            String(itemType).charAt(0).toUpperCase() +
            String(itemType).slice(1).toLowerCase()
        return `\\ST[1]${capitalizedItemType}\\ST[0]`
    }

    /**
     * Flavor text for an item's tooltip: a WauLau_ItemTooltips.json entry if
     * present, else the item's own database description.
     * @param {'weapons'|'armors'|'items'} kind
     * @param {RPG.Item} item
     * @returns {string}
     */
    function itemTooltipFlavorText(kind, item) {
        const entry =
            $dataItemTooltips &&
            $dataItemTooltips[kind] &&
            $dataItemTooltips[kind][item.id]
        if (entry && entry.text) {
            return Array.isArray(entry.text) ? entry.text.join(" ") : entry.text
        }
        const description = item.description || ""
        return kind === "weapons" || kind === "items" ?
                stripLeadingBracketNote(description)
            :   description
    }

    //============================================================================//
    //                        TOOLTIP ENTRY AND PROCESSING                        //
    //============================================================================//

    /** Full tooltip text for a weapon/armor/item row. @param {RPG.BaseItem} item @returns {string|null} */
    function itemTooltipEntryText(item, type) {
        const kind =
            DataManager.isWeapon(item) ? "weapons"
            : DataManager.isArmor(item) ? "armors"
            : DataManager.isItem(item) ? "items"
            : null
        if (!kind) return null

        let topLines
        if (kind === "weapons") {
            const damageLine = weaponDamageLine(item)
            topLines = (damageLine ? [damageLine] : [])
                .concat(itemStatBlockLines(item))
                .concat(weaponAttackStateLines(item))
        } else if (kind === "armors") {
            const slotLine = armorSlotLine(item)
            const resistLine = armorStateResistLine(item)
            topLines = (slotLine ? [slotLine] : [])
                .concat(itemStatBlockLines(item))
                .concat(armorStateRateLines(item))
                .concat(armorElementRateLines(item))
                .concat(resistLine || [])
        } else if (kind === "items") {
            topLines = [grabLeadingBracketNoteForItem(item)]
                .concat(itemDamageLines(item))
                .concat(itemRecoverLines(item))
                .concat(itemStateEffectLines(item))
        } else {
            topLines = itemStateEffectLines(item).concat(itemRecoverLines(item))
        }
        const statLines = topLines.filter((word) => word !== null)

        if (type.toUpperCase() === "SHOP") {
            const text = statLines.length > 1 ? `${statLines.join("\n")}` : ""
            const capitalized = text.replace(
                /(^\w|\s\w|\]\w)(\S*)/g,
                (_, m1, m2) => m1.toUpperCase() + m2
            )
            return capitalized
        } else {
            const flavorText = `\n\\DE[1]${itemTooltipFlavorText(kind, item)}\\DE[0]`
            const text = `\\TI[1]${item.name}\\I[${item.iconIndex}]\\TI[0]\n${statLines.join("\n")}`
            const capitalized = text.replace(
                /(^\w|\s\w|\]\w)(\S*)/g,
                (_, m1, m2) => m1.toUpperCase() + m2
            )
            return `${capitalized}${flavorText}`
        }
    }

    let HUE_BACK_AMT = 20
    let HUE_FRONT_AMT = 20

    /** Builds and renders a weapon/armor/item's tooltip.
     * @param {RPG.BaseItem} item
     * @param {String} [type = "Tooltip"] - Use "Tooltip" to show as a tooltip, and "Shop" to show as a shop window for dialogue shops. Defaults to "Tooltip"
     * @returns {boolean} false if there was nothing worth showing (nothing was drawn,
     *   so the window still holds the previous item's contents and should stay hidden)
     * */
    Window_StateTooltip.prototype.setupItem = function (
        item,
        type = "Tooltip"
    ) {
        this._battler = null
        this._item = item

        const text = itemTooltipEntryText(item, type)

        if (text === "") return false
        this.renderEntries([
            { state: null, buff: null, text: text || item.name },
        ])
        return true
    }

    // --------------------------------ESCAPE CODES--------------------------------//

    /** Resolves \TR/\TRT/\SR/\SRT (state) and \BR (buff/debuff) turn/step codes. */
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

            let stepsRemain = this._state.stepsToRemove
            t = t.replace(
                /\x1bSRT/gi,
                `\x1bDE[1]${
                    turnRemain === 1 ?
                        `${stepsRemain} step remaining`
                    :   `${stepsRemain} steps remaining`
                }\x1bDE[0]`
            )
            t = t.replace(/\x1bSR/gi, stepsRemain)
        }

        if (this._battler && this._buff) {
            let turnRemain = this._battler._buffTurns[this._buff.param] + 1
            t = t.replace(/\x1bBR/gi, turnRemain)
            t = t.replace(
                /\x1bTRT/gi,
                `\x1bDE[1]${
                    turnRemain === 1 ?
                        `${turnRemain} turn remaining`
                    :   `${turnRemain} turns remaining`
                }\x1bDE[0]`
            )
        }

        return t
    }

    // -------------------------------COLOR MIXER--------------------------------//

    /** Clamps a color channel to 0-255, treating only NaN as invalid input
     * @param {number} value the value that should be clamped
     * @param {number} clamp the ceiling of the clamping. Goes from 0 to this value
     * @returns {number} the input value clamped between a max of the "Clamp" value, or a min of 0
     * */
    function clampChannel(value, clamp) {
        const abs = Math.abs(value)
        if (Number.isNaN(abs)) return clamp
        return abs > clamp ? clamp : abs
    }

    /**
     *
     * @param {string | number[]} base Base color to mix with in RGB or HEX, if no Alpha value is sent, it will default to 1.
     * @param {string | number[]} added The added color to mix with in RGB or HEX, if no Alpha value is sent, it will default to 1.
     * @param {number} ratio The ratio of base color to added color. From 0-1.
     * @returns {string} A string fornatted as `rgba(r,g,b,a)`
     */

    function colorMix(base, added, ratio) {
        if (typeof base === "string" && base.includes(`#`))
            base = hexToRGBA(base)
        if (typeof added === "string" && added.includes(`#`))
            added = hexToRGBA(added)
        if (!Array.isArray(base) && !typeof base !== "string") {
            console.error(
                `Tried to mix colors with a base color that is not an RGBA or HEX value. Value; ${base}. Using inputted base color ${base}`
            )
            return base
        }

        if (!Array.isArray(base) && !typeof base !== "string") {
            console.error(
                `Tried to mix colors with a base color that is not an RGBA or HEX value. Value; ${added}. Using inputted base color ${base}`
            )
            return base
        }

        const baseCol = [
            clampChannel(base[0]),
            clampChannel(base[1]),
            clampChannel(base[2]),
        ]
        const addedCol = [
            clampChannel(added[0]),
            clampChannel(added[1]),
            clampChannel(added[2]),
        ]

        ratio = Number.isNaN(Math.abs(ratio)) ? 1 : Math.min(Math.abs(ratio), 1)
        const ratioBase = ratio
        const ratioAdded = 1 - ratio

        let mix = []
        mix[3] =
            Math.abs(
                clampChannel(base[3], 1) * ratioBase -
                    clampChannel(added[3], 1) * ratioAdded
            ).toFixed(2) || 1

        mix[0] = Math.round(addedCol[0] * ratioAdded + baseCol[0] * ratioBase) // red
        mix[1] = Math.round(addedCol[1] * ratioAdded + baseCol[1] * ratioBase) // green
        mix[2] = Math.round(addedCol[2] * ratioAdded + baseCol[2] * ratioBase) // blue
        return `rgba(${mix.join(`,`)})`
    }

    function hexToRGBA(hex) {
        const matchRegex =
            /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i

        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        hex = hex.replace(shorthandRegex, function (m, r, g, b) {
            return r + r + g + g + b + b
        })

        var result = matchRegex.exec(hex)
        const convertedRGB = [
            parseInt(result[1], 16) || 255,
            parseInt(result[2], 16) || 255,
            parseInt(result[3], 16) || 255,
            parseInt(result[4], 16) / 255 || 1,
        ]
        return result ? convertedRGB : null
    }

    /**
     * Get the hex value of the bold outline color. This should only be called when the windowskin is loaded and ready
     * @param {number} indexn The index of the color to get
     * @returns {string} Bold Color as HEX
     */
    function hexColorMapManager(index) {
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
     * Adds this plugin's own bold/italic/color escape codes on top of the
     * engine's defaults: \BI (bold, inline color), \BS (bold, stat color),
     * \B (bold, bold color), \IT (italic), \LB (label, +1 font size),
     * \ST (subtitle, +2 font size), \TI (title, +2 font size).
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
                this.processColorChange(on ? inlineColor : textColor)
                this.contents.outlineWidth =
                    on ? BOLD_OUTLINE_WIDTH : NORMAL_OUTLINE_WIDTH
                this.contents.outlineColor =
                    on ?
                        hexColorMapManager(boldOutlineColor)
                        //`${colorMix(`${hexColorMapManager(inlineColor)}${BOLD_OUTLINE_ALPHA}`, [0, 0, 0, 1], 0.9)}`
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
                this.processColorChange(on ? statColor : textColor)
                this.contents.outlineWidth =
                    on ? BOLD_OUTLINE_WIDTH : NORMAL_OUTLINE_WIDTH
                this.contents.outlineColor =
                    on ?
                        hexColorMapManager(boldOutlineColor)
                        //`${colorMix(`${hexColorMapManager(statColor)}${BOLD_OUTLINE_ALPHA}`, [0, 0, 0, 1], 0.8)}`
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
                this.processColorChange(on ? boldColor : textColor)
                this.contents.outlineWidth =
                    on ? BOLD_OUTLINE_WIDTH : NORMAL_OUTLINE_WIDTH
                this.contents.outlineColor =
                    on ?
                        hexColorMapManager(boldOutlineColor)
                        //`${colorMix(`${hexColorMapManager(boldColor)}${BOLD_OUTLINE_ALPHA}`, [0, 0, 0, 1], 0.8  )}`
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
                this.processColorChange(on ? labelColor : textColor)
                this.outlineWidth = 6
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_LABEL)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
                break
            }
            case "ST": {
                const on = !!this.obtainEscapeParam(textState)
                this.processColorChange(on ? subtitleColor : textColor)
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_SUBTITLE)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
                break
            }
            case "TI": {
                const on = !!this.obtainEscapeParam(textState)
                this.processColorChange(on ? titleColor : textColor)
                if (on) {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_TITLE)
                } else {
                    this.contents.fontSize = this.textSize(TEXT_SIZE_NORMAL)
                }
                break
            }
            case "DE": {
                const on = !!this.obtainEscapeParam(textState)
                this.processColorChange(on ? descColor : textColor)
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

    // RIGHT-ALIGN (\>) -----------------------------
    // Measuring passes (textSizeEx, drawing === false) run before the window
    // width is known, so \> only reserves RIGHT_ALIGN_MIN_GAP there - that
    // gap is what makes the line count as "left + gap + right" wide when
    // renderEntries sizes the window. The drawing pass then jumps x so the
    // rest of the line ends at _rightAlignEdge (the widest line's width).
    const RIGHT_ALIGN_MIN_GAP = 24

    /**
     * Handles \>: pushes the rest of the current line flush to the right edge.
     * @param {object} textState
     */
    Window_StateTooltip.prototype.processRightAlign = function (textState) {
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
    // when pre-measuring a line's height, so it doesn't know \TI/\ST/\LB
    // change size too - lines using them would draw correctly but get the
    // wrong vertical space reserved around them. Reimplemented here with the
    // same lookahead, adding TI/ST/LB using the same size deltas
    // processEscapeCharacter applies above.
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
    // assuming a window's base text is the main font size (22). Tooltip base
    // text is TEXT_SIZE_NORMAL (20), so that made every plain tooltip line
    // 2px shorter than a message window line. Deriving the spacing from
    // TEXT_SIZE_NORMAL instead makes a plain line exactly lineHeight() tall -
    // the same as Window_Message - while bigger/smaller lines (\TI, \LB, \DE)
    // keep the same spacing around their own font size. Uses this window's
    // offset size, so shop lines keep matching the message window beside it.
    /** @param {object} textState @returns {number} */
    Window_StateTooltip.prototype.calcTextHeight = function (textState) {
        const lineSpacing = this.lineHeight() - this.textSize(TEXT_SIZE_NORMAL)
        const lastFontSize = this.contents.fontSize
        const lines = textState.text.slice(textState.index).split("\n")
        const textHeight = this.maxFontSizeInLine(lines[0]) + lineSpacing
        this.contents.fontSize = lastFontSize
        return textHeight
    }

    // Tooltip window has no scrollbar arrows to draw.
    Window_Scrollable.prototype.updateArrows = function () {}

    // FONT-BOLD FIX -----------------------------
    // The loaded custom font only registers a "normal" weight, so a plain
    // fontBold request has no bold face to fall back on - bold is faked with
    // a heavier, color-matched outline instead. outlineWidth/outlineColor are
    //directly in processEscapeCharacter/resetFontSettings above (at the
    // same time as fontBold), so the vanilla engine's own _drawTextOutline
    // already picks them up correctly - no Bitmap-level patch needed.

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
    // Window_Message types 1/frame; a stat block is several times longer
    // than a message, so it types faster to finish in a similar time.
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
        this._dialogueShopInfo.frontSpriteHue = -0
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
            win._hasShopContent = win.setupItem(dialogueShop.item, "Shop")
            win._fullHeight = win.height
            win._shopHeight = null
        }
        if (!win._hasShopContent) return false
        this.visible = true
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

    //---------------------------------------------------------------//
    // Message window beside the info window
    //---------------------------------------------------------------//
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

// Color reference notes:
// #C2D5FB - item Color ingame
// #DCEDD4 - item Color[0]
// #D8EBCF - Item outlinecolor ingame
// #D8EBCF - state color and outline color
