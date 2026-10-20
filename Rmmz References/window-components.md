# Window Components

The window is built up of sprites

## Component Tree

```
PIXI.Container
└─Window
  └─Window_Base
    └─Window_Scrollable
      └─Window_Selectable
        └─Window_StateTooltip
          └─┐
            ├─ _container : PIXI.Container           ← the 'frame' & 'background' group
            │   ├─ _backSprite : Sprite              background, windowskin (0,0,95×95) stretched
            │   │   └─ [0] TilingSprite              pattern overlay, windowskin (0,96,96×96) tiled
            │   └─ _frameSprite : Sprite             border, 8 child sprites = 9-slice from (96,0,96×96)
            │       └─ [0..7] Sprite                 4 corners + 4 edges (24px margin)
            │
            ├─ _dimmerSprite : Sprite                (Window_Base only, after setBackgroundType(1))
            │
            ├─ _clientArea : Sprite                  the inner area, offset by padding, has an AlphaFilter
            │   ├─ _contentsBackSprite : Sprite      → contentsBack Bitmap (behind the text, e.g. row highlights)
            │   ├─ _cursorSprite : Sprite            selection cursor, 9-slice from (96,96,48×48)
            │   │   └─ [0..8] Sprite
            │   └─ _contentsSprite : Sprite          → contents Bitmap  ← text
            │
            ├─ _downArrowSprite / _upArrowSprite     scroll arrows
            └─ _pauseSignSprite                      the "▼ continue" blinker (message windows)
```

> Children draw in order, so the background comes first, then the frame, then the contents. `addChildToBack()` inserts right after `_container.` For example; the dimmer is put above the frame group but below the client area.

## Properties

Most public window properties are getter/setters that write through to one sprite

| Property                                                                                | What it does                                                                                                                                                                                                                                      | GetSet / Function |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `opacity`                                                                               | `_container.alpha`: background **and** frame together                                                                                                                                                                                             | Getter / Setter   |
| ─ `backOpacity`                                                                         | `_backSprite.alpha`: background only                                                                                                                                                                                                              | Getter / Setter   |
| ─ `contentsOpacity`                                                                     | `_contentsSprite.alpha`: the text                                                                                                                                                                                                                 | Getter / Setter   |
| `openness` (0–255)                                                                      | `_container.scale.y` plus re-centring `_container.y`; the "unroll" animation. The mod override and resets `_container.y = 0` to unroll from the top isntead of center. Client area only shows when open because; `_clientArea.visible = isOpen()` | Getter / Setter   |
| `width` / `height` / `padding` / `margin`                                               | Store the value, then `_refreshAllParts()` re-slices background, frame, cursor, arrows and pause sign                                                                                                                                             | Getter / Setter   |
| `windowskin`                                                                            | the `img/system/Window.png` Bitmap every part slices from. Refreshes all parts when it finishes loading                                                                                                                                           | Getter / Setter   |
| `contents` / `contentsBack`                                                             | the Bitmaps shown by `_contentsSprite` / `_contentsBackSprite`                                                                                                                                                                                    | Getter / Setter   |
| `origin` (Point)                                                                        | scroll offset: moves `_clientArea` by `-origin`                                                                                                                                                                                                   | Getter / Setter   |
| `cursorRect`                                                                            | where `_cursorSprite` sits. `Window_Selectable` sets it from the selected row                                                                                                                                                                     | Getter / Setter   |
| `active`, `frameVisible`, `cursorVisible`, `upArrowVisible`/`downArrowVisible`, `pause` | plain flags read during `update`                                                                                                                                                                                                                  | Getter / Setter   |
| `innerWidth` / `innerHeight` / `innerRect`                                              | size minus padding: the space `contents` gets                                                                                                                                                                                                     | Getter / Setter   |
| `setTone(r,g,b)`                                                                        | color tone on `_backSprite`                                                                                                                                                                                                                       | Function          |

## Windowskin

```
┌──────────────┬──────────────┐
│ (0,0) 96×96  │ (96,0) 96×96 │   background stretched │ frame, 9-sliced
│  background  │    frame     │
├──────────────┼───────┬──────┤
│ (0,96) 96×96 │cursor │pause │   tiled pattern │ cursor (96,96) 48×48, | pause sign (144,96) 24px frames
│ tile pattern │48×48  │ sign │
│              ├───────┴──────┤
│              │ text colours │   \C[n] palette: ColorManager.textColor, starts at 0, ends at 31
└──────────────┴──────────────┘
```

## Classes

### `**Window**` [rmmz\_core.js](/LookOutsidePluginMods/js/rmmz_core.js#L3493)

All the sprites above, plus geometry (9-slicing in `_setRectPartsGeometry`). No game logic.

### `**Window_Base**` [rmmz\_windows.js](/LookOutsidePluginMods/js/rmmz_windows.js)

Game settings applied at creation: `loadWindowskin()`, `updatePadding()` (`$gameSystem.windowPadding()`), `updateBackOpacity()`, `updateTone()`. Also `createContents()`, `open()`/`close()` animation, the dimmer, and all text drawing (`drawTextEx`, escape codes).

### `**Window_Scrollable**` **/** `**Window_Selectable**`:

Scrolling (`origin`), rows, cursor, touch/keyboard selection. Tooltips inherits this but has no items, so it's unused.

## Docs

| Layer                                                                           | Docs                                                                                                                                                                                             |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Window` and its properties                                                     | JSDoc in [rmmz\_core.js](/LookOutsidePluginMods/js/rmmz_core.js#L3493) around lines 3493–4270. Now also on hover, via the generated `.d.ts`                                                      |
| `Window_Base` → `Window_Selectable` methods                                     | [rmmz\_windows.js](/LookOutsidePluginMods/js/rmmz_windows.js) source (no JSDoc). Hover shows the rmmz-types signatures                                                                           |
| `x`, `y`, `alpha`, `scale`, `children`, `addChild`, `filters`, `worldTransform` | **PixiJS v5** [Container](https://pixijs.download/v5.3.5/docs/PIXI.Container.html)/[DisplayObject](https://pixijs.download/v5.3.5/docs/PIXI.DisplayObject.html) docs (bundled version is 5.3.12) |
| `Sprite.setFrame`, `setHue`, `setColorTone`, `move`                             | RPG Maker's `Sprite` class in `rmmz_core.js`. It wraps `PIXI.Sprite` and slices its bitmap with `setFrame`                                                                                       |
| `TilingSprite`, `_clientArea`'s `PIXI.filters.AlphaFilter`                      | PixiJS v5 `TilingSprite` / `filters` docs                                                                                                                                                        |

## Notes

- `**_container**` **vs** `**_clientArea**` **explains most quirks.** Frame and background live in `_container` (affected by `opacity` and the openness squash). Text lives in `_clientArea` (offset by padding and scroll, hidden until fully open). Anything added beside them, like the dimmer via `addChildToBack`, follows neither rule. That's why the dimmer fades instead of unrolling.
- **Bitmaps vs sprites.** Bitmaps (`contents`, the windowskin) are pixel canvases you draw into once. Sprites are cheap views that crop, move, scale, tint and fade those pixels every frame. A window is about a dozen sprites all showing pieces of one skin image plus your contents bitmap. That's why resizing is cheap (only `setFrame`/`scale` change) but redrawing text is not.
