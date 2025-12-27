## Custom Cards

> **💡 Tipp:** Nach dem Hinzufügen der Karten zu den Resources kannst du sie im Dashboard-Editor (Vorschau-Teil) finden, indem du z.B. "prism" in die Suche eingibst. Alle Prism-Karten werden dann angezeigt.

---

### prism-heat

Eine benutzerdefinierte Thermostat-Knob-Karte mit Glassmorphism-Design.

<img width="400" alt="prism-heat" src="https://github.com/user-attachments/assets/5a3a4adb-b228-4696-8dff-768e417fc38f" />

**Verwendung:**
```yaml
- type: custom:prism-heat
  entity: climate.living_room
  name: Wohnzimmer
  color: "#fb923c"
```

---

### prism-heat-small

Eine kompakte Heizungs-Karte mit Inlet-Styling und einfachen Temperatur-Controls.

<img width="400" alt="prism-heat-small" src="https://github.com/user-attachments/assets/992f981e-bbb2-4af8-b41f-06602d49e206" />

**Verwendung:**
```yaml
- type: custom:prism-heat-small
  entity: climate.living_room
  name: Wohnzimmer
```

---

### prism-button

Eine Glassmorphism-stylisierte Entity-Button-Karte mit Neumorphismus-Effekten und leuchtendem Icon-Kreis.

<img width="400" alt="prism-button" src="https://github.com/user-attachments/assets/f0220fcb-e03b-4278-9baa-1591db9a4137" />

**Verwendung:**
```yaml
- type: custom:prism-button
  entity: light.living_room_light
  name: Wohnzimmer
  icon: mdi:lightbulb
  layout: horizontal
  active_color: "#ffc864"
```

---

### prism-media

Eine Media-Player-Karte mit Glassmorphism-Design und Inlet-Styling.

<img width="400" alt="prism-media" src="https://github.com/user-attachments/assets/5429e0f0-268f-496e-8ccb-2485fbc9bd30" />

**Verwendung:**
```yaml
- type: custom:prism-media
  entity: media_player.living_room_speaker
  playing_color: "#60a5fa"
```

---

### prism-calendar

Eine Kalender-Karte mit Glassmorphism-Design zur Anzeige kommender Termine.

<img width="400" alt="prism-calendar" src="https://github.com/user-attachments/assets/d95ac18e-bd1b-4de4-ab78-248ac027bbd9" />

**Verwendung:**
```yaml
- type: custom:prism-calendar
  entity: calendar.family_shared
  max_events: 5
  icon_color: "#f87171"
  dot_color: "#f87171"
```

---

### prism-shutter

Eine horizontale Jalousien-Karte mit Inlet-Slider und Glassmorphism-Design.

<img width="400" alt="prism-shutter" src="https://github.com/user-attachments/assets/eb905a66-b1be-456d-a729-7d3d24434d48" />

**Verwendung:**
```yaml
- type: custom:prism-shutter
  entity: cover.living_room_shutter
  name: Wohnzimmer
```

---

### prism-shutter-vertical

Eine vertikale Jalousien-Karte mit Inlet-Slider und kompaktem Design.

<img width="200" alt="prism-shutter-vertical" src="https://github.com/user-attachments/assets/880b7e46-f150-4b32-b114-651a3f7d4ef6" />

**Verwendung:**
```yaml
- type: custom:prism-shutter-vertical
  entity: cover.bedroom_shutter
  name: Schlafzimmer
```

---

### prism-vacuum

Eine Staubsauger-Roboter-Karte mit Inlet-Styling, Animation und Saugleistungssteuerung.

<img width="400" alt="prism-vacuum" src="images/prism-vacuum.png" />

**Verwendung:**
```yaml
- type: custom:prism-vacuum
  entity: vacuum.robot_vacuum
  name: Staubsauger
```

---

### prism-led

Eine LED-Licht-Karte mit interaktivem Farbrad, Weiß-Temperatur-Steuerung und Helligkeitsregelung.

