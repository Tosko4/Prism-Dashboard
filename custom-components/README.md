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

### prism-sidebar

Eine vollflächige Sidebar-Karte mit Kamera, Uhr, Kalender, Wetter-Forecast und Energie-Übersicht – ideal für Grid-Layouts mit eigener `sidebar`-Spalte.

<img width="300" alt="prism-sidebar" src="images/prism-sidebar.png" />

**Verwendung (Beispiel mit Grid-Layout):**
```yaml
type: custom:prism-sidebar
camera_entity: camera.garden_main
weather_entity: weather.home
grid_entity: sensor.power_grid
solar_entity: sensor.power_solar
home_entity: sensor.power_home
calendar_entity: calendar.termine
```

---

### prism-sidebar-light

Light Theme Version der Sidebar-Karte mit hellem Glassmorphism-Design.

<img width="300" alt="prism-sidebar-light" src="images/prism-sidebar.png" />

**Verwendung:**
```yaml
type: custom:prism-sidebar-light
camera_entity: camera.garden_main
weather_entity: weather.home
grid_entity: sensor.power_grid
solar_entity: sensor.power_solar
home_entity: sensor.power_home
calendar_entity: calendar.termine
```

---

## Layout Components

### navigation-bar

<img width="600" alt="navigation-bar" src="https://github.com/user-attachments/assets/8a2d9c3c-fa29-4fee-a9a7-068b8459e351" />

### sidebar

<img width="300" alt="sidebar" src="https://github.com/user-attachments/assets/0bca6980-e4d2-463c-9073-692f0c626945" />
