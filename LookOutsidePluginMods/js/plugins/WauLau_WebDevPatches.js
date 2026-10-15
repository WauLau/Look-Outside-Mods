;(() => {
    const pluginName = "WauLau_WebDevPatches"

    const _Window_openness = Object.getOwnPropertyDescriptor(
        Window.prototype,
        "backOpacity"
    )
    Object.defineProperty(Window.prototype, "backOpacity", {
        get: function () {
            return this._backSprite.alpha * 255
        },
        set: function (value = 255) {
            this._backSprite.alpha = value.clamp(0, 255) / 255
        },
        configurable: true,
    })

    //============================================================================//
    //                     BROWSER: monsterImageExists WITHOUT fs                 //
    //============================================================================//

    // NODE-ONLY -----
    // bunchastuff.js's monsterImageExists() checks img/enemies with
    // require("fs"), which only exists under nw.js. In a browser it throws
    // "require is not defined" (e.g. monster_MoveFar from a troop event).
    // Outside nw.js it's replaced with a synchronous HEAD request against the
    // same paths; results are cached since troop events can ask repeatedly.
    if (!Utils.isNwjs() && typeof window.monsterImageExists === "function") {
        const existsCache = new Map()

        /**
         * @param {string} url - path relative to index.html
         * @returns {boolean} true if the server answers 2xx
         */
        function urlExists(url) {
            if (existsCache.has(url)) return existsCache.get(url)
            let found = false
            try {
                const xhr = new XMLHttpRequest()
                xhr.open("HEAD", url, false)
                xhr.send()
                found = xhr.status >= 200 && xhr.status < 300
            } catch (e) {
                console.warn(`${pluginName}: HEAD ${url} failed - ${e.message}`)
            }
            existsCache.set(url, found)
            return found
        }

        /**
         * Browser stand-in for bunchastuff's monsterImageExists (same paths,
         * including the encrypted ".png_" variant).
         * @param {string} filename - enemy image name without extension
         * @returns {boolean}
         */
        window.monsterImageExists = function (filename) {
            const base = "img/enemies/" + filename
            const found = urlExists(base + ".png") || urlExists(base + ".png_")
            if (!found) console.log("missing file: ./img/" + filename + ".png")
            return found
        }
    }
})()
