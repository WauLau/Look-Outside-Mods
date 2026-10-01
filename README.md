# Look Outside Mods

This repo includes all of my(WauLau's) mods for the RPGMaker MZ game "Look Outside". These can be found on NexusMods. For users of the mods, refer to _Player Guide._ For developers refer to _Developer Guide_. The repo includes the following mods:

- **Look At Tooltips -** Adds tooltips for items and states in battles, menu screens shops etc.
- **Visual Tweak -** Adds 4 new settings for _Brightness, Contrast, Gamma_ and _Saturation_.
- **Extended Soundtrack -** Adds and/or replaces music in-game with alternate versions from [@SirMephistoPheles2](https://www.nexusmods.com/lookoutside/mods/30) and [@MrSkumdog](https://www.nexusmods.com/lookoutside/mods/32) on NexusMods

## Player Guide

All mods are compatible with [RPGModder](https://www.nexusmods.com/lookoutside/mods/75), with the `mod.json`. You can also drag the files into their respective folders as normal. The mod does _no data editing_, everything happens by .js.

#### RPGModder (Recommended)

- Download the mod you want by clicking the mod link above or getting it from mods/
- Unzip the folder
- Install it with RPGModder and patch the game with the tool

#### Manual

- Download the mod you want by clicking the mod link above or getting it from mods/
- Unzip the folder
- Drag the folder into the root folder of Look Outside ('/Steam/steamapps/common/Look Outside')
- Add the following to your `plugins.js`
  based on the downloaded mod

```javascript
    {
        name: "WauLau_LookAtTooltips",
        status: true,
        description:
            "(v2.2) Popup tooltip when hovering a state icon, or a weapon/armor row in the item, equip, or shop screens, with JSON-driven text, stat expressions, bold/italic and color codes. Also supports gamepad browsing for both.",
        parameters: {
            offsetX: "0",
            offsetY: "0",
            decimalPlaces: "0",
            expressionColor: "8",
            textColor: "1",
            boldColor: "0",
            enemyPercentOnly: "true",
            maxWidth: "400",
            gamepadToggleButton: "8",
            gamepadPrevButton: "6",
            gamepadNextButton: "7",
            buffTooltipTexts: "",
            hpBuff: "\\}\\I[32]\\C[1]HP Buff: \\C[3](Turns: \\BR)",
            mpBuff: "\\}\\I[33]\\C[1]MP Buff: \\C[3](Turns: \\BR)",
            atkBuff: "\\}\\I[34]\\C[1]Atk Buff: \\C[3](Turns: \\BR)",
            defBuff: "\\}\\I[35]\\C[1]Def Buff: \\C[3](Turns: \\BR)",
            matkBuff: "\\}\\I[36]\\C[1]M.Atk Buff: \\C[3](Turns: \\BR)",
            mdefBuff: "\\}\\I[37]\\C[1]M.Def Buff: \\C[3](Turns: \\BR)",
            agiBuff: "\\}\\I[38]\\C[1]Agi Buff: \\C[3](Turns: \\BR)",
            lukBuff: "\\}\\I[39]\\C[1]Luk Buff: \\C[3](Turns: \\BR)",
            debuffTooltipTexts: "",
            hpDebuff: "\\}\\I[48]\\C[1]HP Debuff: \\C[3](Turns: \\BR)",
            mpDebuff: "\\}\\I[49]\\C[1]MP Debuff: \\C[3](Turns: \\BR)",
            atkDebuff: "\\}\\I[50]\\C[1]Atk Debuff: \\C[3](Turns: \\BR)",
            defDebuff: "\\}\\I[51]\\C[1]Def Debuff: \\C[3](Turns: \\BR)",
            matkDebuff: "\\}\\I[52]\\C[1]M.Atk Debuff: \\C[3](Turns: \\BR)",
            mdefDebuff: "\\}\\I[53]\\C[1]M.Def Debuff: \\C[3](Turns: \\BR)",
            agiDebuff: "\\}\\I[54]\\C[1]Agi Debuff: \\C[3](Turns: \\BR)",
            lukDebuff: "\\}\\I[55]\\C[1]Luk Debuff: \\C[3](Turns: \\BR)",
        },
    },
    {
        name: "WauLau_VisualTweak",
        status: true,
        description:
            "(v1.1) Adds a 'Visual Tweaks' subpage to the in-game Options menu, with Brightness, Gamma, Contrast and Saturation sliders, backed by a screen-wide color adjustment filter.",
        parameters: {},
    },
    {
        name: "WauLau_ExtendedSoundtrack",
        status: true,
        description: "",
        parameters: {},
    },
```

## Developer Guide

Each mod is well documented. They all rely on hooking into and creating new prototype functions.

The files for each mod are as follows:

**Look At Tooltips:** `js/plugins/WauLau_LookAtTooltips.js` with data files from `data/WauLau_StateTooltips.json` and `data/WauLau_ItemTooltips.json`

**Visual Tweak:** `js/plugins/WauLau_VisualTweak.js`

**Extended Soundtrack** `js/plugins/WauLau_ExtendedSoundtrack.js` with data files from `data/WauLau_BgmReplacements.json`
