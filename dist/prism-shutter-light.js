
class PrismShutterLightCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._dragging = false;
  }

  static getStubConfig() {
    return { entity: "cover.example_shutter", name: "Shutter" }
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "entity",
          required: true,
          selector: { entity: { domain: "cover" } }
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
    this.render();
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
    return 2;
  }

  connectedCallback() {
    if (this.config) {
      this.render();
      this.setupListeners();
    }
  }

  setupListeners() {
    // Buttons
    this.shadowRoot.querySelectorAll('.control-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.controlCover(action);
      });
    });
    
    // Slider Dragging
    const slider = this.shadowRoot.querySelector('.slider-track');
    if (slider) {
        slider.addEventListener('mousedown', this.startDrag.bind(this));
        slider.addEventListener('touchstart', this.startDrag.bind(this), { passive: false });
    }
    
    document.addEventListener('mousemove', this.onDrag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
    
    document.addEventListener('touchmove', this.onDrag.bind(this), { passive: false });
    document.addEventListener('touchend', this.stopDrag.bind(this));
  }
  
  startDrag(e) {
    this._dragging = true;
    const fill = this.shadowRoot.querySelector('.slider-fill');
    if(fill) fill.style.transition = 'none'; // Disable transition for direct follow
    this.onDrag(e);
  }

  stopDrag() {
    if(this._dragging) {
        this._dragging = false;
        const fill = this.shadowRoot.querySelector('.slider-fill');
        if(fill) {
            fill.style.transition = 'width 0.5s ease-out';
            // Get current visual % from style
            const styleW = fill.style.width;
            const percent = parseInt(styleW);
            this.setCoverPosition(percent);
        }
    }
  }

  onDrag(e) {
    if (!this._dragging) return;
    e.preventDefault();

    const track = this.shadowRoot.querySelector('.slider-track');
    const rect = track.getBoundingClientRect();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let percentage = (clientX - rect.left) / rect.width;
    percentage = Math.min(Math.max(percentage, 0), 1);
    
    // Optimistic update
    const fill = this.shadowRoot.querySelector('.slider-fill');
    if(fill) fill.style.width = `${percentage * 100}%`;
    
    // Update label (optional, requires selecting title/subtitle elements which might be tricky if not stored)
    // For simplicity, we just update the bar visually for now
  }
  
  setCoverPosition(pos) {
    if (this._hass && this.config.entity) {
      this._hass.callService('cover', 'set_cover_position', {
        entity_id: this.config.entity,
        position: pos
      });
    } else {
      this.dispatchEvent(new CustomEvent('hass-service-called', {
        detail: {
          domain: 'cover',
          service: 'set_cover_position',
          data: {
            entity_id: this.config.entity,
            position: pos
          }
        },
        bubbles: true,
        composed: true,
      }));
    }
  }

  controlCover(action) {
    if (!this._hass || !this.config.entity) return;
    
    let service = '';
    if (action === 'up') service = 'open_cover';
    if (action === 'stop') service = 'stop_cover';
    if (action === 'down') service = 'close_cover';
    
    this._hass.callService('cover', service, {
      entity_id: this.config.entity
    });
  }

  render() {
    if (!this.config || !this.config.entity) return;
    
    const attr = this._entity ? this._entity.attributes : {};
    const pos = attr.current_position !== undefined ? attr.current_position : 0;
    const state = this._entity ? this._entity.state : 'closed';
    const isOpen = pos > 0;
    
    // Status Text
    let statusText = 'Closed';
    if (pos === 100) statusText = 'Open';
    else if (pos > 0) statusText = `${pos}% Open`;
    
    // Determine active buttons
    const isOpening = state === 'opening';
    const isClosing = state === 'closing';

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
          border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.05);
          border-top: 1px solid rgba(255, 255, 255, 0.8);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0,0,0,0.05);
          padding: 20px;
          color: #1a1a1a;
          user-select: none;
        }
        
        .header {
            display: flex; gap: 16px; align-items: center; margin-bottom: 24px;
        }
        .icon-box {
            width: 48px; height: 48px; border-radius: 50%;
            background: rgba(59, 130, 246, 0.2); color: #60a5fa;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .title { font-size: 18px; font-weight: 500; color: #1a1a1a; }
        .subtitle { font-size: 12px; font-weight: 500; color: #666; text-transform: uppercase; margin-top: 2px; }
        
        /* Inlet Slider Display (Interactive) */
        .slider-track {
            height: 12px; border-radius: 12px; margin-bottom: 24px;
            background: rgba(240, 240, 240, 0.9);
            box-shadow: inset 2px 2px 5px rgba(255,255,255,0.8), inset -1px -1px 2px rgba(0,0,0,0.1);
            border-bottom: 1px solid rgba(0,0,0,0.05);
            border-top: 1px solid rgba(255,255,255,0.6);
            position: relative; overflow: hidden;
            cursor: pointer; touch-action: none;
        }
        .slider-fill {
            position: absolute; top: 0; left: 0; bottom: 0;
            background: #3b82f6;
            box-shadow: 2px 0 5px rgba(59, 130, 246, 0.4);
            border-radius: 12px; transition: width 0.5s ease-out;
        }
        
        .controls {
            display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;
        }
        .control-btn {
            height: 48px; border-radius: 12px; background: rgba(0,0,0,0.03);
            border: 1px solid rgba(0,0,0,0.05);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.2s; color: rgba(0,0,0,0.6);
        }
        /* Active/Pressed State (Inlet) */
        .control-btn:active, .control-btn.active {
            background: rgba(255, 255, 255, 0.9);
            box-shadow: inset 2px 2px 5px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.8);
            border-top: 1px solid rgba(255,255,255,0.6);
            transform: scale(0.98);
            color: #3b82f6;
        }

      </style>
      <div class="card">
        <div class="header">
            <div class="icon-box">
                <ha-icon icon="mdi:window-shutter"></ha-icon>
            </div>
            <div>
                <div class="title">${this.config.name || 'Shutter'}</div>
                <div class="subtitle">${statusText}</div>
            </div>
        </div>
        
        <div class="slider-track">
            <div class="slider-fill" style="width: ${pos}%"></div>
        </div>
        
        <div class="controls">
            <div class="control-btn ${isOpening ? 'active' : ''}" data-action="up">
                <ha-icon icon="mdi:arrow-up"></ha-icon>
            </div>
            <div class="control-btn" data-action="stop">
                <ha-icon icon="mdi:pause"></ha-icon>
            </div>
            <div class="control-btn ${isClosing ? 'active' : ''}" data-action="down">
                <ha-icon icon="mdi:arrow-down"></ha-icon>
            </div>
        </div>
      </div>
    `;
    
    this.setupListeners();
  }
}

customElements.define('prism-shutter-light', PrismShutterLightCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "prism-shutter-light",
  name: "Prism Shutter Light",
  preview: true,
  description: "A custom shutter card with inlet styling"
});
