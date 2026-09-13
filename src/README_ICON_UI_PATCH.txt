성아여고 character-symbol UI patch

Drop-in file layout
- app.js                : Incident 01 UI with character symbols
- cafeteria-app.js      : Incident 02 UI with character symbols
- hub.js                : hub personnel cards with character symbols
- styles.css            : symbol placement, actor emblem, dialogue, commands, responsive rules
- assets/icons/*.png    : 8 recolored character symbols
- other .js files       : supplied current project files, preserved for convenience

The HTML pages are expected to keep the same script filenames and relative structure as the current project.
The icon paths are relative URLs such as assets/icons/hwayoung.png.

Design placements
1. Deployment roster: compact identity seal beside the roster number.
2. Current party ribbon: small symbol before each member.
3. Active turn: large PERSONAL MARK block beside the active character.
4. Unique ability commands: character symbol appears only on ability buttons; field commands stay text-led.
5. Dialogue: speaker symbol appears in both briefing/result dialogue and the presentation overlay.
6. Field unit / rear support: small call-sign symbols reinforce quick recognition.
7. Hub: unlocked characters read like personnel files with a symbol stamp instead of portrait cards.

No game-engine mechanics were changed.
