# Prism Dashboard

💎 Ein modernes, glassmorphism-inspiriertes Dashboard für Home Assistant.

## Custom Cards

Dieses Repository enthält folgende Custom Cards:

- **prism-heat** - Thermostat-Knob-Karte mit Glassmorphism-Design
- **prism-heat-small** - Kompakte Heizungs-Karte mit Inlet-Styling
- **prism-button** - Entity-Button-Karte mit Neumorphismus-Effekten
- **prism-media** - Media-Player-Karte mit Glassmorphism-Design
- **prism-calendar** - Kalender-Karte zur Anzeige kommender Termine
- **prism-shutter** - Horizontale Jalousien-Karte mit Inlet-Slider
- **prism-shutter-vertical** - Vertikale Jalousien-Karte mit kompaktem Design
- **prism-vacuum** - Staubsauger-Roboter-Karte mit Animation und Saugleistungssteuerung
- **prism-led** - Licht-Karte mit Farbrad und Temperatursteuerung

Alle Karten sind auch als **Light Theme** Versionen verfügbar (mit `-light` Suffix).

## Installation

Nach der Installation über HACS:

1. Gehe zu **Einstellungen → Dashboards → Ressourcen** (oben rechts)
2. Klicke auf **"Ressource hinzufügen"**
3. Füge die gewünschten Custom Cards hinzu (nur die, die du verwenden möchtest):
   
   - `/hacsfiles/Prism-Dashboard/prism-heat.js`
   - `/hacsfiles/Prism-Dashboard/prism-heat-small.js`
   - `/hacsfiles/Prism-Dashboard/prism-button.js`
   - `/hacsfiles/Prism-Dashboard/prism-media.js`
   - `/hacsfiles/Prism-Dashboard/prism-calendar.js`
   - `/hacsfiles/Prism-Dashboard/prism-shutter.js`
   - `/hacsfiles/Prism-Dashboard/prism-shutter-vertical.js`
   - `/hacsfiles/Prism-Dashboard/prism-vacuum.js`
   - `/hacsfiles/Prism-Dashboard/prism-led.js`
   
   Light Theme Versionen (optional): `/hacsfiles/Prism-Dashboard/prism-*-light.js`

4. Wähle für alle den Typ **"JavaScript-Modul"**
5. Starte Home Assistant neu

## Verwendung

Alle Karten können im visuellen Dashboard-Editor verwendet werden. Suche einfach nach "prism" im Karten-Browser.

Weitere Informationen findest du in der [README.md](https://github.com/BangerTech/Prism-Dashboard).
