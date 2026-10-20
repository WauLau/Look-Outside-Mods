/*:
 * @target MZ
 * @author WauLau
 * @plugindesc (v0.1) Adds some QOL fixes to Look Outside. Currently includes
 * - Hides mouse cursor when a gamepad is active
 * - Shows the danger meter in the menu while away from home
 * - Shows Dan's viewer count on his battle face with SuperFrontViewMZ on
 *
 * @help
 * ======================================================================================
 * REQUIRES
 * ======================================================================================
 * Look Outside
 */
;(() => {
    "use strict"

    //============================================================================//
    //                       HIDE MOUSE CURSOR WITH GAMEPAD                       //
    //============================================================================//

    const elementRoot = document.documentElement
    /**
     * Shows the OS cursor while the mouse owns input, hides it otherwise.
     * Only writes the style when it changes, since this runs every frame.
     * @param {boolean} isMouse
     */
    function _updateCursorVisibility(isMouse) {
        const cursor = isMouse ? "auto" : "none"
        if (elementRoot.style.cursor !== cursor) {
            elementRoot.style.cursor = cursor
        }
    }

    let mouseInUse = true
    let lastMouseX = 1
    let lastMouseY = 1
    function updateMouseOwnership() {
        // SYNTHETIC MOVES -----
        // Chromium can fire mousemove without the cursor moving, so a
        // hover only counts if the position actually changed.
        if (!TouchInput || !TouchInput._currentState) return
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
        } else if (
            !!GamePad.activeGamepad() &&
            Input._latestButton &&
            Input._pressedTime === 0
        ) {
            mouseInUse = false
        }
        // CURSOR VISIBILITY -----
        // Here rather than in isMouseInUse(): this runs every frame in every
        // scene (map included), while isMouseInUse() is only polled by the
        // menu/battle tooltip code.
        _updateCursorVisibility(mouseInUse)
    }

    const _SceneManager_updateInputData = SceneManager.updateInputData
    SceneManager.updateInputData = function () {
        _SceneManager_updateInputData.call(this)
        updateMouseOwnership()
    }

    const GamePad = {
        isGamePadActive() {
            return !mouseInUse
        },
        /** @returns {Gamepad|null} first connected pad that can rumble (fresh snapshot) */
        activeGamepad() {
            const pads = navigator.getGamepads ? navigator.getGamepads() : []
            for (const pad of pads) {
                if (pad && pad.connected && pad.vibrationActuator) return pad
            }
            return null
        },
    }
    //============================================================================//
    //                               RUMBLE ENGINE                                //
    //==========s==================================================================//
    const RUMBLE_PRESETS = {
        Ping: { duration: 70, weakMagnitude: 0.1, strongMagnitude: 0 },
        Tap: { duration: 100, weakMagnitude: 0.1, strongMagnitude: 0 },
        Short: { duration: 150, weakMagnitude: 0.2, strongMagnitude: 0.2 },
        Medium: { duration: 200, weakMagnitude: 0.4, strongMagnitude: 0.5 },
        Long: { duration: 400, weakMagnitude: 0.6, strongMagnitude: 0.8 },
        VeryLong: { duration: 800, weakMagnitude: 0.7, strongMagnitude: 0.8 },
        Explosive: { duration: 1200, weakMagnitude: 0.8, strongMagnitude: 1 },
        // Matches the quake's Shake Screen (240 frames = 4 s).
        Earthquake: {
            duration: 4000,
            weakMagnitude: 0.5,
            strongMagnitude: 0.7,
        },
    }

    const GamePad_Rumble = {
        /**
         * @param {"Ping"|"Tap"|"Short"|"Medium"|"Long"|"VeryLong"|"Explosive"|"Earthquake"} [type="Medium"]
         * @returns {boolean} false when no rumble-capable pad is connected or mouse is in use
         */
        play(type = "Medium", delay = 0) {
            if (mouseInUse) return false
            const pad = GamePad.activeGamepad()
            if (!pad) return false
            const preset = RUMBLE_PRESETS[type] || RUMBLE_PRESETS.Medium
            pad.vibrationActuator
                .playEffect("dual-rumble", { startDelay: delay, ...preset })
                .catch(() => {}) // "preempted" when a newer rumble cuts this one off
            return true
        },
    }
    //============================================================================//
    //                           RUMBLE IMPLEMENTATION                            //
    //============================================================================//

    const _Scene_Equip_prototype_onItemOk = Scene_Equip.prototype.onItemOk
    Scene_Equip.prototype.onItemOk = function () {
        _Scene_Equip_prototype_onItemOk.call(this)
        GamePad_Rumble.play("Tap")
    }

    const _Scene_Map_prototype_callMenu = Scene_Map.prototype.callMenu
    Scene_Map.prototype.callMenu = function () {
        _Scene_Map_prototype_callMenu.call(this)
        GamePad_Rumble.play("Ping")
    }

    const _Scene_MenuBase_terminate = Scene_MenuBase.prototype.terminate
    Scene_MenuBase.prototype.terminate = function () {
        _Scene_MenuBase_terminate.call(this)
        if (SceneManager._nextScene instanceof Scene_Map) {
            GamePad_Rumble.play("Ping")
        }
    }

    const _Window_ChoiceList_prototype_callOkHandler =
        Window_ChoiceList.prototype.callOkHandler
    Window_ChoiceList.prototype.callOkHandler = function () {
        _Window_ChoiceList_prototype_callOkHandler.call(this)
        GamePad_Rumble.play("Ping")
    }
    const _Window_ChoiceList_prototype_callCancelHandler =
        Window_ChoiceList.prototype.callCancelHandler
    Window_ChoiceList.prototype.callCancelHandler = function () {
        _Window_ChoiceList_prototype_callCancelHandler.call(this)
        GamePad_Rumble.play("Tap")
    }
    const _Window_MenuCommand_prototype_processOk =
        Window_MenuCommand.prototype.processOk
    Window_MenuCommand.prototype.processOk = function () {
        _Window_MenuCommand_prototype_processOk.call(this)
        GamePad_Rumble.play("Tap")
    }

    const _Game_Enemy_prototype_performCollapse =
        Game_Enemy.prototype.performCollapse
    Game_Enemy.prototype.performCollapse = function () {
        _Game_Enemy_prototype_performCollapse.call(this)
        GamePad_Rumble.play("Short")
    }

    const _Game_Actor_prototype_performCollapse =
        Game_Actor.prototype.performCollapse
    Game_Actor.prototype.performCollapse = function () {
        _Game_Actor_prototype_performCollapse.call(this)
        GamePad_Rumble.play("Short")
        setTimeout(() => {
            GamePad_Rumble.play("Medium")
        }, 180)
    }

    const _Game_Action_prototype_executeDamage =
        Game_Action.prototype.executeDamage
    Game_Action.prototype.executeDamage = function (target, value) {
        _Game_Action_prototype_executeDamage.call(this, target, value)
        const result = target.result()
        if (result.critical) GamePad_Rumble.play("Ping")
    }

    //------------------------------- EARTHQUAKE ---------------------------------//

    // QUAKE TRIGGER -----
    // The day-7 earthquake sets switch 1097 ON right before its SE and 4 s
    // Shake Screen, from CE 5 (HourPassed) or a "quake" parallel event on
    // several maps. Only the OFF→ON change counts, so it fires once per
    // playthrough; loading a save restores switches without setValue.
    const SW_EARTHQUAKE = 1097
    const SW_BUSCRASH1 = 224
    const SW_BUSCRASH2 = 222

    const _Game_Switches_setValue = Game_Switches.prototype.setValue
    Game_Switches.prototype.setValue = function (switchId, value) {
        const wasOn = this.value(switchId)
        _Game_Switches_setValue.call(this, switchId, value)
        if (value && !wasOn) {
            switch (true) {
                case switchId === SW_EARTHQUAKE:
                    GamePad_Rumble.play("Earthquake")
                    break
                case switchId === SW_BUSCRASH1:
                    GamePad_Rumble.play("Long")
                    break
                case switchId === SW_BUSCRASH2:
                    GamePad_Rumble.play("Explosive")
                    break
            }
        }
    }

    //-------------------------------- DOOR SOUNDS -------------------------------//

    // DOOR SE TRIGGER -----
    // Doors have no shared event to hook, but they all play one of these SEs.
    // Every route ends in AudioManager.playSe (MUSH_Audio_Engine's version):
    // Play SE (250), move-route Play SE, bunchastuff's qkSfx, and MUSH's
    // PlaySpatialSe plugin command.
    const SE_RUMBLES = new Map([
        ["DoorOpenNormal", "Short"],
        ["DoorOpenClose_normal", "Short"],
        ["DoorOpenCreaky", "Medium"],
        ["DoorStuck", "DoorStuck"],
        ["Door_CantOpen", "DoorCantOpen"],
        ["Door_Unlock", "Tap"],
    ])

    const _AudioManager_playSe = AudioManager.playSe
    /** Extra args are MUSH's pitch/volume variance flags, passed through. */
    AudioManager.playSe = function (se, ...args) {
        _AudioManager_playSe.call(this, se, ...args)
        const rumble = se && SE_RUMBLES.get(se.name)
        // PlaySpatialSe scales volume by distance, so a door out of
        // earshot (volume 0) doesn't rumble.
        if (rumble && se.volume > 0) {
            if (rumble === "DoorStuck") {
                GamePad_Rumble.play("Tap")
                setTimeout(() => {
                    GamePad_Rumble.play("Tap")
                }, 120)
            } else if (rumble === "DoorCantOpen") {
                GamePad_Rumble.play("Short")
                setTimeout(() => {
                    GamePad_Rumble.play("Tap")
                }, 455)
                setTimeout(() => {
                    GamePad_Rumble.play("Tap")
                }, 575)
            }
            GamePad_Rumble.play(rumble)
        }
    }

    window.WauLau = window.WauLau || {}
    window.WauLau.Rumble = GamePad_Rumble
    window.WauLau.GamePad = GamePad
})()
