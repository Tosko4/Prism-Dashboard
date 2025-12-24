class PrismVacuumLightCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    static getStubConfig() {
      return { 
        entity: "vacuum.example", 
        name: "Staubsauger"
      }
    }

    static getConfigForm() {
      return {
        schema: [
          {
            name: "entity",
            required: true,
            selector: { entity: { domain: "vacuum" } }
          },
          {
            name: "name",
            selector: { text: {} }
          }
        ]
      };
    }
  
    setConfig(config) {
      if (!config.entity) {
        throw new Error('Please define an entity');
      }
      this.config = config;
    }
  
    set hass(hass) {
      this._hass = hass;
      if (this.config && this.config.entity) {
        const entity = hass.states[this.config.entity];
        this._entity = entity || null;
        this.render();
      }
    }
  
    getCardSize() {
      return 3;
    }
  
    connectedCallback() {
      this.render();
      this.setupListeners();
    }
  
    setupListeners() {
        const root = this.shadowRoot;
        
        // Play/Pause
        const playBtn = root.querySelector('#play-btn');
        if(playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleAction('toggle');
            });
        }

        // Home
        const homeBtn = root.querySelector('#home-btn');
        if(homeBtn) {
            homeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleAction('home');
            });
        }
        
        // Toggle Play on main inlet click
        const inlet = root.querySelector('.vacuum-inlet');
        if(inlet) {
            inlet.addEventListener('click', () => {
                this.handleAction('toggle');
            });
        }

        // Fan Speed
        root.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const speed = e.currentTarget.dataset.speed;
                this.handleAction('set_speed', speed);
            });
        });
    }
  
    handleAction(action, value) {
      if (!this._hass || !this.config.entity) return;
      
      let service = '';
      let data = { entity_id: this.config.entity };
  
      if (action === 'toggle') {
        const state = this._entity ? this._entity.state : 'idle';
        if (state === 'cleaning') {
          service = 'stop';
        } else if (state === 'paused') {
          service = 'start';
        } else if (state === 'docked' || state === 'idle') {
          service = 'start';
        } else {
          service = 'start';
        }
      } else if (action === 'home') {
        service = 'return_to_base';
      } else if (action === 'set_speed') {
        service = 'set_fan_speed';
        data.fan_speed = value;
      }
  
      if (service && this._hass) {
        this._hass.callService('vacuum', service, data);
      } else if (service) {
        // Fallback for preview mode
        this.dispatchEvent(new CustomEvent('hass-service-called', {
            detail: {
              domain: 'vacuum',
              service: service,
              data: data
            },
            bubbles: true,
            composed: true,
          }));
      }
    }
  
    render() {
      if (!this.config || !this.config.entity) return;
      
      // Render preview even if entity doesn't exist
      const attr = this._entity ? this._entity.attributes : {};
      const state = this._entity ? this._entity.state : 'idle';
      const battery = attr.battery_level !== undefined ? attr.battery_level : 85; // Default for preview
      const name = this.config.name || (this._entity ? attr.friendly_name : null) || 'Vacuum';
      const fanSpeed = attr.fan_speed || 'balanced';
      
      const isCleaning = state === 'cleaning';
      const isReturning = state === 'returning';
      const isActive = isCleaning || isReturning;
      const isDocked = state === 'docked';

      const speeds = ["quiet", "balanced", "turbo", "max"];
      const currentSpeedIndex = speeds.indexOf(fanSpeed.toLowerCase());
  
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-radius: 24px;
            border: 1px solid rgba(0,0,0,0.05);
            border-top: 1px solid rgba(255, 255, 255, 0.8);
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0,0,0,0.05);
            padding: 20px;
            color: #1a1a1a;
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
          }
          .header-left { display: flex; align-items: center; gap: 16px; }
          
          .icon-box {
              width: 48px; height: 48px; border-radius: 50%;
              background: ${isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(0,0,0,0.05)'}; 
              color: ${isActive ? '#60a5fa' : 'rgba(0,0,0,0.4)'};
              display: flex; align-items: center; justify-content: center;
              transition: all 0.5s ease;
              ${isActive ? 'filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.4));' : ''}
          }
          .icon-spin {
              animation: ${isActive ? 'spin 3s linear infinite' : 'none'};
          }
          @keyframes spin { 100% { transform: rotate(360deg); } }
          
          .info { display: flex; flex-direction: column; }
          .title { font-size: 18px; font-weight: 700; color: #1a1a1a; line-height: 1.2; }
          .subtitle { 
              font-size: 12px; font-weight: 500; color: #666; margin-top: 2px;
              display: flex; align-items: center; gap: 4px;
          }
          
          .play-btn {
              width: 40px; height: 40px; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              transition: all 0.2s; cursor: pointer;
              border: 1px solid rgba(0,0,0,0.05);
          }
          .play-btn.active {
              background: rgba(255, 255, 255, 0.9);
              color: #3b82f6;
              box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.8);
              border-top: 1px solid rgba(255,255,255,0.6);
          }
          .play-btn.inactive {
              background: rgba(0,0,0,0.03);
              color: rgba(0,0,0,0.4);
          }
          .play-btn.inactive:hover { background: rgba(0,0,0,0.05); }
          
          /* Visual Inlet */
          .vacuum-inlet {
              width: 100%; height: 160px; border-radius: 16px;
              background: rgba(240, 240, 240, 0.9);
              box-shadow: inset 2px 2px 5px rgba(255,255,255,0.8), inset -1px -1px 2px rgba(0,0,0,0.1);
              border-bottom: 1px solid rgba(0,0,0,0.05);
              border-top: 1px solid rgba(255,255,255,0.6);
              position: relative; overflow: hidden;
              cursor: pointer;
          }
          
          .floor-grid {
              position: absolute; inset: 0; opacity: 0.03;
              background-image: linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px);
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
              background: linear-gradient(135deg, #e5e7eb, #d1d5db, #f3f4f6);
              box-shadow: 0 10px 20px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.8), inset -1px -1px 1px rgba(0,0,0,0.1);
              border: 1px solid rgba(0,0,0,0.1);
              position: relative;
          }
          
          .lidar {
              position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
              width: 36px; height: 36px; border-radius: 50%;
              background: linear-gradient(#f5f5f5, #e0e0e0);
              border: 1px solid rgba(0,0,0,0.05);
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          }
          .lidar-dot {
              width: 8px; height: 8px; border-radius: 50%;
              background: rgba(59, 130, 246, 0.5);
              box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
          }
          
          .led {
              position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
              width: 20px; height: 6px; border-radius: 10px;
              background: ${isCleaning ? '#3b82f6' : 'rgba(255,255,255,0.1)'};
              box-shadow: ${isCleaning ? '0 0 8px #3b82f6' : 'none'};
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
          .controls-label {
              display: flex; align-items: center; gap: 6px;
              font-size: 11px; color: #666;
          }
          .controls-label span { font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
          
          .home-btn {
              display: flex; align-items: center; gap: 6px;
              padding: 4px 10px; border-radius: 20px;
              border: 1px solid transparent;
              cursor: pointer; transition: all 0.2s;
          }
          .home-btn.active {
              background: rgba(255, 255, 255, 0.9); color: #3b82f6;
              box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.8);
              border: 1px solid rgba(0,0,0,0.05); border-top-color: rgba(255,255,255,0.6);
          }
          .home-btn.inactive {
              background: transparent; color: rgba(0,0,0,0.4);
          }
          .home-btn.inactive:hover { background: rgba(0,0,0,0.03); color: rgba(0,0,0,0.7); }
          .home-text { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

          /* Fan Speed Bars */
          .speed-controls {
              display: flex; gap: 8px; width: 100%;
          }
          .speed-btn {
              flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer;
          }
          .speed-bar {
              width: 100%; height: 40px; border-radius: 12px; position: relative; overflow: hidden;
              background: rgba(240,240,240,0.6);
              border: 1px solid rgba(0,0,0,0.05);
              transition: all 0.3s;
          }
          .speed-bar.active {
              background: rgba(255, 255, 255, 0.9);
              box-shadow: inset 1px 1px 2px rgba(0,0,0,0.1), 0 0 10px rgba(59,130,246,0.1);
          }
          .speed-fill {
              position: absolute; bottom: 0; left: 0; right: 0;
              transition: height 0.3s ease-out;
              background: rgba(59, 130, 246, 0.2);
              height: 0;
          }
          .speed-line {
              position: absolute; bottom: 0; left: 0; right: 0; height: 4px;
              transition: all 0.3s;
              background: transparent;
          }
          .speed-text {
              font-size: 9px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;
              color: rgba(0,0,0,0.2); transition: color 0.3s;
          }
          
          /* Active states for bars */
          /* Using data attributes in render loop would be cleaner, but hardcoding css classes for now */
          .speed-btn.active .speed-fill { height: 100%; }
          .speed-btn.active .speed-line { background: #3b82f6; box-shadow: 0 0 8px #3b82f6; }
          .speed-btn.active .speed-text { color: rgba(0,0,0,0.8); }

        </style>
        
        <div class="card">
          <div class="noise"></div>
          
          <div class="header">
              <div class="header-left">
                  <div class="icon-box">
                      <ha-icon icon="mdi:disc" class="icon-spin" style="width: 24px; height: 24px;"></ha-icon>
                  </div>
                  <div class="info">
                      <div class="title">${name}</div>
                      <div class="subtitle">
                          <ha-icon icon="mdi:battery" style="width: 12px; height: 12px; color: #4ade80;"></ha-icon>
                          <span>${battery}%</span>
                      </div>
                  </div>
              </div>
              
              <div id="play-btn" class="play-btn ${isCleaning ? 'active' : 'inactive'}">
                  <ha-icon icon="${isCleaning ? 'mdi:pause' : 'mdi:play'}" style="width: 18px; height: 18px;"></ha-icon>
              </div>
          </div>
          
          <div class="vacuum-inlet">
              <div class="floor-grid"></div>
              <div class="vacuum-body ${isCleaning ? 'animating' : ''}">
                  <div class="vacuum-visual">
                      <div class="lidar">
                          <div class="lidar-dot"></div>
                      </div>
                      <div class="led"></div>
                  </div>
              </div>
          </div>
          
          <div class="controls-row">
             <div class="controls-header">
                 <div class="controls-label">
                     <ha-icon icon="mdi:fan" style="width: 14px; height: 14px; color: rgba(255,255,255,0.4);"></ha-icon>
                     <span>Saugleistung</span>
                 </div>
                 
                 <div id="home-btn" class="home-btn ${isReturning || isDocked ? 'active' : 'inactive'}">
                     <ha-icon icon="mdi:home" style="width: 14px; height: 14px;"></ha-icon>
                     <span class="home-text">Home</span>
                 </div>
             </div>
             
             <div class="speed-controls">
                 ${speeds.map((s, idx) => `
                    <div class="speed-btn ${idx <= currentSpeedIndex ? 'active' : ''}" data-speed="${s}">
                        <div class="speed-bar ${idx <= currentSpeedIndex ? 'active' : ''}">
                            <div class="speed-fill"></div>
                            <div class="speed-line"></div>
                        </div>
                        <span class="speed-text">${s}</span>
                    </div>
                 `).join('')}
             </div>
          </div>
  
        </div>
      `;
      
      this.setupListeners();
    }
  }
  
  customElements.define('prism-vacuum-light', PrismVacuumLightCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "prism-vacuum-light",
    name: "Prism Vacuum Light",
    preview: true,
    description: "A robot vacuum card with inlet styling and animation (light theme)"
  });
