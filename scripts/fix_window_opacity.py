#!/usr/bin/env python3
"""
RPG Maker MZ regenerates data/System.json's "advanced" block from its own
known fields whenever the editor saves, silently dropping the custom
"windowOpacity" field. Run this after editing/saving in the editor to put
it back.
"""
import json
from pathlib import Path

SYSTEM_JSON = Path(__file__).parent / "game" / "data" / "System.json"


def main():
    text = SYSTEM_JSON.read_text(encoding="utf-8")
    data = json.loads(text)

    advanced = data.setdefault("advanced", {})
    if advanced.get("windowOpacity") == 255 and next(iter(advanced), None) == "windowOpacity":
        print("windowOpacity already set, nothing to do.")
        return

    advanced.pop("windowOpacity", None)
    data["advanced"] = {"windowOpacity": 255, **advanced}

    new_text = json.dumps(data, indent=4, ensure_ascii=False)
    SYSTEM_JSON.write_text(new_text, encoding="utf-8")
    print("windowOpacity: 255 restored in data/System.json")


if __name__ == "__main__":
    main()
