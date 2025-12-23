🔮 Prism-Dashboard

Prism ist ein modernes, responsives Home Assistant Dashboard im Glassmorphism-Design. Es kombiniert halbtransparente Oberflächen mit Neumorphismus-Elementen für haptisches Feedback und nutzt intelligente YAML-Anker, um den Code schlank und wartbar zu halten.

(Füge hier später einen Screenshot deines Dashboards ein)

✨ Features

💎 Glassmorphism UI: Halbtransparente "Frosted Glass" Karten mit Unschärfe-Effekten.

👆 Haptisches Feedback: Aktive Buttons wirken "eingedrückt" (Neumorphismus).

🧭 Smart Navigation: Animierte Navigationsleiste, die den aktuellen Raum hervorhebt.

🌈 Status Glow: Icons leuchten je nach Zustand in passenden Farben (Grün für Sicherheit, Orange für Heizung, etc.).

📱 Responsive Grid: Passt sich nahtlos an Tablets (Wandmontage) und Smartphones an.

🧹 Clean Code: Nutzt YAML-Anker (& und *), um Wiederholungen zu vermeiden und globale Style-Änderungen zu vereinfachen.

🛠️ Voraussetzungen

Damit dieses Dashboard funktioniert, müssen folgende Frontend-Integrationen über HACS (Home Assistant Community Store) installiert sein:

Integration

Zweck

Mushroom Cards

Die Basis für fast alle Karten.

Card-mod

Essentiell für das CSS/Glassmorphism Styling.

Layout Card

Ermöglicht das responsive Grid-Layout (Sidebar + Main).

Kiosk Mode

Versteckt Header und Sidebar für den Fullscreen-Look.

Mini Graph Card

Für die Temperatur- und Verlaufsdiagramme.

Browser Mod

Wichtig für Popups (z.B. Kalender oder Staubsauger).

🚀 Installation

1. Dateien vorbereiten

Lade dieses Repository herunter.

Kopiere den Inhalt des Ordners www in deinen Home Assistant Konfigurationsordner unter /config/www/.

Das Hintergrundbild sollte unter /local/background/background.png erreichbar sein.

Hinweis: Starte Home Assistant neu, falls der www Ordner neu erstellt wurde.

2. Dashboard anlegen

Gehe in Home Assistant zu Einstellungen → Dashboards.

Klicke auf Dashboard hinzufügen → Neues Dashboard von Grund auf.

Titel: Prism (oder nach Wahl).

Ansichtstyp: Grid (layout-card) (falls verfügbar, sonst leer lassen und im Code definieren).

3. Code einfügen

Öffne das neue Dashboard.

Klicke oben rechts auf die drei Punkte (...) → Bearbeiten.

Klicke erneut auf die drei Punkte → Raw-Konfigurationseditor.

Lösche den gesamten Inhalt und füge den Code aus der dashboard.yaml dieses Repositories ein.

WICHTIG: Passe die Entitäten an deine Hardware an (siehe unten).

Klicke auf Speichern.

⚙️ Konfiguration & Anpassung

Das Dashboard nutzt generische Platzhalter (z.B. light.living_room_light). Diese existieren in deinem System nicht und müssen durch deine echten Entitäten ersetzt werden.

Entitäten anpassen (Suchen & Ersetzen)

Öffne den Raw-Config-Editor und suche (STRG+F) nach folgenden englischen Platzhaltern, um sie mit deinen Geräten zu ersetzen:

Kameras:

camera.garden_main

camera.front_door

camera.terrace

camera.driveway

Licht & Schalter:

light.kitchen_strip, light.kitchen_bar

switch.living_room_light (oder light.living_room)

switch.office_main_light

switch.bedroom_light

switch.pond_pump

Sensoren (Temperatur/Strom):

sensor.outdoor_temperature

sensor.power_total_consumption

sensor.power_grid_feed

sensor.kitchen_temperature / sensor.kitchen_humidity

Klima / Thermostate:

climate.living_room

climate.office

climate.bathroom_upstairs

Spezial-Entitäten:

calendar.family_shared (Dein Kalender)

weather.home (Dein Wetter-Dienst)

lock.garden_gate (Dein Smart Lock)

input_select.robot_vacuum_status (Dein Saugroboter-Helper)

Styles ändern

Dank der YAML-Anker musst du Styles oft nur an einer Stelle im Code ändern, um sie überall anzuwenden:

&sidebar_content: Definiert den Inhalt der linken Seitenleiste zentral.

&active_chip_style / &inactive_chip_style: Steuert das Aussehen der Navigations-Tabs.

&mush_card_style: Der Haupt-Style für die Glassmorphismus-Karten.

📄 Lizenz

Dieses Projekt ist unter der MIT Lizenz veröffentlicht. Fühl dich frei, es zu kopieren, anzupassen und zu teilen!
