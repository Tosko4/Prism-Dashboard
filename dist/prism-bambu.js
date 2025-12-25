// Bambu Lab Manufacturer and Models for device filtering
const BAMBU_MANUFACTURER = 'Bambu Lab';
const BAMBU_PRINTER_MODELS = [
  'A1', 'A1 MINI', 'A1 Mini', 'A1MINI', 'A1Mini', 'A1mini',
  'H2C', 'H2D', 'H2DPRO', 'H2S',
  'P1P', 'P1S', 'P2S',
  'X1', 'X1C', 'X1E'
];

// AMS Models
const BAMBU_AMS_MODELS = [
  'AMS', 'AMS Lite', 'AMS Hub'
];

// Entity keys to look for (based on translation_key from ha-bambulab)
const ENTITY_KEYS = [
  'aux_fan_speed', 'bed_temp', 'chamber_fan_speed', 'chamber_light', 'chamber_temp',
  'cooling_fan_speed', 'cover_image', 'current_layer', 'door_open', 'humidity',
  'nozzle_temp', 'power', 'print_progress', 'print_status', 'remaining_time',
  'speed_profile', 'stage', 'target_bed_temp', 'target_bed_temperature',
  'target_nozzle_temp', 'target_nozzle_temperature', 'total_layers', 'camera'
];

class PrismBambuCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.showCamera = false;
    this.hasRendered = false;
    this._deviceEntities = {}; // Cache for device entities
  }

  static getStubConfig() {
    return {
      printer: '',
      name: 'Bambu Lab Printer',
      camera_entity: '',
      image: '/local/custom-components/images/prism-bambu-pic.png'
    };
  }

  static getConfigForm() {
    // Build filter for printer device selector
    const printerFilterCombinations = BAMBU_PRINTER_MODELS.map(model => ({
      manufacturer: BAMBU_MANUFACTURER,
      model: model
    }));
    
    // Build filter for AMS device selector
    const amsFilterCombinations = BAMBU_AMS_MODELS.map(model => ({
      manufacturer: BAMBU_MANUFACTURER,
      model: model
    }));

    return {
      schema: [
        {
          name: 'printer',
          label: 'Bambu Lab Printer (select your printer device)',
          required: true,
          selector: { device: { filter: printerFilterCombinations } }
        },
        {
          name: 'ams_device',
          label: 'AMS Device (optional - select your AMS)',
          selector: { device: { filter: amsFilterCombinations } }
        },
        {
          name: 'name',
          label: 'Printer name (optional)',
          selector: { text: {} }
        },
        {
          name: 'camera_entity',
          label: 'Camera entity (optional - auto-detected if not set)',
          selector: { entity: { domain: 'camera' } }
        },
        {
          name: 'image',
          label: 'Printer image path (optional, supports .png and .jpg)',
          selector: { text: {} }
        }
      ]
    };
  }

  // Find all entities belonging to this device (like ha-bambulab-cards does)
  getBambuDeviceEntities() {
    if (!this._hass || !this.config?.printer) return {};
    
    const deviceId = this.config.printer;
    const result = {};
    
    // Loop through all hass entities and find those belonging to our device
    for (const entityId in this._hass.entities) {
      const entityInfo = this._hass.entities[entityId];
      
      if (entityInfo.device_id === deviceId) {
        // Check if this entity matches one of our known keys
        if (entityInfo.platform === 'bambu_lab') {
          const translationKey = entityInfo.translation_key;
          if (ENTITY_KEYS.includes(translationKey)) {
            result[translationKey] = {
              entity_id: entityId,
              ...entityInfo
            };
          }
          // Also store by simple name for easier access
          result[entityId] = entityInfo;
        }
      }
    }
    
    return result;
  }

  // Get entity state by translation key
  getEntityState(key) {
    const entityInfo = this._deviceEntities[key];
    if (!entityInfo?.entity_id) return null;
    const state = this._hass.states[entityInfo.entity_id];
    return state?.state ?? null;
  }

  // Get entity numeric value
  getEntityValue(key) {
    const state = this.getEntityState(key);
    return state ? parseFloat(state) || 0 : 0;
  }

  setConfig(config) {
    // Don't throw error if printer is empty - show preview instead
    this.config = { ...config };
    this._deviceEntities = {}; // Reset cache
    if (!this.hasRendered) {
      this.render();
      this.hasRendered = true;
      this.setupListeners();
    }
  }

  set hass(hass) {
    const firstTime = hass && !this._hass;
    this._hass = hass;
    
    // Cache device entities on first hass assignment or if empty (only if printer is configured)
    if (this.config?.printer && (firstTime || Object.keys(this._deviceEntities).length === 0)) {
      this._deviceEntities = this.getBambuDeviceEntities();
      console.log('Prism Bambu: Found device entities:', Object.keys(this._deviceEntities));
    }
    
    if (!this.hasRendered) {
      this.render();
      this.hasRendered = true;
      this.setupListeners();
    } else {
      // Only update values, don't re-render entire HTML
      this.updateValues();
    }
  }

  // Update only the values that change, without re-rendering the entire card
  updateValues() {
    if (!this.shadowRoot || !this._hass) return;
    
    const data = this.getPrinterData();
    
    // Update text values
    const updateText = (selector, value) => {
      const el = this.shadowRoot.querySelector(selector);
      if (el && el.textContent !== String(value)) {
        el.textContent = value;
      }
    };
    
    // Update progress bar
    const progressBar = this.shadowRoot.querySelector('.progress-bar-fill');
    if (progressBar) {
      progressBar.style.width = `${data.progress}%`;
    }
    
    const progressText = this.shadowRoot.querySelector('.progress-text');
    if (progressText) {
      progressText.textContent = `${Math.round(data.progress)}%`;
    }
    
    // Update title
    updateText('.title', data.name);
    
    // Update status
    updateText('.status-text', data.stateStr);
    
    // Update time left
    const timeValue = this.shadowRoot.querySelector('.stats-row .stat-value');
    if (timeValue) {
      timeValue.textContent = data.printTimeLeft;
    }
    
    // Update layer
    const layerValue = this.shadowRoot.querySelector('.stats-row .stat-value:last-of-type');
    if (layerValue) {
      layerValue.textContent = `${data.currentLayer} / ${data.totalLayers}`;
    }
    
    // Update temperatures and fans via pill values
    const pillValues = this.shadowRoot.querySelectorAll('.pill-value');
    if (pillValues.length >= 5) {
      pillValues[0].textContent = `${data.partFanSpeed}%`;
      pillValues[1].textContent = `${data.auxFanSpeed}%`;
      pillValues[2].textContent = `${Math.round(data.nozzleTemp)}°`;
      pillValues[3].textContent = `${Math.round(data.bedTemp)}°`;
      pillValues[4].textContent = `${Math.round(data.chamberTemp)}°`;
    }
    
    // Update target temps
    const pillLabels = this.shadowRoot.querySelectorAll('.overlay-right .pill-label');
    if (pillLabels.length >= 2) {
      pillLabels[0].textContent = `/${Math.round(data.targetNozzleTemp)}°`;
      pillLabels[1].textContent = `/${Math.round(data.targetBedTemp)}°`;
    }
  }

  connectedCallback() {
    if (this.config && !this.hasRendered) {
      this.render();
      this.hasRendered = true;
      this.setupListeners();
    }
  }

  disconnectedCallback() {
    // Cleanup if needed
  }

  setupListeners() {
    const viewToggle = this.shadowRoot?.querySelector('.view-toggle');
    if (viewToggle) {
      viewToggle.addEventListener('click', () => this.toggleView());
    }

    const pauseBtn = this.shadowRoot?.querySelector('.btn-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.handlePause());
    }

    const stopBtn = this.shadowRoot?.querySelector('.btn-stop');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.handleStop());
    }

    const speedBtn = this.shadowRoot?.querySelector('.btn-speed');
    if (speedBtn) {
      speedBtn.addEventListener('click', () => this.handleSpeed());
    }
    
    // Header light button
    const lightBtn = this.shadowRoot?.querySelector('.btn-light');
    if (lightBtn) {
      lightBtn.addEventListener('click', () => this.handleLightToggle());
    }
    
    // Header camera button
    const cameraBtn = this.shadowRoot?.querySelector('.btn-camera');
    if (cameraBtn) {
      cameraBtn.addEventListener('click', () => this.toggleView());
    }
  }

  toggleView() {
    this.showCamera = !this.showCamera;
    this.render();
  }

  handlePause() {
    if (!this._hass || !this._deviceEntities['print_status']) return;
    // Open more-info for the print status entity
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId: this._deviceEntities['print_status'].entity_id }
    });
    this.dispatchEvent(event);
  }

  handleStop() {
    if (!this._hass || !this._deviceEntities['print_status']) return;
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId: this._deviceEntities['print_status'].entity_id }
    });
    this.dispatchEvent(event);
  }

  handleSpeed() {
    if (!this._hass || !this._deviceEntities['speed_profile']) return;
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId: this._deviceEntities['speed_profile'].entity_id }
    });
    this.dispatchEvent(event);
  }
  
  handleLightToggle() {
    if (!this._hass || !this._deviceEntities['chamber_light']) return;
    const entityId = this._deviceEntities['chamber_light'].entity_id;
    this._hass.callService('light', 'toggle', { entity_id: entityId });
  }

  getPrinterData() {
    if (!this._hass || !this.config) {
      return this.getPreviewData();
    }

    // If no printer selected, show preview
    if (!this.config.printer) {
      return this.getPreviewData();
    }

    // If no device entities found, show preview
    if (Object.keys(this._deviceEntities).length === 0) {
      console.warn('Prism Bambu: No device entities found for device:', this.config.printer);
      return this.getPreviewData();
    }
    
    // Read values using translation keys (how ha-bambulab organizes entities)
    const progress = this.getEntityValue('print_progress');
    const stateStr = this.getEntityState('print_status') || this.getEntityState('stage') || 'unavailable';
    
    // Debug: Log the current status
    console.log('Prism Bambu: Current status:', stateStr, 'Progress:', progress);
    
    // Determine if printer is actively printing (support German status names too)
    const statusLower = stateStr.toLowerCase();
    const isPrinting = ['printing', 'prepare', 'running', 'druckt', 'vorbereiten'].includes(statusLower);
    const isPaused = ['paused', 'pause', 'pausiert'].includes(statusLower);
    const isIdle = !isPrinting && !isPaused; // Everything else is idle
    
    // Get remaining time - format it nicely (only if printing)
    const remainingTimeEntity = this._deviceEntities['remaining_time'];
    let printTimeLeft = '--';
    let printEndTime = '--:--';
    if (remainingTimeEntity?.entity_id && (isPrinting || isPaused)) {
      const state = this._hass.states[remainingTimeEntity.entity_id];
      if (state) {
        const minutes = parseFloat(state.state) || 0;
        if (minutes > 0) {
          const hours = Math.floor(minutes / 60);
          const mins = Math.round(minutes % 60);
          if (hours > 0) {
            printTimeLeft = `${hours}h ${mins}m`;
          } else {
            printTimeLeft = `${mins}m`;
          }
          // Calculate end time
          const endTime = new Date(Date.now() + minutes * 60 * 1000);
          printEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }
    }
    
    // Temperatures
    const nozzleTemp = this.getEntityValue('nozzle_temp');
    const targetNozzleTemp = this.getEntityValue('target_nozzle_temp') || this.getEntityValue('target_nozzle_temperature');
    const bedTemp = this.getEntityValue('bed_temp');
    const targetBedTemp = this.getEntityValue('target_bed_temp') || this.getEntityValue('target_bed_temperature');
    const chamberTemp = this.getEntityValue('chamber_temp');
    
    // Fans
    const partFanSpeed = this.getEntityValue('cooling_fan_speed');
    const auxFanSpeed = this.getEntityValue('aux_fan_speed');
    
    // Layer info (only show when printing)
    let currentLayer = 0;
    let totalLayers = 0;
    if (isPrinting || isPaused) {
      currentLayer = parseInt(this.getEntityState('current_layer')) || 0;
      totalLayers = parseInt(this.getEntityState('total_layers')) || 0;
    }
    
    // Chamber light state
    const chamberLightEntityInfo = this._deviceEntities['chamber_light'];
    const chamberLightEntityId = chamberLightEntityInfo?.entity_id;
    const chamberLightState = chamberLightEntityId ? 
      this._hass.states[chamberLightEntityId]?.state : null;
    const isLightOn = chamberLightState === 'on';
    
    // Debug: Log light entity
    console.log('Prism Bambu: Chamber light entity:', chamberLightEntityId, 'State:', chamberLightState);
    
    // Get printer name from device
    const deviceId = this.config.printer;
    const device = this._hass.devices?.[deviceId];
    const name = this.config.name || device?.name || 'Bambu Lab Printer';
    
    // Camera - auto-detect from device entities or use config
    let cameraEntity = this.config.camera_entity;
    if (!cameraEntity && this._deviceEntities['camera']) {
      cameraEntity = this._deviceEntities['camera'].entity_id;
    }
    const cameraState = cameraEntity ? this._hass.states[cameraEntity] : null;
    const cameraImage = cameraState?.attributes?.entity_picture || null;
    
    // Debug: Log camera entity
    console.log('Prism Bambu: Camera entity:', cameraEntity, 'Has image:', !!cameraImage);
    
    // Image path - use configured image or default
    // Supports both .png and .jpg formats
    const printerImg = this.config.image || '/local/custom-components/images/prism-bambu-pic.png';

    // AMS Data - Use configured AMS device or find connected devices
    let amsData = [];
    let foundAnyAms = false;
    const trayEntities = [];
    
    // Helper function to check if entity is a tray/slot entity
    const isTrayEntity = (entityInfo, entityId) => {
      // Check translation_key for tray_1, tray_2, etc. (ha-bambulab style)
      if (entityInfo.translation_key && /^tray_\d+$/.test(entityInfo.translation_key)) {
        return true;
      }
      // Check entity_id for slot or tray (some integrations use slot instead of tray)
      if (entityId.includes('_slot_') || entityId.includes('_tray_')) {
        return true;
      }
      return false;
    };
    
    // Method 1: Use manually configured AMS device
    if (this.config.ams_device) {
      const amsDeviceId = this.config.ams_device;
      for (const entityId in this._hass.entities) {
        const entityInfo = this._hass.entities[entityId];
        if (entityInfo.device_id === amsDeviceId && isTrayEntity(entityInfo, entityId)) {
          trayEntities.push({
            entityId,
            translationKey: entityInfo.translation_key || entityId,
            ...entityInfo
          });
        }
      }
    }
    
    // Method 2: Auto-detect AMS by looking at devices connected via this printer
    if (trayEntities.length === 0) {
      const printerDeviceId = this.config.printer;
      const connectedDevices = Object.values(this._hass.devices || {})
        .filter(d => d.via_device_id === printerDeviceId);
      
      for (const connectedDevice of connectedDevices) {
        for (const entityId in this._hass.entities) {
          const entityInfo = this._hass.entities[entityId];
          if (entityInfo.device_id === connectedDevice.id && isTrayEntity(entityInfo, entityId)) {
            trayEntities.push({
              entityId,
              translationKey: entityInfo.translation_key || entityId,
              ...entityInfo
            });
          }
        }
      }
    }
    
    // Sort tray entities by their slot/tray number
    trayEntities.sort((a, b) => {
      // Extract number from translation_key (tray_1) or entity_id (ams_1_slot_1)
      const getNum = (e) => {
        const tkMatch = e.translationKey?.match(/(\d+)$/);
        if (tkMatch) return parseInt(tkMatch[1]);
        const idMatch = e.entityId?.match(/slot_(\d+)|tray_(\d+)/);
        if (idMatch) return parseInt(idMatch[1] || idMatch[2]);
        return 0;
      };
      return getNum(a) - getNum(b);
    });
    
    // Debug: Log found AMS tray entities
    if (trayEntities.length > 0) {
      console.log('Prism Bambu: Found AMS tray entities:', trayEntities.map(e => e.entityId));
      // Log first entity's full state for debugging
      const firstState = this._hass.states[trayEntities[0].entityId];
      console.log('Prism Bambu: First tray full state:', firstState);
    }
    
    // Build AMS data from found tray entities
    for (let i = 0; i < Math.max(4, trayEntities.length); i++) {
      const trayEntity = trayEntities[i];
      
      if (trayEntity) {
        foundAnyAms = true;
        const trayState = this._hass.states[trayEntity.entityId];
        const attr = trayState?.attributes || {};
        
        // ha-bambulab stores: name (type), color, remain, active/in_use, empty
        const type = attr.name || attr.type || attr.tray_type || trayState?.state || '';
        let color = attr.color || attr.tray_color || '#666666';
        
        // Ensure color has # prefix (ha-bambulab stores without #)
        if (color && typeof color === 'string' && !color.startsWith('#') && !color.startsWith('rgb')) {
          color = '#' + color;
        }
        
        // Get remaining percentage
        const remaining = parseFloat(attr.remain ?? attr.remaining ?? 0);
        
        // Check if active (ha-bambulab uses 'active' or 'in_use')
        const active = attr.active === true || attr.in_use === true;
        
        // Check if empty
        const isEmpty = attr.empty === true || 
                       !type || 
                       type.toLowerCase() === 'empty' || 
                       type === 'unavailable' || 
                       type === 'unknown' || 
                       type === '-';
        
        amsData.push({
          id: i + 1,
          type: isEmpty ? '' : type.toUpperCase(),
          color: isEmpty ? '#666666' : color,
          remaining: isEmpty ? 0 : Math.round(remaining),
          active,
          empty: isEmpty
        });
      } else if (i < 4) {
        // Fill empty slots up to 4
        amsData.push({
          id: i + 1,
          type: '',
          color: '#666666',
          remaining: 0,
          active: false,
          empty: true
        });
      }
    }
    
    // Debug: Log final AMS data
    console.log('Prism Bambu: Final AMS data:', amsData);
    
    // If no AMS data found at all, show placeholder (not preview data!)
    if (!foundAnyAms) {
      console.log('Prism Bambu: No AMS found, showing empty slots');
      amsData = [
        { id: 1, type: '', color: '#666666', remaining: 0, active: false, empty: true },
        { id: 2, type: '', color: '#666666', remaining: 0, active: false, empty: true },
        { id: 3, type: '', color: '#666666', remaining: 0, active: false, empty: true },
        { id: 4, type: '', color: '#666666', remaining: 0, active: false, empty: true }
      ];
    }

    const returnData = {
      stateStr,
      progress: isIdle ? 0 : progress,
      printTimeLeft,
      printEndTime,
      nozzleTemp,
      targetNozzleTemp,
      bedTemp,
      targetBedTemp,
      chamberTemp,
      partFanSpeed,
      auxFanSpeed,
      currentLayer,
      totalLayers,
      name,
      cameraEntity,
      cameraImage,
      printerImg,
      amsData,
      isPrinting,
      isPaused,
      isIdle,
      isLightOn,
      chamberLightEntity: chamberLightEntityId
    };
    
    // Debug: Log key data for icons and status
    console.log('Prism Bambu: Icons - Light:', chamberLightEntityId, 'Camera:', cameraEntity);
    console.log('Prism Bambu: Status - isPrinting:', isPrinting, 'isPaused:', isPaused, 'isIdle:', isIdle);
    
    return returnData;
  }

  getPreviewData() {
    return {
      stateStr: 'printing',
      progress: 45,
      printTimeLeft: '2h 15m',
      printEndTime: '14:30',
      nozzleTemp: 220,
      targetNozzleTemp: 220,
      bedTemp: 60,
      targetBedTemp: 60,
      chamberTemp: 35,
      partFanSpeed: 50,
      auxFanSpeed: 30,
      currentLayer: 12,
      totalLayers: 28,
      name: this.config?.name || 'Bambu Lab Printer',
      cameraEntity: null,
      cameraImage: null,
      printerImg: this.config?.image || '/local/custom-components/images/prism-bambu-pic.png',
      amsData: [
        { id: 1, type: 'PLA', color: '#FF4444', remaining: 85, active: false },
        { id: 2, type: 'PETG', color: '#4488FF', remaining: 42, active: true },
        { id: 3, type: 'ABS', color: '#111111', remaining: 12, active: false },
        { id: 4, type: 'TPU', color: '#FFFFFF', remaining: 0, active: false, empty: true }
      ],
      isPrinting: true,
      isPaused: false,
      isIdle: false,
      isLightOn: true,
      chamberLightEntity: null
    };
  }

  render() {
    const data = this.getPrinterData();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .card {
            position: relative;
            width: 100%;
            min-height: 600px;
            border-radius: 32px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background-color: rgba(30, 32, 36, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.6);
            color: white;
            box-sizing: border-box;
            user-select: none;
        }
        .noise {
            position: absolute;
            inset: 0;
            opacity: 0.03;
            pointer-events: none;
            background-image: url('https://grainy-gradients.vercel.app/noise.svg');
            mix-blend-mode: overlay;
        }
        
        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 20;
            margin-bottom: 24px;
        }
        .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .printer-icon {
            width: 40px;
            height: 40px;
            min-width: 40px;
            min-height: 40px;
            border-radius: 50%;
            background-color: rgba(0, 174, 66, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #00AE42;
            border: 1px solid rgba(0, 174, 66, 0.2);
            box-shadow: inset 0 0 10px rgba(0, 174, 66, 0.1);
            flex-shrink: 0;
        }
        .printer-icon ha-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .title {
            font-size: 1.125rem;
            font-weight: 700;
            line-height: 1;
            margin: 0;
            color: rgba(255, 255, 255, 0.9);
        }
        .status-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 4px;
        }
        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: ${data.isPrinting ? '#22c55e' : data.isPaused ? '#fbbf24' : 'rgba(255,255,255,0.2)'};
            animation: ${data.isPrinting ? 'pulse 2s infinite' : 'none'};
        }
        .status-text {
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: ${data.isPrinting ? '#4ade80' : data.isPaused ? '#fbbf24' : 'rgba(255,255,255,0.6)'};
        }
        .header-right {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .header-icon-btn {
            width: 36px;
            height: 36px;
            min-width: 36px;
            min-height: 36px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        .header-icon-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
        }
        .header-icon-btn.active {
            color: #fbbf24;
            background-color: rgba(251, 191, 36, 0.1);
            border-color: rgba(251, 191, 36, 0.3);
        }
        .header-icon-btn ha-icon {
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* AMS Grid */
        .ams-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
            z-index: 20;
        }
        .ams-slot {
            position: relative;
            aspect-ratio: 3/4;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 12px;
            background-color: rgba(20, 20, 20, 0.8);
            box-shadow: inset 2px 2px 5px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            border-top: 1px solid rgba(0, 0, 0, 0.2);
            opacity: 0.6;
            filter: grayscale(0.3);
            transition: all 0.2s;
        }
        .ams-slot.active {
            background-color: #1A1A1A;
            border-bottom: 2px solid #00AE42;
            border-top: none;
            box-shadow: 0 0 15px rgba(0, 174, 66, 0.1);
            opacity: 1;
            filter: none;
            transform: scale(1.02);
            z-index: 10;
        }
        .spool-visual {
            position: relative;
            width: 100%;
            aspect-ratio: 1;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.4);
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
        }
        .filament {
            width: 70%;
            height: 70%;
            border-radius: 50%;
            position: relative;
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }
        .spool-center {
            position: absolute;
            width: 20%;
            height: 20%;
            border-radius: 50%;
            background-color: #2a2a2a;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            z-index: 5;
        }
        .remaining-badge {
            position: absolute;
            bottom: -4px;
            background-color: rgba(0, 0, 0, 0.8);
            font-size: 9px;
            font-family: monospace;
            color: white;
            padding: 2px 6px;
            border-radius: 999px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 10;
        }
        .ams-info {
            text-align: center;
            width: 100%;
        }
        .ams-type {
            font-size: 10px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.9);
        }
        
        /* Main Visual */
        .main-visual {
            position: relative;
            flex: 1;
            border-radius: 24px;
            background-color: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.05);
            overflow: hidden;
            margin-bottom: 24px;
            min-height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .view-toggle {
            position: absolute;
            top: 16px;
            right: 16px;
            z-index: 40;
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
            border-radius: 50%;
            background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: background 0.2s;
            flex-shrink: 0;
        }
        .view-toggle ha-icon {
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .view-toggle:hover {
            background-color: rgba(0, 0, 0, 0.8);
        }
        .printer-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 0 30px rgba(59,130,246,0.15)) brightness(1.05);
            z-index: 10;
            padding: 16px;
            box-sizing: border-box;
        }
        .printer-fallback-icon {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255,255,255,0.2);
        }
        .printer-fallback-icon ha-icon {
            width: 80px;
            height: 80px;
        }
        .camera-feed {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        /* Overlays */
        .overlay-left {
            position: absolute;
            left: 12px;
            top: 12px;
            bottom: 12px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 8px;
            z-index: 20;
        }
        .overlay-right {
            position: absolute;
            right: 12px;
            top: 12px;
            bottom: 12px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 8px;
            z-index: 20;
        }
        .overlay-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            background-color: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 999px;
            padding: 6px 12px 6px 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .overlay-pill.right {
            flex-direction: row-reverse;
            padding: 6px 8px 6px 12px;
            text-align: right;
        }
        .pill-icon-container {
            width: 24px;
            height: 24px;
            min-width: 24px;
            min-height: 24px;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .pill-icon-container ha-icon {
            width: 14px;
            height: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .pill-content {
            display: flex;
            flex-direction: column;
            line-height: 1;
        }
        .pill-value {
            font-size: 12px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.9);
        }
        .pill-label {
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
            color: rgba(255, 255, 255, 0.4);
        }
        
        /* Bottom */
        .stats-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 8px;
            margin-bottom: 8px;
        }
        .stat-group {
            display: flex;
            flex-direction: column;
        }
        .stat-label {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.4);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 700;
        }
        .stat-val {
            font-size: 1.25rem;
            font-family: monospace;
            color: white;
            font-weight: 700;
        }
        
        .progress-bar-container {
            width: 100%;
            height: 16px;
            background-color: rgba(0, 0, 0, 0.4);
            border-radius: 999px;
            overflow: hidden;
            position: relative;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
            border: 1px solid rgba(255, 255, 255, 0.05);
            margin-bottom: 16px;
        }
        .progress-bar-fill {
            height: 100%;
            width: ${data.progress}%;
            background: linear-gradient(to right, #00AE42, #4ade80);
            position: relative;
            transition: width 0.3s ease;
        }
        .progress-text {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
            color: white;
            text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            pointer-events: none;
        }
        
        .controls {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
        }
        .btn {
            height: 48px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 700;
            font-size: 14px;
        }
        .btn ha-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .btn-secondary {
            background-color: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.6);
        }
        .btn-secondary:hover:not(:disabled) {
            background-color: rgba(255, 255, 255, 0.1);
        }
        .btn-primary {
            grid-column: span 2;
            background-color: rgba(20, 20, 20, 0.8);
            color: #00AE42;
            gap: 8px;
            box-shadow: inset 2px 2px 5px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            border-top: 1px solid rgba(0, 0, 0, 0.2);
        }
        .btn-primary:hover:not(:disabled) {
            color: #00c94d;
            background-color: rgba(20, 20, 20, 0.9);
        }
        .btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
      </style>
      
      <div class="card">
        <div class="noise"></div>
        
        <div class="header">
            <div class="header-left">
                <div class="printer-icon">
                    <ha-icon icon="mdi:printer-3d-nozzle"></ha-icon>
                </div>
                <div>
                    <h2 class="title">${data.name}</h2>
                    <div class="status-row">
                        <div class="status-dot"></div>
                        <span class="status-text">${data.stateStr}</span>
                    </div>
                </div>
            </div>
            <div class="header-right">
                ${data.chamberLightEntity ? `
                <button class="header-icon-btn btn-light ${data.isLightOn ? 'active' : ''}" title="Chamber Light">
                    <ha-icon icon="mdi:lightbulb${data.isLightOn ? '' : '-outline'}"></ha-icon>
                </button>
                ` : ''}
                ${data.cameraEntity ? `
                <button class="header-icon-btn btn-camera" title="Toggle Camera">
                    <ha-icon icon="mdi:camera${this.showCamera ? '' : '-outline'}"></ha-icon>
                </button>
                ` : ''}
            </div>
        </div>

        <div class="ams-grid">
            ${data.amsData.map(slot => `
                <div class="ams-slot ${slot.active ? 'active' : ''}">
                    <div class="spool-visual">
                        ${!slot.empty ? `
                            <div class="filament" style="background-color: ${slot.color}"></div>
                            <div class="remaining-badge">${slot.remaining}%</div>
                        ` : ''}
                        <div class="spool-center"></div>
                    </div>
                    <div class="ams-info">
                        <div class="ams-type">${slot.empty ? 'Empty' : slot.type}</div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="main-visual">
            ${data.cameraEntity && this.showCamera ? `
                <div class="view-toggle">
                    <ha-icon icon="mdi:image"></ha-icon>
                </div>
                ${data.cameraImage ? `
                    <img src="${data.cameraImage}" class="camera-feed" />
                ` : `
                    <ha-camera-stream
                        .hass=${this._hass}
                        .stateObj=${this._hass?.states[data.cameraEntity]}
                        class="camera-feed"
                    ></ha-camera-stream>
                `}
            ` : `
                ${data.cameraEntity ? `
                <div class="view-toggle">
                    <ha-icon icon="mdi:video"></ha-icon>
                </div>
                ` : ''}
                <img src="${data.printerImg}" class="printer-img" />
                <div class="printer-fallback-icon" style="display: none;">
                  <ha-icon icon="mdi:printer-3d"></ha-icon>
                </div>
                
                <div class="overlay-left">
                    <div class="overlay-pill">
                        <div class="pill-icon-container"><ha-icon icon="mdi:fan"></ha-icon></div>
                        <div class="pill-content">
                            <span class="pill-value">${data.partFanSpeed}%</span>
                            <span class="pill-label">Part</span>
                        </div>
                    </div>
                    <div class="overlay-pill">
                        <div class="pill-icon-container"><ha-icon icon="mdi:weather-windy"></ha-icon></div>
                        <div class="pill-content">
                            <span class="pill-value">${data.auxFanSpeed}%</span>
                            <span class="pill-label">Aux</span>
                        </div>
                    </div>
                </div>
                
                <div class="overlay-right">
                    <div class="overlay-pill right">
                        <div class="pill-icon-container"><ha-icon icon="mdi:thermometer" style="color: #F87171;"></ha-icon></div>
                        <div class="pill-content">
                            <span class="pill-value">${data.nozzleTemp}°</span>
                            <span class="pill-label">/${data.targetNozzleTemp}°</span>
                        </div>
                    </div>
                    <div class="overlay-pill right">
                        <div class="pill-icon-container"><ha-icon icon="mdi:radiator" style="color: #FB923C;"></ha-icon></div>
                        <div class="pill-content">
                            <span class="pill-value">${data.bedTemp}°</span>
                            <span class="pill-label">/${data.targetBedTemp}°</span>
                        </div>
                    </div>
                    <div class="overlay-pill right">
                        <div class="pill-icon-container"><ha-icon icon="mdi:thermometer" style="color: #4ade80;"></ha-icon></div>
                        <div class="pill-content">
                            <span class="pill-value">${data.chamberTemp}°</span>
                            <span class="pill-label">Cham</span>
                        </div>
                    </div>
                </div>
            `}
        </div>

        <div class="stats-row">
            <div class="stat-group">
                <span class="stat-label">Time Left</span>
                <span class="stat-val">${data.printTimeLeft}</span>
            </div>
            <div class="stat-group" style="align-items: flex-end;">
                <span class="stat-label">Layer</span>
                <span class="stat-val">${data.isIdle ? '--' : data.currentLayer} <span style="font-size: 0.875rem; opacity: 0.4;">/ ${data.isIdle ? '--' : data.totalLayers}</span></span>
            </div>
        </div>

        <div class="progress-bar-container">
            <div class="progress-bar-fill"></div>
            <div class="progress-text">${data.progress}%</div>
        </div>

        <div class="controls">
            <button class="btn btn-secondary btn-speed" ${data.isIdle ? 'disabled' : ''}>
                <ha-icon icon="mdi:speedometer"></ha-icon>
            </button>
            <button class="btn btn-secondary btn-stop" ${data.isIdle ? 'disabled' : ''}>
                <ha-icon icon="mdi:stop"></ha-icon>
            </button>
            <button class="btn btn-primary btn-pause" ${data.isIdle ? 'disabled' : ''}>
                <ha-icon icon="${data.isPaused ? 'mdi:play' : 'mdi:pause'}"></ha-icon>
                ${data.isPaused ? 'Resume Print' : data.isPrinting ? 'Pause Print' : 'Control'}
            </button>
        </div>

      </div>
    `;

    this.setupListeners();
  }

  getCardSize() {
    return 8;
  }
}

customElements.define('prism-bambu', PrismBambuCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'prism-bambu',
  name: 'Prism Bambu',
  preview: true,
  description: 'Bambu Lab 3D Printer card with AMS support'
});

