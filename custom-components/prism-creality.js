// Creality Manufacturer and Models for device filtering
// Based on Creality-Control integration (https://github.com/SiloCityLabs/Creality-Control)
const CREALITY_MANUFACTURER = 'Creality';
const CREALITY_PRINTER_MODELS = [
  // K-Series (FDM)
  'K1', 'K1C', 'K1 Max', 'K1 SE', 'K1SE', 'K1 MAX',
  'K2 Plus', 'K2 Pro', 'K2_PLUS', 'K2_PRO',
  // Halot Series (Resin)
  'Halot', 'Halot One', 'Halot Max', 'Halot Sky',
  // Generic
  'Creality Printer', 'Creality'
];

// Entity keys to look for (based on Creality-Control sensor.py)
const ENTITY_KEYS = [
  // Print Status
  'state', 'deviceState', 'printProgress', 'layer', 'TotalLayer', 
  'printLeftTime', 'printJobTime', 'printFileName', 'printId',
  // Temperatures
  'nozzleTemp', 'targetNozzleTemp', 'bedTemp0', 'targetBedTemp0', 'boxTemp',
  // Fans
  'fan', 'fanAuxiliary', 'fanCase', 'auxiliaryFanPct', 'caseFanPct', 'modelFanPct',
  // Position & Speed
  'curPosition', 'realTimeSpeed', 'realTimeFlow', 'curFeedratePct', 'curFlowratePct',
  // Material
  'usedMaterialLength', 'materialDetect', 'materialStatus',
  // System
  'model', 'hostname', 'modelVersion', 'connect', 'tfCard', 'video',
  // Light
  'lightSw',
  // AI Features
  'aiDetection', 'aiFirstFloor', 'aiPausePrint', 'aiSw',
  // Error
  'err', 'powerLoss'
];

class PrismCrealityCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.showCamera = false;
    this.hasRendered = false;
    this._deviceEntities = {}; // Cache for device entities
    this._lastStatus = null; // Track status for re-render decisions
  }

  static getStubConfig() {
    return {
      printer: '',
      name: 'Creality Printer',
      camera_entity: '',
      image: '/local/custom-components/images/prism-creality.webp'
    };
  }

  static getConfigForm() {
    // Build filter for printer device selector
    const printerFilterCombinations = CREALITY_PRINTER_MODELS.map(model => ({
      manufacturer: CREALITY_MANUFACTURER,
      model: model
    }));

    return {
      schema: [
        {
          name: 'printer',
          label: 'Creality Printer (select your printer device)',
          required: true,
          selector: { device: { filter: printerFilterCombinations } }
        },
        {
          name: 'name',
          label: 'Printer name (optional)',
          selector: { text: {} }
        },
        {
          name: 'camera_entity',
          label: 'Camera entity (e.g. camera.creality_k1_se_camera)',
          selector: { entity: { domain: 'camera' } }
        },
        {
          name: 'light_switch',
          label: 'Light switch entity (e.g. switch.creality_light)',
          selector: { entity: { domain: ['light', 'switch'] } }
        },
        {
          name: 'image',
          label: 'Printer image path (optional, supports .png, .jpg, .webp)',
          selector: { text: {} }
        },
        {
          name: 'custom_humidity',
          label: 'Custom humidity sensor (optional)',
          selector: { entity: { domain: 'sensor', device_class: 'humidity' } }
        },
        {
          name: 'custom_temperature',
          label: 'Custom temperature sensor (optional)',
          selector: { entity: { domain: 'sensor', device_class: 'temperature' } }
        },
        {
          name: 'power_switch',
          label: 'Power switch (optional)',
          selector: { entity: { domain: 'switch' } }
        }
      ]
    };
  }

  // Find all entities belonging to this device
  getCrealityDeviceEntities() {
    if (!this._hass || !this.config?.printer) return {};
    
    const deviceId = this.config.printer;
    const result = {};
    
    // Loop through all hass entities and find those belonging to our device
    for (const entityId in this._hass.entities) {
      const entityInfo = this._hass.entities[entityId];
      
      if (entityInfo.device_id === deviceId) {
        // Check if this entity matches one of our known keys or is from creality_control
        if (entityInfo.platform === 'creality_control') {
          const translationKey = entityInfo.translation_key;
          if (translationKey && ENTITY_KEYS.includes(translationKey)) {
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

  // Get entity by name pattern (searches entity_id)
  findEntityByPattern(pattern, domain = null) {
    if (!this._hass) return null;
    
    const deviceId = this.config?.printer;
    for (const entityId in this._hass.entities) {
      const entityInfo = this._hass.entities[entityId];
      if (entityInfo.device_id === deviceId && entityId.toLowerCase().includes(pattern.toLowerCase())) {
        // If domain filter is specified, check it
        if (domain) {
          const entityDomain = entityId.split('.')[0];
          if (entityDomain === domain) {
            return entityId;
          }
        } else {
          return entityId;
        }
      }
    }
    return null;
  }

  // Find entity by pattern with specific domain preference (tries domain first, then falls back)
  findEntityByPatternPreferDomain(pattern, preferredDomain) {
    // First try with the preferred domain
    const withDomain = this.findEntityByPattern(pattern, preferredDomain);
    if (withDomain) return withDomain;
    
    // Fall back to any matching entity
    return this.findEntityByPattern(pattern);
  }

  // Get entity state by entity_id
  getEntityStateById(entityId) {
    if (!entityId || !this._hass) return null;
    const state = this._hass.states[entityId];
    return state?.state ?? null;
  }

  // Get entity numeric value by entity_id
  getEntityValueById(entityId) {
    const state = this.getEntityStateById(entityId);
    return state ? parseFloat(state) || 0 : 0;
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
    const oldStatus = this._lastStatus;
    this._hass = hass;
    
    // Cache device entities on first hass assignment or if empty (only if printer is configured)
    if (this.config?.printer && (firstTime || Object.keys(this._deviceEntities).length === 0)) {
      this._deviceEntities = this.getCrealityDeviceEntities();
      console.log('Prism Creality: Found device entities:', Object.keys(this._deviceEntities));
    }
    
    // Get current status to detect changes
    const data = this.getPrinterData();
    const newStatus = `${data.isIdle}-${data.isPrinting}-${data.isPaused}-${!!data.lightEntity}-${!!data.cameraEntity}`;
    
    // Re-render if: first time, status changed, or never rendered
    if (!this.hasRendered || firstTime || oldStatus !== newStatus) {
      this._lastStatus = newStatus;
      this.render();
      this.hasRendered = true;
      this.setupListeners();
    } else {
      // Only update dynamic values
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
      pillValues[0].textContent = `${data.modelFanSpeed}%`;
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
    
    // Update camera stream hass if it exists
    const cameraStream = this.shadowRoot.querySelector('ha-camera-stream');
    if (cameraStream && this._hass) {
      cameraStream.hass = this._hass;
      if (data.cameraEntity) {
        cameraStream.stateObj = this._hass.states[data.cameraEntity];
      }
    }
    
    // Update light button state from actual HA state
    if (data.lightEntity) {
      const lightBtn = this.shadowRoot.querySelector('.btn-light');
      if (lightBtn) {
        if (data.isLightOn) {
          lightBtn.classList.add('active');
        } else {
          lightBtn.classList.remove('active');
        }
      }
    }
    
    // Update power button state from actual HA state
    if (data.powerSwitch) {
      const powerBtn = this.shadowRoot.querySelector('.btn-power');
      if (powerBtn) {
        if (data.isPowerOn) {
          powerBtn.classList.remove('off');
          powerBtn.classList.add('on');
          powerBtn.title = 'Power Off';
        } else {
          powerBtn.classList.remove('on');
          powerBtn.classList.add('off');
          powerBtn.title = 'Power On';
        }
      }
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
    // Use onclick to avoid duplicate event listeners when re-rendering
    const viewToggle = this.shadowRoot?.querySelector('.view-toggle');
    if (viewToggle) {
      viewToggle.onclick = () => this.toggleView();
    }

    const pauseBtn = this.shadowRoot?.querySelector('.btn-pause');
    if (pauseBtn) {
      pauseBtn.onclick = () => this.handlePause();
    }

    const stopBtn = this.shadowRoot?.querySelector('.btn-stop');
    if (stopBtn) {
      stopBtn.onclick = () => this.handleStop();
    }

    const homeBtn = this.shadowRoot?.querySelector('.btn-home');
    if (homeBtn) {
      homeBtn.onclick = () => this.handleHome();
    }
    
    // Header light button - toggle light
    const lightBtn = this.shadowRoot?.querySelector('.btn-light');
    if (lightBtn) {
      lightBtn.onclick = (e) => {
        e.stopPropagation();
        this.handleLightToggle();
      };
    }
    
    // Header camera button - toggle camera view
    const cameraBtn = this.shadowRoot?.querySelector('.btn-camera');
    if (cameraBtn) {
      cameraBtn.onclick = (e) => {
        e.stopPropagation();
        this.toggleView();
      };
    }
    
    // Camera container - create ha-camera-stream element programmatically
    const cameraContainer = this.shadowRoot?.querySelector('.camera-container');
    if (cameraContainer && this._hass) {
      const entityId = cameraContainer.dataset.entity;
      const stateObj = this._hass.states[entityId];
      
      if (stateObj) {
        // Create the camera stream element
        const cameraStream = document.createElement('ha-camera-stream');
        cameraStream.hass = this._hass;
        cameraStream.stateObj = stateObj;
        cameraStream.className = 'camera-feed';
        cameraStream.style.cursor = 'pointer';
        
        // Click to open popup
        cameraStream.onclick = (e) => {
          e.stopPropagation();
          this.openCameraPopup();
        };
        
        // Clear container and add stream
        cameraContainer.innerHTML = '';
        cameraContainer.appendChild(cameraStream);
      }
    }
    
    // Power button click handler
    const powerBtn = this.shadowRoot?.querySelector('.btn-power');
    if (powerBtn) {
      powerBtn.onclick = (e) => {
        e.stopPropagation();
        this.handlePowerToggle();
      };
    }
  }
  
  handlePowerToggle() {
    if (!this._hass || !this.config.power_switch) return;
    const entityId = this.config.power_switch;
    
    // Call the service
    this._hass.callService('switch', 'toggle', { entity_id: entityId });
    
    // Optimistically update UI immediately
    const powerBtn = this.shadowRoot?.querySelector('.btn-power');
    const currentState = this._hass.states[entityId]?.state;
    const newState = currentState === 'on' ? 'off' : 'on';
    
    if (powerBtn) {
      if (newState === 'on') {
        powerBtn.classList.remove('off');
        powerBtn.classList.add('on');
        powerBtn.title = 'Power Off';
      } else {
        powerBtn.classList.remove('on');
        powerBtn.classList.add('off');
        powerBtn.title = 'Power On';
      }
    }
  }

  toggleView() {
    this.showCamera = !this.showCamera;
    this.render();
  }

  handlePause() {
    if (!this._hass) return;
    // Find pause/resume button entity
    const pauseBtn = this.findEntityByPattern('pause_resume') || this.findEntityByPattern('pause');
    if (pauseBtn) {
      this._hass.callService('button', 'press', { entity_id: pauseBtn });
    } else {
      // Open more-info for the print status entity
      const stateEntity = this.findEntityByPattern('print_state') || this.findEntityByPattern('state');
      if (stateEntity) {
        const event = new CustomEvent('hass-more-info', {
          bubbles: true,
          composed: true,
          detail: { entityId: stateEntity }
        });
        this.dispatchEvent(event);
      }
    }
  }

  handleStop() {
    if (!this._hass) return;
    // Find stop button entity
    const stopBtn = this.findEntityByPattern('stop_print') || this.findEntityByPattern('stop');
    if (stopBtn) {
      this._hass.callService('button', 'press', { entity_id: stopBtn });
    }
  }

  handleHome() {
    if (!this._hass) return;
    // Find home button entity
    const homeBtn = this.findEntityByPattern('home_all') || this.findEntityByPattern('home');
    if (homeBtn) {
      this._hass.callService('button', 'press', { entity_id: homeBtn });
    }
  }
  
  handleLightToggle() {
    if (!this._hass) return;
    
    // Use configured light_switch or auto-detect switch domain
    let entityId = this.config.light_switch;
    
    // Otherwise find the light switch (must be switch domain for control)
    if (!entityId) {
      entityId = this.findEntityByPattern('light', 'switch');
    }
    
    if (!entityId) {
      console.warn('Prism Creality: No light switch entity found. Please configure light_switch in card settings.');
      return;
    }
    
    // Determine domain from entity_id
    const domain = entityId.startsWith('light.') ? 'light' : 'switch';
    
    // Call the service
    this._hass.callService(domain, 'toggle', { entity_id: entityId });
    
    // Optimistically update UI immediately
    const lightBtn = this.shadowRoot?.querySelector('.btn-light');
    const currentState = this._hass.states[entityId]?.state;
    const newState = currentState === 'on' ? 'off' : 'on';
    
    if (lightBtn) {
      if (newState === 'on') {
        lightBtn.classList.add('active');
        lightBtn.innerHTML = '<ha-icon icon="mdi:lightbulb"></ha-icon>';
      } else {
        lightBtn.classList.remove('active');
        lightBtn.innerHTML = '<ha-icon icon="mdi:lightbulb-outline"></ha-icon>';
      }
    }
    
    // Also update printer image dimming
    const printerImg = this.shadowRoot?.querySelector('.printer-img');
    if (printerImg) {
      if (newState === 'on') {
        printerImg.classList.remove('dimmed');
      } else {
        printerImg.classList.add('dimmed');
      }
    }
  }
  
  openCameraPopup() {
    if (!this._hass) return;
    
    // Get camera entity (must be camera domain)
    let entityId = this.config.camera_entity;
    if (!entityId) {
      entityId = this.findEntityByPattern('camera', 'camera');
    }
    
    if (!entityId || !entityId.startsWith('camera.')) {
      console.warn('Prism Creality: No valid camera entity found. Please configure camera_entity in card settings.');
      return;
    }
    
    // Fire the more-info event to open the camera popup
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId: entityId }
    });
    this.dispatchEvent(event);
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
      console.warn('Prism Creality: No device entities found for device:', this.config.printer);
      return this.getPreviewData();
    }
    
    // Find entities by searching entity_ids (Creality uses different naming pattern)
    const progressEntity = this.findEntityByPattern('print_progress');
    const stateEntity = this.findEntityByPattern('print_state') || this.findEntityByPattern('device_state');
    const layerEntity = this.findEntityByPattern('current_layer');
    const totalLayerEntity = this.findEntityByPattern('total_layer');
    const timeLeftEntity = this.findEntityByPattern('time_left');
    const nozzleTempEntity = this.findEntityByPattern('nozzle_temp');
    const targetNozzleTempEntity = this.findEntityByPattern('target_nozzle');
    const bedTempEntity = this.findEntityByPattern('bed_temp');
    const targetBedTempEntity = this.findEntityByPattern('target_bed');
    const boxTempEntity = this.findEntityByPattern('box_temp');
    const modelFanEntity = this.findEntityByPattern('model_fan');
    const auxFanEntity = this.findEntityByPattern('auxiliary_fan');
    const caseFanEntity = this.findEntityByPattern('case_fan');
    // Light: prefer switch domain for control, sensor for status
    const lightSwitchEntity = this.findEntityByPattern('light', 'switch');
    const lightSensorEntity = this.findEntityByPattern('light', 'sensor');
    // Camera: must be camera domain
    const cameraEntityAuto = this.findEntityByPattern('camera', 'camera');
    const fileNameEntity = this.findEntityByPattern('filename') || this.findEntityByPattern('print_filename');
    
    // Read values
    const progress = this.getEntityValueById(progressEntity);
    const stateStr = this.getEntityStateById(stateEntity) || 'unavailable';
    
    // Debug: Log the current status
    console.log('Prism Creality: Current status:', stateStr, 'Progress:', progress);
    
    // Determine if printer is actively printing
    const statusLower = stateStr.toLowerCase();
    const isPrinting = ['printing', 'prepare', 'running', 'druckt', 'vorbereiten', 'busy'].includes(statusLower);
    const isPaused = ['paused', 'pause', 'pausiert'].includes(statusLower);
    const isIdle = !isPrinting && !isPaused;
    
    // Get remaining time - format it nicely
    let printTimeLeft = '--';
    let printEndTime = '--:--';
    if (timeLeftEntity && (isPrinting || isPaused)) {
      const state = this._hass.states[timeLeftEntity];
      if (state) {
        // Creality returns time as HH:MM:SS string or seconds
        const timeValue = state.state;
        if (timeValue && timeValue !== 'Unknown') {
          if (timeValue.includes(':')) {
            // Already formatted as HH:MM:SS
            const parts = timeValue.split(':');
            if (parts.length >= 2) {
              const hours = parseInt(parts[0]) || 0;
              const mins = parseInt(parts[1]) || 0;
              if (hours > 0) {
                printTimeLeft = `${hours}h ${mins}m`;
              } else {
                printTimeLeft = `${mins}m`;
              }
              // Calculate end time
              const totalMinutes = hours * 60 + mins;
              const endTime = new Date(Date.now() + totalMinutes * 60 * 1000);
              printEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
          } else {
            // Seconds value
            const seconds = parseInt(timeValue) || 0;
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (hours > 0) {
              printTimeLeft = `${hours}h ${mins}m`;
            } else {
              printTimeLeft = `${mins}m`;
            }
            const endTime = new Date(Date.now() + seconds * 1000);
            printEndTime = endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
        }
      }
    }
    
    // Temperatures
    const nozzleTemp = this.getEntityValueById(nozzleTempEntity);
    const targetNozzleTemp = this.getEntityValueById(targetNozzleTempEntity);
    const bedTemp = this.getEntityValueById(bedTempEntity);
    const targetBedTemp = this.getEntityValueById(targetBedTempEntity);
    const chamberTemp = this.getEntityValueById(boxTempEntity);
    
    // Fans
    const modelFanSpeed = this.getEntityValueById(modelFanEntity);
    const auxFanSpeed = this.getEntityValueById(auxFanEntity);
    const caseFanSpeed = this.getEntityValueById(caseFanEntity);
    
    // Layer info
    let currentLayer = 0;
    let totalLayers = 0;
    if (isPrinting || isPaused) {
      currentLayer = parseInt(this.getEntityStateById(layerEntity)) || 0;
      totalLayers = parseInt(this.getEntityStateById(totalLayerEntity)) || 0;
    }
    
    // Light: Use configured light_switch, or auto-detected switch, or sensor for status
    let lightEntityId = this.config.light_switch || lightSwitchEntity;
    let lightState = null;
    
    if (lightEntityId) {
      // Use the switch state directly
      lightState = this._hass.states[lightEntityId]?.state;
    } else if (lightSensorEntity) {
      // Fall back to sensor for status display (but won't be controllable)
      lightState = this._hass.states[lightSensorEntity]?.state;
      // Sensor uses "1" for on, "0" for off
      lightState = lightState === '1' ? 'on' : lightState === '0' ? 'off' : lightState;
    }
    
    const isLightOn = lightState === 'on' || lightState === '1';
    
    // Custom sensors
    const customHumidity = this.config.custom_humidity;
    const customHumidityState = customHumidity ? this._hass.states[customHumidity] : null;
    const humidity = customHumidityState ? parseFloat(customHumidityState.state) || 0 : null;
    
    const customTemperature = this.config.custom_temperature;
    const customTemperatureState = customTemperature ? this._hass.states[customTemperature] : null;
    const customTemp = customTemperatureState ? parseFloat(customTemperatureState.state) || 0 : null;
    
    const powerSwitch = this.config.power_switch;
    const powerSwitchState = powerSwitch ? this._hass.states[powerSwitch] : null;
    const isPowerOn = powerSwitchState?.state === 'on';
    
    // Debug: Log light entity
    console.log('Prism Creality: Light entity:', lightEntityId, 'State:', lightState);
    
    // Get printer name from device
    const deviceId = this.config.printer;
    const device = this._hass.devices?.[deviceId];
    const name = this.config.name || device?.name || 'Creality Printer';
    
    // Camera: Use configured camera_entity or auto-detected from camera domain
    let resolvedCameraEntity = this.config.camera_entity || cameraEntityAuto;
    if (resolvedCameraEntity && !resolvedCameraEntity.startsWith('camera.')) {
      console.warn('Prism Creality: Camera entity is not from camera domain:', resolvedCameraEntity);
      resolvedCameraEntity = null;
    }
    const cameraState = resolvedCameraEntity ? this._hass.states[resolvedCameraEntity] : null;
    const cameraImage = cameraState?.attributes?.entity_picture || null;
    
    // Debug: Log camera entity
    console.log('Prism Creality: Camera entity:', resolvedCameraEntity, 'Has image:', !!cameraImage, 'Auto-detected:', cameraEntityAuto);
    
    // Image path
    const printerImg = this.config.image || '/local/custom-components/images/prism-creality.webp';
    
    // Get print filename
    const fileName = this.getEntityStateById(fileNameEntity) || '';

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
      modelFanSpeed,
      auxFanSpeed,
      caseFanSpeed,
      currentLayer,
      totalLayers,
      name,
      cameraEntity: resolvedCameraEntity,
      cameraImage,
      printerImg,
      fileName,
      isPrinting,
      isPaused,
      isIdle,
      isLightOn,
      lightEntity: lightEntityId,
      // Custom sensors
      humidity,
      customTemp,
      powerSwitch,
      isPowerOn
    };
    
    // Debug: Log key data
    console.log('Prism Creality: Icons - Light:', lightEntityId, 'Camera:', resolvedCameraEntity);
    console.log('Prism Creality: Status - isPrinting:', isPrinting, 'isPaused:', isPaused, 'isIdle:', isIdle);
    
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
      modelFanSpeed: 50,
      auxFanSpeed: 30,
      caseFanSpeed: 40,
      currentLayer: 12,
      totalLayers: 28,
      name: this.config?.name || 'Creality Printer',
      cameraEntity: null,
      cameraImage: null,
      printerImg: this.config?.image || '/local/custom-components/images/prism-creality.webp',
      fileName: 'benchy.gcode',
      isPrinting: true,
      isPaused: false,
      isIdle: false,
      isLightOn: true,
      lightEntity: null,
      humidity: null,
      customTemp: null,
      powerSwitch: null,
      isPowerOn: true
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
            min-height: 550px;
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
            background-color: rgba(0, 150, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0096FF;
            border: 1px solid rgba(0, 150, 255, 0.2);
            box-shadow: inset 0 0 10px rgba(0, 150, 255, 0.1);
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
            background-color: rgba(20, 20, 20, 0.9);
            border-color: rgba(0, 0, 0, 0.3);
            box-shadow: inset 2px 2px 5px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.05);
        }
        .header-icon-btn ha-icon {
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Main Visual */
        .main-visual {
            position: relative;
            flex: 1;
            border-radius: 24px;
            background-color: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.05);
            overflow: visible;
            margin-bottom: 24px;
            min-height: 280px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .main-visual-inner {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 24px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Power Corner Button */
        .power-corner-btn {
            position: absolute;
            top: -14px;
            right: -14px;
            z-index: 50;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
        .power-corner-btn.on {
            background: linear-gradient(135deg, rgba(74, 222, 128, 0.9), rgba(34, 197, 94, 0.9));
            color: white;
            box-shadow: 0 4px 12px rgba(74, 222, 128, 0.4), 0 0 20px rgba(74, 222, 128, 0.3);
        }
        .power-corner-btn.off {
            background: linear-gradient(135deg, rgba(60, 60, 60, 0.9), rgba(40, 40, 40, 0.9));
            color: rgba(255, 255, 255, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .power-corner-btn:hover {
            transform: scale(1.1);
        }
        .power-corner-btn.on:hover {
            box-shadow: 0 6px 16px rgba(74, 222, 128, 0.5), 0 0 30px rgba(74, 222, 128, 0.4);
        }
        .power-corner-btn.off:hover {
            background: linear-gradient(135deg, rgba(248, 113, 113, 0.8), rgba(220, 38, 38, 0.8));
            color: white;
            box-shadow: 0 6px 16px rgba(248, 113, 113, 0.4);
        }
        .power-corner-btn ha-icon {
            width: 24px;
            height: 24px;
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
            filter: drop-shadow(0 0 30px rgba(0,150,255,0.15)) brightness(1.05);
            z-index: 10;
            padding: 16px;
            box-sizing: border-box;
            transition: filter 0.3s ease;
        }
        .printer-img.dimmed {
            filter: drop-shadow(0 0 10px rgba(0,0,0,0.3)) brightness(0.4);
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
        .camera-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .camera-feed {
            width: 100%;
            height: 100%;
            object-fit: cover;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .camera-feed:hover {
            opacity: 0.9;
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
            background: linear-gradient(to right, #0096FF, #00C8FF);
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
            color: #0096FF;
            gap: 8px;
            box-shadow: inset 2px 2px 5px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.05);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            border-top: 1px solid rgba(0, 0, 0, 0.2);
        }
        .btn-primary:hover:not(:disabled) {
            color: #00b8ff;
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
                ${data.lightEntity ? `
                <button class="header-icon-btn btn-light ${data.isLightOn ? 'active' : ''}" title="Light">
                    <ha-icon icon="mdi:lightbulb${data.isLightOn ? '' : '-outline'}"></ha-icon>
                </button>
                ` : ''}
                ${data.cameraEntity ? `
                <button class="header-icon-btn btn-camera ${this.showCamera ? 'active' : ''}" title="Toggle Camera">
                    <ha-icon icon="mdi:camera${this.showCamera ? '' : '-outline'}"></ha-icon>
                </button>
                ` : ''}
            </div>
        </div>

        <div class="main-visual ${!data.isLightOn ? 'light-off' : ''}">
            ${data.powerSwitch ? `
            <button class="power-corner-btn btn-power ${data.isPowerOn ? 'on' : 'off'}" title="Power ${data.isPowerOn ? 'Off' : 'On'}">
                <ha-icon icon="mdi:power"></ha-icon>
            </button>
            ` : ''}
            <div class="main-visual-inner">
            ${data.cameraEntity && this.showCamera ? `
                <div class="camera-container" data-entity="${data.cameraEntity}"></div>
            ` : `
                <img src="${data.printerImg}" class="printer-img ${!data.isLightOn ? 'dimmed' : ''}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="printer-fallback-icon" style="display: none;">
                  <ha-icon icon="mdi:printer-3d"></ha-icon>
                </div>
                
                <div class="overlay-left">
                    <div class="overlay-pill">
                        <div class="pill-icon-container"><ha-icon icon="mdi:fan"></ha-icon></div>
                        <div class="pill-content">
                            <span class="pill-value">${data.modelFanSpeed}%</span>
                            <span class="pill-label">Model</span>
                        </div>
                    </div>
                    <div class="overlay-pill">
                        <div class="pill-icon-container"><ha-icon icon="mdi:weather-windy"></ha-icon></div>
                        <div class="pill-content">
                            <span class="pill-value">${data.auxFanSpeed}%</span>
                            <span class="pill-label">Aux</span>
                        </div>
                    </div>
                    ${data.humidity !== null ? `
                    <div class="overlay-pill">
                        <div class="pill-icon-container"><ha-icon icon="mdi:water-percent" style="color: #60a5fa;"></ha-icon></div>
                        <div class="pill-content">
                            <span class="pill-value">${Math.round(data.humidity)}%</span>
                            <span class="pill-label">Humid</span>
                        </div>
                    </div>
                    ` : ''}
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
                            <span class="pill-label">Box</span>
                        </div>
                    </div>
                    ${data.customTemp !== null ? `
                    <div class="overlay-pill right">
                        <div class="pill-icon-container"><ha-icon icon="mdi:thermometer-lines" style="color: #a78bfa;"></ha-icon></div>
                        <div class="pill-content">
                            <span class="pill-value">${Math.round(data.customTemp)}°</span>
                            <span class="pill-label">Custom</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `}
            </div>
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
            <button class="btn btn-secondary btn-home" ${data.isIdle ? '' : 'disabled'} title="Home All Axes">
                <ha-icon icon="mdi:home"></ha-icon>
            </button>
            <button class="btn btn-secondary btn-stop" ${data.isIdle ? 'disabled' : ''} title="Stop Print">
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
    return 7;
  }
}

customElements.define('prism-creality', PrismCrealityCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'prism-creality',
  name: 'Prism Creality',
  preview: true,
  description: 'Creality 3D Printer card for K1, K1C, K1 Max, K1 SE and more'
});

