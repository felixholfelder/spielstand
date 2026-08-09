const express = require("express");
const { exec } = require("child_process");

const app = express();
const PORT = 5005;

// Nur von localhost erreichbar (siehe app.listen weiter unten)
app.post("/shutdown", (req, res) => {
  console.log("Shutdown angefordert...");
  res.json({ status: "shutting down" });

  // Erst antworten, dann herunterfahren, damit die Vue-App noch eine Antwort bekommt
  exec("sudo /sbin/shutdown -h now", (error, stdout, stderr) => {
    if (error) {
      console.error(`Fehler beim Herunterfahren: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
  });
});

app.post("/reboot", (req, res) => {
  console.log("Reboot angefordert...");
  res.json({ status: "rebooting" });

  // Erst antworten, dann herunterfahren, damit die Vue-App noch eine Antwort bekommt
  exec("sudo /sbin/reboot -h now", (error, stdout, stderr) => {
    if (error) {
      console.error(`Fehler beim Herunterfahren: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
  });
});

// WICHTIG: nur auf 127.0.0.1 binden, NICHT auf 0.0.0.0,
// sonst wäre der Endpoint aus dem ganzen Netzwerk ansprechbar
app.listen(PORT, "127.0.0.1", () => {
  console.log(`Shutdown-Service läuft auf http://127.0.0.1:${PORT}`);
});
