/*:
 * @target MZ
 * @author WauLau
 * @plugindesc (v1.0) Shows the danger meter in the menu while away from home
 *
 * REQUIRES
 * ======================================================================================
 * Look Outside
 */
;(() => {
    "use strict"

    const WauLau = {}
    WauLau.QOL = {}

    //============================================================================//
    //                           DANGER METER IN MENU                             //
    //============================================================================//

    const SW_HARDMODE = 8
    const SW_PLAYER_IS_HOME = 25
    const SW_NORMALMODE = 31
    const VAR_DANGER_DISPLAY = 115 // ExploreMinDisplay, eases toward dangerBonus (112)

    const ICON_CELL_EMPTY = 125
    const ICON_CELL_HALF = 124
    const ICON_CELL_FULL = 123
    const ICON_MARK_EMPTY = 127

    // MIRRORS CE 145 -----
    // Same thresholds/icons as the "EXPLORE BONUS" block of common event 145,
    // which builds var 163 for the on-map meter. A cell spans 40 danger 'points'
    // (empty → half → full), a mark is a single step at a milestone (the colored dots for saves and such).
    const DANGER_SEGMENTS = [
        { cell: 20 },
        { mark: 60, full: () => (gSw(SW_NORMALMODE) ? 126 : 156) }, //Show save icon on easy and survivor mode
        { cell: 80 },
        { cell: 120 },
        { mark: 160, full: () => (gSw(SW_HARDMODE) ? 126 : 157) }, //Show save icon on cursed mode
        { cell: 180 },
        { cell: 220 },
        { cell: 260 },
        { mark: 300, full: () => 158 },
        { cell: 320 },
        { cell: 360 },
        { cell: 400 },
        { cell: 440 },
        { mark: 480, full: () => 159 },
    ]

    /**
     * Builds the meter text exactly like CE 145 writes it into var 163.
     * @param {number} danger value of var 115
     * @returns {string}
     */
    function dangerMeterText(danger) {
        const icons = DANGER_SEGMENTS.map((seg) => {
            if (seg.cell !== undefined) {
                if (danger < seg.cell) return ICON_CELL_EMPTY
                if (danger < seg.cell + 20) return ICON_CELL_HALF
                return ICON_CELL_FULL
            }
            return danger < seg.mark ? ICON_MARK_EMPTY : seg.full()
        })
        return icons.map((id) => `\\I[${id}]`).join("")
    }
    WauLau.QOL.dangerMeterText = dangerMeterText

    //---------------------------- Window_DangerMeter ----------------------------//

    /**
     * One-line window for the menu's top button strip; shrinks its width to
     * fit the meter.
     */
    function Window_DangerMeter() {
        this.initialize(...arguments)
    }
    Window_DangerMeter.prototype = Object.create(Window_Base.prototype)
    Window_DangerMeter.prototype.constructor = Window_DangerMeter

    Window_DangerMeter.prototype.initialize = function (rect) {
        Window_Base.prototype.initialize.call(this, rect)
        this.refresh()
        this._background = 1
    }

    // Default padding (12) would need 58px; the button strip is only 52px.
    Window_DangerMeter.prototype.updatePadding = function () {
        this.padding = Math.max(
            0,
            Math.floor((this.height - this.lineHeight()) / 2)
        )
    }

    Window_DangerMeter.prototype.refresh = function () {
        this._background = 1
        this.setBackgroundType(this._background)
        const text = dangerMeterText(gVr(VAR_DANGER_DISPLAY))
        const textWidth = this.textSizeEx(text).width
        this.width = Math.min(
            this.width,
            textWidth + this.itemPadding() * 2 + this.padding * 2
        )
        this.createContents()
        this.drawTextEx(text, this.itemPadding(), 0, textWidth)
    }

    //-------------------------------- Scene_Menu --------------------------------//

    const _Scene_Menu_create = Scene_Menu.prototype.create
    Scene_Menu.prototype.create = function () {
        _Scene_Menu_create.call(this)
        if (!gSw(SW_PLAYER_IS_HOME)) {
            this.createDangerMeterWindow()
        }
    }

    Scene_Menu.prototype.createDangerMeterWindow = function () {
        const win = new Window_DangerMeter(this.dangerMeterWindowRect())
        // Sit on the side of the strip away from the touch-UI cancel button.
        const button = this._cancelButton
        if (button && button.x < Graphics.boxWidth / 2) {
            win.x = Graphics.boxWidth - win.width
        }
        this._dangerMeterWindow = win
        this.addWindow(win)
    }

    Scene_Menu.prototype.dangerMeterWindowRect = function () {
        const wy = this.buttonAreaTop()
        return new Rectangle(0, wy, Graphics.boxWidth, this.buttonAreaHeight())
    }
})()
