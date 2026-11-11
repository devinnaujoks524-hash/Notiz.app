# Notiz

Private Notizen, To-dos und 3D-Karten – komplett schwarz, knallige Farben, verschlüsselt auf deinem Handy.

## Funktionen

- **Notizen** mit Farben, Anheften und Suche
- **To-dos** zum Abhaken
- **Visualisierung:** Bank- und Kundenkarten schweben als 3D-Modell (ziehen = drehen, tippen = umdrehen)
- **Sperre** mit Code, optional Fingerabdruck
- **Offline** – funktioniert ohne Internet
- **Backup** als verschlüsselte Datei (Export/Import)

## Sicherheit

- Alle Daten liegen nur auf deinem Gerät (IndexedDB) und sind mit **AES-256-GCM** verschlüsselt.
- Der Schlüssel wird aus deinem Code abgeleitet (PBKDF2, 600.000 Runden). Ohne Code lässt sich nichts entschlüsseln – es gibt keine Wiederherstellung.
- Fingerabdruck nutzt WebAuthn mit PRF-Erweiterung: Der Fingerabdruck entsperrt einen eigenen Schlüssel, nicht nur eine Attrappe. Wenn das Gerät PRF nicht kann, bleibt nur der Code.
- Bewusst **nicht** gespeichert: PIN, CVV, volle Kartennummer.

## Installieren

1. Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch `main`, Ordner `/ (root)` → **Save**.
2. Nach 1–2 Minuten ist die App unter `https://devinnaujoks524-hash.github.io/notiz.app/` erreichbar.
3. Link in **Chrome** auf dem Handy öffnen → Menü (⋮) → **App installieren** bzw. **Zum Startbildschirm hinzufügen**.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Grundgerüst |
| `styles.css` | Design |
| `app.js` | Ansichten und Bedienung |
| `vault.js` | Verschlüsselung und Speicher |
| `viz.js` | 3D-Karten |
| `sw.js` | Offline-Cache (bei Updates `VERSION` erhöhen) |
| `manifest.webmanifest` | App-Name, Icon, Farben |

Lokal testen: `python3 -m http.server` im Ordner starten und `http://localhost:8000` öffnen.
