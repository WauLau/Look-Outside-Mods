/*:
 * @target MZ
 * @author WauLau
 * @plugindesc (v1.1) Adds a "Visual Tweaks" subpage to the in-game
 * Options menu, with Brightness, Gamma, Contrast and Saturation sliders, backed by a
 * screen-wide color adjustment filter that stays applied across every
 * scene (title, map, menus, battle) and persists in the save config the
 * same way the volume sliders do.
 *
 * @help
 * ======================================================================================
 * WHY THIS EXISTS
 * ======================================================================================
 *
 * RPG Maker MZ's default Options menu has no display/color controls, and
 * this game's own rendering can look meaningfully darker/higher-contrast on
 * some setups (e.g. running via Wine/CrossOver on macOS) than intended.
 * This gives players a way to compensate for that themselves, in-game,
 * without touching engine or OS settings.
 *
 * ======================================================================================
 * HOW IT WORKS
 * ======================================================================================
 *
 * - Adds an entry for "Visual Tweaks" to the main Options menu, which
 *   opens its own subpage scene (Scene_VisualTweak) rather than
 *   crowding the main list - new sliders only ever grow that subpage.
 * - That subpage currently has "Brightness," "Gamma," "Contrast" and "Saturation", using the
 *   same left/right/OK stepping UI as the volume sliders (range
 *   -100%..+100%, step 5%, default 0% = unchanged).
 * - All parameters feed a single persistent PIXI AdjustmentFilter called 'adjustment',
 *   and includes the ones from this plugin. The AdjustmentFilter is from
 *   FilterControllerMZ's bundled pixi-filters build, and gets appended to
 *   every scene's filter list, so the effect is visible everywhere,
 *   including live in the Options menu itself while adjusting it.
 * - All parameters have a range which "clamp" the values, as these are not linear in reality,
 *   and without clamping, the extreme values would be useless as its way to much.
 * - All values save/load with the rest of ConfigManager's data.
 *
 * ======================================================================================
 * REQUIRES
 * ======================================================================================
 * FilterControllerMZ.js enabled somewhere in the plugin list (any position -
 * PIXI.filters.AdjustmentFilter is only touched lazily, the first time a
 * scene actually starts, which is always after every plugin file has
 * finished loading).
 */

