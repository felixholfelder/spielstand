#!/bin/bash

# Chromium im Kiosk-Modus starten
chromium \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --start-maximized \
  --password-store=basic \
  "https://spielstand.holfelder.cloud"
