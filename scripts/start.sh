#!/bin/bash

# Chromium im Kiosk-Modus starten
chromium \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --start-maximized \
  --password-store=basic \
  --app="https://spielstand.holfelder.cloud?platform=raspberry"
