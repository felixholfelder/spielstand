#!/bin/bash
# Zeigt einen Schieberegler zur Helligkeitseinstellung an und ruft dabei
# live set_brightness.sh mit dem gewählten Wert auf.

DIR="$(dirname "$(readlink -f "$0")")"
BACKLIGHT="/sys/class/backlight/10-0045/brightness"
MAXFILE="/sys/class/backlight/10-0045/max_brightness"

MAX=$(cat "$MAXFILE" 2>/dev/null || echo 255)
CURRENT=$(cat "$BACKLIGHT" 2>/dev/null || echo "$MAX")

yad --title="Bildschirmhelligkeit" \
    --width=320 \
    --scale \
    --min-value=10 \
    --max-value="$MAX" \
    --value="$CURRENT" \
    --step=5 \
    --print-partial \
    --button="Schließen:0" \
| while read -r VAL; do
    "$DIR/set_brightness.sh" "$VAL"
done