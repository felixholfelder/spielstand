#!/bin/bash
set -euo pipefail

DEFAULT_SOURCE="${PROJ_DIR:-.}/public/splashscreen.png"

SOURCE="$DEFAULT_SOURCE"

usage() {
  cat <<EOF
Verwendung: $(basename "$0") [OPTIONEN]

Ersetzt den Desktop-Hintergrund

Optionen:
  -s, --source DATEI     Pfad zum Quellbild
                          (Standard: $DEFAULT_SOURCE)
  -h, --help               Diese Hilfe anzeigen
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -s|--source)
      SOURCE="$2"
      shift 2
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

if [[ ! -f "$SOURCE" ]]; then
  echo "Quellbild nicht gefunden: $SOURCE" >&2
  exit 1
fi

pcmanfm -w "$SOURCE"