<img width="400" alt="prism-led" src="images/prism-led.png" />

**Verwendung:**
```yaml
- type: custom:prism-led
  entity: light.living_room_led
  name: Wohnzimmer LED
```

---

### prism-3dprinter

Eine 3D-Drucker-Karte mit Glassmorphism-Design zur Anzeige von Fortschritt, Temperaturen, Lüfter und Layer-Infos.

<img width="400" alt="prism-3dprinter" src="images/prism-3dprinter.png" />

**Verwendung:**
```yaml
- type: custom:prism-3dprinter
  entity: sensor.3d_printer_state        # Sensor/Entität mit Druckerstatus & Attributen
  name: 3D Printer
  camera_entity: camera.3d_printer       # Optional: Drucker-Kamera
  image: /local/custom-components/images/prism-3dprinter.png
```

---

### prism-bambu

Eine Bambu Lab 3D-Drucker-Karte mit AMS (Automatic Material System) Support, Glassmorphism-Design und vollständiger Anzeige von Druckfortschritt, Temperaturen, Lüfter, Layer-Infos und allen 4 AMS-Slots.

<img width="400" alt="prism-bambu" src="images/prism-bambu.jpg" />

**Verwendung:**

**Basis-Konfiguration (Visual Editor):**
```yaml
- type: custom:prism-bambu
  printer: <device_id>  # Bambu Lab Drucker-Gerät (z.B. aus Device-Registry)
  name: Bambu Lab Printer  # Optional: Custom Name
  image: /local/custom-components/images/prism-bambu-pic.png  # Optional: Drucker-Bild
```

**Erweiterte Konfiguration (mit AMS und Kamera):**
```yaml
- type: custom:prism-bambu
  printer: <device_id>  # Bambu Lab Drucker-Gerät
  ams_device: <ams_device_id>  # Optional: AMS-Gerät (falls mehrere AMS vorhanden)
  name: Bambu Lab Printer
  camera_entity: camera.x1c_1_kamera  # Optional: Camera Entity
  image: /local/custom-components/images/prism-bambu-pic.png  # Optional: .png oder .jpg
```

