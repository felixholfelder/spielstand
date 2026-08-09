#!/bin/bash
set -euo pipefail

DEFAULT_SOURCE="${PROJ_DIR:-.}/public/splashscreen.png"

SOURCE="$DEFAULT_SOURCE"
SET_WALLPAPER=true

usage() {
  cat <<EOF
Verwendung: $(basename "$0") [OPTIONEN]

Ersetzt das Plymouth-Splashscreen-Bild und passt den Shutdown-Modus an.
Optional wird das Bild auch als Desktop-Hintergrund gesetzt (pcmanfm).

Optionen:
  -s, --source DATEI     Pfad zum Quellbild
                          (Standard: $DEFAULT_SOURCE)
  -n, --no-wallpaper       Desktop-Hintergrund NICHT mit pcmanfm setzen
  -h, --help               Diese Hilfe anzeigen
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -s|--source)
      SOURCE="$2"
      shift 2
      ;;
    -n|--no-wallpaper)
      SET_WALLPAPER=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unbekannte Option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

PLYMOUTH_SHUTDOWN_FILE="/usr/lib/systemd/system/plymouth-poweroff.service"
REPLACEMENT="--mode=reboot"
TARGET="/usr/share/plymouth/themes/pix/splash.png"

if [[ ! -f "$SOURCE" ]]; then
  echo "Quellbild nicht gefunden: $SOURCE" >&2
  exit 1
fi

if [[ ! -f "$PLYMOUTH_SHUTDOWN_FILE" ]]; then
  echo "Plymouth-Service-Datei nicht gefunden: $PLYMOUTH_SHUTDOWN_FILE" >&2
  exit 1
fi

sudo cp -rf "$SOURCE" "$TARGET"
sudo update-initramfs -u

sudo sed -i "s/--mode=shutdown/$REPLACEMENT/" "$PLYMOUTH_SHUTDOWN_FILE" > /dev/null 2>&1

if $SET_WALLPAPER; then
  pcmanfm -w "$TARGET"
fi

if ! grep -q -- "$REPLACEMENT" "$PLYMOUTH_SHUTDOWN_FILE"; then
  echo "Shutdown-Bild konnte nicht ausgetauscht werden!" >&2
  exit 1
fi
