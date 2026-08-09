#!/bin/bash

GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m"

success() {
  echo -e "${GREEN}$1${NC}"
}

error() {
  echo -e "${RED}$1${NC}"
}

spinner() {
  local pid=$1
  local delay=0.1
  local spinstr='|/-\'
  while kill -0 $pid 2>/dev/null; do
    for i in $(seq 0 3); do
      printf "\r%s ... (%c)" "$DESCRIPTION" "${spinstr:$i:1}"
      sleep $delay
    done
  done
  printf "\r%s ...     " "$DESCRIPTION"  # overwrite spinner with spaces
}

run_step() {
  DESCRIPTION="$1"
  shift
  COMMAND="$@"

  # Run command in background, capture stdout+stderr
  OUTPUT_FILE=$(mktemp)
  ($COMMAND >"$OUTPUT_FILE" 2>&1) &
  cmd_pid=$!

  # Show spinner while command runs
  spinner $cmd_pid
  wait $cmd_pid
  STATUS=$?

  OUTPUT=$(cat "$OUTPUT_FILE")
  rm "$OUTPUT_FILE"

  if [ $STATUS -eq 0 ]; then
    printf "\r%s ... " "$DESCRIPTION"
    success "ERFOLGREICH"
  else
    printf "\r%s ... " "$DESCRIPTION"
    error "FEHLGESCHLAGEN"
    echo "$OUTPUT" >&2
  fi
}

set_project_path() {
  local ENV_PATH="/etc/environment"
  local current_path

  current_path="$(pwd)"

  if [[ "$current_path" != *spielstand* ]]; then
    error "FEHLGESCHLAGEN"
    echo "Du befindest dich im falschen Pfad. Wechsle zuerst in das \"spielstand\" Verzeichnis" >&2
    exit 1
  fi

  export PROJ_DIR="$current_path"

  sudo sed -i '/^PROJ_DIR=/d' "$ENV_PATH"

  echo "PROJ_DIR=\"$current_path\"" | sudo tee -a "$ENV_PATH" > /dev/null

  if ! grep -q "^PROJ_DIR=" "$ENV_PATH"; then
    error "FEHLGESCHLAGEN"
    echo "PROJ_DIR konnte nicht in $ENV_PATH geschrieben werden" >&2
    return 1
  fi
}

hide_taskbar() {
  wf_panel_path="$HOME/.config/wf-panel-pi.ini"

  sudo tee "$wf_panel_path" > /dev/null <<EOF
# Hide taskbar
[panel]
autohide=true
autohide_duration=500
heightwhenhidden=0
EOF

  # Verify creation
  if ! grep -q -- "autohide=true" "$wf_panel_path"; then
    echo "Hiding taskbar failed!" >&2
    return 1
  fi
}

remove_splashscreen() {
  firmware_config_path="/boot/firmware/config.txt"
  disable_splash_command="disable_splash=1"
  boot_delay_command="boot_delay=0"

  # Check if file exists
  if [ ! -f "$firmware_config_path" ]; then
    echo "Config file not found: $firmware_config_path" >&2
    return 1
  fi

  if ! grep -- "$disable_splash_command" "$firmware_config_path"; then
    sudo sh -c "echo '# Disable splashscreen' >> '$firmware_config_path'"
    sudo sh -c "echo '$disable_splash_command' >> '$firmware_config_path'"
    sudo sh -c "echo '$boot_delay_command' >> '$firmware_config_path'"
  fi
}

create_systemd_service() {
  systemd_path="/etc/systemd/user/spielstand.service"

  user_id=$(id -u)
  username=$(whoami)

  sudo tee "$systemd_path" > /dev/null <<EOF
[Unit]
Description=Spielstand Web-App opener
After=graphical-session.target
PartOf=graphical-session.target

[Service]
Type=simple
WorkingDirectory=$PROJ_DIR
ExecStart=$PROJ_DIR/scripts/start.sh
Restart=on-failure

[Install]
WantedBy=default.target
EOF

  # Verify creation
  if ! grep -q -- "^\[Service\]" "$systemd_path"; then
    echo "Systemd file could not be created correctly!" >&2
    return 1
  fi

  systemctl enable --user daemon-reload
  systemctl enable --user enable spielstand.service
  systemctl enable --user spielstand.service
}

hide_taskbar() {
  wf_panel_paths=(
    "$HOME/.config/wf-panel-pi.ini"
    "$HOME/.config/wf-panel-pi/wf-panel-pi.ini"
  )

  for wf_panel_path in "${wf_panel_paths[@]}"; do
    sudo mkdir -p "$(dirname "$wf_panel_path")"

    sudo tee "$wf_panel_path" > /dev/null <<EOF
# Hide taskbar
[panel]
autohide=true
autohide_duration=500
heightwhenhidden=0
EOF

    if ! grep -q -- "autohide=true" "$wf_panel_path"; then
      echo "Hiding taskbar failed for $wf_panel_path!" >&2
      return 1
    fi
  done
}

