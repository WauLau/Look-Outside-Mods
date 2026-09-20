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
 * The Gamepad Toggle Button below turns on tooltip browsing without a mouse.
 * What it shows depends on what's focused when you press it:
 *   - If an item/equip/shop list currently has the cursor, the tooltip
 *     follows whichever row that list's own cursor is on - just move the
 *     cursor as normal, no extra buttons needed for this case.
 *   - Otherwise, it cycles through every state/buff-bearing battler on
 *     screen (same as hovering their icons with a mouse), stepped with the
 *     Prev/Next buttons below.
 * Pressing the toggle button again turns it off. It also turns itself off
 * automatically the moment whatever it was showing stops being on screen -
 * e.g. opening the skill/item list in battle, or moving to a different
 * screen that closes the window a tooltip was anchored to - so it can't get
 * stuck showing on top of whatever opens next.
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

var $dataTooltips = null;
DataManager.loadDataFile('$dataTooltips', 'WauLau_StateTooltips.json');

var $dataItemTooltips = null;
DataManager.loadDataFile('$dataItemTooltips', 'WauLau_ItemTooltips.json');
(() => {
  'use strict';

  //============================================================================//
  //                              PLUGIN SETUP                                  //
  //============================================================================//

  // IMPORTANT CALLOUT -----------------------------
  // Must match this file's own registered plugin name in plugins.js
  // (its filename).
  //
  // Setup plugin to work with RPGMaker MZ, including plugin definitions and
  // Parameters
  const pluginName = 'WauLau_LookAtTooltips';
  const params = PluginManager.parameters(pluginName);

  const WauLau = {};
  WauLau.StateTooltips = {};
  WauLau.StateTooltips.offsetX = parseInt(params.offsetX) || 0;
  WauLau.StateTooltips.offsetY = parseInt(params.offsetY) || 0;
  WauLau.StateTooltips.paramNames = [
    'hp',
    'mp',
    'atk',
    'def',
    'matk',
    'mdef',
    'agi',
    'luk',
  ];
  WauLau.StateTooltips.buffTexts = WauLau.StateTooltips.paramNames.map(
    (p) => params[`${p}Buff`],
  );
  WauLau.StateTooltips.debuffTexts = WauLau.StateTooltips.paramNames.map(
    (p) => params[`${p}Debuff`],
  );

  const decimalPlaces = Number(params.decimalPlaces || 0);
  const textColor = Number(params.textColor || 0);
  const boldColor = Number(params.boldColor || 0);
  const labelColor = Number(params.labelColor || 22);
  const titleColor = Number(params.titleColor || 10);
  const descColor = Number(params.descColor || 26);
  const subtitleColor = Number(params.subtitleColor || 18);
  const inlineColor = Number(params.inlineColor || 2);
  const statColor = Number(params.statColor || 1);
  const boldOutlineColor = Number(params.boldOutlineColor || 12);

  const enemyPercentOnly = params.enemyPercentOnly !== 'false';
  const maxTooltipWidth = Number(params.maxWidth || 500);

  // Registers new gamepad symbols on buttons 6/7/8 (triggers + back/select),
  // which the engine's own Input.gamepadMapper leaves unused. Configurable
  // via plugin parameters only, not through an in-game rebind menu.
  Input.gamepadMapper[Number(params.gamepadToggleButton || 8)] =
    'ToggleTooltip';
  Input.gamepadMapper[Number(params.gamepadPrevButton || 6)] = 'TooltipPrev';
  Input.gamepadMapper[Number(params.gamepadNextButton || 7)] = 'TooltipNext';

  /**
   * Builds the tooltip body text for a state from data/WauLau_Tooltips.json.
   * @param {RPG.State} state - database state object
   * @param {Game_Battler} battler - battler the tooltip is being shown for
   * @returns {string|null} formatted tooltip text, or null if the state has no JSON entry
   */
  function stateTooltipText(state, battler) {
    const entry =
      $dataTooltips && $dataTooltips.states && $dataTooltips.states[state.id];
    if (!entry || !entry.text) return null;
    const rawText =
      Array.isArray(entry.text) ? entry.text.join('\n') : entry.text;
    // {expression}s are resolved on the body only, before the \{name\}
    // header (engine font-size codes, not expression syntax) is attached.
    const text = evaluateTooltipExpressions(battler, rawText);
    return `\\ST[1]${state.name}\\ST[0]\\I[${state.iconIndex}]\\C[${textColor}]\n${text}`;
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
    level: (battler) => (typeof battler.level === 'number' ? battler.level : 0),
    lv: (battler) => (typeof battler.level === 'number' ? battler.level : 0),
    lvl: (battler) => (typeof battler.level === 'number' ? battler.level : 0),
  };

  const aliasNames = Object.keys(statAliases).sort(
    (a, b) => b.length - a.length,
  );

  function resolveExpression(battler, expr) {
    let resolved = expr;
    for (const name of aliasNames) {
      const regex = new RegExp(`\\b${name}\\b`, 'gi');
      resolved = resolved.replace(regex, () => statAliases[name](battler));
    }
    return resolved;
  }

  /** @param {Game_Battler} battler @returns {boolean} */
  function isEnemyBattler(battler) {
    return !!(battler.isEnemy && battler.isEnemy());
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
      .match(/^[a-zA-Z_]+\s*\*\s*([+-]?[0-9]*\.?[0-9]+)$/);
    if (!match) return null;
    const percent = parseFloat(match[1]) * 100;
    return `${percent.toFixed(decimalPlaces)}%`;
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
          const percentText = enemyPercentExpression(expr);
          if (percentText === null) {
            throw new Error(
              `Enemy Tooltips: Percent Only is ON, but "${expr}" isn't a simple "stat * number" expression, so it can't be converted to a percent - reword this entry`,
            );
          }
          return `\\BS[1]${percentText}\\BS[0]`;
        }

        const resolved = resolveExpression(battler, expr);
        if (!/^[0-9+\-*/().\s]+$/.test(resolved)) {
          throw new Error(`Unrecognized stat name in expression: ${expr}`);
        }
        const value = Function(`"use strict"; return (${resolved});`)();
        if (typeof value !== 'number' || Number.isNaN(value)) {
          throw new Error(`Expression did not evaluate to a number: ${expr}`);
        }
        return `\\BS[1]${value.toFixed(decimalPlaces)}\\BS[0]`;
      } catch (e) {
        console.warn(
          `${pluginName}: Failed to evaluate tooltip expression "{${expr}}" - ${e.message}`,
        );
        return '?';
      }
    });
  }

  //============================================================================//
  //                        GAMEPAD TOOLTIP BROWSING                            //
  //============================================================================//

  // Shared state for gamepad-driven tooltip browsing. Only one scene is ever
  // active at a time, so a single object is fine - reset whenever a scene
  // that supports tooltips is (re)created.
  //
  // mode: 'battler' cycles state/buff icons by hand with Prev/Next;
  // 'item' mirrors whichever row an item/equip/shop list's own cursor is on.
  const gamepadTooltip = {
    active: false,
    mode: null,
    battlers: [],
    index: 0,
    itemWindow: null,
    // Kept separate from the mouse-hover system's this._tooltipHoveredItem
    // (see updateGamepadItemTooltip/updateItemTooltipHover below) so mouse
    // and gamepad tracking can't overwrite each other's selection.
    lastItem: null,
  };

  function resetGamepadTooltip() {
    gamepadTooltip.active = false;
    gamepadTooltip.mode = null;
    gamepadTooltip.itemWindow = null;
    gamepadTooltip.lastItem = null;
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
    if (!win.visible) return false;
    if (win.isOpen && !win.isOpen()) return false;
    return true;
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
    if (scene instanceof Scene_Battle && battler.isEnemy && battler.isEnemy()) {
      const spriteset = scene._spriteset;
      const enemySprites = spriteset && spriteset._enemySprites;
      const enemySprite =
        enemySprites && enemySprites.find((s) => s._battler === battler);
      return (enemySprite && enemySprite._stateIconSprite) || null;
    }
    if (battler.isActor && battler.isActor()) {
      const layer = scene._windowLayer;
      if (!layer) return null;
      const key = `actor${battler.actorId()}-stateIcon`;
      for (const child of layer.children) {
        if (
          child instanceof Window_StatusBase &&
          child._additionalSprites &&
          child._additionalSprites[key] instanceof Sprite_StateIcon &&
          isWindowUsableForTooltip(child)
        ) {
          return child._additionalSprites[key];
        }
      }
    }
    return null;
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
          (b) => b.allIcons().length > 0 && battlerTooltipStillValid(scene, b),
        );
    }
    const battlers = [];
    const seen = new Set();
    const layer = scene._windowLayer;
    if (layer) {
      for (const child of layer.children) {
        if (
          !(child instanceof Window_StatusBase) ||
          !isWindowUsableForTooltip(child)
        ) {
          continue;
        }
        if (child._tooltipIconRects) {
          for (const rects of Object.values(child._tooltipIconRects)) {
            for (const rect of rects) {
              if (
                !seen.has(rect.battler) &&
                rect.battler.allIcons().length > 0
              ) {
                seen.add(rect.battler);
                battlers.push(rect.battler);
              }
            }
          }
        }
        if (child._additionalSprites) {
          for (const sprite of Object.values(child._additionalSprites)) {
            if (
              sprite instanceof Sprite_StateIcon &&
              sprite._battler &&
              !seen.has(sprite._battler) &&
              sprite._battler.allIcons().length > 0
            ) {
              seen.add(sprite._battler);
              battlers.push(sprite._battler);
            }
          }
        }
      }
    }
    return battlers;
  }

  /**
   * Per-frame validity gate for gamepad battler browsing: true only while
   * the battler's icon is still being shown by something currently on screen.
   * @param {Scene_Base} scene
   * @param {Game_Battler} battler
   * @returns {boolean}
   */
  function battlerTooltipStillValid(scene, battler) {
    if (!battler) return false;
    const iconSprite = findStateIconSprite(scene, battler);
    if (iconSprite) return iconSprite.visible !== false;
    const layer = scene._windowLayer;
    if (!layer) return false;
    const actorId =
      battler.isActor && battler.isActor() ? battler.actorId() : null;
    for (const child of layer.children) {
      if (child instanceof Window_StatusBase && child._tooltipIconRects) {
        const rects = child._tooltipIconRects[actorId];
        if (rects && rects[0]) {
          return isWindowUsableForTooltip(child);
        }
      }
    }
    return false;
  }

  /**
   * Screen position (plus size, for flipping above/below) to anchor a
   * battler's tooltip to, mirroring where mouse hover would point.
   * @param {Scene_Base} scene
   * @param {Game_Battler} battler
   * @returns {{x:number,y:number,width:number,height:number}|null} null if no anchor was found
   */
  function anchorPositionFor(scene, battler) {
    const iconSprite = findStateIconSprite(scene, battler);
    if (iconSprite) {
      const point = iconSprite.worldTransform.apply(new Point(0, 0));
      return {
        x: point.x,
        y: point.y,
        width: iconSprite.width,
        height: iconSprite.height,
      };
    }
    const layer = scene._windowLayer;
    if (layer) {
      const actorId =
        battler.isActor && battler.isActor() ? battler.actorId() : null;
      for (const child of layer.children) {
        if (
          child instanceof Window_StatusBase &&
          child._tooltipIconRects &&
          isWindowUsableForTooltip(child)
        ) {
          const rects = child._tooltipIconRects[actorId];
          if (rects && rects[0] && child._contentsSprite) {
            const point = child._contentsSprite.worldTransform.apply(
              new Point(rects[0].x, rects[0].y),
            );
            return {
              x: point.x,
              y: point.y,
              width: rects[0].width,
              height: rects[0].height,
            };
          }
        }
      }
    }
    return null;
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
    scene._stateTooltip = new Window_StateTooltip();
    scene.addChild(scene._stateTooltip);
    resetGamepadTooltip();
  }

  /**
   * Shows a battler's state/buff tooltip.
   * @param {Scene_Base} scene
   * @param {Game_Battler} battler
   */
  function showTooltip(scene, battler) {
    scene._stateTooltip.setup(battler);
    scene._stateTooltip.visible = true;
    scene._tooltipItemMode = false;
    scene._tooltipHoveredItem = null;
    // Re-adding an already-added child moves it to the front of the
    // render order, so the tooltip draws above any window created after it.
    scene.addChild(scene._stateTooltip);
  }

  /** @param {Scene_Base} scene */
  function hideTooltip(scene) {
    scene._stateTooltip.visible = false;
  }

  /**
   * Shows a weapon/armor/item tooltip.
   * @param {Scene_Base} scene
   * @param {RPG.BaseItem} item
   */
  function showItemTooltip(scene, item) {
    scene._stateTooltip.setupItem(item);
    scene._stateTooltip.visible = true;
    scene._tooltipItemMode = true;
    scene.addChild(scene._stateTooltip);
  }

  /** Turns gamepad tooltip browsing off and hides the tooltip. @param {Scene_Base} scene */
  function deactivateGamepadTooltip(scene) {
    resetGamepadTooltip();
    scene._tooltipItemMode = false;
    scene._tooltipHoveredItem = null;
    hideTooltip(scene);
  }

  const TOOLTIP_ANCHOR_GAP_Y = 4;
  const TOOLTIP_ANCHOR_GAP_X = -2;
  /**
   * Positions the tooltip window just below an anchor rect, flipping
   * above it when there isn't enough room, or centering it on screen
   * when no anchor was found.
   * @param {Scene_Base} scene
   * @param {{x:number,y:number,width:number,height:number}|null} anchor
   */
  function positionTooltipAt(scene, anchor) {
    const tw = scene._stateTooltip.width;
    const th = scene._stateTooltip.height;

    let x, y;
    if (anchor) {
      x = anchor.x + TOOLTIP_ANCHOR_GAP_X;
      const below = anchor.y + (anchor.height || 0) - TOOLTIP_ANCHOR_GAP_Y;
      const above = anchor.y + TOOLTIP_ANCHOR_GAP_Y - th;
      if (below + th <= Graphics.boxHeight) {
        y = below;
      } else if (above >= 0) {
        y = above;
      } else {
        // Neither side fully fits - clamp to whichever is closest.
        y =
          Math.abs(Graphics.boxHeight - (below + th)) > Math.abs(above) ?
            above
          : below;
      }
    } else {
      x = Graphics.boxWidth / 2;
      y = Graphics.boxHeight / 2;
    }

    scene._stateTooltip.x = Math.max(0, Math.min(x, Graphics.boxWidth - tw));
    scene._stateTooltip.y = Math.max(0, Math.min(y, Graphics.boxHeight - th));
  }

  /**
   * Shows and anchors the tooltip for whichever battler gamepadTooltip.index
   * currently points at.
   * @param {Scene_Base} scene
   */
  function selectGamepadTooltipBattler(scene) {
    const battler = gamepadTooltip.battlers[gamepadTooltip.index];
    showTooltip(scene, battler);
    positionTooltipAt(scene, anchorPositionFor(scene, battler));
  }

  /**
   * Prefers item mode when an item/equip/shop list has the cursor (that
   * list already has its own cursor to track, so Prev/Next don't apply);
   * otherwise falls back to cycling battler icons by hand.
   * @param {Scene_Base} scene
   */
  function activateGamepadTooltip(scene) {
    const itemWindow = findActiveItemWindow(scene);
    if (itemWindow) {
      gamepadTooltip.active = true;
      gamepadTooltip.mode = 'item';
      gamepadTooltip.itemWindow = itemWindow;
      updateGamepadItemTooltip(scene);
      return;
    }
    const battlers = collectTooltipBattlers(scene);
    if (battlers.length > 0) {
      gamepadTooltip.active = true;
      gamepadTooltip.mode = 'battler';
      gamepadTooltip.battlers = battlers;
      gamepadTooltip.index = 0;
      selectGamepadTooltipBattler(scene);
    }
  }

  /**
   * Mirrors whichever row gamepadTooltip.itemWindow's own cursor is on.
   * Bails out once that window stops being the active, on-screen list.
   * @param {Scene_Base} scene
   */
  function updateGamepadItemTooltip(scene) {
    const win = gamepadTooltip.itemWindow;
    if (!win || !win.active || !isWindowUsableForTooltip(win)) {
      deactivateGamepadTooltip(scene);
      return;
    }

    const index = win.index();
    const item = index >= 0 ? win.itemAt(index) : null;
    if (item) {
      if (item !== gamepadTooltip.lastItem) {
        gamepadTooltip.lastItem = item;
        showItemTooltip(scene, item);
      }
      positionTooltipAt(scene, anchorPositionForItemRow(win, index));
    } else if (gamepadTooltip.lastItem) {
      gamepadTooltip.lastItem = null;
      hideTooltip(scene);
    }
  }

  /**
   * Per-frame gamepad-browsing driver: handles the toggle button, then
   * (while active) either defers to item-list tracking or validates/steps
   * through battlers with Prev/Next.
   * @param {Scene_Base} scene
   */
  function updateGamepadTooltip(scene) {
    if (Input.isTriggered('ToggleTooltip')) {
      if (gamepadTooltip.active) {
        deactivateGamepadTooltip(scene);
      } else {
        activateGamepadTooltip(scene);
      }
      return;
    }

    if (!gamepadTooltip.active) return;

    if (gamepadTooltip.mode === 'item') {
      updateGamepadItemTooltip(scene);
      return;
    }

    // Re-checked every frame so a battler's tooltip is dismissed the
    // moment whatever was showing its icons stops being on screen.
    if (
      !battlerTooltipStillValid(
        scene,
        gamepadTooltip.battlers[gamepadTooltip.index],
      )
    ) {
      deactivateGamepadTooltip(scene);
      return;
    }

    if (Input.isTriggered('TooltipNext')) {
      gamepadTooltip.index =
        (gamepadTooltip.index + 1) % gamepadTooltip.battlers.length;
      selectGamepadTooltipBattler(scene);
    } else if (Input.isTriggered('TooltipPrev')) {
      gamepadTooltip.index =
        (gamepadTooltip.index - 1 + gamepadTooltip.battlers.length) %
        gamepadTooltip.battlers.length;
      selectGamepadTooltipBattler(scene);
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
    const mouseActive = TouchInput.isMoved() || TouchInput.isHovered();

    let hoveredItem = null;
    const layer = scene._windowLayer;
    if (layer) {
      for (const child of layer.children) {
        if (!isItemHoverWindow(child) || !isWindowUsableForTooltip(child)) {
          continue;
        }
        const index = child.hitIndex();
        if (index >= 0) {
          const item = child.itemAt(index);
          if (item) hoveredItem = item;
        }
      }
    }

    if (gamepadTooltip.active) {
      if (!mouseActive || !hoveredItem) return;
      resetGamepadTooltip();
    }

    if (hoveredItem) {
      if (hoveredItem !== scene._tooltipHoveredItem) {
        scene._tooltipHoveredItem = hoveredItem;
        showItemTooltip(scene, hoveredItem);
      }
    } else if (scene._tooltipHoveredItem) {
      scene._tooltipHoveredItem = null;
      if (scene._tooltipItemMode) {
        scene._tooltipItemMode = false;
        hideTooltip(scene);
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
    );
  }

  /**
   * The active item/equip/shop list with a real selection, if any - the one
   * gamepad tooltip browsing should track instead of cycling battlers.
   * @param {Scene_Base} scene
   * @returns {Window_Selectable|null}
   */
  function findActiveItemWindow(scene) {
    const layer = scene._windowLayer;
    if (!layer) return null;
    for (const child of layer.children) {
      if (
        isItemHoverWindow(child) &&
        child.active &&
        isWindowUsableForTooltip(child) &&
        child.index() >= 0
      ) {
        return child;
      }
    }
    return null;
  }

  /**
   * Screen position/size of a list row, for anchoring an item tooltip.
   * @param {Window_Selectable} win
   * @param {number} index - row index
   * @returns {{x:number,y:number,width:number,height:number}|null}
   */
  function anchorPositionForItemRow(win, index) {
    if (!win._contentsSprite) return null;
    const rect = win.itemRect(index);
    // Top-left corner - positionTooltipAt adds width/height itself.
    const point = win._contentsSprite.worldTransform.apply(
      new Point(rect.x, rect.y),
    );
    return { x: point.x, y: point.y, width: rect.width, height: rect.height };
  }

  //============================================================================//
  //                  SCENE_BATTLE / SCENE_MENUBASE ATTACHMENT                  //
  //============================================================================//
  // Attaches every method above directly onto each scene's own prototype
  // (instead of through a shared install-function parameter) so "Go to
  // Definition" and "Find References" on this.foo() calls resolve correctly.

  const _Scene_Battle_createAllWindows =
    Scene_Battle.prototype.createAllWindows;
  /** Creates the tooltip window after battle's own windows finish building. */
  Scene_Battle.prototype.createAllWindows = function () {
    _Scene_Battle_createAllWindows.call(this);
    createTooltipWindow(this);
  };

  const _Scene_Battle_update = Scene_Battle.prototype.update;
  /** Per-frame: drives gamepad browsing, mouse item-hover, and cursor-follow. */
  Scene_Battle.prototype.update = function () {
    _Scene_Battle_update.call(this);
    updateGamepadTooltip(this);
    updateItemTooltipHover(this);
    // Zero width/height tells positionTooltipAt to flip above/below right
    // at the cursor point, rather than past the far edge of an icon/row.
    if (this._stateTooltip.visible && !gamepadTooltip.active) {
      positionTooltipAt(this, {
        x: TouchInput.x + WauLau.StateTooltips.offsetX,
        y: TouchInput.y + WauLau.StateTooltips.offsetY,
        width: 0,
        height: 0,
      });
    }
  };

  /** Delegates to {@link activateGamepadTooltip}. */
  Scene_Battle.prototype.activateGamepadTooltip = function () {
    activateGamepadTooltip(this);
  };
  /** Delegates to {@link deactivateGamepadTooltip}. */
  Scene_Battle.prototype.deactivateGamepadTooltip = function () {
    deactivateGamepadTooltip(this);
  };
  /** Delegates to {@link updateGamepadTooltip}. */
  Scene_Battle.prototype.updateGamepadTooltip = function () {
    updateGamepadTooltip(this);
  };
  /** Delegates to {@link positionTooltipAt}. */
  Scene_Battle.prototype.positionTooltipAt = function (anchor) {
    positionTooltipAt(this, anchor);
  };
  /** Delegates to {@link selectGamepadTooltipBattler}. */
  Scene_Battle.prototype.selectGamepadTooltipBattler = function () {
    selectGamepadTooltipBattler(this);
  };
  /** Delegates to {@link updateGamepadItemTooltip}. */
  Scene_Battle.prototype.updateGamepadItemTooltip = function () {
    updateGamepadItemTooltip(this);
  };
  /** Delegates to {@link createTooltipWindow}. */
  Scene_Battle.prototype.createTooltipWindow = function () {
    createTooltipWindow(this);
  };
  /** Delegates to {@link showTooltip}. */
  Scene_Battle.prototype.showTooltip = function (battler) {
    showTooltip(this, battler);
  };
  /** Delegates to {@link hideTooltip}. */
  Scene_Battle.prototype.hideTooltip = function () {
    hideTooltip(this);
  };
  /** Delegates to {@link showItemTooltip}. */
  Scene_Battle.prototype.showItemTooltip = function (item) {
    showItemTooltip(this, item);
  };
  /** Delegates to {@link updateItemTooltipHover}. */
  Scene_Battle.prototype.updateItemTooltipHover = function () {
    updateItemTooltipHover(this);
  };

  const _Scene_MenuBase_create = Scene_MenuBase.prototype.create;
  /** Creates the tooltip window after the menu scene's own windows finish building. */
  Scene_MenuBase.prototype.create = function () {
    _Scene_MenuBase_create.call(this);
    createTooltipWindow(this);
  };

  const _Scene_MenuBase_update = Scene_MenuBase.prototype.update;
  /** Per-frame: drives gamepad browsing, mouse item-hover, and cursor-follow. */
  Scene_MenuBase.prototype.update = function () {
    _Scene_MenuBase_update.call(this);
    updateGamepadTooltip(this);
    updateItemTooltipHover(this);
    if (this._stateTooltip.visible && !gamepadTooltip.active) {
      positionTooltipAt(this, {
        x: TouchInput.x + WauLau.StateTooltips.offsetX,
        y: TouchInput.y + WauLau.StateTooltips.offsetY,
        width: 0,
        height: 0,
      });
    }
  };

  /** Delegates to {@link activateGamepadTooltip}. */
  Scene_MenuBase.prototype.activateGamepadTooltip = function () {
    activateGamepadTooltip(this);
  };
  /** Delegates to {@link deactivateGamepadTooltip}. */
  Scene_MenuBase.prototype.deactivateGamepadTooltip = function () {
    deactivateGamepadTooltip(this);
  };
  /** Delegates to {@link updateGamepadTooltip}. */
  Scene_MenuBase.prototype.updateGamepadTooltip = function () {
    updateGamepadTooltip(this);
  };
  /** Delegates to {@link positionTooltipAt}. */
  Scene_MenuBase.prototype.positionTooltipAt = function (anchor) {
    positionTooltipAt(this, anchor);
  };
  /** Delegates to {@link selectGamepadTooltipBattler}. */
  Scene_MenuBase.prototype.selectGamepadTooltipBattler = function () {
    selectGamepadTooltipBattler(this);
  };
  /** Delegates to {@link updateGamepadItemTooltip}. */
  Scene_MenuBase.prototype.updateGamepadItemTooltip = function () {
    updateGamepadItemTooltip(this);
  };
  /** Delegates to {@link createTooltipWindow}. */
  Scene_MenuBase.prototype.createTooltipWindow = function () {
    createTooltipWindow(this);
  };
  /** Delegates to {@link showTooltip}. */
  Scene_MenuBase.prototype.showTooltip = function (battler) {
    showTooltip(this, battler);
  };
  /** Delegates to {@link hideTooltip}. */
  Scene_MenuBase.prototype.hideTooltip = function () {
    hideTooltip(this);
  };
  /** Delegates to {@link showItemTooltip}. */
  Scene_MenuBase.prototype.showItemTooltip = function (item) {
    showItemTooltip(this, item);
  };
  /** Delegates to {@link updateItemTooltipHover}. */
  Scene_MenuBase.prototype.updateItemTooltipHover = function () {
    updateItemTooltipHover(this);
  };

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
    Sprite_Battler.prototype.updatePosition;
  Sprite_Battler.prototype.updatePosition = function () {
    if (!this._battler) return;
    _Sprite_Battler_updatePosition_battlerGuard.call(this);
  };

  // GUARD: Sprite_Damage.setup --------------------------------------------//
  // regenDamageResistFix.js reads BattleManager._action.calcElementRate()
  // with no null-check, but _action is only set during a normal battle
  // action - regen/DoT ticks and conversation-battle damage pop-ups don't
  // go through that flow. Wraps whatever setup() is installed by load time
  // and substitutes a neutral stand-in (calcElementRate() => 1) only when
  // _action is missing, for the duration of that one call.
  const _Sprite_Damage_setup_actionGuard = Sprite_Damage.prototype.setup;
  Sprite_Damage.prototype.setup = function (target) {
    const hadAction = !!BattleManager._action;
    if (!hadAction) {
      BattleManager._action = { calcElementRate: () => 1 };
    }
    try {
      _Sprite_Damage_setup_actionGuard.call(this, target);
    } finally {
      if (!hadAction) {
        BattleManager._action = null;
      }
    }
  };

  // Window_MenuStatus and Window_Status (the party list and the detailed
  // character screen) don't use Sprite_StateIcon at all - Window_StatusBase's
  // drawActorIcons() just draws icons straight onto the window's bitmap with
  // drawIcon(), so there's no sprite object for the mouse-enter/exit hooks
  // above to attach to. Record each drawn icon's screen rect per actor here,
  // then hit-test them by hand against the window's own contents sprite
  // transform (the same technique Sprite_StateIcon.isBeingTouched uses, just
  // applied to the window's internal _contentsSprite instead of a sprite).
  const _Window_StatusBase_drawActorIcons =
    Window_StatusBase.prototype.drawActorIcons;
  Window_StatusBase.prototype.drawActorIcons = function (actor, x, y, width) {
    _Window_StatusBase_drawActorIcons.call(this, actor, x, y, width);
    this._tooltipIconRects = this._tooltipIconRects || {};
    const iconWidth = ImageManager.iconWidth;
    const iconHeight = ImageManager.iconHeight;
    const icons = actor
      .allIcons()
      .slice(0, Math.floor((width || 144) / iconWidth));
    this._tooltipIconRects[actor.actorId()] = icons.map((_icon, i) => ({
      x: x + i * iconWidth,
      y: y + 2,
      width: iconWidth,
      height: iconHeight,
      battler: actor,
    }));
  };

  const _Window_StatusBase_update = Window_StatusBase.prototype.update;
  Window_StatusBase.prototype.update = function () {
    _Window_StatusBase_update.call(this);
    this.updateTooltipIconHover();
  };

  Window_StatusBase.prototype.updateTooltipIconHover = function () {
    if (!this._tooltipIconRects || !sceneHasTooltipSupport()) return;
    // A window can go from visible to hidden without ever losing the mouse
    // (e.g. Scene_Battle.commandSkill/commandItem in rmmz_scenes.js hides
    // the party status window when the skill/item list opens) - without
    // this check, the stale TouchInput position from before it was hidden
    // would keep matching the last-hovered rect and the tooltip would show
    // right through the new window on top of it.
    if (!isWindowUsableForTooltip(this)) {
      if (this._tooltipHoveredBattler) {
        this._tooltipHoveredBattler = null;
        SceneManager._scene.hideTooltip();
      }
      return;
    }

    const touchPos = new Point(TouchInput.x, TouchInput.y);
    const localPos = this._contentsSprite.worldTransform.applyInverse(touchPos);

    let hoveredBattler = null;
    for (const rects of Object.values(this._tooltipIconRects)) {
      for (const rect of rects) {
        if (
          localPos.x >= rect.x &&
          localPos.x < rect.x + rect.width &&
          localPos.y >= rect.y &&
          localPos.y < rect.y + rect.height
        ) {
          hoveredBattler = rect.battler;
          break;
        }
      }
      if (hoveredBattler) break;
    }

    if (hoveredBattler !== this._tooltipHoveredBattler) {
      this._tooltipHoveredBattler = hoveredBattler;
      resetGamepadTooltip();
      if (hoveredBattler && hoveredBattler.allIcons().length > 0) {
        SceneManager._scene.showTooltip(hoveredBattler);
      } else {
        SceneManager._scene.hideTooltip();
      }
    }
  };

  let gbccoffee_statetooltips_spritestateicon_initialize =
    Sprite_StateIcon.prototype.initialize;
  Sprite_StateIcon.prototype.initialize = function () {
    gbccoffee_statetooltips_spritestateicon_initialize.call(this);
    this._hovered = false;
  };

  let gbccoffee_statetooltips_spritestateicon_update =
    Sprite_StateIcon.prototype.update;
  Sprite_StateIcon.prototype.update = function () {
    gbccoffee_statetooltips_spritestateicon_update.call(this);
    this.processTouch();
  };

  Sprite_StateIcon.prototype.processTouch = function () {
    if (this.isBeingTouched()) {
      if (!this._hovered && TouchInput.isHovered()) {
        this._hovered = true;
        this.onMouseEnter();
      }
    } else {
      if (this._hovered) {
        this.onMouseExit();
      }
      this._pressed = false;
      this._hovered = false;
    }
  };

  Sprite_StateIcon.prototype.isPressed = function () {
    return this._pressed;
  };

  Sprite_StateIcon.prototype.isBeingTouched = function () {
    const touchPos = new Point(TouchInput.x, TouchInput.y);
    const localPos = this.worldTransform.applyInverse(touchPos);
    return this.hitTest(localPos.x, localPos.y);
  };

  Sprite_StateIcon.prototype.hitTest = function (x, y) {
    const rect = new Rectangle(
      -this.anchor.x * this.width,
      -this.anchor.y * this.height,
      this.width,
      this.height,
    );
    return rect.contains(x, y);
  };

  /** Duck-typed check for whether the current scene has tooltip support installed. @returns {boolean} */
  function sceneHasTooltipSupport() {
    return typeof SceneManager._scene.showTooltip === 'function';
  }

  Sprite_StateIcon.prototype.onMouseEnter = function () {
    if (sceneHasTooltipSupport()) {
      if (this._battler && this._battler.allIcons().length > 0) {
        resetGamepadTooltip();
        SceneManager._scene.showTooltip(this._battler);
      }
    }
  };

  Sprite_StateIcon.prototype.onMouseExit = function () {
    if (sceneHasTooltipSupport()) {
      SceneManager._scene.hideTooltip();
    }
  };

  //============================================================================//
  //                          WINDOW_STATETOOLTIP                               //
  //============================================================================//

  function Window_StateTooltip() {
    this.initialize(...arguments);
  }

  Window_StateTooltip.prototype = Object.create(Window_Selectable.prototype);
  Window_StateTooltip.prototype.constructor = Window_StateTooltip;

  Window_StateTooltip.prototype.initialize = function () {
    Window_Selectable.prototype.initialize.call(
      this,
      new Rectangle(0, 0, 0, 0),
    );
    this.visible = false;
  };

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
    const words = line.split(' ');
    let wrapped = '';
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && win.textSizeEx(candidate).width > maxWidth) {
        wrapped += (wrapped ? '\n' : '') + current;
        current = word;
      } else {
        current = candidate;
      }
    }
    wrapped += (wrapped ? '\n' : '') + current;
    return wrapped;
  }

  /** Word-wraps every line of text. @param {Window_Base} win @param {string} text @param {number} maxWidth @returns {string} */
  function wrapTooltipText(win, text, maxWidth) {
    return text
      .split('\n')
      .map((line) => wrapLine(win, line, maxWidth))
      .join('\n');
  }

  // --------------------------------ENTRY RENDERING-----------------------------//

  /**
   * Shared by setup() and setupItem(): measures every entry's wrapped size,
   * sizes the window from the total, then draws each entry at its offset.
   * @param {Array<{state:RPG.State|null, buff:object|null, text:string}>} rawEntries
   */
  Window_StateTooltip.prototype.renderEntries = function (rawEntries) {
    const entries = rawEntries.map((entry) => {
      const wrappedText = wrapTooltipText(this, entry.text, maxTooltipWidth);
      const size = this.textSizeEx(wrappedText);
      console.log('Wrapped and final text', wrappedText);
      return {
        ...entry,
        text: wrappedText,
        width: size.width,
        height: size.height,
      };
    });

    const w = Math.max(0, ...entries.map((e) => e.width));
    const h = entries.reduce((sum, e) => sum + e.height, 0);

    this.width = w + this.padding * 3;
    this.height = h + this.padding * 2;

    this.createContents();

    let y = 0;
    for (const entry of entries) {
      this._state = entry.state || null;
      this._buff = entry.buff || null;
      this.drawTextEx(entry.text, 0, y, this.width);
      y += entry.height;
    }
  };

  /**
   * Builds and renders a battler's full tooltip (name header + states + buffs/debuffs).
   * @param {Game_Battler} battler
   */
  Window_StateTooltip.prototype.setup = function (battler) {
    this._battler = battler;
    this._item = null;

    this._buffTexts = [];
    for (let i = 0; i < this._battler.buffLength(); i++) {
      let bd = { isBuffDebuff: true, param: i };
      if (this._battler.isBuffAffected(i)) {
        bd.text = WauLau.StateTooltips.buffTexts[i];
        this._buffTexts.push(bd);
      } else if (this._battler.isDebuffAffected(i)) {
        bd.text = WauLau.StateTooltips.debuffTexts[i];
        this._buffTexts.push(bd);
      }
    }

    const stateEntries = this._battler.states().map((state) => {
      const text = stateTooltipText(state, this._battler);
      return {
        state,
        buff: null,
        text:
          text || `\x1bST[1]${state.name}\x1bST[0]\x1bI[${state.iconIndex}]`,
      };
    });
    const buffEntries = this._buffTexts.map((buff) => ({
      state: null,
      buff,
      text: buff.text,
    }));

    // Battler's own name always leads the tooltip.
    const nameEntry = {
      state: null,
      buff: null,
      text: `\x1bTI[1]${battler.name()}\x1bTI[0]`,
    };

    this.renderEntries([nameEntry].concat(stateEntries, buffEntries));
  };

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
    const paramNames = $dataSystem.terms.params;
    const lines = [];

    for (let i = 0; i < 8; i++) {
      const value = item.params[i];
      if (!value) continue;
      const sign = value > 0 ? '+' : '';
      lines.push(
        `\\BI[1]${paramNames[i]}:\\BI[0] \\BS[1]${sign}${value}\\BS[0]`,
      );
    }

    const exParams = item.traits
      .filter((t) => t.code === Game_BattlerBase.TRAIT_XPARAM && t.value !== 0)
      .map((t) => {
        const name = xparamName(t.dataId);
        if (!name || name === 'Hit Rate') return null;
        const percent = Math.round(t.value * 100);
        const sign = percent > 0 ? '+' : '';
        lines.push(`\\BI[1]${name}:\\BI[0] \\BS[1]${sign}${percent}%\\BS[0]`);
      })
      .filter(Boolean);

    if (lines.length === 0) return null;
    lines.splice(0, 0, `\\LB[1]Stats\\LB[0]`);
    return lines;
  }

  /**
   * Display name for an xparam (TRAIT_XPARAM dataId, fixed engine order:
   * Hit, Eva, Cri, Cev, Mev, Mrf, Cnt, Hrg, Mrg, Trg). Hit/Evasion and the
   * HP/MP/TP regen labels pull this project's renamed terms.
   * @param {number} xparamId
   * @returns {string|null}
   */
  function xparamName(xparamId) {
    const terms = $dataSystem.terms;
    switch (xparamId) {
      case 0:
        return terms.params[8] || 'Hit Rate';
      case 1:
        return terms.params[9] || 'Evasion';
      case 2:
        return 'Critical Rate';
      case 3:
        return 'Critical Evasion';
      case 4:
        return 'Magic Evasion';
      case 5:
        return 'Magic Reflect';
      case 6:
        return 'Counter Rate';
      case 7:
        return `${terms.basic[3]} Regen`;
      case 8:
        return `${terms.basic[5]} Regen`;
      case 9:
        return `${terms.basic[7]} Regen`;
      default:
        return null;
    }
  }

  // Two-handed weapons have no dedicated flag in this project - they work
  // by sealing the "Ranged" equip slot (TRAIT_EQUIP_SEAL), looked up by
  // name in case the equip type list is ever reordered.
  /** @param {RPG.Weapon} item @returns {boolean} */
  function isTwoHandedWeapon(item) {
    const rangedEtypeId = $dataSystem.equipTypes.indexOf('Ranged');
    if (rangedEtypeId < 0) return false;
    return item.traits.some(
      (t) =>
        t.code === Game_BattlerBase.TRAIT_EQUIP_SEAL &&
        t.dataId === rangedEtypeId,
    );
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
      .filter(Boolean);
    const handedness = isTwoHandedWeapon(item) ? '2H' : '1H';
    if (elementNames.length === 0) return `\\ST[1]{${handedness}\\ST[0]}`;
    return `\\ST[1]${handedness} ${elementNames.join('/')}\\ST[0]`;
  }

  /**
   * Chance-to-inflict lines from the weapon's TRAIT_ATTACK_STATE traits.
   * @param {RPG.Weapon} item
   * @returns {string[]|null}
   */
  function weaponAttackStateLines(item) {
    const lines = [];
    const inflictions = item.traits
      .filter((t) => t.code === Game_BattlerBase.TRAIT_ATTACK_STATE)
      .map((t) => {
        const state = $dataStates[t.dataId];
        if (!state) return null;
        lines.push(
          `\\BS[1]${Math.round(t.value * 100)}%\\BS[0] \\BI[1]chance to inflict\\BI[0] \\BS[1]\\IT[1]${state.name}\\IT[0]\\BS[0]`,
        );
      })
      .filter(Boolean);
    if (lines.length === 0) return null;
    lines.splice(0, 0, `\\LB[1]Inflictions:\\LB[0]`);
    return lines;
  }

  /** Armor's equip slot label (e.g. "Body Gear"). @param {RPG.Armor} item @returns {string|null} */
  function armorSlotLine(item) {
    const name = $dataSystem.equipTypes[item.etypeId];
    return name ? `\\ST[1]${name} Gear\\ST[0]` : null;
  }

  /**
   * State-rate deviations from normal (TRAIT_STATE_RATE, value !== 1).
   * @param {RPG.Armor} item
   * @returns {string[]|null}
   */
  function armorStateRateLines(item) {
    const lines = [];
    const statusEffects = item.traits
      .filter(
        (t) => t.code === Game_BattlerBase.TRAIT_STATE_RATE && t.value !== 1,
      )
      .map((t) => {
        const state = $dataStates[t.dataId];
        if (!state) return null;
        const percent = Math.round((t.value - 1) * 100);
        const sign = percent > 0 ? '+' : '';
        lines.push(
          `\\BS[1]${sign}${percent}%\\BS[0] \\BI[1]chance to be affected by\\BI[0] \\BS[1]\\IT[1]${state.name}\\IT[0]\\BS[0]`,
        );
      })
      .filter(Boolean);
    if (lines.length === 0) return null;
    lines.splice(0, 0, `\\LB[1]Status Effects\\LB[0]`);
    return lines;
  }

  /**
   * Full state immunities (TRAIT_STATE_RESIST), one comma-joined line.
   * @param {RPG.Armor} item
   * @returns {string[]|null}
   */
  function armorStateResistLine(item) {
    const lines = [];
    const names = item.traits
      .filter((t) => t.code === Game_BattlerBase.TRAIT_STATE_RESIST)
      .map((t) => {
        const state = $dataStates[t.dataId];
        lines.push(`\\BS[1]${state.name}\\BS[0]`);
      })
      .filter(Boolean);
    if (lines.length === 0) return null;
    lines.splice(0, 0, `\\LB[1]Immune against:\\LB[0]`);
    return lines;
  }

  /**
   * Incoming elemental damage adjustments (TRAIT_ELEMENT_RATE, value !== 1).
   * @param {RPG.Armor} item
   * @returns {string[]|null}
   */
  function armorElementRateLines(item) {
    const lines = [];
    for (const trait of item.traits.values()) {
      let elementName = '';
      let percent = '';
      let sign = '';
      let valid = false;
      let shouldAbandon = false;
      for (const [key, value] of Object.entries(trait)) {
        if (shouldAbandon) break;
        switch (key) {
          case 'code': {
            if (value === Game_BattlerBase.TRAIT_ELEMENT_RATE) {
              valid = true;
            } else shouldAbandon = true;
            break;
          }
          case 'dataId': {
            elementName = $dataSystem.elements[value];
            break;
          }
          case 'value': {
            if (value === 0) break;
            percent = Math.round((value - 1) * 100);
            sign = percent > 0 ? '+' : '';
            break;
          }
          default: {
          }
        }
      }
      if (valid)
        lines.push(
          `\\BS[0]${sign}${percent}% ${elementName}\\BS[0] \\BI[1]damage taken\\BI[0]`,
        );
    }
    if (lines.length === 0) return null;
    lines.splice(0, 0, `\\LB[1]Damage Adjustments\\LB[0]`);
    return lines;
  }

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
    const parts = [];
    if (rate) parts.push(`${Math.round(Math.abs(rate) * 100)}%`);
    if (flat) parts.push(`${Math.abs(flat)}`);
    if (parts.length === 0) return [];
    const isLoss = rate < 0 || (rate === 0 && flat < 0);
    const verb = isLoss ? 'Lose' : 'Recover';
    return [`${verb}`, `\\BS[1]${parts.join(' + ')}\\BS[0] ${label}`];
  }

  /** Combined "Recover:"/"Lose:" lines for an item's HP/STM effects. @param {RPG.Item} item @returns {string[]} */
  function itemRecoverLines(item) {
    let hpRate = 0,
      hpFlat = 0,
      hasHp = false;
    let mpRate = 0,
      mpFlat = 0,
      hasMp = false;
    for (const effect of item.effects) {
      if (effect.code === Game_Action.EFFECT_RECOVER_HP) {
        hasHp = true;
        hpRate += effect.value1;
        hpFlat += effect.value2;
      } else if (effect.code === Game_Action.EFFECT_RECOVER_MP) {
        hasMp = true;
        mpRate += effect.value1;
        mpFlat += effect.value2;
      }
    }
    const basic = $dataSystem.terms.basic;
    const recoverLines = [];
    const loseLines = [];
    if (hasHp) {
      const [verb, line] = recoverAmountLine(hpRate, hpFlat, basic[3]);
      if (verb === 'Lose') loseLines.push(line);
      else recoverLines.push(line);
    }
    if (hasMp) {
      const [verb, line] = recoverAmountLine(mpRate, mpFlat, basic[5]);
      if (verb === 'Lose') loseLines.push(line);
      else recoverLines.push(line);
    }
    if (loseLines.length !== 0) loseLines.splice(0, 0, `\\LB[1]Lose:\\LB[0]`);
    if (recoverLines.length !== 0)
      recoverLines.splice(0, 0, `\\LB[1]Recover:\\LB[0]`);

    if (recoverLines.length === 0) return loseLines;
    if (loseLines.length === 0) return recoverLines;

    const combined = recoverLines.concat(loseLines);
    if (combined.length === 0) return [];

    return combined;
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
    const combined = [];
    for (const [stateId, chance] of stateChances) {
      const state = $dataStates[stateId];
      // iconIndex 0 marks a purely internal/bookkeeping state - skip it,
      // same convention Game_BattlerBase.allIcons() uses.
      if (!state || state.iconIndex === 0) continue;
      const percent = Math.round(chance * 100);
      const prefix = percent >= 100 ? '' : `${percent}% `;
      combined.push(`\\BS[1]${prefix}\\BS[0] ${state.name}`);
    }
    if (combined.length === 0) return [];
    combined.splice(0, 0, `\\LB[1]${verb}:\\LB[0]`);
    return combined;
  }

  /** Add/remove-state effect lines for an item. @param {RPG.Item} item @returns {string[]} */
  function itemStateEffectLines(item) {
    const addChances = new Map();
    const removeChances = new Map();
    for (const effect of item.effects) {
      // dataId 0 on EFFECT_ADD_STATE means "whatever the user's weapon
      // inflicts on attack" rather than a specific state - skipped.
      if (effect.code === Game_Action.EFFECT_ADD_STATE && effect.dataId > 0) {
        addChances.set(
          effect.dataId,
          Math.max(addChances.get(effect.dataId) || 0, effect.value1),
        );
      } else if (effect.code === Game_Action.EFFECT_REMOVE_STATE) {
        removeChances.set(
          effect.dataId,
          Math.max(removeChances.get(effect.dataId) || 0, effect.value1),
        );
      }
    }
    // groupedStateLines() returns [header, ...stateNames] - keep the header
    // on its own line and comma-join the state names after it.
    const inflictions = groupedStateLines('Inflicts', addChances);
    const cures = groupedStateLines('Cures', removeChances);
    const lines = [];
    if (inflictions.length > 0) {
      lines.push(inflictions[0], `${inflictions.slice(1).join(', ')}`);
    }
    if (cures.length > 0) {
      lines.push(cures[0], `${cures.slice(1).join(', ')}`);
    }
    return lines;
  }

  // -------------------------------FLAVOR TEXT----------------------------------//

  // Strips a hand-written leading "[Crush]"-style bracket from a weapon/item
  // description, since weaponDamageLine() now derives that from trait data.
  /** @param {string} text @returns {string} */
  function stripLeadingBracketNote(text) {
    return text.replace(/^\s*\[[^\]]*\]\s*/, '');
  }

  /** Grab the first WD_Itemsobject from the items 'note',
   * or try and grab an item type from its bracket in its description.
   * @param {RPG.Item} item The item database object
   * @returns {string} The item type */
  function grabLeadingBracketNoteForItem(item) {
    const metaObj = item.meta;
    let isMetaTag = false;
    for (const [key, value] of Object.entries(metaObj)) {
      if (
        key.localeCompare(`WD_Items`, undefined, { sensitivity: 'base' }) === 0
      )
        isMetaTag = true;
      else isMetaTag = false;
      if (isMetaTag) {
        const match = value.match(/\w+/);
        if (match === null) {
          const type = item.description.match(/\[(?<name>\w*)\]/);
          if (type === null) return `\\ST[1]Item\\ST[0]`;
          return `\\ST[1]${type.groups.name} Item\\ST[0]`;
        }
        const capitalizedMatch =
          String(match).charAt(0).toUpperCase() + String(match).slice(1);
        return `\\ST[1]${capitalizedMatch} Item\\ST[0]`;
      }
    }
    return `\\ST[1]Item\\ST[0]`;
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
      $dataItemTooltips[kind][item.id];
    if (entry && entry.text) {
      return Array.isArray(entry.text) ? entry.text.join(' ') : entry.text;
    }
    const description = item.description || '';
    return kind === 'weapons' || kind === 'items' ?
        stripLeadingBracketNote(description)
      : description;
  }

  /** Full tooltip text for a weapon/armor/item row. @param {RPG.BaseItem} item @returns {string|null} */
  function itemTooltipEntryText(item) {
    const kind =
      DataManager.isWeapon(item) ? 'weapons'
      : DataManager.isArmor(item) ? 'armors'
      : DataManager.isItem(item) ? 'items'
      : null;
    if (!kind) return null;

    let topLines;
    if (kind === 'weapons') {
      const damageLine = weaponDamageLine(item);
      topLines = (damageLine ? [damageLine] : [])
        .concat(itemStatBlockLines(item))
        .concat(weaponAttackStateLines(item));
    } else if (kind === 'armors') {
      const slotLine = armorSlotLine(item);
      const resistLine = armorStateResistLine(item);
      topLines = (slotLine ? [slotLine] : [])
        .concat(itemStatBlockLines(item))
        .concat(armorElementRateLines(item))
        .concat(resistLine ? [resistLine] : [])
        .concat(armorStateRateLines(item));
    } else if (kind === 'items') {
      topLines = [grabLeadingBracketNoteForItem(item)]
        .concat(itemStateEffectLines(item))
        .concat(itemRecoverLines(item));
    } else {
      topLines = itemStateEffectLines(item).concat(itemRecoverLines(item));
    }
    const flavorText = itemTooltipFlavorText(kind, item);
    const statLines = topLines.filter((word) => word !== null);

    return `\\TI[1]${item.name}\\I[${item.iconIndex}]\\TI[0]\n${statLines.join('\n')}\n\\DE[1]${flavorText}\\DE[0]`;
  }

  /** Builds and renders a weapon/armor/item's tooltip. @param {RPG.BaseItem} item */
  Window_StateTooltip.prototype.setupItem = function (item) {
    this._battler = null;
    this._item = item;

    const text = itemTooltipEntryText(item);
    this.renderEntries([{ state: null, buff: null, text: text || item.name }]);
  };

  // --------------------------------ESCAPE CODES--------------------------------//

  /** Resolves \TR/\TRT/\SR/\SRT (state) and \BR (buff/debuff) turn/step codes. */
  Window_StateTooltip.prototype.convertEscapeCharacters = function (text) {
    let t = Window_Base.prototype.convertEscapeCharacters.call(this, text);

    if (this._battler && this._state) {
      let turnRemain = this._battler._stateTurns[this._state.id];
      if (this._state.autoRemovalTiming == 1) {
        turnRemain += 1;
      }
      if (turnRemain <= 0) turnRemain = '∞';
      t = t.replace(
        /\x1bTRT/gi,
        `\x1bDE[1]${
          turnRemain === 1 ?
            `${turnRemain} turn remaining`
          : `${turnRemain} turns remaining`
        }\x1bDE[0]`,
      );
      t = t.replace(/\x1bTR/gi, turnRemain);

      let stepsRemain = this._state.stepsToRemove;
      t = t.replace(
        /\x1bSRT/gi,
        `\x1bDE[1]${
          turnRemain === 1 ?
            `${stepsRemain} step remaining`
          : `${stepsRemain} steps remaining`
        }\x1bDE[0]`,
      );
      t = t.replace(/\x1bSR/gi, stepsRemain);
    }

    if (this._battler && this._buff) {
      let turnRemain = this._battler._buffTurns[this._buff.param] + 1;
      t = t.replace(/\x1bBR/gi, turnRemain);
      t = t.replace(
        /\x1bTRT/gi,
        `\x1bDE[1]${
          turnRemain === 1 ?
            `${turnRemain} turn remaining`
          : `${turnRemain} turns remaining`
        }\x1bDE[0]`,
      );
    }

    return t;
  };

  // -------------------------------COLOR MIXER--------------------------------//

  /** Clamps a color channel to 0-255, treating only NaN as invalid input
   * @param {number} value the value that should be clamped
   * @param {number} clamp the ceiling of the clamping. Goes from 0 to this value
   * @returns {number} the input value clamped between a max of the "Clamp" value, or a min of 0
   * */
  function clampChannel(value, clamp) {
    const abs = Math.abs(value);
    if (Number.isNaN(abs)) return clamp;
    return abs > clamp ? clamp : abs;
  }

  /**
   *
   * @param {string | number[]} base Base color to mix with in RGB or HEX, if no Alpha value is sent, it will default to 1.
   * @param {string | number[]} added The added color to mix with in RGB or HEX, if no Alpha value is sent, it will default to 1.
   * @param {number} ratio The ratio of base color to added color. From 0-1.
   * @returns {string} A string fornatted as `rgba(r,g,b,a)`
   */

  function colorMix(base, added, ratio) {
    if (typeof base === 'string' && base.includes(`#`)) base = hexToRGBA(base);
    if (typeof added === 'string' && added.includes(`#`))
      added = hexToRGBA(added);
    if (!Array.isArray(base) && !typeof base !== 'string') {
      console.error(
        `Tried to mix colors with a base color that is not an RGBA or HEX value. Value; ${base}. Using inputted base color ${base}`,
      );
      return base;
    }

    if (!Array.isArray(base) && !typeof base !== 'string') {
      console.error(
        `Tried to mix colors with a base color that is not an RGBA or HEX value. Value; ${added}. Using inputted base color ${base}`,
      );
      return base;
    }

    const baseCol = [
      clampChannel(base[0]),
      clampChannel(base[1]),
      clampChannel(base[2]),
    ];
    const addedCol = [
      clampChannel(added[0]),
      clampChannel(added[1]),
      clampChannel(added[2]),
    ];

    ratio = Number.isNaN(Math.abs(ratio)) ? 1 : Math.min(Math.abs(ratio), 1);
    const ratioBase = ratio;
    const ratioAdded = 1 - ratio;

    let mix = [];
    mix[3] =
      Math.abs(
        clampChannel(base[3], 1) * ratioBase -
          clampChannel(added[3], 1) * ratioAdded,
      ).toFixed(2) || 1;

    mix[0] = Math.round(addedCol[0] * ratioAdded + baseCol[0] * ratioBase); // red
    mix[1] = Math.round(addedCol[1] * ratioAdded + baseCol[1] * ratioBase); // green
    mix[2] = Math.round(addedCol[2] * ratioAdded + baseCol[2] * ratioBase); // blue
    return `rgba(${mix.join(`,`)})`;
  }

  function hexToRGBA(hex) {
    const matchRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i;
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;

    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = matchRegex.exec(hex);
    const convertedRGB = [
      parseInt(result[1], 16) || 255,
      parseInt(result[2], 16) || 255,
      parseInt(result[3], 16) || 255,
      parseInt(result[4], 16) / 255 || 1,
    ];
    return result ? convertedRGB : null;
  }

  /**
   * Get the hex value of the bold outline color. This should only be called when the windowskin is loaded and ready
   * @param {number} indexn The index of the color to get
   * @returns {string} Bold Color as HEX
   */
  function hexColorMapManager(index) {
    if (M_hexColorMap.has(index)) return M_hexColorMap.get(index);

    if (index > 31 || index < 0) {
      console.error(
        `[LookAtTooltips] Passed a color index outside of the range of 0-31 when trying to convert to hex. Passed index was: ${index}. Returning #ffffff`,
      );
      return '#ffffff';
    }

    const hex = ColorManager.textColor(index);

    M_hexColorMap.set(index, hex);

    return hex;
  }

  // ------------------------ESCAPE CHARACTER VARIABLES------------------------//
  // Outline width/color for the fake-bold effect (see FONT-BOLD FIX below) -
  // set directly here, at the same time as fontBold/color, rather than
  // derived later from a single shared color when the outline is actually
  // drawn - so each bold variant's outline matches ITS OWN color (inline/
  // stat/bold) instead of every \B/\BI/\BS style sharing one outline color.
  const BOLD_OUTLINE_WIDTH = 4;
  const NORMAL_OUTLINE_WIDTH = 1;
  const NORMAL_SPACING_WIDTH = '0px';
  const BOLD_SPACING_WIDTH = '2px';
  const NORMAL_OUTLINE_COLOR = 'rgba(0, 0, 0, 0)';
  const BOLD_OUTLINE_ALPHA = 'ff';
  const TEXT_SIZE_NORMAL = 20;
  const TEXT_SIZE_BOLD = TEXT_SIZE_NORMAL;
  const TEXT_SIZE_LABEL = 24;
  const TEXT_SIZE_SUBTITLE = 28;
  const TEXT_SIZE_TITLE = 30;
  const TEXT_SIZE_DESCRIPTION = 16;
  let M_hexColorMap = new Map(); //Map containing index colors as hex colors as <Index : Hex>

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
    textState,
  ) {
    switch (code) {
      case 'BI': {
        const on = !!this.obtainEscapeParam(textState);
        this.contents.fontBold = on;
        this.processColorChange(on ? inlineColor : textColor);
        this.contents.outlineWidth =
          on ? BOLD_OUTLINE_WIDTH : NORMAL_OUTLINE_WIDTH;
        this.contents.outlineColor =
          on ?
            hexColorMapManager(boldOutlineColor)
            //`${colorMix(`${hexColorMapManager(inlineColor)}${BOLD_OUTLINE_ALPHA}`, [0, 0, 0, 1], 0.9)}`
          : NORMAL_OUTLINE_COLOR;
        this.contents._context.letterSpacing =
          on ? BOLD_SPACING_WIDTH : NORMAL_SPACING_WIDTH;
        if (on) {
          this.contents.fontSize = TEXT_SIZE_BOLD;
        } else {
          this.contents.fontSize = TEXT_SIZE_NORMAL;
        }
        break;
      }
      case 'BS': {
        const on = !!this.obtainEscapeParam(textState);
        this.contents.fontBold = on;
        this.processColorChange(on ? statColor : textColor);
        this.contents.outlineWidth =
          on ? BOLD_OUTLINE_WIDTH : NORMAL_OUTLINE_WIDTH;
        this.contents.outlineColor =
          on ?
            hexColorMapManager(boldOutlineColor)
            //`${colorMix(`${hexColorMapManager(statColor)}${BOLD_OUTLINE_ALPHA}`, [0, 0, 0, 1], 0.8)}`
          : NORMAL_OUTLINE_COLOR;
        this.contents._context.letterSpacing =
          on ? BOLD_SPACING_WIDTH : NORMAL_SPACING_WIDTH;
        if (on) {
          this.contents.fontSize = TEXT_SIZE_BOLD;
        } else {
          this.contents.fontSize = TEXT_SIZE_NORMAL;
        }
        break;
      }
      case 'B': {
        const on = !!this.obtainEscapeParam(textState);
        this.contents.fontBold = on;
        this.processColorChange(on ? boldColor : textColor);
        this.contents.outlineWidth =
          on ? BOLD_OUTLINE_WIDTH : NORMAL_OUTLINE_WIDTH;
        this.contents.outlineColor =
          on ?
            hexColorMapManager(boldOutlineColor)
            //`${colorMix(`${hexColorMapManager(boldColor)}${BOLD_OUTLINE_ALPHA}`, [0, 0, 0, 1], 0.8  )}`
          : NORMAL_OUTLINE_COLOR;
        this.contents._context.letterSpacing =
          on ? BOLD_SPACING_WIDTH : NORMAL_SPACING_WIDTH;
        if (on) {
          this.contents.fontSize = TEXT_SIZE_BOLD;
        } else {
          this.contents.fontSize = TEXT_SIZE_NORMAL;
        }
        break;
      }
      case 'IT': {
        this.contents.fontItalic = !!this.obtainEscapeParam(textState);
        break;
      }
      case 'LB': {
        const on = !!this.obtainEscapeParam(textState);
        this.processColorChange(on ? labelColor : textColor);
        this.outlineWidth = 6;
        if (on) {
          this.contents.fontSize = TEXT_SIZE_LABEL;
        } else {
          this.contents.fontSize = TEXT_SIZE_NORMAL;
        }
        break;
      }
      case 'ST': {
        const on = !!this.obtainEscapeParam(textState);
        this.processColorChange(on ? subtitleColor : textColor);
        if (on) {
          this.contents.fontSize = TEXT_SIZE_SUBTITLE;
        } else {
          this.contents.fontSize = TEXT_SIZE_NORMAL;
        }
        break;
      }
      case 'TI': {
        const on = !!this.obtainEscapeParam(textState);
        this.processColorChange(on ? titleColor : textColor);
        if (on) {
          this.contents.fontSize = TEXT_SIZE_TITLE;
        } else {
          this.contents.fontSize = TEXT_SIZE_NORMAL;
        }
        break;
      }
      case 'DE': {
        const on = !!this.obtainEscapeParam(textState);
        this.processColorChange(on ? descColor : textColor);
        if (on) {
          this.contents.fontItalic = true;
          this.contents.fontSize = TEXT_SIZE_DESCRIPTION;
        } else {
          this.contents.fontItalic = false;
          this.contents.fontSize = TEXT_SIZE_NORMAL;
        }
        break;
      }
      default:
        this.contents.fontBold = false;
        this.contents.fontItalic = false;
        this.contents.outlineWidth = NORMAL_OUTLINE_WIDTH;
        this.contents.outlineColor = NORMAL_OUTLINE_COLOR;
        this.contents.fontSize = TEXT_SIZE_NORMAL;
        Window_Base.prototype.processEscapeCharacter.call(
          this,
          code,
          textState,
        );
    }
  };

  Window_StateTooltip.prototype.resetFontSettings = function () {
    Window_Base.prototype.resetFontSettings.call(this);
    this.contents.fontBold = false;
    this.contents.fontItalic = false;
    this.contents.outlineWidth = NORMAL_OUTLINE_WIDTH;
    this.contents.outlineColor = NORMAL_OUTLINE_COLOR;
    this.contents.fontSize = TEXT_SIZE_NORMAL;
  };

  // LINE-HEIGHT FIX -----------------------------
  // The engine's own maxFontSizeInLine only recognizes \{, \}, and \FS[n]
  // when pre-measuring a line's height, so it doesn't know \TI/\ST/\LB
  // change size too - lines using them would draw correctly but get the
  // wrong vertical space reserved around them. Reimplemented here with the
  // same lookahead, adding TI/ST/LB using the same size deltas
  // processEscapeCharacter applies above.
  /** @param {string} line @returns {number} */
  Window_StateTooltip.prototype.maxFontSizeInLine = function (line) {
    let maxFontSize = this.contents.fontSize;
    const regExp = /\x1b({|}|FS|TI|ST|LB|DE)(\[(\d+)])?/gi;
    for (;;) {
      const array = regExp.exec(line);
      if (!array) break;
      const code = String(array[1]).toUpperCase();
      const on = !!Number(array[3]);
      if (code === '{') {
        this.makeFontBigger();
      } else if (code === '}') {
        this.makeFontSmaller();
      } else if (code === 'FS') {
        this.contents.fontSize = parseInt(array[3]);
      } else if (code === 'TI') {
        if (on) {
          this.contents.fontSize = TEXT_SIZE_TITLE;
        } else {
          this.contents.fontSize = TEXT_SIZE_NORMAL;
        }
      } else if (code === 'ST') {
        if (on) {
          this.contents.fontSize = TEXT_SIZE_TITLE;
        } else {
          this.contents.fontSize = TEXT_SIZE_NORMAL;
        }
      } else if (code === 'LB') {
        if (on) {
          this.contents.fontSize = TEXT_SIZE_LABEL;
        } else {
          this.contents.fontSize = TEXT_SIZE_NORMAL;
        }
      } else if (code === 'DE') {
        if (on) {
          this.contents.fontSize = TEXT_SIZE_DESCRIPTION;
        } else {
          this.contents.fontSize = TEXT_SIZE_NORMAL;
        }
      }
      if (this.contents.fontSize > maxFontSize) {
        maxFontSize = this.contents.fontSize;
      }
    }
    return maxFontSize;
  };

  // Tooltip window has no scrollbar arrows to draw.
  Window_Scrollable.prototype.updateArrows = function () {};

  // FONT-BOLD FIX -----------------------------
  // The loaded custom font only registers a "normal" weight, so a plain
  // fontBold request has no bold face to fall back on - bold is faked with
  // a heavier, color-matched outline instead. outlineWidth/outlineColor are
  //directly in processEscapeCharacter/resetFontSettings above (at the
  // same time as fontBold), so the vanilla engine's own _drawTextOutline
  // already picks them up correctly - no Bitmap-level patch needed.
})();

// Color reference notes:
// #C2D5FB - item Color ingame
// #DCEDD4 - item Color[0]
// #D8EBCF - Item outlinecolor ingame
// #D8EBCF - state color and outline color
