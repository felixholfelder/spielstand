#!/bin/bash

# Chromium im Kiosk-Modus starten
chromium \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --start-maximized \
  "https://spielstand.holfelder.cloud"