**Hinweis:** Die Karte verwendet die **Device-Registry** von Home Assistant und filtert automatisch alle relevanten Entities basierend auf dem ausgewählten Drucker-Gerät. Dies funktioniert genau wie die offiziellen [ha-bambulab Cards](https://github.com/greghesp/ha-bambulab-cards).

**Features:**
- ✅ **AMS Support**: Zeigt alle 4 AMS-Slots mit Farb-Visualisierung
- ✅ **Filament-Typ Erkennung**: Unterstützt PCTG, PETG, PLA, ABS, TPU, ASA, PA-CF, PA, PC, PVA, HIPS, PP
- ✅ **Restmenge-Anzeige**: Zeigt `?` wenn RFID-Tracking nicht aktiv, sonst Prozent
- ✅ **Aktiver Slot**: Wird automatisch hervorgehoben
- ✅ **Live Kamera-Stream**: Toggle zwischen Drucker-Bild und Live-Video-Stream
- ✅ **Kamera-Popup**: Klick auf Kamera öffnet großes More-Info Fenster
- ✅ **Chamber Light Control**: Licht-Button zum Ein/Ausschalten der Druckraum-Beleuchtung
- ✅ **Dynamisches Bild**: Drucker-Bild wird abgedunkelt wenn Licht aus ist
- ✅ **Interaktive Buttons**: Pause/Stop/Speed mit korrekter State-Logik
- ✅ **Temperatur-Overlays**: Nozzle, Bed, Chamber mit Ziel-Temperaturen
- ✅ **Fan-Geschwindigkeiten**: Part & Aux Fan Anzeige
- ✅ **Layer-Informationen**: Aktuelle Layer / Gesamt-Layer
- ✅ **Fortschrittsbalken**: Visueller Progress-Bar mit Prozent
- ✅ **Status-Indikator**: Farbiger Punkt (grün=pulsierend beim Drucken, gelb=pausiert, grau=idle)

**Konfiguration im Visual Editor:**

1. **Printer Device**: Wähle dein Bambu Lab Drucker-Gerät aus der Device-Liste
2. **AMS Device** (optional): Falls mehrere AMS vorhanden, wähle das gewünschte AMS-Gerät
3. **Name** (optional): Custom Name für die Karte
4. **Camera Entity** (optional): Camera Entity für Live-Stream
5. **Image** (optional): Pfad zum Drucker-Bild (`.png` oder `.jpg`)

**Automatische Entity-Erkennung:**

Die Karte erkennt automatisch alle relevanten Entities basierend auf dem Drucker-Gerät:

- **Print Status**: `print_status` Entity
- **Temperatures**: `nozzle_temp`, `bed_temp`, `chamber_temp` mit Ziel-Temperaturen
- **Fans**: `cooling_fan_speed` (Part Fan), `aux_fan_speed` (Aux Fan)
- **Progress**: `print_progress`, `remaining_time`, `current_layer`, `total_layers`
- **Chamber Light**: `chamber_light` Entity (wird automatisch erkannt)
- **Camera**: `camera` Entity (wird automatisch erkannt oder kann manuell gesetzt werden)
- **AMS Slots**: `tray_1`, `tray_2`, `tray_3`, `tray_4` Entities (via `translation_key`)

**AMS Daten:**

Die Karte liest AMS-Daten aus den Tray-Entities (`sensor.*_slot_1`, `sensor.*_slot_2`, etc.):

- **Filament Type**: Wird aus `attributes.name` oder `attributes.type` extrahiert (z.B. "Bambu PCTG Basic" → "PCTG")
- **Color**: `attributes.color` (wird automatisch von #RRGGBBAA zu #RRGGBB konvertiert)
- **Remaining**: `attributes.remain` (zeigt `?` wenn `remain_enabled: false`)
- **Active**: `attributes.active` oder `attributes.in_use`
- **Empty**: `attributes.empty` oder leere State

**Bild hochladen:**

Das Drucker-Bild muss manuell in Home Assistant hochgeladen werden:
1. Kopiere das Bild nach `/config/www/custom-components/images/prism-bambu-pic.png` (oder `.jpg`)
2. Oder verwende einen anderen Pfad und gib ihn im `image`-Feld an
3. Die Karte unterstützt sowohl `.png` als auch `.jpg` Formate
4. Als letzter Fallback wird ein Drucker-Icon angezeigt

**Interaktionen:**

- **Licht-Button**: Toggle Chamber Light an/aus (Button zeigt sofortigen Feedback)
- **Kamera-Button**: Wechselt zwischen Drucker-Bild und Live-Kamera-Stream
- **Kamera-Bild klicken**: Öffnet großes More-Info Popup (wie bei HA Bild-Entities)
- **Pause-Button**: Öffnet More-Info Dialog für Print-Status (nur aktiv wenn Drucker druckt/pausiert)

**ha-bambulab Integration:**
Die Karte ist kompatibel mit der [ha-bambulab Integration](https://github.com/greghesp/ha-bambulab) und arbeitet wie die [offiziellen Bambu Lab Cards](https://github.com/greghesp/ha-bambulab-cards).

---

### prism-creality

Eine Creality 3D-Drucker-Karte mit Glassmorphism-Design und vollständiger Anzeige von Druckfortschritt, Temperaturen, Lüfter, Layer-Infos. Unterstützt K1, K1C, K1 Max, K1 SE und weitere Creality Drucker.

<img width="400" alt="prism-creality" src="images/prism-creality.jpg" />

**Verwendung:**

**Basis-Konfiguration (Visual Editor):**
```yaml
- type: custom:prism-creality
  printer: <device_id>  # Creality Drucker-Gerät (z.B. aus Device-Registry)
  name: Creality Printer  # Optional: Custom Name
  image: /local/custom-components/images/prism-creality.webp  # Optional: Drucker-Bild
```

**Erweiterte Konfiguration (mit Kamera und Light):**
```yaml
- type: custom:prism-creality
  printer: <device_id>  # Creality Drucker-Gerät
  name: Creality K1 SE
  camera_entity: camera.creality_k1_se_camera  # Optional: Camera Entity
  light_switch: switch.creality_light  # Optional: Light Switch Entity
  image: /local/custom-components/images/prism-creality.webp  # Optional: .webp, .png oder .jpg
```

**Hinweis:** Die Karte verwendet die **Device-Registry** von Home Assistant und filtert automatisch alle relevanten Entities basierend auf dem ausgewählten Drucker-Gerät. Dies funktioniert mit der [Creality-Control Integration](https://github.com/SiloCityLabs/Creality-Control).

**Features:**
- ✅ **Auto-Entity-Erkennung**: Automatische Erkennung von Light Switch und Camera Entities
- ✅ **Live Kamera-Stream**: Toggle zwischen Drucker-Bild und Live-Video-Stream
- ✅ **Kamera-Popup**: Klick auf Kamera öffnet großes More-Info Fenster
- ✅ **Light Control**: Licht-Button zum Ein/Ausschalten der Drucker-Beleuchtung
- ✅ **Dynamisches Bild**: Drucker-Bild wird abgedunkelt wenn Licht aus ist
- ✅ **Interaktive Buttons**: Pause/Resume, Stop, Home All Axes mit korrekter State-Logik
- ✅ **Temperatur-Overlays**: Nozzle, Bed, Box/Chamber mit Ziel-Temperaturen
- ✅ **Fan-Geschwindigkeiten**: Model Fan, Auxiliary Fan, Case Fan Anzeige
- ✅ **Layer-Informationen**: Aktuelle Layer / Gesamt-Layer
- ✅ **Fortschrittsbalken**: Visueller Progress-Bar mit Prozent
- ✅ **Status-Indikator**: Farbiger Punkt (grün=pulsierend beim Drucken, gelb=pausiert, grau=idle)
- ✅ **Power Switch**: Optionaler Power-Button (grün=an, grau/rot=aus)

**Konfiguration im Visual Editor:**

1. **Printer Device**: Wähle dein Creality Drucker-Gerät aus der Device-Liste
2. **Name** (optional): Custom Name für die Karte
3. **Camera Entity** (optional): Camera Entity für Live-Stream (wird auch auto-erkannt)
4. **Light Switch** (optional): Light/Switch Entity für Beleuchtung (wird auch auto-erkannt)
5. **Image** (optional): Pfad zum Drucker-Bild (`.webp`, `.png` oder `.jpg`)

**Automatische Entity-Erkennung:**

Die Karte erkennt automatisch alle relevanten Entities basierend auf dem Drucker-Gerät:

- **Print Status**: `print_state` oder `device_state` Entity
- **Temperatures**: `nozzle_temp`, `bed_temp`, `box_temp` mit Ziel-Temperaturen
- **Fans**: `model_fan_pct`, `auxiliary_fan_pct`, `case_fan_pct`
- **Progress**: `print_progress`, `time_left`, `current_layer`, `total_layer`
- **Light Switch**: `switch.creality_light` (wird automatisch erkannt)
- **Camera**: `camera.creality_*_camera` (wird automatisch erkannt oder kann manuell gesetzt werden)

**Unterstützte Drucker-Modelle:**

- ✅ **K1, K1C, K1 Max, K1 SE** (FDM Drucker)
- ✅ **K2 Plus, K2 Pro** (FDM Drucker)
- ✅ **Halot Series** (Resin Drucker)
- ✅ Weitere Creality Drucker mit WebSocket-Support

**Creality-Control Integration:**
Die Karte ist kompatibel mit der [Creality-Control Integration](https://github.com/SiloCityLabs/Creality-Control) und nutzt alle verfügbaren Sensoren, Switches, Buttons und Camera Entities.

**Bild hochladen:**

Das Drucker-Bild muss manuell in Home Assistant hochgeladen werden:
1. Kopiere das Bild nach `/config/www/custom-components/images/prism-creality.webp` (oder `.png`/`.jpg`)
2. Oder verwende einen anderen Pfad und gib ihn im `image`-Feld an
3. Die Karte unterstützt `.webp`, `.png` und `.jpg` Formate
4. Als letzter Fallback wird ein Drucker-Icon angezeigt

**Interaktionen:**

- **Licht-Button**: Toggle Light an/aus (Button zeigt sofortigen Feedback)
- **Kamera-Button**: Wechselt zwischen Drucker-Bild und Live-Kamera-Stream
- **Kamera-Bild klicken**: Öffnet großes More-Info Popup (wie bei HA Bild-Entities)
- **Pause-Button**: Pause/Resume Print (nur aktiv wenn Drucker druckt/pausiert)
- **Stop-Button**: Stop Print (nur aktiv wenn Drucker druckt/pausiert)
- **Home-Button**: Home All Axes (nur aktiv wenn Drucker idle ist)
- **Power-Button**: Toggle Power Switch (wenn konfiguriert)

---

### prism-energy

Eine Energie-Flow-Karte mit Glassmorphism-Design zur Visualisierung von Solar-Erzeugung, Netz-Bezug/Einspeisung, Batterie-Speicher, Hausverbrauch und E-Auto-Ladung. Optimiert für die [OpenEMS/Fenecon Integration](https://github.com/Lamarqe/ha_openems).

<img width="400" alt="prism-energy" src="images/prism-energy.jpg" />

**Features:**
- ✅ **Animierte Energieflüsse**: Visualisiert den Energiefluss zwischen allen Komponenten
- ✅ **Solar-Produktion**: Zeigt aktuelle PV-Leistung mit Animation
- ✅ **Netz-Integration**: Bezug/Einspeisung mit farblicher Unterscheidung
- ✅ **Batterie-Speicher**: SOC-Anzeige mit dynamischem Icon und Lade/Entlade-Status
- ✅ **Hausverbrauch**: Aktuelle Verbrauchsleistung
- ✅ **E-Auto-Ladung** (optional): EV-Ladeleistung wenn konfiguriert
- ✅ **Autarkie-Badge** (optional): Zeigt Eigenverbrauchsquote
- ✅ **Details-Bereich**: Optionaler Statistik-Bereich mit Balken-Visualisierung
- ✅ **Visual Editor**: Vollständige Konfiguration über den Home Assistant UI Editor

---

#### Voraussetzungen

Diese Karte ist optimiert für die **[ha_openems Integration](https://github.com/Lamarqe/ha_openems)** (Fenecon FEMS / OpenEMS).

1. Installiere die Integration über HACS
2. Konfiguriere dein FEMS/OpenEMS System
3. Aktiviere die benötigten Entitäten (siehe unten)

---

#### Benötigte Entitäten finden

Nach Installation der ha_openems Integration findest du die Entitäten unter **Einstellungen → Geräte & Dienste → OpenEMS**.

**So findest du deine System-ID:**
- Deine Entitäten haben das Format: `sensor.<system_id>_sum_<channel>`
- Beispiel: `sensor.fems79420_sum_productionactivepower`
- Die System-ID ist der Teil vor `_sum` (z.B. `fems79420`)

**Benötigte Entitäten aktivieren:**

Gehe zu **Einstellungen → Geräte & Dienste → OpenEMS → X Entitäten** und aktiviere:

| Entität | Channel | Beschreibung |
|---------|---------|--------------|
| `sensor.<system>_sum_productionactivepower` | ProductionActivePower | ☀️ Solar-Produktion (Watt) |
| `sensor.<system>_sum_gridactivepower` | GridActivePower | 🔌 Netz-Leistung (Watt) |
| `sensor.<system>_sum_esssoc` | EssSoc | 🔋 Batterie-Ladezustand (%) |
| `sensor.<system>_sum_essdischargepower` | EssDischargePower | 🔋 Batterie-Leistung (Watt) |
| `sensor.<system>_sum_consumptionactivepower` | ConsumptionActivePower | 🏠 Hausverbrauch (Watt) |

**Optionale Entitäten:**

| Entität | Channel | Beschreibung |
|---------|---------|--------------|
| `sensor.<system>_evcs0_chargepower` | ChargePower | 🚗 E-Auto Ladeleistung (Watt) |

**Solar-Module (Charger) Entitäten:**

Wenn du mehrere Solar-Charger/Wechselrichter hast, kannst du diese einzeln anzeigen lassen:

| Entität | Channel | Beschreibung |
|---------|---------|--------------|
| `sensor.<system>_charger0_actualpower` | ActualPower | ☀️ Charger 0 Leistung (Watt) |
| `sensor.<system>_charger1_actualpower` | ActualPower | ☀️ Charger 1 Leistung (Watt) |
| `sensor.<system>_charger2_actualpower` | ActualPower | ☀️ Charger 2 Leistung (Watt) |
| `sensor.<system>_charger3_actualpower` | ActualPower | ☀️ Charger 3 Leistung (Watt) |

> 💡 **Tipp:** Die Charger-Nummern entsprechen den einzelnen Wechselrichtern/PV-Strings deines Systems. Konfiguriere diese in der Karte unter "Solar Module" und gib jedem einen sprechenden Namen (z.B. "Dach Süd", "Carport", etc.).

---

#### Autarkie-Sensor erstellen

> ⚠️ **Wichtig:** Die ha_openems Integration bietet **keine direkte Autarkie-Entität**. Du musst einen Template-Sensor erstellen!

**Methode 1: Über die Home Assistant UI (empfohlen, ab HA 2023.3)**

1. Gehe zu **Einstellungen → Geräte & Dienste → Helfer**
2. Klicke auf **Helfer erstellen** (unten rechts)
3. Wähle **Template** aus der Liste
4. Fülle die Felder aus:
   - **Name**: `Energie Autarkie`
   - **Einheit**: `%`
   - **Icon**: `mdi:leaf`
   - **Template**: Kopiere den folgenden Code (ersetze `DEINE_SYSTEM_ID` mit deiner System-ID):

```jinja2
{% set consumption = states('sensor.DEINE_SYSTEM_ID_sum_consumptionactivepower') | float(0) %}
{% set grid_import = states('sensor.DEINE_SYSTEM_ID_sum_gridactivepower') | float(0) %}
{% if consumption > 0 %}
  {% set grid_used = [grid_import, 0] | max %}
  {{ ((1 - (grid_used / consumption)) * 100) | round(0) }}
{% else %}
  100
{% endif %}
```

5. Klicke auf **Erstellen**

**Beispiel:** Wenn deine Entität `sensor.fems79420_sum_consumptionactivepower` heißt, dann ist deine System-ID `fems79420`. Ersetze also `DEINE_SYSTEM_ID` mit `fems79420`.

**Methode 2: Über configuration.yaml (für erfahrene Nutzer)**

Falls du lieber YAML verwendest, füge folgenden Code zu deiner `configuration.yaml` hinzu:

```yaml
template:
  - sensor:
      - name: "Energie Autarkie"
        unique_id: energy_autarky_percentage
        unit_of_measurement: "%"
        state_class: measurement
        icon: mdi:leaf
        state: >
          {% set consumption = states('sensor.DEINE_SYSTEM_ID_sum_consumptionactivepower') | float(0) %}
          {% set grid_import = states('sensor.DEINE_SYSTEM_ID_sum_gridactivepower') | float(0) %}
          {% if consumption > 0 %}
            {% set grid_used = [grid_import, 0] | max %}
            {{ ((1 - (grid_used / consumption)) * 100) | round(0) }}
          {% else %}
            100
          {% endif %}
```

**Ersetze `DEINE_SYSTEM_ID` mit deiner tatsächlichen System-ID!**

Nach dem Neustart von Home Assistant hast du `sensor.energie_autarkie` zur Verfügung.

**Autarkie-Formel:**
```
Autarkie = (1 - (Netzbezug / Verbrauch)) × 100%

Beispiele:
- Verbrauch 1000W, Netzbezug 200W → Autarkie = 80%
- Verbrauch 1000W, Netzbezug 0W   → Autarkie = 100%
- Bei Einspeisung (negativ)       → Autarkie = 100%
```

---

#### Karten-Konfiguration

**Verwendung (Visual Editor empfohlen):**

Die Karte kann vollständig über den Visual Editor konfiguriert werden. Suche einfach nach "Prism Energy" im Karten-Auswahl-Dialog.

**YAML-Konfiguration:**
```yaml
type: custom:prism-energy
name: Energy Monitor
solar_power: sensor.fems79420_sum_productionactivepower
grid_power: sensor.fems79420_sum_gridactivepower
battery_soc: sensor.fems79420_sum_esssoc
battery_power: sensor.fems79420_sum_essdischargepower
home_consumption: sensor.fems79420_sum_consumptionactivepower
ev_power: sensor.fems79420_evcs0_chargepower  # Optional - nur wenn E-Auto vorhanden
autarky: sensor.energie_autarkie  # Optional - Template-Sensor von oben
image: /hacsfiles/images/prism-energy-home.png
show_details: true
```

**Erweiterte Konfiguration mit Solar-Modulen:**
```yaml
type: custom:prism-energy
name: Energy Monitor
solar_power: sensor.fems79420_sum_productionactivepower
grid_power: sensor.fems79420_sum_gridactivepower
battery_soc: sensor.fems79420_sum_esssoc
battery_power: sensor.fems79420_sum_essdischargepower
home_consumption: sensor.fems79420_sum_consumptionactivepower
show_details: true
# Solar Module einzeln anzeigen (optional)
solar_module1: sensor.fems79420_charger0_actualpower
solar_module1_name: "Büro links"
solar_module2: sensor.fems79420_charger1_actualpower
solar_module2_name: "Büro rechts"
solar_module3: sensor.fems79420_charger2_actualpower
solar_module3_name: "Wohnhaus"
```

---

#### Konfigurationsoptionen

| Option | Typ | Pflicht | Beschreibung |
|--------|-----|---------|--------------|
| `name` | string | Nein | Kartenname (Standard: "Energy Monitor") |
| `solar_power` | entity | Ja | Solar-Produktions-Sensor (Gesamt) |
| `grid_power` | entity | Ja | Netz-Leistungs-Sensor (positiv=Bezug, negativ=Einspeisung) |
| `battery_soc` | entity | Ja | Batterie-Ladezustand in % |
| `battery_power` | entity | Ja | Batterie-Leistung (positiv=Entladung, negativ=Ladung) |
| `home_consumption` | entity | Ja | Hausverbrauchs-Sensor |
| `ev_power` | entity | Nein | E-Auto Ladeleistung (wenn nicht gesetzt, wird EV nicht angezeigt) |
| `autarky` | entity | Nein | Autarkie-Prozent (wenn nicht gesetzt, wird Badge nicht angezeigt) |
| `image` | string | Nein | Pfad zum Haus-Bild (Standard: prism-energy-home.png) |
| `show_details` | boolean | Nein | Details-Bereich unten anzeigen (Standard: true) |
| **Solar Module** | | | *Optionale Einzelanzeige der Solar-Charger im Detail-Bereich* |
| `solar_module1` | entity | Nein | Solar Charger 1 Entity (z.B. `charger0_actualpower`) |
| `solar_module1_name` | string | Nein | Name für Modul 1 (z.B. "Büro links") |
| `solar_module2` | entity | Nein | Solar Charger 2 Entity |
| `solar_module2_name` | string | Nein | Name für Modul 2 (z.B. "Büro rechts") |
| `solar_module3` | entity | Nein | Solar Charger 3 Entity |
| `solar_module3_name` | string | Nein | Name für Modul 3 (z.B. "Wohnhaus") |
| `solar_module4` | entity | Nein | Solar Charger 4 Entity |
| `solar_module4_name` | string | Nein | Name für Modul 4 |

---

#### Energiefluss-Logik

Die animierten Linien werden basierend auf folgenden Bedingungen angezeigt:

| Flow | Bedingung | Farbe |
|------|-----------|-------|
| Solar → Haus | Solar > 50W UND Verbrauch > 0 | 🟡 Gelb/Orange |
| Solar → Batterie | Solar > 50W UND Batterie lädt | 🟡 Gelb/Orange |
| Solar → Netz | Solar > 50W UND Einspeisung | 🟡 Gelb/Orange |
| Netz → Haus | Netzbezug > 50W | 🔵 Blau |
| Netz → Batterie | Netzbezug > 50W UND Batterie lädt | 🔵 Blau |
| Batterie → Haus | Batterie entlädt > 50W | 🟢 Grün |
| Batterie → Netz | Batterie entlädt UND Einspeisung | 🟢 Grün |

---

#### Bild anpassen

Das Standard-Bild ist bereits enthalten. Du kannst aber auch ein eigenes Bild verwenden:

**HACS-Installation:**
```
/hacsfiles/images/prism-energy-home.png
```

**Manuelle Installation:**
```
/local/custom-components/images/prism-energy-home.png
```

**Eigenes Bild:**
1. Lade dein Bild nach `/config/www/` hoch
2. Verwende den Pfad `/local/dein-bild.png` in der Konfiguration

---

### prism-sidebar

Eine vollflächige Sidebar-Karte mit Kamera, Uhr, Kalender, Wetter-Forecast und Energie-Übersicht – ideal für Grid-Layouts mit eigener `sidebar`-Spalte.

<img width="300" alt="prism-sidebar" src="images/prism-sidebar.png" />

**Verwendung (Beispiel mit Grid-Layout):**
```yaml
type: custom:prism-sidebar
camera_entity: camera.garden_main
camera_entity_2: camera.front_door  # Optional: Zweite Kamera
camera_entity_3: camera.backyard    # Optional: Dritte Kamera
rotation_interval: 10               # Optional: Rotationsintervall in Sekunden (3-60, Standard: 10)
weather_entity: weather.home
grid_entity: sensor.power_grid
solar_entity: sensor.power_solar
home_entity: sensor.power_home
calendar_entity: calendar.termine
```

**Hinweis:** Wenn mehrere Kameras konfiguriert sind, rotieren sie automatisch durch. Das Rotationsintervall kann zwischen 3 und 60 Sekunden eingestellt werden.

---

### prism-sidebar-light

Light Theme Version der Sidebar-Karte mit hellem Glassmorphism-Design.

<img width="300" alt="prism-sidebar-light" src="images/prism-sidebar.png" />

**Verwendung:**
```yaml
type: custom:prism-sidebar-light
camera_entity: camera.garden_main
camera_entity_2: camera.front_door  # Optional: Zweite Kamera
camera_entity_3: camera.backyard    # Optional: Dritte Kamera
rotation_interval: 10               # Optional: Rotationsintervall in Sekunden (3-60, Standard: 10)
weather_entity: weather.home
grid_entity: sensor.power_grid
solar_entity: sensor.power_solar
home_entity: sensor.power_home
calendar_entity: calendar.termine
```

**Hinweis:** Wenn mehrere Kameras konfiguriert sind, rotieren sie automatisch durch. Das Rotationsintervall kann zwischen 3 und 60 Sekunden eingestellt werden.

---

## Layout Components

### navigation-bar

<img width="600" alt="navigation-bar" src="https://github.com/user-attachments/assets/8a2d9c3c-fa29-4fee-a9a7-068b8459e351" />

### sidebar

<img width="300" alt="sidebar" src="https://github.com/user-attachments/assets/0bca6980-e4d2-463c-9073-692f0c626945" />
