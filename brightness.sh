#!/bin/bash
# Setzt die Bildschirmhelligkeit für das Display unter /sys/class/backlight/10-0045
BACKLIGHT="/sys/class/backlight/10-0045/brightness"
MAXFILE="/sys/class/backlight/10-0045/max_brightness"

if [ ! -w "$BACKLIGHT" ]; then
    echo "Fehler: Keine Schreibrechte auf $BACKLIGHT."
    echo "Siehe Einrichtungsschritt für die udev-Regel (99-backlight.rules)."
    exit 1
fi

MAX=$(cat "$MAXFILE" 2>/dev/null || echo 255)

if [ -z "$1" ]; then
    echo "Nutzung: $0 <Wert 1-$MAX>"
    exit 1
fi

VALUE=$1

# Grenzen absichern
if [ "$VALUE" -lt 10 ]; then VALUE=10; fi
if [ "$VALUE" -gt "$MAX" ]; then VALUE=$MAX; fi

echo "$VALUE" > "$BACKLIGHT"