## Prism-Dashboard

💎 Ein modernes, glassmorphism-inspiriertes Dashboard für Home Assistant, aufgebaut auf den beliebten Mushroom Cards.

<p align="center">
  <img src="https://github.com/user-attachments/assets/6048858f-4ba0-40a8-95b8-7787cde1d8ab" alt="tac-dash-1" width="70%">
</p>

---

### Inhaltsverzeichnis

- [Was ist Prism?](#was-ist-prism)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
  - [1. Dateien vorbereiten](#1-dateien-vorbereiten)
  - [2. Dashboard anlegen](#2-dashboard-anlegen)
  - [3. Code einfügen](#3-code-einfügen)
- [Configuration](#configuration)
  - [Entitäten anpassen](#entitäten-anpassen)
  - [Styles ändern](#styles-ändern)
- [Support / Feedback](#support--feedback)
- [Contributing](#contributing)
- [Sponsorship](#sponsorship)
- [Keywords](#keywords)

---

## Was ist Prism?

Prism ist ein modernes, responsives Home Assistant Dashboard im Glassmorphism-Design.  
Es kombiniert halbtransparente „frosted glass“-Oberflächen mit Neumorphismus-Elementen für haptisches Feedback und nutzt intelligente YAML-Anker, um den Code schlank, einheitlich und leicht wartbar zu halten.

Prism ist optimiert für Wandtablets und Smartphones und eignet sich ideal als zentraler Smart-Home-Hub im Alltag.


<p align="center">
  <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=FD26FHKRWS3US" target="_blank" rel="noopener noreferrer">
    <img src="https://pics.paypal.com/00/s/N2EwMzk4NzUtOTQ4Yy00Yjc4LWIwYmUtMTA3MWExNWIzYzMz/file.PNG" alt="SUPPORT PRISM" height="51">
  </a>
</p>

---

## Features

- **💎 Glassmorphism UI**  
  Halbtransparente „Frosted Glass“-Karten mit Unschärfe-Effekten für einen modernen, hochwertigen Look.

- **👆 Haptisches Feedback (Neumorphismus)**  
  Aktive Buttons wirken „eingedrückt“ und geben visuelles Feedback bei Interaktionen.

- **🧭 Smart Navigation**  
  Animierte Navigationsleiste, die den aktuellen Raum bzw. die aktive Ansicht automatisch hervorhebt.

- **🌈 Status Glow**  
  Icons leuchten je nach Zustand in passenden Farben (z. B. Grün für Sicherheit, Orange für Heizung).

- **📱 Responsives Grid**  
  Layout passt sich nahtlos an verschiedene Geräte an (Tablet an der Wand, Smartphone in der Hand).

- **🧹 Clean Code mit YAML-Ankern**  
  Nutzt YAML-Anker (`&` und `*`), um Wiederholungen zu vermeiden und globale Style-Änderungen zentral zu halten.

---

## Requirements

Damit dieses Dashboard funktioniert, müssen folgende Frontend-Integrationen über **HACS (Home Assistant Community Store)** installiert sein:

- **Mushroom Cards**  
  Basis für fast alle Karten im Dashboard.

- **card-mod**  
  Essenziell für das CSS- und Glassmorphism-Styling.

- **layout-card**  
  Ermöglicht das responsive Grid-Layout (Sidebar + Main-Bereich).

- **kiosk-mode**  
  Versteckt Header und Sidebar von Home Assistant für einen cleanen Fullscreen-Look.

- **mini-graph-card**  
  Für Temperatur- und Verlaufsdiagramme.

- **browser_mod**  
  Wichtig für Popups (z. B. Kalender, Staubsauger-Steuerung).

---

## Installation

### 1. Dateien vorbereiten

1. Dieses Repository herunterladen oder clonen.  
2. Den Inhalt des Ordners `www` in deinen Home Assistant Konfigurationsordner unter  
   `/config/www/` kopieren.  
3. Das Hintergrundbild sollte anschließend unter  
   `/local/background/background.png`  
   erreichbar sein.  
4. **Hinweis:** Starte Home Assistant neu, falls der `www`-Ordner neu erstellt oder neu hinzugefügt wurde.

### 2. Dashboard anlegen

1. In Home Assistant zu **Einstellungen → Dashboards** navigieren.  
2. Auf **„Dashboard hinzufügen“** klicken → **„Neues Dashboard von Grund auf“** wählen.  
3. Folgende Einstellungen vornehmen:
   - **Titel:** `Prism` (oder ein Titel deiner Wahl)
   - **Ansichtstyp:** `Grid (layout-card)` (falls verfügbar, ansonsten später im Code definieren)

### 3. Code einfügen

1. Das neue Dashboard öffnen.  
2. Oben rechts auf die drei Punkte `(...)` klicken → **„Bearbeiten“**.  
3. Erneut auf die drei Punkte klicken → **„Raw-Konfigurationseditor“** auswählen.  
4. Den gesamten Inhalt löschen.  
5. Den Inhalt der `dashboard.yaml` aus diesem Repository einfügen.  
6. **WICHTIG:** Entitäten an deine eigene Hardware anpassen (siehe Abschnitt „Configuration“).  
7. Auf **„Speichern“** klicken.

---

## Configuration

Das Dashboard nutzt generische Platzhalter-Entitäten (z. B. `light.living_room_light`).  
Diese existieren in deinem System in der Regel nicht und müssen durch deine **echten Entitäten** ersetzt werden.

### Entitäten anpassen

Öffne den Raw-Konfigurationseditor deines Dashboards und nutze die Suche (`Strg+F` oder `Cmd+F`), um die folgenden Platzhalter zu finden und zu ersetzen:

- **Kameras**  
  - `camera.garden_main`  
  - `camera.front_door`  
  - `camera.terrace`  
  - `camera.driveway`

- **Licht** (Beispiele)  
  - `light.kitchen_strip`  
  - `light.kitchen_bar`  
  - `light.living_room_light`  
  - `light.office_desk`

- **Schalter**  
  - `switch.pond_pump`  
  - `switch.workshop_equipment`  
  - `switch.bedroom_light`

- **Sensoren**  
  - `sensor.outdoor_temperature`  
  - `sensor.power_total_consumption`  
  - `sensor.kitchen_temperature`

- **Klima**  
  - `climate.living_room`  
  - `climate.office`  
  - `climate.bathroom_upstairs`

- **Spezial-Entitäten**  
  - `calendar.family_shared` – dein Kalender  
  - `weather.home` – dein Wetter-Dienst  
  - `lock.garden_gate` – dein Smart Lock  
  - `input_select.robot_vacuum_status` – Helper für deinen Saugroboter

> **Tipp:** Ersetze die Platzhalter konsequent per „Suchen & Ersetzen“, um Fehler zu vermeiden.

### Styles ändern

Dank der YAML-Anker musst du Styles in der Regel nur an wenigen zentralen Stellen ändern:

- **`&sidebar_content`**  
  Definiert den Inhalt der linken Sidebar zentral.

- **`&active_chip_style` / `&inactive_chip_style`**  
  Steuern das Aussehen der Navigations-Tabs (aktiv vs. inaktiv).

- **`&mush_card_style`**  
  Haupt-Style für die Glassmorphism-Karten (Transparenz, Schatten, Blur, etc.).

Einmal angepasst, werden diese Styles automatisch auf alle referenzierten Stellen angewendet.

---

## Support / Feedback

Bei Bugs, Fragen oder Feature Requests:

- **GitHub Issues:** Bitte das „Issues“-Tab dieses Repositories verwenden.  
- Alternativ: Kontaktiere mich direkt (z. B. über dein bevorzugtes Profil, falls hier verlinkt).

Feedback, Vorschläge und Screenshots deiner eigenen Setups sind jederzeit willkommen!

---

## Contributing

Beiträge sind ausdrücklich erwünscht:

1. Repository forken.  
2. Eigenen Branch erstellen (`feature/...` oder `fix/...`).  
3. Änderungen vornehmen und testen.  
4. Pull Request eröffnen und kurz beschreiben, was geändert wurde.

---

## Sponsorship

Wenn dir Prism gefällt und du die Weiterentwicklung unterstützen möchtest:

Nutze gerne den **Support-Button oben** in der README (öffnet sich in einem neuen Tab/Fenster).

Vielen Dank für deine Unterstützung! 💙

---

## Keywords

`home-assistant`, `dashboard`, `glassmorphism`, `lovelace`, `mushroom-cards`, `yaml`, `smart-home`, `ui-design`, `hacs`, `minimalist`

