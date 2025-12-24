# Dashboard-Konfiguration

Dieser Ordner enthält die Dashboard-Konfiguration und wiederverwendbare YAML-Komponenten für das Prism-Dashboard.

## Struktur

```
dashboard/
├── prism-dashboard.yml      # Hauptdashboard-Konfiguration
└── components/              # Wiederverwendbare YAML-Komponenten
    ├── custom-card.yml      # Template für Standard-Karten
    ├── navigation-bar.yml   # Navigationsleiste
    └── sidebar.yml          # Sidebar-Komponente
```

## Hauptdashboard

Die Datei `prism-dashboard.yml` enthält die komplette Dashboard-Konfiguration mit allen Views (Erdgeschoss, Obergeschoss, Büro, etc.). Diese Datei kann direkt in den Raw-Konfigurationseditor von Home Assistant kopiert werden.

### Verwendung

1. Öffne dein Dashboard in Home Assistant
2. Gehe zu **Bearbeiten** → **Raw-Konfigurationseditor**
3. Kopiere den Inhalt von `prism-dashboard.yml` hinein
4. Passe die Entitäten an deine Hardware an
5. Speichere die Änderungen

## Wiederverwendbare Komponenten

Die Komponenten im `components/`-Ordner sind als Vorlagen gedacht und können in dein Dashboard integriert werden.

### custom-card.yml

Ein Template für Standard-Karten mit Glassmorphism-Design. Enthält:
- Glassmorphism-Styling (halbtransparent mit Blur-Effekt)
- Neumorphismus-Effekte (eingedrückt bei Aktivität)
- Icon Glow-Effekte (farbiges Leuchten je nach Entitätstyp)

**Verwendung:**
```yaml
# Kopiere den Inhalt von custom-card.yml und passe die Entität an:
entity: light.dein_licht  # <-- Deine Entität hier
name: Dein Name
icon: mdi:lightbulb
```

### navigation-bar.yml

Die Navigationsleiste mit Glassmorphism-Design. Nutzt `mushroom-chips-card` für die Navigation zwischen verschiedenen Views.

**Verwendung:**
```yaml
# Kopiere den Inhalt von navigation-bar.yml
# Passe die navigation_path-Werte an deine View-Pfade an
```

**Anpassungen:**
- Ändere die `navigation_path`-Werte zu deinen View-Pfaden
- Passe die Chip-Texte an (z.B. "ERDGESCHOSS", "OBERGESCHOSS")
- Füge weitere Navigation-Items hinzu oder entferne welche

### sidebar.yml

Die linke Sidebar-Komponente mit:
- Kamerabild
- Datum & Uhrzeit
- Kalender (nächste Termine)
- Wetter & Temperatur-Graph
- Stromverbrauchsanzeige

**Verwendung:**
```yaml
# Kopiere den Inhalt von sidebar.yml
# Passe die Entitäten an:
# - camera.garden_main → deine Kamera
# - calendar.family_shared → dein Kalender
# - weather.home → dein Wetter
# - sensor.outdoor_temperature → dein Temperatursensor
# - sensor.power_* → deine Stromverbrauchs-Sensoren
```

**Anpassungen:**
- Ersetze alle Platzhalter-Entitäten durch deine echten Entitäten
- Passe die Styles an, falls gewünscht
- Füge weitere Elemente hinzu oder entferne welche

## Integration in das Hauptdashboard

Das Hauptdashboard (`prism-dashboard.yml`) nutzt YAML-Anker (`&` und `*`), um die Komponenten zu referenzieren:

```yaml
# Definition mit Anker
cards: &sidebar_content
  - type: vertical-stack
    cards:
      # ... Sidebar-Inhalt ...

# Verwendung mit Referenz
cards: *sidebar_content
```

Dies ermöglicht:
- **DRY-Prinzip:** Code wird nicht wiederholt
- **Zentrale Wartung:** Änderungen an einer Stelle wirken sich auf alle Referenzen aus
- **Sauberer Code:** Weniger Redundanz, bessere Lesbarkeit

## Anpassungen

### Entitäten ersetzen

Alle Platzhalter-Entitäten müssen durch deine echten Entitäten ersetzt werden. Nutze die Suche (`Strg+F` / `Cmd+F`), um alle Vorkommen zu finden:

- `camera.garden_main` → deine Kamera
- `light.living_room_light` → deine Lichter
- `switch.pond_pump` → deine Schalter
- `climate.living_room` → deine Klima-Entitäten
- `sensor.outdoor_temperature` → deine Sensoren
- `calendar.family_shared` → dein Kalender
- `weather.home` → dein Wetter
- etc.

### Styles anpassen

Die Styles sind in den YAML-Ankern definiert:

- **`&mush_card_style`** – Haupt-Style für Glassmorphism-Karten
- **`&active_chip_style`** – Style für aktive Navigation-Chips
- **`&inactive_chip_style`** – Style für inaktive Navigation-Chips
- **`&sidebar_content`** – Kompletter Sidebar-Inhalt

Ändere diese Anker-Definitionen, um das Aussehen global anzupassen.

## Tipps

1. **Backup erstellen:** Bevor du Änderungen machst, erstelle ein Backup deiner Dashboard-Konfiguration
2. **Schrittweise testen:** Teste Änderungen in kleinen Schritten
3. **YAML-Validierung:** Nutze einen YAML-Validator, um Syntaxfehler zu vermeiden
4. **Kommentare nutzen:** Die YAML-Dateien enthalten Kommentare, die bei der Anpassung helfen

## Support

Bei Fragen oder Problemen:
- Siehe die [Haupt-README](../README.md) für allgemeine Informationen
- Öffne ein [GitHub Issue](https://github.com/BangerTech/Prism-Dashboard/issues) für Bugs oder Feature-Requests

