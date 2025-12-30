/**
 * Prism Energy Card
 * A glassmorphism energy flow card for Home Assistant
 * Designed for OpenEMS/Fenecon integration
 * 
 * Features:
 * - Animated energy flow visualization
 * - Weather effects (rain, snow, fog, sun, moon, stars)
 * - Day/Night transitions with house dimming
 * - Sunrise/Sunset effects
 * 
 * @version 1.2.1
 * @author BangerTech
 */

class PrismEnergyCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
    this._animationFrame = null;
  }

  static getStubConfig() {
    return {
      name: "Energy Monitor",
      solar_power: "",
      grid_power: "",
      battery_soc: "",
      battery_power: "",
      home_consumption: "",
      ev_power: "",
      autarky: "",
      image: "/local/custom-components/images/prism-energy-home.png",
      max_solar_power: 10000,
      max_grid_power: 10000,
      max_consumption: 10000,
      // Weather effects (optional)
      enable_weather_effects: false,
      weather_entity: "",
      cloud_coverage_entity: "",
      // Solar modules (optional)
      solar_module1: "",
      solar_module1_name: "",
      solar_module2: "",
      solar_module2_name: "",
      solar_module3: "",
      solar_module3_name: "",
      solar_module4: "",
      solar_module4_name: "",
      // Pill positions (optional - in percent)
      solar_pill_top: 22,
      solar_pill_left: 52,
      grid_pill_top: 32,
      grid_pill_left: 18,
      home_pill_top: 54,
      home_pill_left: 55,
      battery_pill_top: 60,
      battery_pill_left: 88,
      ev_pill_top: 72,
      ev_pill_left: 22
    };
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "name",
          label: "Card Name",
          selector: { text: {} }
        },
        {
          name: "image",
          label: "Image URL (default: prism-energy-home.png)",
          selector: { text: {} }
        },
        {
          name: "show_details",
          label: "Show details section at bottom",
          selector: { boolean: {} }
        },
        {
          name: "",
          type: "divider"
        },
        {
          name: "solar_power",
          label: "Solar Power (Total)",
          required: true,
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "grid_power",
          label: "Grid Power (positive=import, negative=export)",
          required: true,
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "battery_soc",
          label: "Battery SOC %",
          required: true,
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "battery_power",
          label: "Battery Power (positive=discharge, negative=charge)",
          required: true,
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "home_consumption",
          label: "Home Consumption",
          required: true,
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "ev_power",
          label: "EV Charging Power (optional)",
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "autarky",
          label: "Autarky % (optional)",
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "",
          type: "divider"
        },
        {
          type: "expandable",
          name: "",
          title: "🌤️ Weather & Day/Night Animation",
          schema: [
            {
              name: "enable_weather_effects",
              label: "Enable weather effects",
              selector: { boolean: {} }
            },
            {
              name: "weather_entity",
              label: "Weather Entity (e.g. weather.home)",
              selector: { entity: { domain: "weather" } }
            },
            {
              name: "cloud_coverage_entity",
              label: "Cloud Coverage Sensor (optional, e.g. sensor.openweathermap_cloud_coverage)",
              selector: { entity: { domain: "sensor" } }
            }
          ]
        },
        {
          type: "expandable",
          name: "",
          title: "📊 Maximum Values for Progress Bars",
          schema: [
            {
              name: "max_solar_power",
              label: "Max Solar Power (Watts) - e.g. 10000 for 10kW",
              selector: { number: { min: 1000, max: 100000, step: 100, mode: "box", unit_of_measurement: "W" } }
            },
            {
              name: "max_grid_power",
              label: "Max Grid Power (Watts)",
              selector: { number: { min: 1000, max: 100000, step: 100, mode: "box", unit_of_measurement: "W" } }
            },
            {
              name: "max_consumption",
              label: "Max Consumption (Watts)",
              selector: { number: { min: 1000, max: 100000, step: 100, mode: "box", unit_of_measurement: "W" } }
            }
          ]
        },
        {
          type: "expandable",
          name: "",
          title: "☀️ Solar Modules (optional - for individual display)",
          schema: [
            {
              name: "solar_module1",
              label: "Solar Module 1 (Entity)",
              selector: { entity: { domain: "sensor" } }
            },
            {
              name: "solar_module1_name",
              label: "Module 1 Name (e.g. Roof East)",
              selector: { text: {} }
            },
            {
              name: "solar_module2",
              label: "Solar Module 2 (Entity)",
              selector: { entity: { domain: "sensor" } }
            },
            {
              name: "solar_module2_name",
              label: "Module 2 Name (e.g. Roof West)",
              selector: { text: {} }
            },
            {
              name: "solar_module3",
              label: "Solar Module 3 (Entity)",
              selector: { entity: { domain: "sensor" } }
            },
            {
              name: "solar_module3_name",
              label: "Module 3 Name (e.g. Garage)",
              selector: { text: {} }
            },
            {
              name: "solar_module4",
              label: "Solar Module 4 (Entity)",
              selector: { entity: { domain: "sensor" } }
            },
            {
              name: "solar_module4_name",
              label: "Module 4 Name",
              selector: { text: {} }
            }
          ]
        },
        {
          type: "expandable",
          name: "",
          title: "📍 Pill Positions (optional - in %)",
          schema: [
            {
              type: "grid",
              name: "",
              schema: [
                {
                  name: "solar_pill_top",
                  label: "☀️ Solar Top 22%",
                  selector: { number: { min: 0, max: 100, step: 1, mode: "box" } }
                },
                {
                  name: "solar_pill_left",
                  label: "☀️ Solar Left 52%",
                  selector: { number: { min: 0, max: 100, step: 1, mode: "box" } }
                }
              ]
            },
            {
              type: "grid",
              name: "",
              schema: [
                {
                  name: "grid_pill_top",
                  label: "⚡ Grid Top 32%",
                  selector: { number: { min: 0, max: 100, step: 1, mode: "box" } }
                },
                {
                  name: "grid_pill_left",
                  label: "⚡ Grid Left 18%",
                  selector: { number: { min: 0, max: 100, step: 1, mode: "box" } }
                }
              ]
            },
            {
              type: "grid",
              name: "",
              schema: [
                {
                  name: "home_pill_top",
                  label: "🏠 Home Top 54%",
                  selector: { number: { min: 0, max: 100, step: 1, mode: "box" } }
                },
                {
                  name: "home_pill_left",
                  label: "🏠 Home Left 55%",
                  selector: { number: { min: 0, max: 100, step: 1, mode: "box" } }
                }
              ]
            },
            {
              type: "grid",
              name: "",
              schema: [
                {
                  name: "battery_pill_top",
                  label: "🔋 Battery Top 60%",
                  selector: { number: { min: 0, max: 100, step: 1, mode: "box" } }
                },
                {
                  name: "battery_pill_left",
                  label: "🔋 Battery Left 88%",
                  selector: { number: { min: 0, max: 100, step: 1, mode: "box" } }
                }
              ]
            },
            {
              type: "grid",
              name: "",
              schema: [
                {
                  name: "ev_pill_top",
                  label: "🚗 EV Top 72%",
                  selector: { number: { min: 0, max: 100, step: 1, mode: "box" } }
                },
                {
                  name: "ev_pill_left",
                  label: "🚗 EV Left 22%",
                  selector: { number: { min: 0, max: 100, step: 1, mode: "box" } }
                }
              ]
            }
          ]
        }
      ]
    };
  }

  setConfig(config) {
    this._config = {
      name: config.name || "Energy Monitor",
      solar_power: config.solar_power || "",
      grid_power: config.grid_power || "",
      battery_soc: config.battery_soc || "",
      battery_power: config.battery_power || "",
      home_consumption: config.home_consumption || "",
      ev_power: config.ev_power || "",
      autarky: config.autarky || "",
      image: config.image || "/local/custom-components/images/prism-energy-home.png",
      show_details: config.show_details !== false,
      // Max values for progress bars (in Watts)
      max_solar_power: config.max_solar_power || 10000,
      max_grid_power: config.max_grid_power || 10000,
      max_consumption: config.max_consumption || 10000,
      // Weather effects
      enable_weather_effects: config.enable_weather_effects || false,
      weather_entity: config.weather_entity || "",
      cloud_coverage_entity: config.cloud_coverage_entity || "",
      // Solar modules
      solar_module1: config.solar_module1 || "",
      solar_module1_name: config.solar_module1_name || "Module 1",
      solar_module2: config.solar_module2 || "",
      solar_module2_name: config.solar_module2_name || "Module 2",
      solar_module3: config.solar_module3 || "",
      solar_module3_name: config.solar_module3_name || "Module 3",
      solar_module4: config.solar_module4 || "",
      solar_module4_name: config.solar_module4_name || "Module 4",
      // Pill positions (in percent) - default values match current layout
      solar_pill_top: config.solar_pill_top ?? 22,
      solar_pill_left: config.solar_pill_left ?? 52,
      grid_pill_top: config.grid_pill_top ?? 32,
      grid_pill_left: config.grid_pill_left ?? 18,
      home_pill_top: config.home_pill_top ?? 54,
      home_pill_left: config.home_pill_left ?? 55,
      battery_pill_top: config.battery_pill_top ?? 60,
      battery_pill_left: config.battery_pill_left ?? 88,
      ev_pill_top: config.ev_pill_top ?? 72,
      ev_pill_left: config.ev_pill_left ?? 22
    };
  }

  set hass(hass) {
    this._hass = hass;
    // Only do full render on first load, then just update values
    if (!this._initialized) {
      this.render();
      this._initialized = true;
    } else {
      this._updateValues();
      this._updateWeatherIfChanged();
    }
  }

  // Check if weather conditions changed and update only weather elements
  _updateWeatherIfChanged() {
    if (!this._config.enable_weather_effects || !this._config.weather_entity) return;
    
    const weatherData = this._getWeatherData();
    // Include cloud coverage in key (rounded to 10% steps to avoid too frequent updates)
    const cloudKey = weatherData.cloudCoverage !== null ? Math.round(weatherData.cloudCoverage / 10) * 10 : 'none';
    const weatherKey = `${weatherData.weatherType}-${weatherData.isNight}-${weatherData.isSunrise}-${weatherData.isSunset}-${cloudKey}`;
    
    // Only update if weather state changed
    if (this._lastWeatherKey === weatherKey) return;
    this._lastWeatherKey = weatherKey;
    
    // Update weather container
    const weatherContainer = this.shadowRoot.querySelector('.weather-container');
    if (weatherContainer) {
      weatherContainer.remove();
    }
    
    const visualContainer = this.shadowRoot.querySelector('.visual-container');
    if (visualContainer) {
      visualContainer.insertAdjacentHTML('afterbegin', this._renderWeatherEffects(weatherData));
      
      // Update night-mode classes
      const houseImg = this.shadowRoot.querySelector('.house-img');
      if (houseImg) {
        houseImg.classList.toggle('night-mode', weatherData.isNight);
      }
      visualContainer.classList.toggle('night-mode', weatherData.isNight);
    }
    
    // Update weather label in header
    const weatherStatus = this.shadowRoot.querySelector('.weather-status');
    if (weatherStatus) {
      const dayNightLabel = this._getDayNightLabel(weatherData.isNight);
      const weatherTypeLabel = this._getWeatherLabel(weatherData);
      weatherStatus.textContent = `${dayNightLabel} • ${weatherTypeLabel}`;
    }
  }

  // Update only the dynamic values without re-rendering (preserves animations)
  _updateValues() {
    if (!this.shadowRoot || !this._hass) return;

    // Use _getStateInWatts for power sensors to handle kW units (e.g. from evcc)
    const solarPower = this._getStateInWatts(this._config.solar_power, 0);
    const gridPower = this._getStateInWatts(this._config.grid_power, 0);
    const batterySoc = this._getState(this._config.battery_soc, 0); // SOC is percentage, not power
    const batteryPower = this._getStateInWatts(this._config.battery_power, 0);
    const homeConsumption = this._getStateInWatts(this._config.home_consumption, 0);
    const evPower = this._getStateInWatts(this._config.ev_power, 0);
    const autarky = this._getState(this._config.autarky, 0); // Autarky is percentage

    // Update pill values
    this._updateElement('.pill-solar .pill-val', this._formatPower(solarPower));
    this._updateElement('.pill-grid .pill-val', this._formatPower(gridPower));
    this._updateElement('.pill-home .pill-val', this._formatPower(homeConsumption));
    this._updateElement('.pill-battery .pill-val', `${Math.round(batterySoc)}%`);
    
    if (this._config.ev_power) {
      const isEvCharging = evPower > 50;
      this._updateElement('.pill-ev .pill-val', isEvCharging ? this._formatPower(evPower) : this._t('idle'));
    }
    
    if (this._config.autarky) {
      this._updateElement('.autarkie-text', `${Math.round(autarky)}%`);
    }

    // Update flow visibility
    this._updateFlows();
  }

  _updateElement(selector, value) {
    const el = this.shadowRoot.querySelector(selector);
    if (el && el.textContent !== value) {
      el.textContent = value;
    }
  }

  _updateFlows() {
    // Use _getStateInWatts for power sensors to handle kW units (e.g. from evcc)
    const solarPower = this._getStateInWatts(this._config.solar_power, 0);
    const gridPower = this._getStateInWatts(this._config.grid_power, 0);
    const batteryPower = this._getStateInWatts(this._config.battery_power, 0);
    const homeConsumption = this._getStateInWatts(this._config.home_consumption, 0);
    const evPower = this._getStateInWatts(this._config.ev_power, 0);

    const isSolarActive = solarPower > 50;
    const isGridImport = gridPower > 50;
    const isGridExport = gridPower < -50;
    const isBatteryCharging = batteryPower < -50;
    const isBatteryDischarging = batteryPower > 50;
    const isEvCharging = evPower > 50;
    const hasEV = !!this._config.ev_power;

    // Show/hide flow groups based on state
    this._setFlowVisibility('flow-solar-home', isSolarActive && homeConsumption > 0);
    this._setFlowVisibility('flow-solar-battery', isSolarActive && isBatteryCharging);
    this._setFlowVisibility('flow-solar-grid', isSolarActive && isGridExport);
    this._setFlowVisibility('flow-grid-home', isGridImport);
    this._setFlowVisibility('flow-grid-battery', isGridImport && isBatteryCharging);
    this._setFlowVisibility('flow-battery-home', isBatteryDischarging);
    this._setFlowVisibility('flow-battery-grid', isBatteryDischarging && isGridExport);
    
    if (hasEV) {
      this._setFlowVisibility('flow-solar-ev', isSolarActive && isEvCharging);
      this._setFlowVisibility('flow-grid-ev', isGridImport && isEvCharging);
      this._setFlowVisibility('flow-battery-ev', isBatteryDischarging && isEvCharging);
    }
  }

  _setFlowVisibility(className, visible) {
    const el = this.shadowRoot.querySelector(`.${className}`);
    if (el) {
      el.style.display = visible ? 'block' : 'none';
    }
  }

  getCardSize() {
    return 6;
  }

  connectedCallback() {
    this.render();
    this._setupEventListeners();
  }

  disconnectedCallback() {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
    }
  }

  // Open more-info dialog for an entity (shows history)
  _openMoreInfo(entityId) {
    if (!entityId || !this._hass) return;
    
    const event = new Event('hass-more-info', {
      bubbles: true,
      composed: true
    });
    event.detail = { entityId: entityId };
    this.dispatchEvent(event);
  }

  // Setup click event listeners for pills
  _setupEventListeners() {
    if (!this.shadowRoot) return;
    
    // Add click listeners to all pills with data-entity attribute
    this.shadowRoot.querySelectorAll('.pill[data-entity]').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const entityId = pill.getAttribute('data-entity');
        if (entityId) {
          this._openMoreInfo(entityId);
        }
      });
    });

    // Add click listener to house image (opens home consumption history)
    const houseImg = this.shadowRoot.querySelector('.house-img');
    if (houseImg && this._config.home_consumption) {
      houseImg.addEventListener('click', () => {
        this._openMoreInfo(this._config.home_consumption);
      });
    }
  }

  // Helper to get entity state
  _getState(entityId, defaultVal = 0) {
    if (!entityId || !this._hass) return defaultVal;
    const stateObj = this._hass.states[entityId];
    if (!stateObj) return defaultVal;
    const val = parseFloat(stateObj.state);
    return isNaN(val) ? defaultVal : val;
  }

  // Helper to get power entity state normalized to Watts
  // Handles entities that report in kW (like evcc) and converts them to W
  _getStateInWatts(entityId, defaultVal = 0) {
    if (!entityId || !this._hass) return defaultVal;
    const stateObj = this._hass.states[entityId];
    if (!stateObj) return defaultVal;
    const val = parseFloat(stateObj.state);
    if (isNaN(val)) return defaultVal;
    
    // Check unit of measurement and convert kW to W if needed
    const unit = stateObj.attributes?.unit_of_measurement?.toLowerCase() || '';
    if (unit === 'kw') {
      return val * 1000; // Convert kW to W
    }
    return val;
  }

  // Helper to format power values
  _formatPower(watts) {
    const absWatts = Math.abs(watts);
    if (absWatts >= 1000) {
      return `${(absWatts / 1000).toFixed(1)} kW`;
    }
    return `${Math.round(absWatts)} W`;
  }

  // Helper to render solar details (modules or total) - just the rows, bar is added externally
  _renderSolarDetails(totalPower, color) {
    // Check if any solar modules are configured
    const modules = [];
    if (this._config.solar_module1) {
      modules.push({
        entity: this._config.solar_module1,
        name: this._config.solar_module1_name || "Module 1"
      });
    }
    if (this._config.solar_module2) {
      modules.push({
        entity: this._config.solar_module2,
        name: this._config.solar_module2_name || "Module 2"
      });
    }
    if (this._config.solar_module3) {
      modules.push({
        entity: this._config.solar_module3,
        name: this._config.solar_module3_name || "Module 3"
      });
    }
    if (this._config.solar_module4) {
      modules.push({
        entity: this._config.solar_module4,
        name: this._config.solar_module4_name || "Module 4"
      });
    }

    // If modules are configured, show individual values
    if (modules.length > 0) {
      let html = '';
      modules.forEach(mod => {
        const power = this._getStateInWatts(mod.entity, 0);
        html += `
          <div class="detail-row">
            <span class="detail-label">${mod.name}</span>
            <span class="detail-val" style="color: ${color};">${this._formatPower(power)}</span>
          </div>
        `;
      });
      return html;
    }

    // Default: show total power only
    return `
      <div class="detail-row">
        <span class="detail-label">${this._t('power')}</span>
        <span class="detail-val" style="color: ${color};">${this._formatPower(totalPower)}</span>
      </div>
    `;
  }

  // Generate animated flow path with real SVG filter glow (CodePen style)
  _renderFlow(path, color, active, reverse = false, className = '') {
    const direction = reverse ? 'reverse' : '';
    const display = active ? 'block' : 'none';
    // Create unique filter ID based on color
    const filterId = `glow-${color.replace('#', '').replace(/[^a-zA-Z0-9]/g, '')}`;
    
    return `
      <g class="flow-group ${className}" style="display: ${display};">
        <!-- Background track (pulsing, async) -->
        <path d="${path}" fill="none" stroke="${color}" stroke-width="0.5" stroke-linecap="round" class="flow-track" />
        
        <!-- Glowing animated beam with SVG filter -->
        <path d="${path}" fill="none" stroke="${color}" stroke-width="1.2" stroke-opacity="0.9" stroke-linecap="round" 
              class="flow-beam ${direction}" filter="url(#strokeGlow)" />
        
        <!-- Bright core with soft edges -->
        <path d="${path}" fill="none" stroke="${color}" stroke-width="0.5" stroke-opacity="0.85" stroke-linecap="round" 
              class="flow-beam ${direction}" filter="url(#softEdge)" />
      </g>
    `;
  }

  // Get weather icon based on conditions
  _getWeatherIcon(weatherData) {
    if (!weatherData.enabled) return 'mdi:weather-sunny';
    
    const { weatherType, isNight } = weatherData;
    
    if (isNight) {
      if (weatherType === 'cloudy') return 'mdi:weather-night-partly-cloudy';
      if (weatherType === 'rainy') return 'mdi:weather-rainy';
      if (weatherType === 'snowy') return 'mdi:weather-snowy';
      if (weatherType === 'foggy') return 'mdi:weather-fog';
      if (weatherType === 'stormy') return 'mdi:weather-lightning';
      return 'mdi:weather-night';
    } else {
      if (weatherType === 'cloudy') return 'mdi:weather-partly-cloudy';
      if (weatherType === 'rainy') return 'mdi:weather-rainy';
      if (weatherType === 'snowy') return 'mdi:weather-snowy';
      if (weatherType === 'foggy') return 'mdi:weather-fog';
      if (weatherType === 'stormy') return 'mdi:weather-lightning';
      if (weatherType === 'windy') return 'mdi:weather-windy';
      return 'mdi:weather-sunny';
    }
  }

  // Get weather label for display (supports EN/DE based on HA language)
  _getWeatherLabel(weatherData) {
    if (!weatherData.enabled) return '';
    
    // Check Home Assistant language
    const lang = this._hass?.language || this._hass?.locale?.language || 'de';
    const isEnglish = lang.startsWith('en');
    
    const labels = isEnglish ? {
      'sunny': 'Sunny',
      'clear': 'Clear',
      'cloudy': 'Cloudy',
      'rainy': 'Rain',
      'snowy': 'Snow',
      'foggy': 'Fog',
      'stormy': 'Storm',
      'windy': 'Windy'
    } : {
      'sunny': 'Sonnig',
      'clear': 'Klar',
      'cloudy': 'Bewölkt',
      'rainy': 'Regen',
      'snowy': 'Schnee',
      'foggy': 'Nebel',
      'stormy': 'Gewitter',
      'windy': 'Windig'
    };
    
    return labels[weatherData.weatherType] || weatherData.weatherType;
  }

  // Get day/night label based on HA language
  _getDayNightLabel(isNight) {
    const lang = this._hass?.language || this._hass?.locale?.language || 'de';
    const isEnglish = lang.startsWith('en');
    
    if (isEnglish) {
      return isNight ? 'Night' : 'Day';
    }
    return isNight ? 'Nacht' : 'Tag';
  }

  // Translate UI labels based on HA language (card display only, not editor)
  _t(key) {
    const lang = this._hass?.language || this._hass?.locale?.language || 'de';
    const isEnglish = lang.startsWith('en');
    
    const translations = {
      // Pill labels
      'production': isEnglish ? 'Production' : 'Erzeugung',
      'inactive': isEnglish ? 'Inactive' : 'Inaktiv',
      'export': isEnglish ? 'Export' : 'Einspeisung',
      'import': isEnglish ? 'Import' : 'Bezug',
      'neutral': isEnglish ? 'Neutral' : 'Neutral',
      'consumption': isEnglish ? 'Consumption' : 'Verbrauch',
      'charging': isEnglish ? 'Charging' : 'Ladung',
      'discharging': isEnglish ? 'Discharging' : 'Entladung',
      'standby': isEnglish ? 'Standby' : 'Standby',
      'idle': isEnglish ? 'Idle' : 'Inaktiv',
      // Detail headers
      'grid': isEnglish ? 'Grid' : 'Netz',
      'storage': isEnglish ? 'Storage' : 'Speicher',
      'current': isEnglish ? 'Current' : 'Aktuell',
      // Detail labels
      'power': isEnglish ? 'Power' : 'Leistung',
      'autarky': isEnglish ? 'Autarky' : 'Autarkie',
      // Module defaults
      'module': isEnglish ? 'Module' : 'Modul',
      // Live indicator
      'live': isEnglish ? 'LIVE' : 'LIVE'
    };
    
    return translations[key] || key;
  }

  // Get weather data from Home Assistant
  _getWeatherData() {
    if (!this._config.enable_weather_effects || !this._config.weather_entity || !this._hass) {
      return { enabled: false };
    }

    // Get weather state
    const weatherState = this._hass.states[this._config.weather_entity];
    const weatherCondition = (weatherState?.state || 'clear').toLowerCase();

    // Get sun state for day/night
    const sunState = this._hass.states['sun.sun'];
    const isNight = sunState?.state === 'below_horizon';
    
    // Get sun elevation for sunrise/sunset effects
    const sunElevation = sunState?.attributes?.elevation || 0;
    const isSunrise = sunElevation > -10 && sunElevation < 10 && !isNight;
    const isSunset = sunElevation > -10 && sunElevation < 10 && isNight;

    // Map HA weather states to animation types
    let weatherType = 'clear';
    if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle') || weatherCondition.includes('shower')) {
      weatherType = 'rainy';
    } else if (weatherCondition.includes('snow') || weatherCondition.includes('sleet') || weatherCondition.includes('hail')) {
      weatherType = 'snowy';
    } else if (weatherCondition.includes('fog') || weatherCondition.includes('mist') || weatherCondition.includes('haze')) {
      weatherType = 'foggy';
    } else if (weatherCondition.includes('cloud') || weatherCondition.includes('overcast')) {
      weatherType = 'cloudy';
    } else if (weatherCondition.includes('clear') || weatherCondition.includes('sunny')) {
      weatherType = 'sunny';
    } else if (weatherCondition.includes('thunder') || weatherCondition.includes('lightning')) {
      weatherType = 'stormy';
    } else if (weatherCondition.includes('wind')) {
      weatherType = 'windy';
    }

    // Get cloud coverage from optional sensor (0-100%)
    let cloudCoverage = null;
    if (this._config.cloud_coverage_entity) {
      const cloudState = this._hass.states[this._config.cloud_coverage_entity];
      if (cloudState) {
        cloudCoverage = parseFloat(cloudState.state) || 0;
      }
    }

    return {
      enabled: true,
      weatherType,
      isNight,
      isSunrise,
      isSunset,
      condition: weatherCondition,
      cloudCoverage
    };
  }

  // Render weather effects HTML
  _renderWeatherEffects(weatherData) {
    if (!weatherData.enabled) return '';

    let html = '<div class="weather-container">';
    const { weatherType, isNight, isSunrise, isSunset } = weatherData;

    // Rain effect
    if (weatherType === 'rainy' || weatherType === 'stormy') {
      const dropCount = weatherType === 'stormy' ? 35 : 20;
      for (let i = 0; i < dropCount; i++) {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 0.6 + Math.random() * 0.4;
        const opacity = 0.3 + Math.random() * 0.4;
        html += `<div class="rain-drop" style="left: ${left}%; animation-delay: ${delay}s; animation-duration: ${duration}s; opacity: ${opacity};"></div>`;
      }
    }

    // Snow effect
    if (weatherType === 'snowy') {
      for (let i = 0; i < 40; i++) {
        const left = Math.random() * 100;
        const delay = Math.random() * 6;
        const duration = 4 + Math.random() * 6;
        const size = 2 + Math.random() * 4;
        const opacity = 0.4 + Math.random() * 0.4;
        html += `<div class="snow-flake" style="left: ${left}%; animation-delay: ${delay}s; animation-duration: ${duration}s; width: ${size}px; height: ${size}px; opacity: ${opacity};"></div>`;
      }
    }

    // Fog effect
    if (weatherType === 'foggy') {
      html += `<div class="fog-layer fog-1"></div>`;
      html += `<div class="fog-layer fog-2"></div>`;
      html += `<div class="fog-layer fog-3"></div>`;
    }

    // Lightning effect for storms
    if (weatherType === 'stormy') {
      html += `<div class="lightning"></div>`;
    }

    // Night effects: stars and moon
    if (isNight) {
      // Stars - only in top 15-20% of the card
      html += '<div class="stars-container">';
      for (let i = 0; i < 20; i++) {
        const left = Math.random() * 100;
        const top = Math.random() * 18; // Only top 18%
        const size = 1 + Math.random() * 1.5;
        const delay = Math.random() * 3;
        const brightness = 0.2 + Math.random() * 0.3; // More transparent (0.2-0.5)
        html += `<div class="star" style="left: ${left}%; top: ${top}%; width: ${size}px; height: ${size}px; animation-delay: ${delay}s; opacity: ${brightness};"></div>`;
      }
      html += '</div>';

      // Moon (only if not completely cloudy) - more subtle
      if (weatherType !== 'foggy' && weatherType !== 'stormy') {
        html += `
          <div class="moon">
            <div class="moon-crater c1"></div>
            <div class="moon-crater c2"></div>
            <div class="moon-crater c3"></div>
          </div>
        `;
      }
    } else {
      // Day effects: sun glow - more subtle
      if (weatherType === 'sunny' || weatherType === 'clear') {
        html += '<div class="sun-glow"></div>';
      }
    }

    // Sunrise/Sunset gradient overlay
    if (isSunrise) {
      html += '<div class="sunrise-overlay"></div>';
    } else if (isSunset) {
      html += '<div class="sunset-overlay"></div>';
    }

    // Clouds based on cloud coverage or weather type
    const cloudCoverage = weatherData.cloudCoverage;
    const showClouds = (weatherType === 'cloudy' || (cloudCoverage !== null && cloudCoverage > 0)) && 
                       weatherType !== 'foggy' && !isNight;
    
    if (showClouds) {
      // Determine cloud count based on coverage (if available) or default to all
      let staticCount = 3;
      let movingCount = 4;
      
      if (cloudCoverage !== null) {
        // Scale clouds based on coverage percentage
        if (cloudCoverage <= 20) {
          staticCount = 0; movingCount = 1;
        } else if (cloudCoverage <= 40) {
          staticCount = 1; movingCount = 1;
        } else if (cloudCoverage <= 55) {
          staticCount = 2; movingCount = 2;
        } else if (cloudCoverage <= 70) {
          staticCount = 2; movingCount = 3;
        } else if (cloudCoverage <= 85) {
          staticCount = 3; movingCount = 3;
        } else {
          staticCount = 3; movingCount = 4;
        }
      }
      
      html += '<!-- Clouds based on coverage -->';
      // Static clouds
      if (staticCount >= 1) html += '<div class="cloud cloud-static cloud-static-1"></div>';
      if (staticCount >= 2) html += '<div class="cloud cloud-static cloud-static-2"></div>';
      if (staticCount >= 3) html += '<div class="cloud cloud-static cloud-static-3"></div>';
      // Moving clouds
      if (movingCount >= 1) html += '<div class="cloud cloud-moving cloud-1"></div>';
      if (movingCount >= 2) html += '<div class="cloud cloud-moving cloud-2"></div>';
      if (movingCount >= 3) html += '<div class="cloud cloud-moving cloud-3"></div>';
      if (movingCount >= 4) html += '<div class="cloud cloud-moving cloud-4"></div>';
    }

    html += '</div>';
    return html;
  }

  // Get weather-related CSS styles
  _getWeatherStyles() {
    return `
      /* Weather Container - between house image and UI elements */
      .weather-container {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        overflow: hidden;
        border-radius: 24px;
      }

      /* Rain Animation */
      .rain-drop {
        position: absolute;
        width: 2px;
        height: 20px;
        background: linear-gradient(to bottom, transparent, rgba(174, 194, 224, 0.6), rgba(174, 194, 224, 0.8));
        top: -30px;
        border-radius: 0 0 2px 2px;
        animation: rain-fall linear infinite;
        filter: blur(0.5px);
      }
      @keyframes rain-fall {
        0% { top: -30px; opacity: 0; }
        5% { opacity: 1; }
        95% { opacity: 1; }
        100% { top: 100%; opacity: 0; }
      }

      /* Snow Animation */
      .snow-flake {
        position: absolute;
        background: radial-gradient(circle at 30% 30%, #ffffff, #e8e8e8);
        border-radius: 50%;
        top: -10px;
        filter: blur(0.5px);
        animation: snow-fall linear infinite;
        box-shadow: 0 0 4px rgba(255, 255, 255, 0.5);
      }
      @keyframes snow-fall {
        0% { 
          top: -10px; 
          transform: translateX(0) rotate(0deg); 
          opacity: 0; 
        }
        5% { opacity: 0.8; }
        50% { transform: translateX(25px) rotate(180deg); }
        95% { opacity: 0.8; }
        100% { 
          top: 100%; 
          transform: translateX(-25px) rotate(360deg); 
          opacity: 0; 
        }
      }

      /* Fog Animation */
      .fog-layer {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg, 
          transparent 0%, 
          rgba(200, 210, 220, 0.15) 20%, 
          rgba(200, 210, 220, 0.25) 50%, 
          rgba(200, 210, 220, 0.15) 80%, 
          transparent 100%
        );
        animation: fog-drift linear infinite;
        filter: blur(30px);
      }
      .fog-1 { animation-duration: 25s; }
      .fog-2 { animation-duration: 35s; animation-direction: reverse; opacity: 0.7; }
      .fog-3 { animation-duration: 45s; animation-delay: -10s; opacity: 0.5; top: 30%; }
      @keyframes fog-drift {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      /* Stars Animation - subtle, only in top area */
      .stars-container {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
      }
      .star {
        position: absolute;
        background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8), rgba(170, 204, 255, 0.5));
        border-radius: 50%;
        animation: star-twinkle 4s ease-in-out infinite;
        box-shadow: 0 0 3px rgba(255, 255, 255, 0.3);
      }
      @keyframes star-twinkle {
        0%, 100% { opacity: 0.2; transform: scale(0.9); }
        50% { opacity: 0.5; transform: scale(1.1); }
      }

      /* Moon - subtle and transparent, positioned below autarky badge */
      .moon {
        position: absolute;
        top: 50px;
        right: 60px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(245, 245, 245, 0.5) 0%, rgba(232, 232, 232, 0.4) 50%, rgba(208, 208, 208, 0.3) 100%);
        box-shadow: 
          0 0 15px rgba(255, 255, 255, 0.15),
          0 0 30px rgba(255, 255, 255, 0.08);
        z-index: 0;
        opacity: 0.6;
      }
      .moon-crater {
        position: absolute;
        background: radial-gradient(circle at 60% 40%, rgba(180, 180, 180, 0.3), rgba(160, 160, 160, 0.4));
        border-radius: 50%;
        box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.15);
      }
      .moon-crater.c1 { width: 10px; height: 10px; top: 6px; right: 8px; }
      .moon-crater.c2 { width: 6px; height: 6px; bottom: 10px; left: 10px; }
      .moon-crater.c3 { width: 5px; height: 5px; top: 16px; left: 6px; }

      /* Sun Glow - subtle, positioned in top area */
      .sun-glow {
        position: absolute;
        top: 50px;
        right: 100px;
        width: 150px;
        height: 150px;
        background: radial-gradient(
          circle at center,
          rgba(255, 200, 50, 0.2) 0%,
          rgba(255, 180, 50, 0.1) 30%,
          rgba(255, 160, 50, 0.05) 50%,
          transparent 70%
        );
        filter: blur(25px);
        z-index: 0;
        animation: sun-pulse 10s ease-in-out infinite;
      }
      @keyframes sun-pulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }

      /* Sunrise/Sunset Overlays - subtle gradients, below UI */
      .sunrise-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to top,
          rgba(255, 150, 80, 0.08) 0%,
          rgba(255, 180, 100, 0.05) 20%,
          transparent 50%
        );
        z-index: 0;
        pointer-events: none;
      }
      .sunset-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to top,
          rgba(255, 100, 50, 0.1) 0%,
          rgba(255, 80, 80, 0.08) 15%,
          rgba(180, 80, 120, 0.05) 35%,
          transparent 60%
        );
        z-index: 0;
        pointer-events: none;
      }

      /* Lightning Effect - below UI elements */
      .lightning {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0);
        animation: lightning-flash 8s infinite;
        z-index: 0;
        pointer-events: none;
      }
      @keyframes lightning-flash {
        0%, 89%, 91%, 93%, 100% { background: rgba(255, 255, 255, 0); }
        90%, 92% { background: rgba(255, 255, 255, 0.3); }
      }

      /* Clouds - subtle, only in top area, below UI */
      .cloud {
        position: absolute;
        background: linear-gradient(
          to bottom,
          rgba(255, 255, 255, 0.3) 0%,
          rgba(220, 220, 230, 0.2) 100%
        );
        border-radius: 50px;
        filter: blur(3px);
        z-index: 0;
      }
      .cloud::before, .cloud::after {
        content: '';
        position: absolute;
        background: inherit;
        border-radius: 50%;
      }
      .cloud-1 {
        width: 60px; height: 22px;
        top: 8%; left: -80px;
        animation-duration: 50s;
        opacity: 0.4;
      }
      .cloud-1::before { width: 30px; height: 30px; top: -15px; left: 12px; }
      .cloud-1::after { width: 35px; height: 35px; top: -18px; left: 28px; }
      .cloud-2 {
        width: 45px; height: 18px;
        top: 12%; left: -60px;
        animation-duration: 65s;
        animation-delay: -20s;
        opacity: 0.3;
      }
      .cloud-2::before { width: 22px; height: 22px; top: -12px; left: 8px; }
      .cloud-2::after { width: 28px; height: 28px; top: -14px; left: 20px; }
      .cloud-3 {
        width: 70px; height: 25px;
        top: 5%; left: -90px;
        animation-duration: 80s;
        animation-delay: -35s;
        opacity: 0.25;
      }
      .cloud-3::before { width: 35px; height: 35px; top: -18px; left: 15px; }
      .cloud-3::after { width: 42px; height: 42px; top: -22px; left: 35px; }
      .cloud-4 {
        width: 50px; height: 18px;
        top: 16%; left: -70px;
        animation-duration: 60s;
        animation-delay: -15s;
        opacity: 0.32;
      }
      .cloud-4::before { width: 25px; height: 25px; top: -12px; left: 10px; }
      .cloud-4::after { width: 30px; height: 30px; top: -15px; left: 24px; }
      
      /* Static clouds - gently float in place */
      .cloud-static {
        animation: cloud-float 8s ease-in-out infinite;
      }
      .cloud-static-1 {
        width: 55px; height: 20px;
        top: 15%; left: 25%;
        opacity: 0.35;
      }
      .cloud-static-1::before { width: 28px; height: 28px; top: -14px; left: 10px; }
      .cloud-static-1::after { width: 32px; height: 32px; top: -16px; left: 25px; }
      .cloud-static-2 {
        width: 48px; height: 18px;
        top: 11%; left: 60%;
        opacity: 0.3;
        animation-delay: -3s;
      }
      .cloud-static-2::before { width: 24px; height: 24px; top: -12px; left: 8px; }
      .cloud-static-2::after { width: 28px; height: 28px; top: -14px; left: 22px; }
      .cloud-static-3 {
        width: 42px; height: 16px;
        top: 18%; left: 45%;
        opacity: 0.28;
        animation-delay: -5s;
      }
      .cloud-static-3::before { width: 20px; height: 20px; top: -10px; left: 7px; }
      .cloud-static-3::after { width: 24px; height: 24px; top: -12px; left: 18px; }
      
      /* Moving clouds - use individual properties to not override duration/delay */
      .cloud-moving {
        animation-name: cloud-drift;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
      }
      
      @keyframes cloud-drift {
        0% { transform: translateX(0); }
        100% { transform: translateX(calc(100vw + 200px)); }
      }
      @keyframes cloud-float {
        0%, 100% { transform: translateX(0) translateY(0); }
        25% { transform: translateX(5px) translateY(-3px); }
        50% { transform: translateX(0) translateY(-5px); }
        75% { transform: translateX(-5px) translateY(-2px); }
      }

      /* Night mode house dimming */
      .house-img.night-mode {
        filter: drop-shadow(0 20px 40px rgba(0,0,0,0.5)) brightness(0.55) saturate(0.85);
        transition: filter 1s ease;
      }
      
      /* Night background adjustment - subtle darkening at top */
      .visual-container.night-mode {
        background: linear-gradient(
          to bottom,
          rgba(15, 23, 42, 0.2) 0%,
          transparent 40%
        );
      }
    `;
  }

  render() {
    if (!this.shadowRoot) return;

    // Get current values - use _getStateInWatts for power sensors to handle kW units (e.g. from evcc)
    const solarPower = this._getStateInWatts(this._config.solar_power, 0);
    const gridPower = this._getStateInWatts(this._config.grid_power, 0);
    const batterySoc = this._getState(this._config.battery_soc, 0); // SOC is percentage, not power
    const batteryPower = this._getStateInWatts(this._config.battery_power, 0);
    const homeConsumption = this._getStateInWatts(this._config.home_consumption, 0);
    const evPower = this._getStateInWatts(this._config.ev_power, 0);
    const autarky = this._getState(this._config.autarky, 0); // Autarky is percentage
    
    const hasEV = !!this._config.ev_power;
    const hasAutarky = !!this._config.autarky;
    const houseImg = this._config.image;
    
    // Get weather data
    const weatherData = this._getWeatherData();

    // Determine flow states
    // OpenEMS: GridActivePower positive = import, negative = export
    // OpenEMS: EssDischargePower positive = discharge, negative = charge
    const isSolarActive = solarPower > 50;
    const isGridImport = gridPower > 50;
    const isGridExport = gridPower < -50;
    const isBatteryCharging = batteryPower < -50;
    const isBatteryDischarging = batteryPower > 50;
    const isEvCharging = evPower > 50;

    // Battery icon based on SOC
    let batteryIcon = "mdi:battery";
    if (batterySoc >= 90) batteryIcon = "mdi:battery";
    else if (batterySoc >= 70) batteryIcon = "mdi:battery-80";
    else if (batterySoc >= 50) batteryIcon = "mdi:battery-60";
    else if (batterySoc >= 30) batteryIcon = "mdi:battery-40";
    else if (batterySoc >= 10) batteryIcon = "mdi:battery-20";
    else batteryIcon = "mdi:battery-outline";
    
    if (isBatteryCharging) batteryIcon = "mdi:battery-charging";

    // Get pill positions from config (with defaults)
    const pillPos = {
      solar: { x: this._config.solar_pill_left, y: this._config.solar_pill_top },
      grid: { x: this._config.grid_pill_left, y: this._config.grid_pill_top },
      home: { x: this._config.home_pill_left, y: this._config.home_pill_top },
      battery: { x: this._config.battery_pill_left, y: this._config.battery_pill_top },
      ev: { x: this._config.ev_pill_left, y: this._config.ev_pill_top }
    };

    // Helper to calculate control point for smooth curves
    const midPoint = (p1, p2) => ({
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    });

    // SVG Paths for energy flows (dynamically calculated based on pill positions)
    const paths = {
      // Solar flows from top (roof area)
      solarToHome: `M ${pillPos.solar.x} ${pillPos.solar.y} Q ${midPoint(pillPos.solar, pillPos.home).x + 1} ${midPoint(pillPos.solar, pillPos.home).y} ${pillPos.home.x} ${pillPos.home.y}`,
      solarToBattery: `M ${pillPos.solar.x} ${pillPos.solar.y} Q ${midPoint(pillPos.solar, pillPos.battery).x} ${midPoint(pillPos.solar, pillPos.battery).y} ${pillPos.battery.x} ${pillPos.battery.y}`,
      solarToGrid: `M ${pillPos.solar.x} ${pillPos.solar.y} Q ${midPoint(pillPos.solar, pillPos.grid).x} ${midPoint(pillPos.solar, pillPos.grid).y} ${pillPos.grid.x} ${pillPos.grid.y}`,
      solarToEv: `M ${pillPos.solar.x} ${pillPos.solar.y} Q ${midPoint(pillPos.solar, pillPos.ev).x} ${midPoint(pillPos.solar, pillPos.ev).y} ${pillPos.ev.x} ${pillPos.ev.y}`,
      
      // Grid flows from left (power pole)
      gridToHome: `M ${pillPos.grid.x} ${pillPos.grid.y} Q ${midPoint(pillPos.grid, pillPos.home).x} ${midPoint(pillPos.grid, pillPos.home).y} ${pillPos.home.x} ${pillPos.home.y}`,
      gridToBattery: `M ${pillPos.grid.x} ${pillPos.grid.y} Q ${midPoint(pillPos.grid, pillPos.battery).x} ${midPoint(pillPos.grid, pillPos.battery).y} ${pillPos.battery.x} ${pillPos.battery.y}`,
      gridToEv: `M ${pillPos.grid.x} ${pillPos.grid.y} Q ${midPoint(pillPos.grid, pillPos.ev).x} ${midPoint(pillPos.grid, pillPos.ev).y} ${pillPos.ev.x} ${pillPos.ev.y}`,
      
      // Battery flows from right (battery storage)
      batteryToHome: `M ${pillPos.battery.x} ${pillPos.battery.y} Q ${midPoint(pillPos.battery, pillPos.home).x} ${midPoint(pillPos.battery, pillPos.home).y} ${pillPos.home.x} ${pillPos.home.y}`,
      batteryToEv: `M ${pillPos.battery.x} ${pillPos.battery.y} Q ${midPoint(pillPos.battery, pillPos.ev).x} ${midPoint(pillPos.battery, pillPos.ev).y} ${pillPos.ev.x} ${pillPos.ev.y}`,
      batteryToGrid: `M ${pillPos.battery.x} ${pillPos.battery.y} Q ${midPoint(pillPos.battery, pillPos.grid).x} ${midPoint(pillPos.battery, pillPos.grid).y} ${pillPos.grid.x} ${pillPos.grid.y}`
    };

    // Colors
    const colors = {
      solar: '#F59E0B',
      grid: '#3B82F6',
      battery: '#10B981',
      home: '#8B5CF6',
      ev: '#EC4899'
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .card {
          position: relative;
          width: 100%;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: rgba(30, 32, 36, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3);
          color: white;
          box-sizing: border-box;
          user-select: none;
        }
        
        .noise {
          position: absolute;
          inset: 0;
          opacity: 0.02;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
        }

        /* Header - must be above weather animations */
        .header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 50;
          background: linear-gradient(to bottom, rgba(0,0,0,0.4), transparent);
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(245, 158, 11, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${colors.solar};
          border: 1px solid rgba(245, 158, 11, 0.25);
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.2), inset 0 0 10px rgba(245, 158, 11, 0.1);
        }
        
        .title-group h2 {
          font-size: 1.1rem;
          font-weight: 600;
          line-height: 1.2;
          margin: 0;
          color: rgba(255, 255, 255, 0.95);
        }
        
        .live-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
        }
        
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 2s ease-in-out infinite;
          box-shadow: 0 0 8px #22c55e;
        }
        
        .live-text {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #4ade80;
        }
        
        .weather-separator {
          margin: 0 6px;
          color: rgba(255, 255, 255, 0.3);
          font-size: 0.65rem;
        }
        
        .weather-status {
          font-size: 0.65rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.4);
        }
        
        .autarkie-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(12px);
        }
        
        .autarkie-text {
          font-size: 0.8rem;
          font-family: "SF Mono", "Monaco", "Inconsolata", monospace;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
        }

        /* Main Visual */
        .visual-container {
          position: relative;
          width: 100%;
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
          padding-top: 20px;
        }
        
        .house-img {
          width: 110%;
          max-width: none;
          object-fit: contain;
          margin-left: -1.5rem;
          margin-top: 1rem;
          z-index: 0;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.4));
        }
        
        .bottom-gradient {
          position: absolute;
          inset: auto 0 0 0;
          height: 8rem;
          background: linear-gradient(to top, rgba(30, 32, 36, 1), transparent);
          pointer-events: none;
          z-index: 5;
        }

        /* SVG Overlay */
        .svg-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10;
        }

        /* Animations */
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
        
        /* 
         * Smooth flow animation - simple dash moving along path
         * Like reference: https://www.mediaevent.de/wp-content/uploads/2021/06/schach-dashline-lineart.svg
         */
        @keyframes flow-animation {
          0% {
            stroke-dashoffset: 100;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        
        @keyframes flow-animation-reverse {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: 100;
          }
        }
        
        @keyframes track-pulse {
          0%, 100% {
            stroke-opacity: 0.18;
          }
          50% {
            stroke-opacity: 0.06;
          }
        }
        
        .flow-track {
          animation: track-pulse 2.2s ease-in-out infinite;
        }
        
        .flow-beam {
          stroke-dasharray: 25 75;
          animation: flow-animation 3s linear infinite;
        }
        
        .flow-beam.reverse {
          stroke-dasharray: 25 75;
          animation: flow-animation-reverse 3s linear infinite;
        }

        /* Data Pills - Inlet Style */
        .pill {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(20, 20, 20, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 999px;
          padding: 6px 10px 6px 6px;
          box-shadow: 
            inset 2px 2px 4px rgba(0, 0, 0, 0.6),
            inset -1px -1px 2px rgba(255, 255, 255, 0.03),
            0 4px 8px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-top: 1px solid rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 20;
          transform: translate(-50%, -50%);
          white-space: nowrap;
          transition: all 0.3s ease;
        }
        
        .pill:hover {
          transform: translate(-50%, -50%) scale(1.03);
        }
        
        .pill[data-entity] {
          cursor: pointer;
        }
        
        .pill[data-entity]:active {
          transform: translate(-50%, -50%) scale(0.97);
        }
        
        .house-img {
          cursor: pointer;
          transition: filter 0.2s ease;
        }
        
        .house-img:hover {
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.4)) brightness(1.05);
        }
        
        .pill-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .pill-icon ha-icon {
          --mdc-icon-size: 16px;
        }
        
        .pill-content {
          display: flex;
          flex-direction: column;
          line-height: 1;
          gap: 1px;
        }
        
        .pill-val {
          font-size: 0.8rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          font-family: "SF Mono", "Monaco", "Inconsolata", monospace;
        }
        
        .pill-label {
          font-size: 0.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.4);
        }

        /* Pill Icon Colors */
        .bg-solar {
          background: rgba(245, 158, 11, 0.15);
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
        }
        .color-solar { color: ${colors.solar}; }
        
        .bg-grid {
          background: rgba(59, 130, 246, 0.15);
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
        }
        .color-grid { color: ${colors.grid}; }
        
        .bg-battery {
          background: rgba(16, 185, 129, 0.15);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
        }
        .color-battery { color: ${colors.battery}; }
        
        .bg-home {
          background: rgba(139, 92, 246, 0.15);
          box-shadow: 0 0 8px rgba(139, 92, 246, 0.3);
        }
        .color-home { color: ${colors.home}; }
        
        .bg-ev {
          background: rgba(236, 72, 153, 0.15);
          box-shadow: 0 0 8px rgba(236, 72, 153, 0.3);
        }
        .color-ev { color: ${colors.ev}; }
        
        .bg-inactive {
          background: rgba(255, 255, 255, 0.03);
          box-shadow: none;
        }
        .color-inactive { color: rgba(255, 255, 255, 0.35); }

        /* Bottom Details */
        .details-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          padding: 20px 24px;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        @media (max-width: 600px) {
          .details-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .detail-col {
          display: flex;
          flex-direction: column;
          min-height: 90px;
        }
        
        .detail-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .detail-header {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
        }
        
        .detail-label {
          color: rgba(255, 255, 255, 0.6);
        }
        
        .detail-val {
          font-family: "SF Mono", "Monaco", "Inconsolata", monospace;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
        }
        
        /* Inlet-style progress bar - aligned at bottom */
        .detail-bar {
          height: 6px;
          width: 100%;
          border-radius: 999px;
          overflow: hidden;
          margin-top: auto;
          background: rgba(0, 0, 0, 0.4);
          box-shadow: 
            inset 1px 1px 3px rgba(0, 0, 0, 0.5),
            inset -1px -1px 2px rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.3);
        }
        
        .detail-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.5s ease;
          box-shadow: 0 0 6px currentColor;
        }

        ha-icon {
          --mdc-icon-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        ${this._getWeatherStyles()}
      </style>

      <div class="card">
        <div class="noise"></div>
        
        <!-- Header -->
        <div class="header">
          <div class="header-left">
            <div class="icon-circle">
              <ha-icon icon="mdi:solar-power-variant"></ha-icon>
            </div>
            <div class="title-group">
              <h2>${this._config.name}</h2>
              <div class="live-indicator">
                <div class="dot"></div>
                <span class="live-text">Live</span>
                ${weatherData.enabled ? `
                <span class="weather-separator">|</span>
                <span class="weather-status">${this._getDayNightLabel(weatherData.isNight)} • ${this._getWeatherLabel(weatherData)}</span>
                ` : ''}
              </div>
            </div>
          </div>
          ${hasAutarky ? `
          <div class="autarkie-badge">
            <ha-icon icon="mdi:leaf" style="color: #4ade80; --mdc-icon-size: 16px;"></ha-icon>
            <span class="autarkie-text">${Math.round(autarky)}%</span>
          </div>
          ` : ''}
        </div>

        <!-- Main Visual -->
        <div class="visual-container ${weatherData.enabled && weatherData.isNight ? 'night-mode' : ''}">
          ${weatherData.enabled ? this._renderWeatherEffects(weatherData) : ''}
          <img src="${houseImg}" class="house-img ${weatherData.enabled && weatherData.isNight ? 'night-mode' : ''}" alt="Energy Home" />
          <div class="bottom-gradient"></div>

          <!-- SVG Flows -->
          <svg class="svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
            <!-- Glow filter definition -->
            <defs>
              <!-- Stroke Glow Filter (soft edges) -->
              <filter id="strokeGlow" x="-100%" y="-100%" width="300%" height="300%" filterUnits="userSpaceOnUse">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur2" />
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="softCore" />
                <feMerge>
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="blur2" />
                  <feMergeNode in="softCore" />
                </feMerge>
              </filter>
              <!-- Soft Core Filter (minimal blur for smooth edges) -->
              <filter id="softEdge" x="-50%" y="-50%" width="200%" height="200%" filterUnits="userSpaceOnUse">
                <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" />
              </filter>
            </defs>
            
            <!-- Solar Flows -->
            ${this._renderFlow(paths.solarToHome, colors.solar, isSolarActive && homeConsumption > 0, false, 'flow-solar-home')}
            ${this._renderFlow(paths.solarToBattery, colors.solar, isSolarActive && isBatteryCharging, false, 'flow-solar-battery')}
            ${this._renderFlow(paths.solarToGrid, colors.solar, isSolarActive && isGridExport, false, 'flow-solar-grid')}
            ${hasEV ? this._renderFlow(paths.solarToEv, colors.solar, isSolarActive && isEvCharging, false, 'flow-solar-ev') : ''}

            <!-- Grid Flows -->
            ${this._renderFlow(paths.gridToHome, colors.grid, isGridImport, false, 'flow-grid-home')}
            ${this._renderFlow(paths.gridToBattery, colors.grid, isGridImport && isBatteryCharging, false, 'flow-grid-battery')}
            ${hasEV ? this._renderFlow(paths.gridToEv, colors.grid, isGridImport && isEvCharging, false, 'flow-grid-ev') : ''}

            <!-- Battery Flows -->
            ${this._renderFlow(paths.batteryToHome, colors.battery, isBatteryDischarging, false, 'flow-battery-home')}
            ${hasEV ? this._renderFlow(paths.batteryToEv, colors.battery, isBatteryDischarging && isEvCharging, false, 'flow-battery-ev') : ''}
            ${this._renderFlow(paths.batteryToGrid, colors.battery, isBatteryDischarging && isGridExport, false, 'flow-battery-grid')}
          </svg>

          <!-- Solar Pill (Top - Roof) - Clickable for history -->
          <div class="pill pill-solar" style="top: ${pillPos.solar.y}%; left: ${pillPos.solar.x}%;" data-entity="${this._config.solar_power}">
            <div class="pill-icon ${isSolarActive ? 'bg-solar' : 'bg-inactive'}">
              <ha-icon icon="mdi:solar-power" class="${isSolarActive ? 'color-solar' : 'color-inactive'}"></ha-icon>
            </div>
            <div class="pill-content">
              <span class="pill-val">${this._formatPower(solarPower)}</span>
              <span class="pill-label">${isSolarActive ? this._t('production') : this._t('inactive')}</span>
            </div>
          </div>

          <!-- Grid Pill (Left - Power Pole) - Clickable for history -->
          <div class="pill pill-grid" style="top: ${pillPos.grid.y}%; left: ${pillPos.grid.x}%;" data-entity="${this._config.grid_power}">
            <div class="pill-icon ${isGridImport || isGridExport ? 'bg-grid' : 'bg-inactive'}">
              <ha-icon icon="mdi:transmission-tower" class="${isGridImport || isGridExport ? 'color-grid' : 'color-inactive'}"></ha-icon>
            </div>
            <div class="pill-content">
              <span class="pill-val">${this._formatPower(gridPower)}</span>
              <span class="pill-label">${isGridExport ? this._t('export') : isGridImport ? this._t('import') : this._t('neutral')}</span>
            </div>
          </div>

          <!-- Home Pill (Center - House) - Clickable for history -->
          <div class="pill pill-home" style="top: ${pillPos.home.y}%; left: ${pillPos.home.x}%;" data-entity="${this._config.home_consumption}">
            <div class="pill-icon bg-home">
              <ha-icon icon="mdi:home-lightning-bolt" class="color-home"></ha-icon>
            </div>
            <div class="pill-content">
              <span class="pill-val">${this._formatPower(homeConsumption)}</span>
              <span class="pill-label">${this._t('consumption')}</span>
            </div>
          </div>

          <!-- Battery Pill (Right - Battery Storage) - Clickable for history -->
          <div class="pill pill-battery" style="top: ${pillPos.battery.y}%; left: ${pillPos.battery.x}%;" data-entity="${this._config.battery_soc}">
            <div class="pill-icon ${isBatteryCharging || isBatteryDischarging ? 'bg-battery' : 'bg-inactive'}">
              <ha-icon icon="${batteryIcon}" class="${isBatteryCharging || isBatteryDischarging ? 'color-battery' : 'color-inactive'}"></ha-icon>
            </div>
            <div class="pill-content">
              <span class="pill-val">${Math.round(batterySoc)}%</span>
              <span class="pill-label">${isBatteryCharging ? this._t('charging') : isBatteryDischarging ? this._t('discharging') : this._t('standby')}</span>
            </div>
          </div>

          <!-- EV Pill (Bottom Left - Carport) - Clickable for history -->
          ${hasEV ? `
          <div class="pill pill-ev" style="top: ${pillPos.ev.y}%; left: ${pillPos.ev.x}%;" data-entity="${this._config.ev_power}">
            <div class="pill-icon ${isEvCharging ? 'bg-ev' : 'bg-inactive'}">
              <ha-icon icon="mdi:car-electric" class="${isEvCharging ? 'color-ev' : 'color-inactive'}"></ha-icon>
            </div>
            <div class="pill-content">
              <span class="pill-val">${isEvCharging ? this._formatPower(evPower) : this._t('idle')}</span>
              <span class="pill-label">EV</span>
            </div>
          </div>
          ` : ''}
        </div>

        <!-- Bottom Details -->
        ${this._config.show_details ? `
        <div class="details-grid">
          <!-- Solar -->
          <div class="detail-col">
            <div class="detail-header">Solar</div>
            <div class="detail-content">
              ${this._renderSolarDetails(solarPower, colors.solar)}
            </div>
            <div class="detail-bar">
              <div class="detail-fill" style="width: ${Math.min(100, (solarPower / this._config.max_solar_power) * 100)}%; background: ${colors.solar};"></div>
            </div>
          </div>

          <!-- Grid -->
          <div class="detail-col">
            <div class="detail-header">${this._t('grid')}</div>
            <div class="detail-content">
              <div class="detail-row">
                <span class="detail-label">${isGridExport ? this._t('export') : this._t('import')}</span>
                <span class="detail-val" style="color: ${isGridExport ? colors.battery : '#ef4444'};">${this._formatPower(gridPower)}</span>
              </div>
            </div>
            <div class="detail-bar">
              <div class="detail-fill" style="width: ${Math.min(100, (Math.abs(gridPower) / this._config.max_grid_power) * 100)}%; background: ${isGridExport ? colors.battery : '#ef4444'};"></div>
            </div>
          </div>

          <!-- Consumption -->
          <div class="detail-col">
            <div class="detail-header">${this._t('consumption')}</div>
            <div class="detail-content">
              <div class="detail-row">
                <span class="detail-label">${this._t('current')}</span>
                <span class="detail-val">${this._formatPower(homeConsumption)}</span>
              </div>
            </div>
            <div class="detail-bar">
              <div class="detail-fill" style="width: ${Math.min(100, (homeConsumption / this._config.max_consumption) * 100)}%; background: ${colors.home};"></div>
            </div>
          </div>

          <!-- Storage -->
          <div class="detail-col">
            <div class="detail-header">${this._t('storage')}</div>
            <div class="detail-content">
              <div class="detail-row">
                <span class="detail-label">${this._t('power')}</span>
                <span class="detail-val">${this._formatPower(Math.abs(batteryPower))}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">SOC</span>
                <span class="detail-val" style="color: ${colors.battery};">${Math.round(batterySoc)}%</span>
              </div>
            </div>
            <div class="detail-bar">
              <div class="detail-fill" style="width: ${batterySoc}%; background: ${colors.battery};"></div>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    `;
    
    // Setup click event listeners after rendering
    this._setupEventListeners();
  }
}

// Register card component
customElements.define('prism-energy', PrismEnergyCard);

// Register with HACS / HA card picker
window.customCards = window.customCards || [];
window.customCards.push({
  type: "prism-energy",
  name: "Prism Energy",
  preview: true,
  description: "A glassmorphism energy flow card for OpenEMS/Fenecon systems"
});

console.info(
  `%c PRISM-ENERGY %c v1.2.1 %c kW/W Auto-Detection `,
  'background: #F59E0B; color: black; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;',
  'background: #1e2024; color: white; font-weight: bold; padding: 2px 6px;',
  'background: #3B82F6; color: white; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0;'
);

