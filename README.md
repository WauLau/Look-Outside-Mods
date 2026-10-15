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
        "name":"WauLau_LookAtTooltips",
        "status":true,
        "description":"(v3.0) Enables fully integrated tooltips for the game \"Look Outside\".",
        "parameters":{"enemyPercentOnly":"true","gamepadPrevButton":"6","gamepadNextButton":"7"}
    },
    {
        name: "WauLau_VisualTweak",
        status: true,
        description:
            "(v1.1) Adds a 'Visual Tweaks' subpage to the in-game Options menu, with Brightness, Gamma, Contrast and Saturation sliders, backed by a screen-wide color adjustment filter.",
        parameters: {}
    },
    {
        name: "WauLau_ExtendedSoundtrack",
        status: true,
        description: "",
        parameters: {}
    },
```

## Developer Guide

Each mod is well documented. They all rely on hooking into and creating new prototype functions.

The files for each mod are as follows:

**Look At Tooltips:** `js/plugins/WauLau_LookAtTooltips.js` with data files from `data/WauLau_StateTooltips.json` and `data/WauLau_ItemTooltips.json`

**Visual Tweak:** `js/plugins/WauLau_VisualTweak.js`

**Extended Soundtrack** `js/plugins/WauLau_ExtendedSoundtrack.js` with data files from `data/WauLau_BgmReplacements.json`
