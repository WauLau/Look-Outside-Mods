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

  // Must match this file's own registered plugin name in plugins.js (i.e.
  // its filename) - PluginManager.parameters() looks parameters up by that
  // name, case-insensitively, against enabled plugins only. This has been
  // renamed twice (WauLau_StateTooltips -> MOD_WauLau_LookAtTooltips ->
  // WauLau_LookAtTooltips) without updating this constant to match, so the
  // lookup silently returned {} the whole time - every param below fell
  // back to its default except offsetX/offsetY, which had none and turned
  // into NaN, which is why mouse-driven tooltips positioned themselves at
  // (NaN, NaN) - invisible - while gamepad-driven ones (positioned from an
  // anchor point, never touching offsetX/offsetY) were unaffected.
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
  const expressionColor = Number(params.expressionColor || 8);
  const textColor = Number(params.textColor || 1);
  const boldColor = Number(params.boldColor || 0);
  const labelColor = Number(params.accentColor || 22);
  const titleColor = Number(params.titleColor || 10);
  const descColor = Number(params.descColor || 26);
  const subtitleColor = Number(params.subtitleColor || 18);
  const inlineColor = Number(params.inlineColor || 0);
  const statColor = Number(params.statColor || 1);

  const enemyPercentOnly = params.enemyPercentOnly !== 'false';
  const maxTooltipWidth = Number(params.maxWidth || 500);

  // Buttons 6/7/8 (triggers + back/select) aren't used by the engine's own
  // Input.gamepadMapper (js/rmmz_core.js:5727 only defines 0-5 and 12-15),
  // so registering new symbols here is safe and doesn't collide with the
  // menu's existing pageup/pagedown (LB/RB) tab-switching. This is dev-time
  // configurable via these plugin parameters, not an in-game rebind menu -
  // wiring into Mano_InputConfig's own rebind UI would mean hand-editing its
  // fragile nested extendsMapper JSON, which risks breaking that plugin's
  // whole config screen for a feature this self-contained doesn't need.
  Input.gamepadMapper[Number(params.gamepadToggleButton || 8)] =
    'ToggleTooltip';
  Input.gamepadMapper[Number(params.gamepadPrevButton || 6)] = 'TooltipPrev';
  Input.gamepadMapper[Number(params.gamepadNextButton || 7)] = 'TooltipNext';

  function stateTooltipText(state, battler) {
    const entry =
      $dataTooltips && $dataTooltips.states && $dataTooltips.states[state.id];
    if (!entry || !entry.text) return null;
    const rawText =
      Array.isArray(entry.text) ? entry.text.join('\n') : entry.text;
    // Resolve {expression}s in the body ONLY, before the \{name\} header
    // (which uses the engine's make-font-bigger/smaller codes, not our
    // expression syntax) gets attached - otherwise the scanner below would
    // also see that header's braces and mistake the state's name for a
    // broken math expression.
    const text = evaluateTooltipExpressions(battler, rawText);
    return `\\I[${state.iconIndex}]\\C[1]\\{${state.name}\\}\\C[${textColor}]\n${text}`;
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

  function isEnemyBattler(battler) {
    return !!(battler.isEnemy && battler.isEnemy());
  }

  // Only handles the common "statName * 0.05" shape, checked against the raw
  // expression text before any stat name is resolved to a real value - so an
  // enemy's actual stat never gets touched at all, just the literal multiplier
  // already written in the tooltip text.
  function enemyPercentExpression(expr) {
    const match = expr
      .trim()
      .match(/^[a-zA-Z_]+\s*\*\s*([+-]?[0-9]*\.?[0-9]+)$/);
    if (!match) return null;
    const percent = parseFloat(match[1]) * 100;
    return `${percent.toFixed(decimalPlaces)}%`;
  }

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
          return `\x1bC[${expressionColor}]${percentText}\x1bC[${textColor}]`;
        }

        const resolved = resolveExpression(battler, expr);
        if (!/^[0-9+\-*/().\s]+$/.test(resolved)) {
          throw new Error(`Unrecognized stat name in expression: ${expr}`);
        }
        const value = Function(`"use strict"; return (${resolved});`)();
        if (typeof value !== 'number' || Number.isNaN(value)) {
          throw new Error(`Expression did not evaluate to a number: ${expr}`);
        }
        return `\x1bC[${expressionColor}]${value.toFixed(decimalPlaces)}\x1bC[${textColor}]`;
      } catch (e) {
        console.warn(
          `${pluginName}: Failed to evaluate tooltip expression "{${expr}}" - ${e.message}`,
        );
        return '?';
      }
    });
  }

  // Gamepad tooltip-browsing state. Only one scene is ever active at a time,
  // so a single shared object is fine - it gets reset whenever a scene that
  // supports tooltips is (re)created. `mode` distinguishes cycling through
  // battlers' state/buff icons (no native cursor to follow, so Prev/Next
  // steps through them by hand) from tracking whichever row is currently
  // selected in an item/equip/shop list (which already has its own cursor,
  // so there's nothing to step - just mirror whatever's selected).
  const gamepadTooltip = {
    active: false,
    mode: null,
    battlers: [],
    index: 0,
    itemWindow: null,
    // Tracked separately from the mouse-hover system's own
    // this._tooltipHoveredItem (see updateGamepadItemTooltip and
    // updateItemTooltipHover below) - the two used to share that field, but
    // that meant the mouse and gamepad could each overwrite the other's
    // notion of "what's currently shown" just by coincidentally landing on
    // the same/different row, with no real input from the player driving
    // it either way.
    lastItem: null,
  };

  function resetGamepadTooltip() {
    gamepadTooltip.active = false;
    gamepadTooltip.mode = null;
    gamepadTooltip.itemWindow = null;
    gamepadTooltip.lastItem = null;
  }

  // Shared "is this window's content actually the thing on screen right
  // now" check, used everywhere a stale reference to a window could
  // otherwise keep a tooltip alive after that window stopped being the
  // relevant one - e.g. Scene_Battle.commandSkill/commandItem
  // (rmmz_scenes.js) call this._statusWindow.hide() when the skill/item
  // list opens on top of it, but never clear its _tooltipIconRects, so
  // without this check a battler tooltip anchored to that window would
  // otherwise keep showing right through the new list.
  function isWindowUsableForTooltip(win) {
    if (!win.visible) return false;
    if (win.isOpen && !win.isOpen()) return false;
    return true;
  }

  // Menu case: any Window_StatusBase-derived window (Window_MenuStatus,
  // Window_Status, ...) already records _tooltipIconRects per actor as a
  // side effect of drawing (added for the menu hover fix) - reuse that as
  // the list of "battlers with a tooltip available" instead of rediscovering
  // it a different way. Battle case: just every party/troop member with an
  // active icon, minus anyone whose only anchor (see
  // battlerTooltipStillValid below) isn't currently showing.
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
          child instanceof Window_StatusBase &&
          child._tooltipIconRects &&
          isWindowUsableForTooltip(child)
        ) {
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
      }
    }
    return battlers;
  }

  // Per-frame validity gate for gamepad battler browsing (see
  // isWindowUsableForTooltip above for why this is needed): true only while
  // the battler's icons are still being shown by something currently on
  // screen - the enemy's own sprite in battle, or whichever
  // Window_StatusBase last drew that actor's icons, in every other case
  // (including actors in battle, whose icons only ever come from
  // Window_BattleStatus).
  function battlerTooltipStillValid(scene, battler) {
    if (!battler) return false;
    if (scene instanceof Scene_Battle && battler.isEnemy && battler.isEnemy()) {
      const spriteset = scene._spriteset;
      const enemySprites = spriteset && spriteset._enemySprites;
      const enemySprite =
        enemySprites && enemySprites.find((s) => s._battler === battler);
      return !!(enemySprite && enemySprite.visible);
    }
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

  // Screen position (plus size, so positionTooltipAt can flip above/below
  // it to stay on screen) to anchor the tooltip to for a given battler,
  // mirroring where mouse hover would already be pointing: the enemy's own
  // icon sprite in battle, or the first recorded icon rect in whichever
  // menu window is showing that battler. Returns null if neither can be
  // found (scene layout this project doesn't use yet), in which case the
  // caller falls back to a fixed position rather than crashing.
  function anchorPositionFor(scene, battler) {
    if (scene instanceof Scene_Battle && battler.isEnemy && battler.isEnemy()) {
      const spriteset = scene._spriteset;
      const enemySprites = spriteset && spriteset._enemySprites;
      const enemySprite =
        enemySprites && enemySprites.find((s) => s._battler === battler);
      const iconSprite = enemySprite && enemySprite._stateIconSprite;
      if (iconSprite) {
        const point = iconSprite.worldTransform.apply(new Point(0, 0));
        return {
          x: point.x,
          y: point.y,
          width: iconSprite.width,
          height: iconSprite.height,
        };
      }
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

  // Installs the same tooltip window/show/hide/follow-cursor plumbing onto any
  // scene class. createHookName is whichever lifecycle method that scene uses
  // to finish building its windows (Scene_Battle: "createAllWindows",
  // Scene_MenuBase: "create") - so this same logic covers battle and every
  // menu screen (Scene_Menu, Scene_Status, Scene_Item, Scene_Skill, Scene_Equip,
  // etc, since they all inherit from Scene_MenuBase) without duplicating it.
  function installTooltipSupport(sceneProto, createHookName) {
    const _create = sceneProto[createHookName];
    sceneProto[createHookName] = function () {
      _create.call(this);
      this.createTooltipWindow();
    };

    const _update = sceneProto.update;
    sceneProto.update = function () {
      _update.call(this);
      this.updateGamepadTooltip();
      this.updateItemTooltipHover();

      // The cursor is a point, not a rect, but positionTooltipAt only needs
      // width/height to know how far past the anchor the tooltip's near
      // edge would sit - passing 0 for both means "flip above/below right
      // at the cursor" instead of "right at the far edge of an icon/row".
      if (this._stateTooltip.visible && !gamepadTooltip.active) {
        this.positionTooltipAt({
          x: TouchInput.x + WauLau.StateTooltips.offsetX,
          y: TouchInput.y + WauLau.StateTooltips.offsetY,
          width: 0,
          height: 0,
        });
      }
    };

    // ToggleTooltip prefers item mode: if an item/equip/shop list currently
    // has the cursor (i.e. is the active, focused window), that's a much
    // stronger "this is what the player is looking at" signal than the
    // battler-icon browsing below, and unlike state/buff icons an item row
    // already has its own cursor to track, so there's nothing to step
    // through by hand - Prev/Next simply don't apply in this mode. Falls
    // back to the original battler-cycling behavior when no such list is
    // focused (e.g. the party overview screen).
    sceneProto.activateGamepadTooltip = function () {
      const itemWindow = findActiveItemWindow(this);
      if (itemWindow) {
        gamepadTooltip.active = true;
        gamepadTooltip.mode = 'item';
        gamepadTooltip.itemWindow = itemWindow;
        this.updateGamepadItemTooltip();
        return;
      }
      const battlers = collectTooltipBattlers(this);
      if (battlers.length > 0) {
        gamepadTooltip.active = true;
        gamepadTooltip.mode = 'battler';
        gamepadTooltip.battlers = battlers;
        gamepadTooltip.index = 0;
        this.selectGamepadTooltipBattler();
      }
    };

    sceneProto.deactivateGamepadTooltip = function () {
      resetGamepadTooltip();
      this._tooltipItemMode = false;
      this._tooltipHoveredItem = null;
      this.hideTooltip();
    };

    sceneProto.updateGamepadTooltip = function () {
      if (Input.isTriggered('ToggleTooltip')) {
        if (gamepadTooltip.active) {
          this.deactivateGamepadTooltip();
        } else {
          this.activateGamepadTooltip();
        }
        return;
      }

      if (!gamepadTooltip.active) return;

      if (gamepadTooltip.mode === 'item') {
        this.updateGamepadItemTooltip();
        return;
      }

      // Re-checked every frame (not just on toggle/Prev/Next) so that a
      // battler's tooltip gets dismissed the moment whatever was showing its
      // icons stops being the thing on screen - e.g. opening the skill/item
      // list in battle hides the party status window (Scene_Battle.
      // commandSkill/commandItem in rmmz_scenes.js) without this plugin ever
      // being told, so without this check the tooltip would otherwise keep
      // showing right on top of that new list.
      if (
        !battlerTooltipStillValid(
          this,
          gamepadTooltip.battlers[gamepadTooltip.index],
        )
      ) {
        this.deactivateGamepadTooltip();
        return;
      }

      if (Input.isTriggered('TooltipNext')) {
        gamepadTooltip.index =
          (gamepadTooltip.index + 1) % gamepadTooltip.battlers.length;
        this.selectGamepadTooltipBattler();
      } else if (Input.isTriggered('TooltipPrev')) {
        gamepadTooltip.index =
          (gamepadTooltip.index - 1 + gamepadTooltip.battlers.length) %
          gamepadTooltip.battlers.length;
        this.selectGamepadTooltipBattler();
      }
    };

    // Shared by selectGamepadTooltipBattler, updateGamepadItemTooltip, and
    // the mouse-follow positioning in update() above: sits the tooltip just
    // below the anchor (an icon, a list row, or the cursor - anything with
    // an {x, y, width, height}), flipping to just above it instead when
    // there isn't enough room below, so it never gets cut off the bottom of
    // the screen. Falls back to screen-center when no anchor was found.
    const TOOLTIP_ANCHOR_GAP_Y = 4;
    const TOOLTIP_ANCHOR_GAP_X = -2;
    sceneProto.positionTooltipAt = function (anchor) {
      const tw = this._stateTooltip.width;
      const th = this._stateTooltip.height;

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
          // Neither side fully fits (a very short/narrow screen) - below is
          // at least closest to the anchor, so clamp that instead of
          // picking one side arbitrarily.
          y =
            Math.abs(Graphics.boxHeight - (below + th)) > Math.abs(above) ?
              above
            : below;
        }
      } else {
        x = Graphics.boxWidth / 2;
        y = Graphics.boxHeight / 2;
      }

      this._stateTooltip.x = Math.max(0, Math.min(x, Graphics.boxWidth - tw));
      this._stateTooltip.y = Math.max(0, Math.min(y, Graphics.boxHeight - th));
    };

    sceneProto.selectGamepadTooltipBattler = function () {
      const battler = gamepadTooltip.battlers[gamepadTooltip.index];
      this.showTooltip(battler);
      this.positionTooltipAt(anchorPositionFor(this, battler));
    };

    // Mirrors whichever row gamepadTooltip.itemWindow's own cursor is
    // currently on - no Prev/Next handling needed since normal list
    // navigation already moves that cursor. Bails out (same as toggling
    // tooltip browsing off) the moment that window stops being the active,
    // on-screen list, which is what makes opening a different window on top
    // of it (or closing back out of it) correctly dismiss the tooltip
    // instead of leaving it stuck on the last selected row.
    sceneProto.updateGamepadItemTooltip = function () {
      const win = gamepadTooltip.itemWindow;
      if (!win || !win.active || !isWindowUsableForTooltip(win)) {
        this.deactivateGamepadTooltip();
        return;
      }

      const index = win.index();
      const item = index >= 0 ? win.itemAt(index) : null;
      if (item) {
        if (item !== gamepadTooltip.lastItem) {
          gamepadTooltip.lastItem = item;
          this.showItemTooltip(item);
        }
        this.positionTooltipAt(anchorPositionForItemRow(win, index));
      } else if (gamepadTooltip.lastItem) {
        gamepadTooltip.lastItem = null;
        this.hideTooltip();
      }
    };

    sceneProto.createTooltipWindow = function () {
      this._stateTooltip = new Window_StateTooltip();
      this.addChild(this._stateTooltip);
      resetGamepadTooltip();
    };

    sceneProto.showTooltip = function (battler) {
      this._stateTooltip.setup(battler);
      this._stateTooltip.visible = true;
      // Cleared so a stale hover from the item-tooltip system (see
      // updateItemTooltipHover below) can't hide this tooltip right back out
      // again on the very next frame.
      this._tooltipItemMode = false;
      this._tooltipHoveredItem = null;
      // Re-adding an already-added child moves it to the front of the
      // render order, so the tooltip always draws above any window
      // created after it, regardless of scene-specific creation order.
      this.addChild(this._stateTooltip);
    };

    sceneProto.hideTooltip = function () {
      this._stateTooltip.visible = false;
    };

    sceneProto.showItemTooltip = function (item) {
      this._stateTooltip.setupItem(item);
      this._stateTooltip.visible = true;
      this._tooltipItemMode = true;
      // Re-adding an already-added child moves it to the front of the
      // render order, same reasoning as showTooltip() above.
      this.addChild(this._stateTooltip);
    };

    // Scans every item/equip/shop list window in this scene for the row the
    // mouse is over, using each window's own built-in hitIndex()/itemAt()
    // (the same pair the engine uses for click-to-select) rather than
    // reimplementing row hit-testing by hand. Done once here at the scene
    // level, after every child window has already run its own update() this
    // frame, rather than having each window call showItemTooltip/hideTooltip
    // itself - with several such windows visible at once (equip screen shows
    // both the slot list and the picker list together), whichever window's
    // update() happened to run last would silently win the tooltip for the
    // frame, so this collects "what's actually under the mouse right now"
    // in one pass instead of leaving it to child-update ordering.
    //
    // Only touches item-mode tooltips (guarded by _tooltipItemMode) so this
    // never fights the separate state/buff icon-hover tooltip system above.
    //
    // The mouse takes over from gamepad browsing only once it actually
    // lands on something real - both halves matter:
    //   - "actually moved" (TouchInput.isMoved()/isHovered(), a one-frame
    //     pulse tied to real mouse-move events) so a mouse that's merely
    //     resting somewhere on the list - coincidentally over some row,
    //     while the player is exclusively driving the gamepad - can't fight
    //     whatever row the gamepad has selected just by sitting there.
    //   - "landed on an item" so a real move that ends up over empty space
    //     doesn't cancel gamepad browsing for nothing, leaving no tooltip
    //     at all where a perfectly good one was already showing (this was
    //     the actual cause of an earlier version of this fix hiding the
    //     tooltip on any mouse movement without ever showing a new one).
    // Only once both are true does the mouse cancel gamepad mode, right as
    // it takes over showing the new item below - never as a separate step,
    // so there's no gap where gamepad mode is off but nothing has replaced
    // what it was showing.
    sceneProto.updateItemTooltipHover = function () {
      const mouseActive = TouchInput.isMoved() || TouchInput.isHovered();

      let hoveredItem = null;
      const layer = this._windowLayer;
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
        if (hoveredItem !== this._tooltipHoveredItem) {
          this._tooltipHoveredItem = hoveredItem;
          this.showItemTooltip(hoveredItem);
        }
      } else if (this._tooltipHoveredItem) {
        this._tooltipHoveredItem = null;
        if (this._tooltipItemMode) {
          this._tooltipItemMode = false;
          this.hideTooltip();
        }
      }
    };
  }

  // Explicit allow-list (rather than duck-typing on itemAt()) so this only
  // ever fires for the item/equip/shop screens this feature was built for -
  // Window_SkillList and other Window_Selectable subclasses also implement
  // itemAt() for unrelated data, and would otherwise pick up tooltips too.
  // Window_EquipItem and Window_ShopSell both extend Window_ItemList, so
  // that one check already covers them.
  function isItemHoverWindow(win) {
    return (
      win instanceof Window_ItemList ||
      win instanceof Window_EquipSlot ||
      win instanceof Window_ShopBuy
    );
  }

  // Whichever item/equip/shop list currently has the cursor, if any - the
  // one gamepad tooltip browsing should track instead of cycling battlers.
  // Requires an actual selection (index() >= 0), not just visibility, since
  // e.g. a list that's on screen but not yet interacted with can still
  // report active === true right after being activated with nothing
  // selected. At most one such window is ever active at a time (that's how
  // RPG Maker MZ's own window focus works - activating one always
  // deactivates whatever had focus before), so the first match wins.
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

  // Same worldTransform trick anchorPositionFor uses for menu icon rects,
  // just against a list row's own itemRect() instead of a hand-tracked
  // rect - every Window_Selectable already knows exactly where its rows are
  // drawn, so there's no need to record anything extra the way
  // Window_StatusBase.drawActorIcons does for icons.
  function anchorPositionForItemRow(win, index) {
    if (!win._contentsSprite) return null;
    const rect = win.itemRect(index);
    // Top-left, matching anchorPositionFor's convention - positionTooltipAt
    // adds width/height itself when checking whether "below" fits, so this
    // has to be the near edge, not the far one, or it'd double-count the
    // row's height and end up positioned a full row too low.
    const point = win._contentsSprite.worldTransform.apply(
      new Point(rect.x, rect.y),
    );
    return { x: point.x, y: point.y, width: rect.width, height: rect.height };
  }

  installTooltipSupport(Scene_Battle.prototype, 'createAllWindows');
  installTooltipSupport(Scene_MenuBase.prototype, 'create');

  // Defensive guard, not tooltip-related: Sprite_Battler.prototype.setHome
  // (js/rmmz_sprites.js:476-480) calls this.updatePosition() directly and
  // unconditionally, completely bypassing the normal update()/updateMain()
  // chain's "if (this._battler)" check - the only place in the whole engine
  // that can reach updatePosition() before/without a battler assigned.
  // bunchastuff.js's own updatePosition() override (several hundred lines
  // long) assumes this._battler always exists and reads it unconditionally
  // in multiple places, which throws whenever that setHome() path fires
  // without one - a bug that predates this plugin's item/equip/shop tooltip
  // feature but only actually gets excited by it (this feature now also
  // covers Scene_MenuBase-derived scenes such as Scene_Load, which run
  // extra per-frame work this plugin didn't do before). Rather than editing
  // bunchastuff.js directly, wrap whatever updatePosition() is installed by
  // the time this plugin runs (load order puts bunchastuff.js first) so a
  // missing battler is a silent no-op instead of a crash - matching exactly
  // what the vanilla update() guard already does elsewhere for this exact
  // situation. This keeps the fix self-contained to this plugin, so anyone
  // reusing it elsewhere doesn't also need to patch a project-specific file
  // that may not even be present in their project.
  const _Sprite_Battler_updatePosition_battlerGuard =
    Sprite_Battler.prototype.updatePosition;
  Sprite_Battler.prototype.updatePosition = function () {
    if (!this._battler) return;
    _Sprite_Battler_updatePosition_battlerGuard.call(this);
  };

  // Second defensive guard, also not tooltip-related: regenDamageResistFix.js
  // overrides Sprite_Damage.prototype.setup to pop up "RESIST!"/"WEAKNESS!"
  // text by reading BattleManager._action.calcElementRate(target) - but
  // BattleManager._action is only set while BattleManager.startAction() has
  // an action actively executing (js/rmmz_managers.js:2256 defaults it to
  // null), and this project has at least one other way to pop up a damage
  // number (this project's own regen/DoT ticks, and apparently its
  // "conversation battle" encounters too) that doesn't go through that flow.
  // regenDamageResistFix.js has no null-check before reading it; a nearly
  // identical copy of this same logic inside bunchastuff.js does check
  // (`if (BattleManager._action)`) but loads earlier, so
  // regenDamageResistFix.js's unguarded version is the one actually
  // installed by the time this runs. Rather than editing that file, wrap
  // whatever Sprite_Damage.prototype.setup is installed by the time this
  // plugin runs (load order puts it after regenDamageResistFix.js) and, only
  // when BattleManager._action is missing, substitute a neutral stand-in
  // (calcElementRate() => 1, i.e. "normal, no resist or weakness") just for
  // the duration of that one call - every other branch of the original
  // function (the regen-message special case, the actual number popup)
  // still runs completely unchanged.
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

  // Duck-typed rather than checking specific scene classes, so this works in
  // battle and every menu screen that installTooltipSupport() was applied to
  // (and any future scene it gets added to later) without listing them here.
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

  function wrapTooltipText(win, text, maxWidth) {
    return text
      .split('\n')
      .map((line) => wrapLine(win, line, maxWidth))
      .join('\n');
  }

  // Shared by setup() (battler/state/buff tooltips) and setupItem() (weapon/
  // armor tooltips): measures every entry's actual (possibly multi-line)
  // size once, sizes the window from that, then draws each entry at its
  // matching offset - so sizing and layout can never disagree with each
  // other. Each entry may carry a `state`/`buff` pair (or neither, for a
  // plain text entry like the name header or an item tooltip), consumed by
  // convertEscapeCharacters() below to resolve \TR/\BR/etc for that entry.
  Window_StateTooltip.prototype.renderEntries = function (rawEntries) {
    const entries = rawEntries.map((entry) => {
      const wrappedText = wrapTooltipText(this, entry.text, maxTooltipWidth);
      const size = this.textSizeEx(wrappedText);
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
        text: text || `\\}\\I[${state.iconIndex}]\\C[1]${state.name}`,
      };
    });
    const buffEntries = this._buffTexts.map((buff) => ({
      state: null,
      buff,
      text: buff.text,
    }));

    // The battler's own name always leads the tooltip, so it's clear at a
    // glance whose effects are being shown - important now that this
    // window can show up for any party member or enemy, not just whoever
    // the mouse happens to be over.
    const nameEntry = {
      state: null,
      buff: null,
      text: `\\B[1]\\{${battler.name()}\\}\\B[0]`,
    };

    this.renderEntries([nameEntry].concat(stateEntries, buffEntries));
  };

  // Weapon/armor tooltip: auto stat block (this project's own renamed param
  // labels, from $dataSystem.terms.params, so e.g. "Ballistics" shows up
  // instead of the default "M.Atk") plus optional flavor text, same as
  // states get a JSON entry instead of a note tag. Falls back to the item's
  // own database "description" field when WauLau_ItemTooltips.json has
  // nothing for it, since many items already have one written and there's
  // no reason to make authors duplicate that text into the new file too.
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

  // TRAIT_XPARAM (code 22) dataId order is fixed by the engine: Hit, Eva,
  // Cri, Cev, Mev, Mrf, Cnt, Hrg, Mrg, Trg. This project renames Hit/Evasion
  // in $dataSystem.terms.params[8]/[9] (right after the 8 base param names -
  // the same file this plugin already reads Attack/Ballistics/etc from), and
  // renames HP/MP/TP to Health/Stamina/Ammo in terms.basic, so both are
  // pulled from there instead of hardcoding this project's own terminology.
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

  // This project's two-handed weapons don't have a dedicated flag - they
  // work by sealing the "Ranged" equip slot (TRAIT_EQUIP_SEAL, dataId =
  // that slot's etypeId) so nothing else can go in the off-hand while
  // they're equipped. Looked up by name rather than a hardcoded etypeId in
  // case the equip type list is ever reordered.
  function isTwoHandedWeapon(item) {
    const rangedEtypeId = $dataSystem.equipTypes.indexOf('Ranged');
    if (rangedEtypeId < 0) return false;
    return item.traits.some(
      (t) =>
        t.code === Game_BattlerBase.TRAIT_EQUIP_SEAL &&
        t.dataId === rangedEtypeId,
    );
  }

  // A weapon's damage type isn't a plain field - it's however many
  // TRAIT_ATTACK_ELEMENT (code 31) traits the database has on it, each
  // dataId pointing into $dataSystem.elements. Some weapons carry more than
  // one (e.g. a mace hits as both Crushing and Piercing).
  function weaponDamageLine(item) {
    const elementNames = item.traits
      .filter((t) => t.code === Game_BattlerBase.TRAIT_ATTACK_ELEMENT)
      .map((t) => $dataSystem.elements[t.dataId])
      .filter(Boolean);
    const handedness = isTwoHandedWeapon(item) ? '2H' : '1H';
    if (elementNames.length === 0) return `\\ST[1]{${handedness}\\ST[0]}`;
    return `\\ST[1]${handedness} ${elementNames.join('/')}\\ST[0]`;
  }

  // TRAIT_ATTACK_STATE (code 32): chance (0-1) the weapon's basic attack
  // inflicts a given state, e.g. the Venom Dagger's 75% Poison.
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

  // Armor's equip slot, named the same way the equip screen already labels
  // it (e.g. "Body", "Ranged"), shown at the top like weapons' damage line.
  function armorSlotLine(item) {
    const name = $dataSystem.equipTypes[item.etypeId];
    return name ? `\\ST[1]${name} Gear\\ST[0]` : null;
  }

  // TRAIT_STATE_RATE (code 13): multiplier on how likely a state is to land
  // (1 = unchanged, so those are skipped - only deviations are worth
  // showing). Phrased the same "Resistant/Vulnerable: +-X% chance to be
  // affected by Y" way the states JSON already phrases this exact idea.
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

  // TRAIT_STATE_RESIST (code 14): full immunity, just a set of state ids
  // with no accompanying value - collapsed into a single comma-joined line
  // rather than one line per state.
  function armorStateResistLine(item) {
    const lines = [];
    const names = item.traits
      .filter((t) => t.code === Game_BattlerBase.TRAIT_STATE_RESIST)
      .map((t) => {
        const state = $dataStates[t.dataId];
        lines.push(`\\BS[1]state.name\\BS[0]`);
      })
      .filter(Boolean);
    if (lines.length === 0) return null;
    lines.splice(0, 0, `\\LB[1]Immune against:\\LB[0]`);
    return lines;
  }

  // TRAIT_ELEMENT_RATE (code 11): same "multiplier, 1 = unchanged" shape as
  // state rate above, but for incoming elemental damage.
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

  // Consumable items (potions, food, medical supplies...) don't have a
  // params array like weapons/armor do - what they do is entirely described
  // by their effects list. Only the effect types actually asked for are
  // covered: recover HP/STM, and add/remove state. Anything else on the
  // item (gain TP, buffs, learn skill, common event, ...) is left out.

  // One line per distinct HP/STM recovery amount on the item, combining a
  // "rate * maxHP/STM" part and a flat part the same way
  // Game_Action.itemEffectRecoverHp/Mp add them together (js/rmmz_objects.js)
  // - summing every matching effect first, since maxHP/STM is a constant, so
  // e.g. two separate +10% HP effects on one item really do add up to +20%.
  function recoverAmountLine(rate, flat, label) {
    const parts = [];
    if (rate) parts.push(`${Math.round(Math.abs(rate) * 100)}%`);
    if (flat) parts.push(`${Math.abs(flat)}`);
    if (parts.length === 0) return [];
    const isLoss = rate < 0 || (rate === 0 && flat < 0);
    const verb = isLoss ? 'Lose' : 'Recover';
    return [
      `${verb}`,
      `\\BS[1]${parts.join(' + ')}\\BS[0] \\BI[1]${label}\\BI[0]`,
    ];
  }

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

  // Add/remove-state effects, grouped by chance so an item like
  // "Medic-in-a-jar" that cures two dozen states at 100% each shows one
  // "Cures: A, B, C, ..." line instead of two dozen near-identical ones.
  // A state hit by more than one effect on the same item (this project's
  // database has a few of these, seemingly leftover duplicate entries) uses
  // the highest chance among them, since that's the true floor on how
  // likely the state is to land/clear regardless of the redundant rolls.
  function groupedStateLines(verb, stateChances) {
    const combined = [];
    for (const [stateId, chance] of stateChances) {
      const state = $dataStates[stateId];
      // iconIndex 0 is the same "no icon" convention Game_BattlerBase's own
      // allIcons()/stateIcons() already use to decide which states show up
      // anywhere in the UI - this project has a few purely internal
      // bookkeeping states built that way (e.g. "usedTonic" on Succulent
      // Fruit), which have no business appearing in a player-facing tooltip.
      if (!state || state.iconIndex === 0) continue;
      const percent = Math.round(chance * 100);
      const prefix = percent >= 100 ? '' : `${percent}% `;
      combined.push(`\\BS[1]${prefix}${state.name}\\BS[0]`);
    }
    if (combined.length === 0) return [];
    combined.splice(0, 0, `\\LB[1]${verb}:\\LB[0]`);
    return combined;
  }

  function itemStateEffectLines(item) {
    const addChances = new Map();
    const removeChances = new Map();
    for (const effect of item.effects) {
      // dataId 0 on EFFECT_ADD_STATE means "whatever states the user's
      // weapon inflicts on attack" rather than a specific state - nothing
      // fixed to name here, so it's skipped.
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
    // groupedStateLines() already puts its own header ("\LB[1]Inflicts:\LB[0]")
    // as element 0, one state name per following element - keep the header on
    // its own line and comma-join only the actual state names after it,
    // instead of re-adding a second header and joining it in with the states.
    const inflictions = groupedStateLines('Inflicts', addChances);
    const cures = groupedStateLines('Cures', removeChances);
    const lines = [];
    if (inflictions.length > 0) {
      lines.push(inflictions[0], inflictions.slice(1).join(', '));
    }
    if (cures.length > 0) {
      lines.push(cures[0], cures.slice(1).join(', '));
    }
    return lines;
  }

  // Weapon descriptions in this project's database were hand-annotated with
  // a leading "[Crush]" / "[Makeshift/Slash]" style bracket noting the same
  // damage type weaponDamageLine() above now derives properly from the
  // actual trait data - drop it so it doesn't show twice (and doesn't show
  // a stale/inconsistent damage type if the two ever disagree). Armor
  // descriptions use a leading bracket for unrelated info (e.g.
  // "[Accessory]") and are left alone.
  function stripLeadingBracketNote(text) {
    return text.replace(/^\s*\[[^\]]*\]\s*/, '');
  }
  function grabLeadingBracketNoteForItem(text) {
    const metaObj = text.meta;
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
          const type = text.description.match(/\[(?<name>\w*)\]/);
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
    //const flavorLines = flavorText ? flavorText.split('\n') : [];
    const statLines = topLines.filter((word) => word !== null);
    // const bodyLines = statLines.concat(
    //   statLines.length && flavorLines.length ? [''] : [],
    //   flavorLines,
    // );

    return `\\TI[1]${item.name}\\I[${item.iconIndex}]\\TI[0]\n${statLines.join('\n')}\\C[${descColor}]\n\\IT[1]${flavorText}\\IT[0]`;
  }

  Window_StateTooltip.prototype.setupItem = function (item) {
    this._battler = null;
    this._item = item;

    const text = itemTooltipEntryText(item);
    this.renderEntries([{ state: null, buff: null, text: text || item.name }]);
  };

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
        turnRemain === 1 ?
          `${turnRemain} turn remaining`
        : `${turnRemain} turns remaining`,
      );
      t = t.replace(/\x1bTR/gi, turnRemain);

      let stepsRemain = this._state.stepsToRemove;
      t = t.replace(
        /\x1bSRT/gi,
        turnRemain === 1 ?
          `${stepsRemain} step remaining`
        : `${stepsRemain} steps remaining`,
      );
      t = t.replace(/\x1bSR/gi, stepsRemain);
    }

    if (this._battler && this._buff) {
      let turnRemain = this._battler._buffTurns[this._buff.param] + 1;
      t = t.replace(/\x1bBR/gi, turnRemain);
      t = t.replace(
        /\x1bTRT/gi,
        turnRemain === 1 ?
          `${turnRemain} turn remaining`
        : `${turnRemain} turns remaining`,
      );
    }

    return `\x1bC[${textColor}]${t}\x1bC[0]`;
  };

  Window_StateTooltip.prototype.processEscapeCharacter = function (
    code,
    textState,
  ) {
    switch (code) {
      //Bold Inline
      case 'BI': {
        const on = !!this.obtainEscapeParam(textState);
        this.contents.fontBold = on;
        this.processColorChange(on ? inlineColor : textColor);
        break;
      }
      //Bold stat color
      case 'BS': {
        const on = !!this.obtainEscapeParam(textState);
        this.contents.fontBold = on;
        this.processColorChange(on ? statColor : textColor);
        break;
      }
      case 'B': {
        const on = !!this.obtainEscapeParam(textState);
        this.contents.fontBold = on;
        this.processColorChange(on ? boldColor : textColor);
        break;
      }
      //Italic
      case 'IT': {
        this.contents.fontItalic = !!this.obtainEscapeParam(textState);
        break;
      }
      //Label/accent
      case 'LB': {
        const on = !!this.obtainEscapeParam(textState);
        this.contents.fontBold = on;
        this.processColorChange(on ? labelColor : textColor);
        this.outlineWidth = 6;
        if (on) {
          this.makeFontBigger();
        } else {
          this.makeFontSmaller();
        }
        break;
      }

      //Subtitle
      case 'ST': {
        const on = !!this.obtainEscapeParam(textState);
        this.contents.fontBold = on;
        this.processColorChange(on ? subtitleColor : textColor);
        // this.changeOutlineColor(on ? boldColor : textColor);
        // this.outlineWidth = 8;
        if (on) {
          this.makeFontBigger();
          this.makeFontBigger();
        } else {
          this.makeFontSmaller();
          this.makeFontSmaller();
        }
        break;
      }
      //Title
      case 'TI': {
        const on = !!this.obtainEscapeParam(textState);
        this.contents.fontBold = on;
        this.processColorChange(on ? titleColor : textColor);
        // this.changeOutlineColor(on ? boldColor : textColor);
        // this.outlineWidth = 8;
        if (on) {
          this.makeFontBigger();
          this.makeFontBigger();
        } else {
          this.makeFontSmaller();
          this.makeFontSmaller();
        }
        break;
      }
      default:
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
  };

  // Window_Base.prototype.maxFontSizeInLine (js/rmmz_windows.js:424), used by
  // calcTextHeight() to size each line BEFORE it's drawn, only recognizes
  // the engine's own \{, \}, and \FS[n] size-changing codes via a hardcoded
  // regex - it has no idea \TI/\ST/\LB exist, so it always assumes a line
  // stays at whatever size it already was, then processNewLine() reserves
  // that (wrong, too-small-or-big) amount of vertical space for it. The
  // actual drawing is unaffected (processEscapeCharacter above really does
  // resize the font when it runs), but the gap between lines doesn't match
  // what got drawn - that mismatch is the extra/missing padding around any
  // line that changes size with one of this plugin's own codes. Fixed by
  // reimplementing the same lookahead, but recognizing TI/ST/LB too, with
  // the exact same size deltas their real cases above apply.
  Window_StateTooltip.prototype.maxFontSizeInLine = function (line) {
    let maxFontSize = this.contents.fontSize;
    const regExp = /\x1b({|}|FS|TI|ST|LB)(\[(\d+)])?/gi;
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
      } else if (code === 'TI' || code === 'ST') {
        if (on) {
          this.makeFontBigger();
          this.makeFontBigger();
        } else {
          this.makeFontSmaller();
          this.makeFontSmaller();
        }
      } else if (code === 'LB') {
        if (on) {
          this.makeFontBigger();
        } else {
          this.makeFontSmaller();
        }
      }
      if (this.contents.fontSize > maxFontSize) {
        maxFontSize = this.contents.fontSize;
      }
    }
    return maxFontSize;
  };

  Window_Scrollable.prototype.updateArrows = function () {};

  // The loaded custom font only registers a single "normal" weight face
  // (see FontManager.startLoading), so the engine's own Bold-via-CSS-font-
  // string request has no bold face to fall back on and renders unchanged.
  // Fake it by drawing the fill text twice with a 1px offset instead.
  // fontBold is never set true anywhere else in this project, so this is
  // effectively scoped to this plugin's own tooltip text.
  const _Bitmap_drawTextBody = Bitmap.prototype._drawTextBody;
  Bitmap.prototype._drawTextBody = function (text, tx, ty, maxWidth) {
    _Bitmap_drawTextBody.call(this, text, tx, ty, maxWidth);
    //        if (this.fontBold) {
    //            _Bitmap_drawTextBody.call(this, text, tx + 1, ty, maxWidth)
    //        }
  };
})();
