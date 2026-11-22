# Lumen

Private Notizen, To-dos und Rechnungen – komplett schwarz, knallige Farben, verschlüsselt auf deinem Handy.

## Funktionen

- **Notizen** mit Farben, Anheften, `#Tags`, interaktiven Checklisten (`[ ]`), Suche und **Sprachnotizen** (Aufnahme und Wiedergabe als Insel oben)
- **To-dos** zum Abhaken, Wischen, Gedrückthalten (Kontextmenü), **Wiederholung** (täglich/wöchentlich/monatlich), Erledigt-Serie & 28-Tage-Heatmap
- **Fokus-Timer** als schwebende Insel mit optionalem Offline-Ambient-Sound (Regen, Rauschen, Klang)
- **Suche über alles** (Lupe oder auf der Startseite nach unten ziehen)
- **Schnellaktionen** am App-Symbol und **Teilen nach Lumen** aus anderen Apps
- **Rechnungen** mit Foto, Steuer (DE, AT, CH, USA u. a. oder eigene), Netto/Brutto-Rechnung und Status
- **Vier Designs:** Klassisch (schwarz), Glas (mit Lichtbrechung), Ember (Dark-Dashboard-Stil mit Wochen-Kurve) oder Gemini (Obsidian-Prisma mit 4 Farbspektren, Tagesfokus-Ring & 7-Tage-Puls) – umschaltbar in den Einstellungen
- **Sperre** mit Code, optional Fingerabdruck
- **Offline** – funktioniert ohne Internet
- **Backup** als verschlüsselte Datei (Export/Import)

## Sicherheit

- Alle Daten liegen nur auf deinem Gerät (IndexedDB) und sind mit **AES-256-GCM** verschlüsselt.
- Der Schlüssel wird aus deinem Code abgeleitet (PBKDF2, 600.000 Runden). Ohne Code lässt sich nichts entschlüsseln – es gibt keine Wiederherstellung.
- Fingerabdruck nutzt WebAuthn mit PRF-Erweiterung: Der Fingerabdruck entsperrt einen eigenen Schlüssel, nicht nur eine Attrappe. Wenn das Gerät PRF nicht kann, bleibt nur der Code.

## Installieren

1. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch `main`, Ordner `/ (root)` → **Save**.
2. Nach 1–2 Minuten ist die App unter `https://devinnaujoks524-hash.github.io/Notiz.app/` erreichbar.
3. Link in **Chrome** auf dem Handy öffnen → Menü (⋮) → **App installieren** bzw. **Zum Startbildschirm hinzufügen**.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Grundgerüst |
| `styles.css` | Design |
| `app.js` | Ansichten und Bedienung |
| `vault.js` | Verschlüsselung und Speicher |
| `sw.js` | Offline-Cache (bei Updates `VERSION` erhöhen) |
| `manifest.webmanifest` | App-Name, Icon, Farben |

Lokal testen: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen.
