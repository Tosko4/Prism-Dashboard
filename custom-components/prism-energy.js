/**
 * Prism Energy Card
 * A glassmorphism energy flow card for Home Assistant
 * Designed for OpenEMS/Fenecon integration
 * 
 * @version 1.0.0
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
      // Solar modules (optional)
      solar_module1: "",
      solar_module1_name: "",
      solar_module2: "",
      solar_module2_name: "",
      solar_module3: "",
      solar_module3_name: "",
      solar_module4: "",
      solar_module4_name: ""
    };
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "name",
          label: "Kartenname",
          selector: { text: {} }
        },
        {
          name: "image",
          label: "Bild-URL (Standard: prism-energy-home.png)",
          selector: { text: {} }
        },
        {
          name: "show_details",
          label: "Details-Bereich unten anzeigen",
          selector: { boolean: {} }
        },
        {
          name: "",
          type: "divider"
        },
        {
          name: "solar_power",
          label: "Solar Leistung (Gesamt)",
          required: true,
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "grid_power",
          label: "Netz Leistung (positiv=Bezug, negativ=Einspeisung)",
          required: true,
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "battery_soc",
          label: "Batterie SOC %",
          required: true,
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "battery_power",
          label: "Batterie Leistung (positiv=Entladung, negativ=Ladung)",
          required: true,
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "home_consumption",
          label: "Hausverbrauch",
          required: true,
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "ev_power",
          label: "E-Auto Ladeleistung (optional)",
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "autarky",
          label: "Autarkie % (optional)",
          selector: { entity: { domain: "sensor" } }
        },
        {
          name: "",
          type: "divider"
        },
        {
          type: "expandable",
          name: "",
          title: "📊 Maximalwerte für Fortschrittsbalken",
          schema: [
            {
              name: "max_solar_power",
              label: "Max. Solar-Leistung (Watt) - z.B. 10000 für 10kW",
              selector: { number: { min: 1000, max: 100000, step: 100, mode: "box", unit_of_measurement: "W" } }
            },
            {
              name: "max_grid_power",
              label: "Max. Netz-Leistung (Watt)",
              selector: { number: { min: 1000, max: 100000, step: 100, mode: "box", unit_of_measurement: "W" } }
            },
            {
              name: "max_consumption",
              label: "Max. Verbrauch (Watt)",
              selector: { number: { min: 1000, max: 100000, step: 100, mode: "box", unit_of_measurement: "W" } }
            }
          ]
        },
        {
          type: "expandable",
          name: "",
          title: "☀️ Solar Module (optional - für Einzelanzeige im Detail-Bereich)",
          schema: [
            {
              name: "solar_module1",
              label: "Solar Modul 1 (Entity)",
              selector: { entity: { domain: "sensor" } }
            },
            {
              name: "solar_module1_name",
              label: "Modul 1 Name (z.B. Büro links)",
              selector: { text: {} }
            },
            {
              name: "solar_module2",
              label: "Solar Modul 2 (Entity)",
              selector: { entity: { domain: "sensor" } }
            },
            {
              name: "solar_module2_name",
              label: "Modul 2 Name (z.B. Büro rechts)",
              selector: { text: {} }
            },
            {
              name: "solar_module3",
              label: "Solar Modul 3 (Entity)",
              selector: { entity: { domain: "sensor" } }
            },
            {
              name: "solar_module3_name",
              label: "Modul 3 Name (z.B. Wohnhaus)",
              selector: { text: {} }
            },
            {
              name: "solar_module4",
              label: "Solar Modul 4 (Entity)",
              selector: { entity: { domain: "sensor" } }
            },
            {
              name: "solar_module4_name",
              label: "Modul 4 Name",
              selector: { text: {} }
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
      // Solar modules
      solar_module1: config.solar_module1 || "",
      solar_module1_name: config.solar_module1_name || "Modul 1",
      solar_module2: config.solar_module2 || "",
      solar_module2_name: config.solar_module2_name || "Modul 2",
      solar_module3: config.solar_module3 || "",
      solar_module3_name: config.solar_module3_name || "Modul 3",
      solar_module4: config.solar_module4 || "",
      solar_module4_name: config.solar_module4_name || "Modul 4"
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
    }
  }

  // Update only the dynamic values without re-rendering (preserves animations)
  _updateValues() {
    if (!this.shadowRoot || !this._hass) return;

    const solarPower = this._getState(this._config.solar_power, 0);
    const gridPower = this._getState(this._config.grid_power, 0);
    const batterySoc = this._getState(this._config.battery_soc, 0);
    const batteryPower = this._getState(this._config.battery_power, 0);
    const homeConsumption = this._getState(this._config.home_consumption, 0);
    const evPower = this._getState(this._config.ev_power, 0);
    const autarky = this._getState(this._config.autarky, 0);

    // Update pill values
    this._updateElement('.pill-solar .pill-val', this._formatPower(solarPower));
    this._updateElement('.pill-grid .pill-val', this._formatPower(gridPower));
    this._updateElement('.pill-home .pill-val', this._formatPower(homeConsumption));
    this._updateElement('.pill-battery .pill-val', `${Math.round(batterySoc)}%`);
    
    if (this._config.ev_power) {
      const isEvCharging = evPower > 50;
      this._updateElement('.pill-ev .pill-val', isEvCharging ? this._formatPower(evPower) : 'Idle');
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
    const solarPower = this._getState(this._config.solar_power, 0);
    const gridPower = this._getState(this._config.grid_power, 0);
    const batteryPower = this._getState(this._config.battery_power, 0);
    const homeConsumption = this._getState(this._config.home_consumption, 0);
    const evPower = this._getState(this._config.ev_power, 0);

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
        name: this._config.solar_module1_name || "Modul 1"
      });
    }
    if (this._config.solar_module2) {
      modules.push({
        entity: this._config.solar_module2,
        name: this._config.solar_module2_name || "Modul 2"
      });
    }
    if (this._config.solar_module3) {
      modules.push({
        entity: this._config.solar_module3,
        name: this._config.solar_module3_name || "Modul 3"
      });
    }
    if (this._config.solar_module4) {
      modules.push({
        entity: this._config.solar_module4,
        name: this._config.solar_module4_name || "Modul 4"
      });
    }

    // If modules are configured, show individual values
    if (modules.length > 0) {
      let html = '';
      modules.forEach(mod => {
        const power = this._getState(mod.entity, 0);
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
        <span class="detail-label">Leistung</span>
        <span class="detail-val" style="color: ${color};">${this._formatPower(totalPower)}</span>
      </div>
    `;
  }

  // Generate animated flow path with "Fake Glow" - 3 layered paths instead of filters
  _renderFlow(path, color, active, reverse = false, className = '') {
    const direction = reverse ? 'reverse' : '';
    const display = active ? 'block' : 'none';
    
    return `
      <g class="flow-group ${className}" style="display: ${display};">
        <!-- Background track (always visible when flow is active) -->
        <path d="${path}" fill="none" stroke="${color}" stroke-width="0.6" stroke-opacity="0.15" stroke-linecap="round" />
        
        <!-- LAYER 1: Breiter, sehr transparenter Outer Glow -->
        <path d="${path}" fill="none" stroke="${color}" stroke-width="3" stroke-opacity="0.1" stroke-linecap="round" class="flow-beam ${direction}" />
        
        <!-- LAYER 2: Mittlerer Inner Glow -->
        <path d="${path}" fill="none" stroke="${color}" stroke-width="1.5" stroke-opacity="0.4" stroke-linecap="round" class="flow-beam ${direction}" />
        
        <!-- LAYER 3: Dünner, heller Kern -->
        <path d="${path}" fill="none" stroke="#ffffff" stroke-width="0.1" stroke-opacity="0.3" stroke-linecap="round" class="flow-beam ${direction}" />
      </g>
    `;
  }

  render() {
    if (!this.shadowRoot) return;

    // Get current values
    const solarPower = this._getState(this._config.solar_power, 0);
    const gridPower = this._getState(this._config.grid_power, 0);
    const batterySoc = this._getState(this._config.battery_soc, 0);
    const batteryPower = this._getState(this._config.battery_power, 0);
    const homeConsumption = this._getState(this._config.home_consumption, 0);
    const evPower = this._getState(this._config.ev_power, 0);
    const autarky = this._getState(this._config.autarky, 0);
    
    const hasEV = !!this._config.ev_power;
    const hasAutarky = !!this._config.autarky;
    const houseImg = this._config.image;

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

    // SVG Paths for energy flows (adjusted for the house image layout)
    const paths = {
      // Solar flows from top (roof area) - adjusted for pill positions
      solarToHome: "M 52 22 Q 53 40 55 54",
      solarToBattery: "M 52 22 Q 68 38 88 60",
      solarToGrid: "M 52 22 Q 35 27 18 32",
      solarToEv: "M 52 22 Q 38 48 22 72",
      
      // Grid flows from left (power pole)
      gridToHome: "M 18 32 Q 36 45 55 54",
      gridToBattery: "M 18 32 Q 52 48 88 60",
      gridToEv: "M 18 32 Q 20 52 22 72",
      
      // Battery flows from right (battery storage)
      batteryToHome: "M 88 60 Q 72 58 55 54",
      batteryToEv: "M 88 60 Q 55 68 22 72",
      batteryToGrid: "M 88 60 Q 52 48 18 32"
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

        /* Header */
        .header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 30;
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
        <div class="visual-container">
          <img src="${houseImg}" class="house-img" alt="Energy Home" />
          <div class="bottom-gradient"></div>

          <!-- SVG Flows -->
          <svg class="svg-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
            <!-- Glow filter definition -->
            <defs>
              <filter id="glow-filter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
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
          <div class="pill pill-solar" style="top: 22%; left: 52%;" data-entity="${this._config.solar_power}" title="Klicken für Historie">
            <div class="pill-icon ${isSolarActive ? 'bg-solar' : 'bg-inactive'}">
              <ha-icon icon="mdi:solar-power" class="${isSolarActive ? 'color-solar' : 'color-inactive'}"></ha-icon>
            </div>
            <div class="pill-content">
              <span class="pill-val">${this._formatPower(solarPower)}</span>
              <span class="pill-label">${isSolarActive ? 'Erzeugung' : 'Inaktiv'}</span>
            </div>
          </div>

          <!-- Grid Pill (Left - Power Pole) - Clickable for history -->
          <div class="pill pill-grid" style="top: 32%; left: 18%;" data-entity="${this._config.grid_power}" title="Klicken für Historie">
            <div class="pill-icon ${isGridImport || isGridExport ? 'bg-grid' : 'bg-inactive'}">
              <ha-icon icon="mdi:transmission-tower" class="${isGridImport || isGridExport ? 'color-grid' : 'color-inactive'}"></ha-icon>
            </div>
            <div class="pill-content">
              <span class="pill-val">${this._formatPower(gridPower)}</span>
              <span class="pill-label">${isGridExport ? 'Einspeisung' : isGridImport ? 'Bezug' : 'Neutral'}</span>
            </div>
          </div>

          <!-- Home Pill (Center - House) - Clickable for history -->
          <div class="pill pill-home" style="top: 54%; left: 55%;" data-entity="${this._config.home_consumption}" title="Klicken für Historie">
            <div class="pill-icon bg-home">
              <ha-icon icon="mdi:home-lightning-bolt" class="color-home"></ha-icon>
            </div>
            <div class="pill-content">
              <span class="pill-val">${this._formatPower(homeConsumption)}</span>
              <span class="pill-label">Verbrauch</span>
            </div>
          </div>

          <!-- Battery Pill (Right - Battery Storage) - Clickable for history -->
          <div class="pill pill-battery" style="top: 60%; left: 88%;" data-entity="${this._config.battery_soc}" title="Klicken für Historie">
            <div class="pill-icon ${isBatteryCharging || isBatteryDischarging ? 'bg-battery' : 'bg-inactive'}">
              <ha-icon icon="${batteryIcon}" class="${isBatteryCharging || isBatteryDischarging ? 'color-battery' : 'color-inactive'}"></ha-icon>
            </div>
            <div class="pill-content">
              <span class="pill-val">${Math.round(batterySoc)}%</span>
              <span class="pill-label">${isBatteryCharging ? 'Ladung' : isBatteryDischarging ? 'Entladung' : 'Standby'}</span>
            </div>
          </div>

          <!-- EV Pill (Bottom Left - Carport) - Clickable for history -->
          ${hasEV ? `
          <div class="pill pill-ev" style="top: 72%; left: 22%;" data-entity="${this._config.ev_power}" title="Klicken für Historie">
            <div class="pill-icon ${isEvCharging ? 'bg-ev' : 'bg-inactive'}">
              <ha-icon icon="mdi:car-electric" class="${isEvCharging ? 'color-ev' : 'color-inactive'}"></ha-icon>
            </div>
            <div class="pill-content">
              <span class="pill-val">${isEvCharging ? this._formatPower(evPower) : 'Idle'}</span>
              <span class="pill-label">Fahrzeug</span>
            </div>
          </div>
          ` : ''}
        </div>

        <!-- Bottom Details -->
        ${this._config.show_details ? `
        <div class="details-grid">
          <!-- Erzeugung -->
          <div class="detail-col">
            <div class="detail-header">Solar</div>
            <div class="detail-content">
              ${this._renderSolarDetails(solarPower, colors.solar)}
            </div>
            <div class="detail-bar">
              <div class="detail-fill" style="width: ${Math.min(100, (solarPower / this._config.max_solar_power) * 100)}%; background: ${colors.solar};"></div>
            </div>
          </div>

          <!-- Netz -->
          <div class="detail-col">
            <div class="detail-header">Netz</div>
            <div class="detail-content">
              <div class="detail-row">
                <span class="detail-label">${isGridExport ? 'Einspeisung' : 'Bezug'}</span>
                <span class="detail-val" style="color: ${isGridExport ? colors.battery : '#ef4444'};">${this._formatPower(gridPower)}</span>
              </div>
            </div>
            <div class="detail-bar">
              <div class="detail-fill" style="width: ${Math.min(100, (Math.abs(gridPower) / this._config.max_grid_power) * 100)}%; background: ${isGridExport ? colors.battery : '#ef4444'};"></div>
            </div>
          </div>

          <!-- Verbrauch -->
          <div class="detail-col">
            <div class="detail-header">Verbrauch</div>
            <div class="detail-content">
              <div class="detail-row">
                <span class="detail-label">Aktuell</span>
                <span class="detail-val">${this._formatPower(homeConsumption)}</span>
              </div>
            </div>
            <div class="detail-bar">
              <div class="detail-fill" style="width: ${Math.min(100, (homeConsumption / this._config.max_consumption) * 100)}%; background: ${colors.home};"></div>
            </div>
          </div>

          <!-- Speicher -->
          <div class="detail-col">
            <div class="detail-header">Speicher</div>
            <div class="detail-content">
              <div class="detail-row">
                <span class="detail-label">Leistung</span>
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
  `%c PRISM-ENERGY %c v1.0.0 `,
  'background: #F59E0B; color: black; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;',
  'background: #1e2024; color: white; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0;'
);