remove_trash_basket() {
  CONFIG_FILES=$(find "$HOME/.config/pcmanfm" -type f -name "desktop-items-*.conf" 2>/dev/null)

  if [ -z "$CONFIG_FILES" ]; then
    echo "No pcmanfm desktop config files found." >&2
    return 1
  fi

  for CONFIG_FILE in $CONFIG_FILES; do
    echo "Processing $CONFIG_FILE"

    # Make a backup first
    cp "$CONFIG_FILE" "$CONFIG_FILE.bak"

    # Ensure section exists and disable trash
    for key in show_trash show_home show_documents show_mounts; do
      if grep -q "^$key=" "$CONFIG_FILE"; then
        sed -i "s/^$key=.*/$key=0/" "$CONFIG_FILE"
      else
        echo "$key=0" >> "$CONFIG_FILE"
      fi
    done

    # Verify the change
    if ! grep -q "^show_trash=0" "$CONFIG_FILE"; then
      echo "Failed to update $CONFIG_FILE" >&2
      return 1
    fi
  done

  # Reload pcmanfm so changes take effect
  if command -v pcmanfm >/dev/null 2>&1; then
    pcmanfm --reconfigure || {
      echo "Warning: Could not reload pcmanfm automatically" >&2
    }
  fi

  pcmanfm --reconfigure
}

deactivate_services() {
  sudo systemctl disable NetworkManager-wait-online.service
  sudo systemctl disable e2scrub_reap.service
  sudo systemctl disable ModemManager.service
  sudo systemctl disable rpi-eeprom-update.service
}

install_screen_keyboard() {
  sudo apt-get install squeekboard -y -qqq
}

setup_shutdown_service() {
  target="~/shutdown-service/"
  mkdir -p "$target"
  cp "$PROJ_DIR/shutdown-service/server.js" "$target"
  cp "$PROJ_DIR/shutdown-service/package.json" "$target"

  # TODO - das ganze in Docker Container umwandeln?
  cd "$target"
  sudo apt-get install nodejs -y
  npm install

  sudo tee "/etc/sudoers.d/shutdown-button" > /dev/null <<EOF
spielstand ALL=(ALL) NOPASSWD: /sbin/shutdown
EOF

  username=$(whoami)

  sudo tee "/etc/systemd/system/shutdown-service.service" > /dev/null <<EOF
[Unit]
Description=Lokaler Shutdown-Service fuer Kiosk-Button
After=network.target

[Service]
Type=simple
User=$username
WorkingDirectory=$PROJ_DIR/shutdown-service
ExecStart=/usr/bin/node $HOME/shutdown-service/server.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable --now shutdown-service
}

print_ascii_art() {
  echo "
  __       _      _     _                  _
 / _\_ __ (_) ___| |___| |_ __ _ _ __   __| |
 \ \| '_ \| |/ _ \ / __| __/ _  | '_ \ / _  |
 _\ \ |_) | |  __/ \__ \ || (_| | | | | (_| |
 \__/ .__/|_|\___|_|___/\__\__,_|_| |_|\__,_|
    |_|
"
}

clear

print_ascii_art
echo -e "Sollte dieses Setup-Script bei einem Schritt fehlschlagen, ja... dann keine Ahnung...\n\n"
read -p "Drücke <ENTER> um das Setup zu beginnen..."

set_project_path
run_step "Taskbar ausblenden" hide_taskbar
run_step "Entferne Splashscreen" remove_splashscreen
run_step "System-Splashscreen ändern" sudo -E bash -c "$PROJ_DIR/scripts/update_system_splash.sh -s $PROJ_DIR/public/splashscreen_90.png"
run_step "Desktop Wallpaper ändern" sudo -E bash -c "$PROJ_DIR/scripts/set_wallpaper.sh"
run_step "Systemd-Datei für Systemstart erstellen" create_systemd_service
run_step "Mülleimer entfernen" remove_trash_basket
run_step "Aktiviere SSH" sudo raspi-config nonint do_ssh 0
run_step "Aktiviere VNC" sudo raspi-config nonint do_vnc 0
run_step "Aktiviere SPI" sudo raspi-config nonint do_spi 0
run_step "Deaktiviere unnötige Services" deactivate_services
run_step "Installiere Bildschirmtastatur" install_screen_keyboard
run_step "Setup: Shutdown-service" setup_shutdown_service

success "Setup erfolgreich abgeschlossen!\n\n"

print_ascii_art

echo "Spielstand neustarten, um Setup abzuschließen..."

while true; do
  read -p "Spielstand neustarten? [J]a, [N]ein: " choice
  case "$choice" in
    j|J )
      sudo reboot
      break
      ;;
    n|N )
      echo "Kein Neustart."
      break
      ;;
    * )
      echo "Bitte gib entweder \"J\" oder \"N\" ein!"
      ;;
  esac
done