(() => {
  'use strict';

  //============================================================================//
  //                              CONSTANTS & STATE                             //
  //============================================================================//

  const VISUAL_OPTION_MIN = -100;
  const VISUAL_OPTION_MAX = 100;
  const VISUAL_OPTION_STEP = 5;

  // Slider -100..100 maps onto [1 - RANGE, 1 + RANGE] for each filter uniform.
  const BRIGHTNESS_RANGE = 0.5;
  const CONTRAST_RANGE = 0.4;
  const GAMMA_RANGE = 0.4;
  const SATURATION_RANGE = 0.8;

  // Single source of truth for the subpage's row list - the subpage's menu
  // row count (Window_VisualTweak) and its window height
  // (Scene_VisualTweak.maxCommands) both read this, so adding a slider
  // here is the only step needed to also add it to the subpage's UI.
  const VISUAL_TWEAKS = [
    { symbol: 'brightness', name: 'Brightness' },
    { symbol: 'contrast', name: 'Contrast' },
    { symbol: 'gamma', name: 'Gamma' },
    { symbol: 'saturation', name: 'Saturation' },
  ];

  const WauLau = {};
  WauLau.VisualTweak = {};

  WauLau.VisualTweak._filter = null;

  /**
   * Lazily creates the shared full-screen adjustment filter. Lazy on
   * purpose: PIXI.filters.AdjustmentFilter is registered by
   * FilterControllerMZ.js at that plugin's own parse time, and this avoids
   * caring exactly where this file sits relative to it in plugins.js.
   * @returns {PIXI.Filter}
   */
  WauLau.VisualTweak.filter = function () {
    if (!this._filter) {
      this._filter = new PIXI.filters.AdjustmentFilter();
    }
    return this._filter;
  };

  /** Recomputes the filter's uniforms from the current ConfigManager values. */
  WauLau.VisualTweak.refresh = function () {
    const filter = this.filter();
    filter.brightness = 1 + (ConfigManager.brightness / 100) * BRIGHTNESS_RANGE;
    filter.contrast = 1 + (ConfigManager.contrast / 100) * CONTRAST_RANGE;
    filter.saturation = 1 + (ConfigManager.saturation / 100) * SATURATION_RANGE;
    filter.gamma = 1 + (ConfigManager.gamma / 100) * GAMMA_RANGE;
  };

  //============================================================================//
  //                         GRAPHICS - PERSISTENT FILTER                       //
  //============================================================================//

  // IMPORTANT CALLOUT -----------------------------
  // Scene_Base already sets `this.filters = [this._colorFilter]` in its own
  // constructor (Scene_Base.prototype.createColorFilter, rmmz_scenes.js) for
  // screen fade in/out. Graphics.setStage(this._scene) runs once per scene,
  // after that constructor call, so appending here - never replacing - is
  // what keeps every fade transition working alongside this filter.
  const _Graphics_setStage = Graphics.setStage;
  Graphics.setStage = function (stage) {
    _Graphics_setStage.call(this, stage);
    if (stage) {
      stage.filters = [...stage.filters, WauLau.VisualTweak.filter()];
    }
  };

  //============================================================================//
  //                         CONFIGMANAGER - PERSISTENCE                        //
  //============================================================================//

  ConfigManager.brightness = 0;
  ConfigManager.contrast = 0;
  ConfigManager.gamma = 0;
  ConfigManager.saturation = 0;

  const _ConfigManager_makeData = ConfigManager.makeData;
  ConfigManager.makeData = function () {
    const config = _ConfigManager_makeData.call(this);
    config.brightness = this.brightness;
    config.contrast = this.contrast;
    config.gamma = this.gamma;
    config.saturation = this.saturation;
    return config;
  };

  const _ConfigManager_applyData = ConfigManager.applyData;
  ConfigManager.applyData = function (config) {
    _ConfigManager_applyData.call(this, config);
    this.brightness = ConfigManager.readTweakOption(config, 'brightness');
    this.contrast = ConfigManager.readTweakOption(config, 'contrast');
    this.gamma = ConfigManager.readTweakOption(config, 'gamma');
    this.saturation = ConfigManager.readTweakOption(config, 'saturation');
    WauLau.VisualTweak.refresh();
  };

  /**
   * @param {object} config - raw config data
   * @param {string} name - "brightness" or "contrast"
   * @returns {number} clamped value, 0 (neutral) if absent
   */
  ConfigManager.readTweakOption = function (config, name) {
    if (name in config) {
      return Number(config[name]).clamp(VISUAL_OPTION_MIN, VISUAL_OPTION_MAX);
    }
    return 0;
  };

  //============================================================================//
  //                WINDOW_OPTIONS - SHARED SLIDER MECHANICS                    //
  //============================================================================//

  // IMPORTANT CALLOUT -----------------------------
  // These overrides live on Window_Options itself (not just the main menu's
  // instance of it) because Window_VisualTweak, below, subclasses
  // Window_Options purely to inherit this slider-stepping/status-text/
  // live-refresh behavior for whichever rows addVisualTweak() adds -
  // the main menu and the subpage share one implementation.

  Window_Options.prototype.addVisualTweak = function () {
    for (const option of VISUAL_TWEAKS) {
      this.addCommand(option.name, option.symbol);
    }
  };

  /** @param {string} symbol @returns {boolean} */
  Window_Options.prototype.isTweakSymbol = function (symbol) {
    return VISUAL_TWEAKS.some((option) => option.symbol === symbol);
  };

  /** @param {number} value @returns {string} */
  Window_Options.prototype.visualTweakStatusText = function (value) {
    return (value > 0 ? '+' : '') + value + '%';
  };

  // A row with its own setHandler() (e.g. the main menu's "Visual
  // Tweaks" nav row) falls through to the normal Window_Command dispatch
  // instead of being treated as a toggle/slider - see addVisualTweakSettingsCommand.
  const _Window_Options_statusText = Window_Options.prototype.statusText;
  Window_Options.prototype.statusText = function (index) {
    const symbol = this.commandSymbol(index);
    if (this.isHandled(symbol)) {
      return '';
    } else if (this.isTweakSymbol(symbol)) {
      return this.visualTweakStatusText(this.getConfigValue(symbol));
    }
    return _Window_Options_statusText.call(this, index);
  };

  const _Window_Options_processOk = Window_Options.prototype.processOk;
  Window_Options.prototype.processOk = function () {
    const symbol = this.commandSymbol(this.index());
    if (this.isHandled(symbol)) {
      Window_Selectable.prototype.processOk.call(this);
    } else if (this.isTweakSymbol(symbol)) {
      this.changeDisplayedOption(symbol, true, true);
    } else {
      _Window_Options_processOk.call(this);
    }
  };

  const _Window_Options_cursorRight = Window_Options.prototype.cursorRight;
  Window_Options.prototype.cursorRight = function () {
    const symbol = this.commandSymbol(this.index());
    if (this.isHandled(symbol)) {
      // Nav rows don't respond to left/right, same as any other command row.
    } else if (this.isTweakSymbol(symbol)) {
      this.changeDisplayedOption(symbol, true, false);
    } else {
      _Window_Options_cursorRight.call(this);
    }
  };

  const _Window_Options_cursorLeft = Window_Options.prototype.cursorLeft;
  Window_Options.prototype.cursorLeft = function () {
    const symbol = this.commandSymbol(this.index());
    if (this.isHandled(symbol)) {
      // Nav rows don't respond to left/right, same as any other command row.
    } else if (this.isTweakSymbol(symbol)) {
      this.changeDisplayedOption(symbol, false, false);
    } else {
      _Window_Options_cursorLeft.call(this);
    }
  };

  /**
   * @param {string} symbol
   * @param {boolean} forward
   * @param {boolean} wrap - wrap past either end back to the opposite end
   */
  Window_Options.prototype.changeDisplayedOption = function (
    symbol,
    forward,
    wrap,
  ) {
    const lastValue = this.getConfigValue(symbol);
    const offset = forward ? VISUAL_OPTION_STEP : -VISUAL_OPTION_STEP;
    const value = lastValue + offset;
    if (value > VISUAL_OPTION_MAX && wrap) {
      this.changeValue(symbol, VISUAL_OPTION_MIN);
    } else if (value < VISUAL_OPTION_MIN && wrap) {
      this.changeValue(symbol, VISUAL_OPTION_MAX);
    } else {
      this.changeValue(
        symbol,
        value.clamp(VISUAL_OPTION_MIN, VISUAL_OPTION_MAX),
      );
    }
  };

  const _Window_Options_changeValue = Window_Options.prototype.changeValue;
  Window_Options.prototype.changeValue = function (symbol, value) {
    _Window_Options_changeValue.call(this, symbol, value);
    if (this.isTweakSymbol(symbol)) {
      WauLau.VisualTweak.refresh();
    }
  };

  //============================================================================//
  //                  WINDOW_OPTIONS - MAIN MENU NAV ROW                        //
  //============================================================================//

  const _Window_Options_makeCommandList =
    Window_Options.prototype.makeCommandList;
  Window_Options.prototype.makeCommandList = function () {
    _Window_Options_makeCommandList.call(this);
    this.addVisualTweakSettingsCommand();
  };

  Window_Options.prototype.addVisualTweakSettingsCommand = function () {
    this.addCommand('Visual Tweaks', 'visualTweaks');
  };

  //============================================================================//
  //              WINDOW_VisualTweak / SCENE_VisualTweak                  //
  //                         (the subpage itself)                               //
  //============================================================================//

  function Window_VisualTweak(rect) {
    this.initialize(...arguments);
  }

  Window_VisualTweak.prototype = Object.create(Window_Options.prototype);
  Window_VisualTweak.prototype.constructor = Window_VisualTweak;

  Window_VisualTweak.prototype.makeCommandList = function () {
    this.addVisualTweak();
  };

  function Scene_VisualTweak() {
    this.initialize(...arguments);
  }

  Scene_VisualTweak.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_VisualTweak.prototype.constructor = Scene_VisualTweak;

  Scene_VisualTweak.prototype.initialize = function () {
    Scene_MenuBase.prototype.initialize.call(this);
  };

  Scene_VisualTweak.prototype.create = function () {
    Scene_MenuBase.prototype.create.call(this);
    this.createOptionsWindow();
  };

  Scene_VisualTweak.prototype.terminate = function () {
    Scene_MenuBase.prototype.terminate.call(this);
    ConfigManager.save();
  };

  Scene_VisualTweak.prototype.createOptionsWindow = function () {
    const rect = this.optionsWindowRect();
    this._optionsWindow = new Window_VisualTweak(rect);
    this._optionsWindow.setHandler('cancel', this.popScene.bind(this));
    this.addWindow(this._optionsWindow);
  };

  // Mirrors Scene_Options.prototype.optionsWindowRect (rmmz_scenes.js) so the
  // subpage looks like a natural continuation of the main Options screen.
  Scene_VisualTweak.prototype.optionsWindowRect = function () {
    const n = Math.min(this.maxCommands(), this.maxVisibleCommands());
    const ww = 400;
    const wh = this.calcWindowHeight(n, true);
    const wx = (Graphics.boxWidth - ww) / 2;
    const wy = (Graphics.boxHeight - wh) / 2;
    return new Rectangle(wx, wy, ww, wh);
  };

  Scene_VisualTweak.prototype.maxCommands = function () {
    return VISUAL_TWEAKS.length;
  };

  Scene_VisualTweak.prototype.maxVisibleCommands = function () {
    return 12;
  };

  //============================================================================//
  //              SCENE_OPTIONS - OPEN THE SUBPAGE FROM THE NAV ROW             //
  //============================================================================//

  const _Scene_Options_createOptionsWindow =
    Scene_Options.prototype.createOptionsWindow;
  Scene_Options.prototype.createOptionsWindow = function () {
    _Scene_Options_createOptionsWindow.call(this);
    this._optionsWindow.setHandler(
      'visualTweaks',
      this.commandVisualTweakSettings.bind(this),
    );
  };

  Scene_Options.prototype.commandVisualTweakSettings = function () {
    SceneManager.push(Scene_VisualTweak);
  };

  // vanilla maxCommands() returns a hardcoded 7 (rmmz_scenes.js) for its own
  // 3 general + 4 volume rows; +1 here accounts for the new nav row without
  // hardcoding a replacement number that could drift from the engine's own.
  const _Scene_Options_maxCommands = Scene_Options.prototype.maxCommands;
  Scene_Options.prototype.maxCommands = function () {
    return _Scene_Options_maxCommands.call(this) + 1;
  };
})();
