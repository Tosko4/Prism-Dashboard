class PrismVacuumSwitchbotCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._mapRefreshInterval = null;
        this._activeTab = 'fan'; // 'fan' or 'water'
        this._activeScene = 1; // 1 or 2 - which scene is selected
    }

    static getStubConfig() {
      return { 
        device_id: "b0e9fe012c6d",
        name: "SwitchBot S10"
      }
    }

    static getConfigForm() {
      return {
        schema: [
          {
            name: "device_id",
            required: true,
            selector: { text: {} },
            description: "SwitchBot Device MAC Address (e.g. b0e9fe012c6d)"
          },
          {
            name: "name",
            selector: { text: {} }
          },
          {
            name: "map_camera",
            selector: { entity: { domain: ["camera", "image"] } }
          },
          {
            name: "show_status",
            selector: { boolean: {} }
          },
          {
            name: "",
            type: "expandable",
            title: "Szenen-Modus",
            schema: [
              {
                name: "use_scenes",
                selector: { boolean: {} },
                description: "Aktiviert die Szenen-Auswahl. Der Play-Button startet dann die ausgewählte Szene statt dem normalen Start-Befehl."
              },
              {
                name: "scene_1",
                selector: { entity: { domain: "scene" } },
                description: "Erste Szene (z.B. 'Alle Räume reinigen')"
              },
              {
                name: "scene_1_name",
                selector: { text: {} },
                description: "Anzeigename für Szene 1 (optional, z.B. 'Alles')"
              },
              {
                name: "scene_2",
                selector: { entity: { domain: "scene" } },
                description: "Zweite Szene (z.B. 'Nur Küche reinigen')"
              },
              {
                name: "scene_2_name",
                selector: { text: {} },
                description: "Anzeigename für Szene 2 (optional, z.B. 'Küche')"
              }
            ]
          }
        ]
      };
    }
  
    setConfig(config) {
      if (!config.device_id) {
        throw new Error('Please define a device_id (SwitchBot MAC Address)');
      }
      this.config = {
        show_status: true,
        ...config
      };
      // Normalize device_id to lowercase
      this.config.device_id = this.config.device_id.toLowerCase();
    }
  
    set hass(hass) {
      this._hass = hass;
      if (this.config && this.config.device_id) {
        // Get all SwitchBot MQTT entities for this device
        this._loadEntities();
        this.render();
      }
    }
    
    // Load entities based on device_id
    _loadEntities() {
      const deviceId = this.config.device_id;
      
      // Sensors
      this._batteryEntity = this._hass.states[`sensor.both_battery_${deviceId}`];
      this._waterBaseBatteryEntity = this._hass.states[`sensor.both_waterbasebattery_${deviceId}`];
      this._workingStatusEntity = this._hass.states[`sensor.both_workingstatus_${deviceId}`];
      this._taskTypeEntity = this._hass.states[`sensor.both_tasktype_${deviceId}`];
      this._onlineStatusEntity = this._hass.states[`binary_sensor.both_onlinestatus_${deviceId}`];
      
      // Command Buttons (indices from actual SwitchBot MQTT integration)
      this._startCleanButton = this._hass.states[`button.btn_1_cmd_${deviceId}`];
      this._pauseButton = this._hass.states[`button.btn_3_cmd_${deviceId}`];
      this._dockButton = this._hass.states[`button.btn_4_cmd_${deviceId}`];
      
      // Number controls (index 7 = changeParam command)
      this._fanLevelEntity = this._hass.states[`number.fanlevel_7_cmd_${deviceId}`];
      this._waterLevelEntity = this._hass.states[`number.waterlevel_7_cmd_${deviceId}`];
      
      // Select controls
      this._actionEntity = this._hass.states[`select.action_0_cmd_${deviceId}`];
      this._selfCleanModeEntity = this._hass.states[`select.mode_5_cmd_${deviceId}`];
      
      // Get map camera entity if configured
      if (this.config.map_camera) {
        this._mapEntity = this._hass.states[this.config.map_camera] || null;
      }
    }
  
    getCardSize() {
      return 3;
    }
  
    connectedCallback() {
      this.render();
      this.setupListeners();
    }
    
    disconnectedCallback() {
      if (this._mapRefreshInterval) {
        clearInterval(this._mapRefreshInterval);
      }
    }
  
    setupListeners() {
        const root = this.shadowRoot;
        
        // Play/Pause Button
        const playBtn = root.querySelector('#play-btn');
        if(playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleAction('toggle');
            });
        }

        // Dock/Home Button
        const homeBtn = root.querySelector('#home-btn');
        if(homeBtn) {
            homeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleAction('dock');
            });
        }
        
        // Click on vacuum inlet - no action (just visual)
        // Could be used for locate or other features in the future

        // Tab Buttons
        root.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const tab = e.currentTarget.dataset.tab;
                this._activeTab = tab;
                this.render();
            });
        });
        
        // Scene Buttons
        root.querySelectorAll('.scene-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const scene = parseInt(e.currentTarget.dataset.scene);
                this._activeScene = scene;
                this.render();
            });
        });

        // Fan Speed Buttons
        root.querySelectorAll('.fan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const level = parseInt(e.currentTarget.dataset.level);
                this.handleAction('set_fan_level', level);
            });
        });
        
        // Water Level Buttons
        root.querySelectorAll('.water-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const level = parseInt(e.currentTarget.dataset.level);
                this.handleAction('set_water_level', level);
            });
        });
    }
  
    handleAction(action, value) {
      if (!this._hass || !this.config.device_id) return;
      
      const deviceId = this.config.device_id;

      if (action === 'toggle') {
        // Use taskType to determine if actually cleaning (more accurate than workingStatus)
        const taskType = this._taskTypeEntity?.state || 'standBy';
        const cleaningTasks = ['cleanAll', 'cleanArea', 'cleanRoom', 'explore', 'cleanWithExplorer'];
        const isCleaning = cleaningTasks.includes(taskType);
        
        if (isCleaning) {
          // Pause - btn_3
          this._hass.callService('button', 'press', { 
            entity_id: `button.btn_3_cmd_${deviceId}` 
          });
        } else {
          // Check if scene mode is enabled
          if (this.config.use_scenes) {
            const sceneEntity = this._activeScene === 1 ? this.config.scene_1 : this.config.scene_2;
            if (sceneEntity) {
              this._hass.callService('scene', 'turn_on', { 
                entity_id: sceneEntity 
              });
              return;
            }
          }
          // Default: Start clean - btn_1
          this._hass.callService('button', 'press', { 
            entity_id: `button.btn_1_cmd_${deviceId}` 
          });
        }
      } else if (action === 'dock') {
        // Dock - btn_4
        this._hass.callService('button', 'press', { 
          entity_id: `button.btn_4_cmd_${deviceId}` 
        });
      } else if (action === 'set_fan_level' && value) {
        // Set the fan level parameter
        this._hass.callService('number', 'set_value', { 
          entity_id: `number.fanlevel_7_cmd_${deviceId}`,
          value: value
        });
        // Press the changeParam button to apply (btn_7)
        setTimeout(() => {
          this._hass.callService('button', 'press', { 
            entity_id: `button.btn_7_cmd_${deviceId}` 
          });
        }, 100);
      } else if (action === 'set_water_level' && value) {
        // Set the water level parameter
        this._hass.callService('number', 'set_value', { 
          entity_id: `number.waterlevel_7_cmd_${deviceId}`,
          value: value
        });
        // Press the changeParam button to apply (btn_7)
        setTimeout(() => {
          this._hass.callService('button', 'press', { 
            entity_id: `button.btn_7_cmd_${deviceId}` 
          });
        }, 100);
      }
    }
    
    // Get fan level from entity or default
    getFanLevel() {
      if (this._fanLevelEntity) {
        return parseInt(this._fanLevelEntity.state) || 1;
      }
      return 1;
    }
    
    // Get water level from entity or default
    getWaterLevel() {
      if (this._waterLevelEntity) {
        return parseInt(this._waterLevelEntity.state) || 1;
      }
      return 1;
    }
    
    // Get battery icon based on level
    getBatteryIcon(level) {
      if (level >= 95) return 'mdi:battery';
      if (level >= 85) return 'mdi:battery-90';
      if (level >= 75) return 'mdi:battery-80';
      if (level >= 65) return 'mdi:battery-70';
      if (level >= 55) return 'mdi:battery-60';
      if (level >= 45) return 'mdi:battery-50';
      if (level >= 35) return 'mdi:battery-40';
      if (level >= 25) return 'mdi:battery-30';
      if (level >= 15) return 'mdi:battery-20';
      if (level >= 5) return 'mdi:battery-10';
      return 'mdi:battery-outline';
    }
    
    // Get battery color based on level
    getBatteryColor(level, isCharging) {
      if (isCharging) return '#facc15'; // Yellow when charging
      if (level >= 50) return '#4ade80'; // Green
      if (level >= 20) return '#fb923c'; // Orange
      return '#ef4444'; // Red
    }
    
    // Translation helper - English default, German if HA is set to German
    _t(key) {
      const lang = this._hass?.language || this._hass?.locale?.language || 'en';
      const isGerman = lang.startsWith('de');
      
      const translations = {
        // SwitchBot taskType statuses
        'standBy': isGerman ? 'Bereit' : 'Standby',
        'explore': isGerman ? 'Erkundet' : 'Exploring',
        'cleanAll': isGerman ? 'Reinigt Alles' : 'Cleaning All',
        'cleanArea': isGerman ? 'Reinigt Bereich' : 'Cleaning Area',
        'cleanRoom': isGerman ? 'Reinigt Raum' : 'Cleaning Room',
        'fillWater': isGerman ? 'Füllt Wasser' : 'Filling Water',
        'deepWashing': isGerman ? 'Tiefenreinigung' : 'Deep Washing',
        'backToCharge': isGerman ? 'Fährt zur Station' : 'Returning',
        'markingWaterBase': isGerman ? 'Markiert Station' : 'Marking Base',
        'drying': isGerman ? 'Trocknet' : 'Drying',
        'collectDust': isGerman ? 'Staubsammlung' : 'Collecting Dust',
        'remoteControl': isGerman ? 'Fernsteuerung' : 'Remote Control',
        'cleanWithExplorer': isGerman ? 'Reinigt & Erkundet' : 'Clean & Explore',
        'fillWaterForHumi': isGerman ? 'Füllt Befeuchter' : 'Fill Humidifier',
        'markingHumi': isGerman ? 'Markiert Befeuchter' : 'Marking Humidifier',
        // workingStatus
        'Charging': isGerman ? 'Lädt' : 'Charging',
        'ChargeDone': isGerman ? 'Geladen' : 'Charged',
        'Dormant': isGerman ? 'Ruhemodus' : 'Dormant',
        'InTrouble': isGerman ? 'Fehler' : 'Error',
        'Paused': isGerman ? 'Pausiert' : 'Paused',
        // Fallback
        'unknown': isGerman ? 'Unbekannt' : 'Unknown',
        // UI labels
        'vacuum': isGerman ? 'Staubsauger' : 'Vacuum'
      };
      
      return translations[key] || key;
    }
    
    // Get status text from SwitchBot taskType (more accurate than workingStatus)
    getStatusText(taskType, workingStatus) {
      // taskType values: standBy, explore, cleanAll, cleanArea, cleanRoom, fillWater, 
      // deepWashing, backToCharge, markingWaterBase, drying, collectDust, remoteControl
      
      // Use taskType as primary indicator
      if (taskType && this._t(taskType) !== taskType) {
        return this._t(taskType);
      }
      
      // Fallback to workingStatus for charging states
      if (workingStatus && this._t(workingStatus) !== workingStatus) {
        return this._t(workingStatus);
      }
      
      return taskType || workingStatus || this._t('unknown');
    }
    
    // Get map image URL
    getMapUrl() {
      if (!this._mapEntity || !this._hass) return null;
      
      const entityId = this.config.map_camera;
      const domain = entityId.split('.')[0];
      
      if (this._mapEntity.attributes.entity_picture) {
        const entityPicture = this._mapEntity.attributes.entity_picture;
        const separator = entityPicture.includes('?') ? '&' : '?';
        return `${entityPicture}${separator}_ts=${Date.now()}`;
      }
      
      if (domain === 'camera') {
        const token = this._mapEntity.attributes.access_token || '';
        return `/api/camera_proxy/${entityId}?token=${token}&t=${Date.now()}`;
      }
      
      return null;
    }
  
    render() {
      if (!this.config || !this.config.device_id) return;
      
      // Get values from entities
      const workingStatus = this._workingStatusEntity?.state || 'StandBy';
      const taskType = this._taskTypeEntity?.state || 'standBy';
      const battery = this._batteryEntity ? parseInt(this._batteryEntity.state) : 85;
      const waterBaseBattery = this._waterBaseBatteryEntity ? parseInt(this._waterBaseBatteryEntity.state) : null;
      const isOnline = this._onlineStatusEntity?.state === 'on' || this._onlineStatusEntity?.state === 'Verbunden';
      const fanLevel = this.getFanLevel();
      
      const name = this.config.name || 'SwitchBot Vacuum';
      
      // Determine states based on taskType (more accurate than workingStatus)
      // taskType cleaning states
      const cleaningTasks = ['cleanAll', 'cleanArea', 'cleanRoom', 'explore', 'cleanWithExplorer'];
      const returningTasks = ['backToCharge'];
      const dockedTasks = ['standBy'];
      const selfCleanTasks = ['fillWater', 'deepWashing', 'drying', 'collectDust', 'markingWaterBase'];
      
      // workingStatus for additional states
      const pausedStates = ['Paused'];
      const errorStates = ['InTrouble'];
      const chargingStates = ['Charging'];
      
      const isCleaning = cleaningTasks.includes(taskType);
      const isReturning = returningTasks.includes(taskType);
      const isDocked = dockedTasks.includes(taskType) && !chargingStates.includes(workingStatus);
      const isPaused = pausedStates.includes(workingStatus);
      const hasError = errorStates.includes(workingStatus) || (!isOnline && this._onlineStatusEntity);
      const isSelfCleaning = selfCleanTasks.includes(taskType);
      const isCharging = chargingStates.includes(workingStatus) || workingStatus === 'ChargeDone';
      const isActive = isCleaning || isReturning || isSelfCleaning;

      // Map URL if configured
      const mapUrl = this.getMapUrl();
      const showMap = this.config.map_camera && mapUrl;
  
      // Battery icon and color
      const batteryIcon = isCharging ? 'mdi:battery-charging' : this.getBatteryIcon(battery);
      const batteryColor = this.getBatteryColor(battery, isCharging);
      
      // Status color
      const getStatusColor = () => {
        if (hasError) return '#ef4444';
        if (isCleaning) return '#3b82f6';
        if (isReturning) return '#f59e0b';
        if (isPaused) return '#f59e0b';
        if (isSelfCleaning) return '#a855f7';
        if (isDocked) return '#4ade80';
        return 'rgba(255,255,255,0.4)';
      };

      // Fan speed levels for S10 (1-4)
      const fanLevels = [
        { level: 1, label: 'Leise' },
        { level: 2, label: 'Normal' },
        { level: 3, label: 'Stark' },
        { level: 4, label: 'Max' }
      ];
      
      // Water levels for S10 (1-2)
      const waterLevel = this.getWaterLevel();
      const waterLevels = [
        { level: 1, label: 'Wenig' },
        { level: 2, label: 'Viel' }
      ];

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .card {
            background: rgba(30, 32, 36, 0.6);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 24px;
            border: 1px solid rgba(255,255,255,0.05);
            border-top: 1px solid rgba(255, 255, 255, 0.15);
            border-bottom: 1px solid rgba(0, 0, 0, 0.4);
            box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0,0,0,0.3);
            padding: 20px;
            color: white;
            user-select: none;
            box-sizing: border-box;
            display: flex; flex-direction: column; gap: 20px;
            overflow: hidden;
            position: relative;
          }

          /* Noise texture */
          .noise {
            position: absolute; inset: 0; opacity: 0.03; pointer-events: none;
            background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
            mix-blend-mode: overlay;
          }
          
          /* Header */
          .header {
              display: flex; justify-content: space-between; align-items: center; z-index: 2;
              gap: 12px;
          }
          .header-left { 
              display: flex; align-items: center; gap: 12px;
              flex: 1;
              min-width: 0;
              overflow: hidden;
          }
          
          .icon-box {
              width: 40px; height: 40px; min-width: 40px; min-height: 40px; border-radius: 50%;
              background: ${isActive || hasError 
                  ? 'linear-gradient(145deg, rgba(25, 27, 30, 1), rgba(30, 32, 38, 1))' 
                  : 'linear-gradient(145deg, rgba(35, 38, 45, 1), rgba(28, 30, 35, 1))'}; 
              color: ${isActive ? '#60a5fa' : hasError ? '#ef4444' : 'rgba(255,255,255,0.4)'};
              display: flex; align-items: center; justify-content: center;
              transition: all 0.5s ease;
              flex-shrink: 0;
              box-shadow: ${isActive || hasError 
                  ? 'inset 3px 3px 8px rgba(0, 0, 0, 0.7), inset -2px -2px 4px rgba(255, 255, 255, 0.03)' 
                  : '4px 4px 10px rgba(0, 0, 0, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.03), inset 0 1px 2px rgba(255, 255, 255, 0.05)'};
              border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .icon-box ha-icon {
              width: 22px;
              height: 22px;
              --mdc-icon-size: 22px;
              display: flex;
              align-items: center;
              justify-content: center;
              line-height: 0;
              ${isActive ? 'filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.6));' : ''}
              ${hasError ? 'filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.6));' : ''}
          }
          .icon-spin {
              animation: ${isActive ? 'spin 3s linear infinite' : 'none'};
          }
          @keyframes spin { 100% { transform: rotate(360deg); } }
          
          .info { 
              display: flex; flex-direction: column;
              min-width: 0;
              overflow: hidden;
          }
          .title { 
              font-size: 1.125rem; font-weight: 700; color: rgba(255, 255, 255, 0.9); line-height: 1;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
          }
          .subtitle { 
              font-size: 0.75rem; font-weight: 500; color: rgba(255, 255, 255, 0.6); margin-top: 4px;
              display: flex; align-items: center; gap: 8px;
              flex-wrap: wrap;
              overflow: hidden;
          }
          .subtitle ha-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              line-height: 0;
              flex-shrink: 0;
          }
          .subtitle span {
              line-height: 1;
          }
          .battery-info {
              display: flex;
              align-items: center;
              gap: 4px;
          }
          .water-base-battery {
              display: flex;
              align-items: center;
              gap: 4px;
              color: #60a5fa;
          }
          .status-badge {
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 2px 6px;
              border-radius: 8px;
              background: rgba(255,255,255,0.05);
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
          }
          .status-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: ${getStatusColor()};
              ${isActive ? 'animation: pulse 2s infinite;' : ''}
          }
          @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
          }
          
          .header-right {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-shrink: 0;
          }
          
          .play-btn {
              width: 40px; height: 40px; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              transition: all 0.2s; cursor: pointer;
              border: 1px solid rgba(255,255,255,0.05);
          }
          .play-btn ha-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              line-height: 0;
          }
          .play-btn.active {
              background: linear-gradient(145deg, rgba(25, 27, 30, 1), rgba(30, 32, 38, 1));
              color: #3b82f6;
              box-shadow: inset 3px 3px 8px rgba(0,0,0,0.7), inset -2px -2px 4px rgba(255,255,255,0.03);
          }
          .play-btn.active ha-icon {
              filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.6));
          }
          .play-btn.inactive {
              background: linear-gradient(145deg, rgba(35, 38, 45, 1), rgba(28, 30, 35, 1));
              color: rgba(255,255,255,0.4);
              box-shadow: 
                  4px 4px 10px rgba(0, 0, 0, 0.5),
                  -2px -2px 6px rgba(255, 255, 255, 0.03),
                  inset 0 1px 2px rgba(255, 255, 255, 0.05);
          }
          .play-btn.inactive:hover { 
              background: linear-gradient(145deg, rgba(40, 43, 50, 1), rgba(32, 34, 40, 1));
              color: #4ade80;
          }
          .play-btn.inactive:hover ha-icon {
              filter: drop-shadow(0 0 6px rgba(74, 222, 128, 0.5));
          }
          
          /* Visual Inlet - click for self-clean */
          .vacuum-inlet {
              width: 100%; height: 160px; border-radius: 16px;
              background: rgba(20, 20, 20, 0.8);
              box-shadow: inset 2px 2px 5px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.05);
              border-bottom: 1px solid rgba(255,255,255,0.05);
              border-top: 1px solid rgba(0,0,0,0.4);
              position: relative; overflow: hidden;
              cursor: pointer;
              transition: all 0.2s ease;
          }
          .vacuum-inlet:hover {
              background: rgba(25, 25, 25, 0.9);
          }
          .vacuum-inlet:active {
              transform: scale(0.995);
          }
          
          /* Map display */
          .map-container {
              position: absolute;
              inset: 0;
              display: flex;
              align-items: center;
              justify-content: center;
          }
          .map-image {
              width: 100%;
              height: 100%;
              object-fit: contain;
              opacity: 0.9;
          }
          .map-overlay {
              position: absolute;
              inset: 0;
              background: linear-gradient(to bottom, rgba(20,20,20,0.3), transparent, rgba(20,20,20,0.5));
              pointer-events: none;
          }
          
          .floor-grid {
              position: absolute; inset: 0; opacity: 0.03;
              background-image: linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px);
              background-size: 30px 30px;
          }
          
          .vacuum-body {
             position: absolute; width: 96px; height: 96px;
             left: 50%; top: 50%;
             transform: translate(-50%, -50%);
             z-index: 10;
          }
          
          .vacuum-visual {
              width: 100%; height: 100%; border-radius: 50%;
              background: linear-gradient(135deg, #353842, #2a2d35, #1a1c21);
              box-shadow: 0 10px 20px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1);
              border: 1px solid rgba(255,255,255,0.1);
              position: relative;
          }
          
          .lidar {
              position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
              width: 36px; height: 36px; border-radius: 50%;
              background: linear-gradient(#25282e, #15171a);
              border: 1px solid rgba(255,255,255,0.05);
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 4px 8px rgba(0,0,0,0.4);
          }
          .lidar-dot {
              width: 8px; height: 8px; border-radius: 50%;
              background: ${hasError ? 'rgba(239, 68, 68, 0.8)' : isSelfCleaning ? 'rgba(168, 85, 247, 0.8)' : 'rgba(59, 130, 246, 0.5)'};
              box-shadow: 0 0 5px ${hasError ? 'rgba(239, 68, 68, 0.8)' : isSelfCleaning ? 'rgba(168, 85, 247, 0.8)' : 'rgba(59, 130, 246, 0.5)'};
          }
          
          .led {
              position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
              width: 20px; height: 6px; border-radius: 10px;
              background: ${isCleaning ? '#3b82f6' : hasError ? '#ef4444' : isSelfCleaning ? '#a855f7' : 'rgba(255,255,255,0.1)'};
              box-shadow: ${isCleaning ? '0 0 8px #3b82f6' : hasError ? '0 0 8px #ef4444' : isSelfCleaning ? '0 0 8px #a855f7' : 'none'};
              transition: all 0.3s;
          }
          
          /* Animation */
          .vacuum-body.animating {
             animation: movePath 12s linear infinite;
          }
          
          @keyframes movePath {
              0% { transform: translate(-50%, -50%) translate(0, 0) rotate(0deg); }
              15% { transform: translate(-50%, -50%) translate(100px, 25px) rotate(15deg); }
              35% { transform: translate(-50%, -50%) translate(100px, -25px) rotate(-15deg); }
              50% { transform: translate(-50%, -50%) translate(-100px, -25px) rotate(10deg); }
              65% { transform: translate(-50%, -50%) translate(-100px, 25px) rotate(-10deg); }
              100% { transform: translate(-50%, -50%) translate(0, 0) rotate(0deg); }
          }
          
          /* Controls Row */
          .controls-row {
              display: flex; flex-direction: column; gap: 12px; z-index: 2;
          }
          
          .controls-header {
              display: flex; justify-content: space-between; align-items: center; padding: 0 4px;
          }
          
          /* Tab Buttons */
          .tab-container {
              display: flex; align-items: center; gap: 4px;
              background: rgba(20,20,20,0.4);
              border-radius: 20px;
              padding: 3px;
          }
          .tab-btn {
              display: flex; align-items: center; justify-content: center;
              width: 32px; height: 26px; border-radius: 16px;
              cursor: pointer; transition: all 0.2s;
              color: rgba(255,255,255,0.3);
              background: transparent;
          }
          .tab-btn:hover {
              color: rgba(255,255,255,0.6);
          }
          .tab-btn.active {
              background: rgba(255,255,255,0.1);
              color: #3b82f6;
          }
          .tab-btn.active.water {
              color: #60a5fa;
          }
          .tab-btn ha-icon {
              display: flex;
              align-items: center;
              justify-content: center;
          }
          
          /* Scene Selector */
          .scene-selector {
              display: flex; 
              align-items: center; 
              gap: 6px;
              flex: 1;
              justify-content: center;
          }
          .scene-btn {
              display: flex; 
              align-items: center; 
              justify-content: center;
              padding: 6px 10px; 
              border-radius: 10px;
              cursor: pointer; 
              transition: all 0.2s;
              font-size: 9px; 
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              white-space: nowrap;
              border: 1px solid rgba(255,255,255,0.05);
              height: 26px;
              box-sizing: border-box;
          }
          /* Inactive = raised/erhaben */
          .scene-btn.inactive {
              background: linear-gradient(145deg, rgba(35, 38, 45, 1), rgba(28, 30, 35, 1));
              color: rgba(255,255,255,0.4);
              box-shadow: 
                  4px 4px 10px rgba(0, 0, 0, 0.5),
                  -2px -2px 6px rgba(255, 255, 255, 0.03),
                  inset 0 1px 2px rgba(255, 255, 255, 0.05);
          }
          .scene-btn.inactive:hover {
              background: linear-gradient(145deg, rgba(40, 43, 50, 1), rgba(32, 34, 40, 1));
              color: rgba(255,255,255,0.6);
          }
          /* Active = pressed/eingedrückt */
          .scene-btn.active {
              background: linear-gradient(145deg, rgba(25, 27, 30, 1), rgba(30, 32, 38, 1));
              color: #4ade80;
              box-shadow: inset 3px 3px 8px rgba(0,0,0,0.7), inset -2px -2px 4px rgba(255,255,255,0.03);
          }
          .scene-btn ha-icon {
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
          }
          .scene-btn.active ha-icon {
              filter: drop-shadow(0 0 4px rgba(74, 222, 128, 0.5));
          }
          
          .home-btn {
              width: 36px; height: 36px; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              cursor: pointer; transition: all 0.2s;
              border: 1px solid rgba(255,255,255,0.05);
              flex-shrink: 0;
          }
          .home-btn ha-icon {
              display: flex;
              align-items: center;
              justify-content: center;
          }
          .home-btn.active {
              background: linear-gradient(145deg, rgba(25, 27, 30, 1), rgba(30, 32, 38, 1));
              color: #3b82f6;
              box-shadow: inset 3px 3px 8px rgba(0,0,0,0.7), inset -2px -2px 4px rgba(255,255,255,0.03);
          }
          .home-btn.active ha-icon {
              filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.6));
          }
          .home-btn.inactive {
              background: linear-gradient(145deg, rgba(35, 38, 45, 1), rgba(28, 30, 35, 1));
              color: rgba(255,255,255,0.4);
              box-shadow: 
                  4px 4px 10px rgba(0, 0, 0, 0.5),
                  -2px -2px 6px rgba(255, 255, 255, 0.03),
                  inset 0 1px 2px rgba(255, 255, 255, 0.05);
          }
          .home-btn.inactive:hover { 
              background: linear-gradient(145deg, rgba(40, 43, 50, 1), rgba(32, 34, 40, 1));
              color: rgba(255,255,255,0.7); 
          }

          /* Speed/Level Bars */
          .speed-controls {
              display: flex; gap: 8px; width: 100%;
          }
          .level-btn {
              flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer;
              min-width: 0;
          }
          .level-bar {
              width: 100%; height: 40px; border-radius: 12px; position: relative; overflow: hidden;
              background: rgba(20,20,20,0.4);
              border: 1px solid rgba(255,255,255,0.05);
              transition: all 0.3s;
          }
          .level-bar.active {
              background: #141414;
              box-shadow: inset 1px 1px 2px rgba(0,0,0,0.8), 0 0 10px rgba(59,130,246,0.15);
          }
          .level-bar.active.water {
              box-shadow: inset 1px 1px 2px rgba(0,0,0,0.8), 0 0 10px rgba(96,165,250,0.15);
          }
          .level-fill {
              position: absolute; bottom: 0; left: 0; right: 0;
              transition: height 0.3s ease-out;
              background: rgba(59, 130, 246, 0.2);
              height: 0;
          }
          .level-fill.water {
              background: rgba(96, 165, 250, 0.2);
          }
          .level-line {
              position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
              transition: all 0.3s;
              background: transparent;
          }
          .level-text {
              font-size: 8px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.3px;
              color: rgba(255,255,255,0.2); transition: color 0.3s;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
          }
          
          /* Active states for bars */
          .level-btn.active .level-fill { height: 100%; }
          .level-btn.active .level-line { background: #3b82f6; box-shadow: 0 0 8px #3b82f6; }
          .level-btn.active .level-line.water { background: #60a5fa; box-shadow: 0 0 8px #60a5fa; }
          .level-btn.active .level-text { color: rgba(255,255,255,0.8); }

        </style>
        
        <div class="card">
          <div class="noise"></div>
          
          <div class="header">
              <div class="header-left">
                  <div class="icon-box">
                      <ha-icon icon="${hasError ? 'mdi:alert-circle' : 'mdi:robot-vacuum'}" class="${isActive ? 'icon-spin' : ''}" style="width: 24px; height: 24px;"></ha-icon>
                  </div>
                  <div class="info">
                      <div class="title">${name}</div>
                      <div class="subtitle">
                          <div class="battery-info">
                              <ha-icon icon="${batteryIcon}" style="width: 14px; height: 14px; color: ${batteryColor};"></ha-icon>
                              <span>${battery}%</span>
                          </div>
                          ${waterBaseBattery !== null ? `
                          <div class="water-base-battery">
                              <ha-icon icon="mdi:water" style="width: 12px; height: 12px;"></ha-icon>
                              <span>${waterBaseBattery}%</span>
                          </div>
                          ` : ''}
                          ${this.config.show_status ? `
                          <div class="status-badge">
                              <div class="status-dot"></div>
                              <span>${this.getStatusText(taskType, workingStatus)}</span>
                          </div>
                          ` : ''}
                      </div>
                  </div>
              </div>
              
              <div class="header-right">
                  <div id="play-btn" class="play-btn ${isCleaning ? 'active' : 'inactive'}">
                      <ha-icon icon="${isCleaning ? 'mdi:pause' : 'mdi:play'}" style="width: 20px; height: 20px;"></ha-icon>
                  </div>
              </div>
          </div>
          
          <div class="vacuum-inlet">
              ${showMap ? `
              <div class="map-container">
                  <img class="map-image" src="${mapUrl}" alt="Vacuum Map" />
                  <div class="map-overlay"></div>
              </div>
              ` : `
              <div class="floor-grid"></div>
              <div class="vacuum-body ${isCleaning ? 'animating' : ''}">
                  <div class="vacuum-visual">
                      <div class="lidar">
                          <div class="lidar-dot"></div>
                      </div>
                      <div class="led"></div>
                  </div>
              </div>
              `}
          </div>
          
          <div class="controls-row">
             <div class="controls-header">
                 <div class="tab-container">
                     <div class="tab-btn ${this._activeTab === 'fan' ? 'active' : ''}" data-tab="fan">
                         <ha-icon icon="mdi:fan" style="width: 16px; height: 16px;"></ha-icon>
                     </div>
                     <div class="tab-btn ${this._activeTab === 'water' ? 'active water' : ''}" data-tab="water">
                         <ha-icon icon="mdi:water" style="width: 16px; height: 16px;"></ha-icon>
                     </div>
                 </div>
                 
                 ${this.config.use_scenes && (this.config.scene_1 || this.config.scene_2) ? `
                 <div class="scene-selector">
                     ${this.config.scene_1 ? `
                     <div class="scene-btn ${this._activeScene === 1 ? 'active' : 'inactive'}" data-scene="1">
                         <ha-icon icon="mdi:play-circle-outline" style="width: 12px; height: 12px; margin-right: 4px;"></ha-icon>
                         ${this.config.scene_1_name || 'Szene 1'}
                     </div>
                     ` : ''}
                     ${this.config.scene_2 ? `
                     <div class="scene-btn ${this._activeScene === 2 ? 'active' : 'inactive'}" data-scene="2">
                         <ha-icon icon="mdi:play-circle-outline" style="width: 12px; height: 12px; margin-right: 4px;"></ha-icon>
                         ${this.config.scene_2_name || 'Szene 2'}
                     </div>
                     ` : ''}
                 </div>
                 ` : '<div style="flex: 1;"></div>'}
                 
                 <div id="home-btn" class="home-btn ${isReturning || isDocked ? 'active' : 'inactive'}">
                     <ha-icon icon="mdi:home" style="width: 18px; height: 18px;"></ha-icon>
                 </div>
             </div>
             
             ${this._activeTab === 'fan' ? `
             <div class="speed-controls">
                 ${fanLevels.map((f) => `
                    <div class="level-btn fan-btn ${f.level <= fanLevel ? 'active' : ''}" data-level="${f.level}">
                        <div class="level-bar ${f.level <= fanLevel ? 'active' : ''}">
                            <div class="level-fill"></div>
                            <div class="level-line"></div>
                        </div>
                        <span class="level-text">${f.label}</span>
                    </div>
                 `).join('')}
             </div>
             ` : `
             <div class="speed-controls">
                 ${waterLevels.map((w) => `
                    <div class="level-btn water-btn ${w.level <= waterLevel ? 'active' : ''}" data-level="${w.level}">
                        <div class="level-bar ${w.level <= waterLevel ? 'active water' : ''}">
                            <div class="level-fill water"></div>
                            <div class="level-line water"></div>
                        </div>
                        <span class="level-text">${w.label}</span>
                    </div>
                 `).join('')}
             </div>
             `}
          </div>
  
        </div>
      `;
      
      this.setupListeners();
    }
  }
  
  customElements.define('prism-vacuum-switchbot', PrismVacuumSwitchbotCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "prism-vacuum-switchbot",
    name: "Prism Vacuum SwitchBot",
    preview: true,
    description: "A robot vacuum card for SwitchBot MQTT integration with inlet styling and animation"
  });
