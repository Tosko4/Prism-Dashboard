
class PrismButtonCard extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._config = null;
  }

  static getStubConfig() {
    return { entity: "light.example_light", name: "Example", icon: "mdi:lightbulb", layout: "horizontal", active_color: "#ffc864" }
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "entity",
          required: true,
          selector: { entity: {} }
        },
        {
          name: "name",
          selector: { text: {} }
        },
        {
          name: "icon",
          selector: { icon: {} }
        },
        {
          name: "layout",
          selector: {
            select: {
              options: ["horizontal", "vertical"]
            }
          }
        },
        {
          name: "active_color",
          selector: { color_rgb: {} }
        }
      ]
    };
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }
    this._config = config;
    if (!this._config.icon) {
      this._config.icon = "mdi:lightbulb";
    }
    if (!this._config.layout) {
      this._config.layout = "horizontal";
    }
    // Normalize active_color (convert RGB arrays to hex if needed)
    if (this._config.active_color) {
      this._config.active_color = this._normalizeColor(this._config.active_color);
    }
    this._updateCard();
  }

  _normalizeColor(color) {
    // If color is an array [r, g, b] from color_rgb selector, convert to hex
    if (Array.isArray(color) && color.length >= 3) {
      const r = color[0].toString(16).padStart(2, '0');
      const g = color[1].toString(16).padStart(2, '0');
      const b = color[2].toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    // If it's already a hex string, return as is
    return color;
  }

  set hass(hass) {
    this._hass = hass;
    if (this._config) {
      this._updateCard();
    }
  }

  getCardSize() {
    return 1;
  }

  connectedCallback() {
    if (this._config) {
      this._updateCard();
    }
  }

  _isActive() {
    if (!this._hass || !this._config.entity) return false;
    const entity = this._hass.states[this._config.entity];
    if (!entity) return false;
    
    const state = entity.state;
    if (this._config.entity.startsWith('lock.')) {
      return state === 'locked';
    } else if (this._config.entity.startsWith('climate.')) {
      return state === 'heat' || state === 'auto';
    } else {
      return state === 'on' || state === 'open';
    }
  }

  _getIconColor() {
    if (!this._hass || !this._config.entity) return null;
    const entity = this._hass.states[this._config.entity];
    if (!entity) return null;
    
    const state = entity.state;
    const isActive = this._isActive();
    
    // If active_color is configured and entity is active, use it
    if (isActive && this._config.active_color) {
      const hex = this._config.active_color;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { color: `rgb(${r}, ${g}, ${b})`, shadow: `rgba(${r}, ${g}, ${b}, 0.6)` };
    }
    
    // Otherwise use default colors based on entity type
    if (this._config.entity.startsWith('lock.')) {
      if (state === 'locked') {
        return { color: 'rgb(76, 175, 80)', shadow: 'rgba(76, 175, 80, 0.6)' };
      } else if (state === 'unlocked') {
        return { color: 'rgb(244, 67, 54)', shadow: 'rgba(244, 67, 54, 0.6)' };
      }
    } else if (this._config.entity.startsWith('climate.')) {
      if (state === 'heat' || state === 'auto') {
        return { color: 'rgb(255, 152, 0)', shadow: 'rgba(255, 152, 0, 0.6)' };
      }
    } else {
      if (state === 'on' || state === 'open') {
        return { color: 'rgb(255, 200, 100)', shadow: 'rgba(255, 200, 100, 0.6)' };
      }
    }
    return null;
  }

  _handleTap() {
    if (!this._hass || !this._config.entity) return;
    const domain = this._config.entity.split('.')[0];
    this._hass.callService(domain, 'toggle', {
      entity_id: this._config.entity
    });
  }

  _handleHold() {
    if (!this._hass || !this._config.entity) return;
    const event = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId: this._config.entity }
    });
    this.dispatchEvent(event);
  }

  _updateCard() {
    if (!this._config || !this._config.entity) return;
    
    const entity = this._hass ? this._hass.states[this._config.entity] : null;
    const isActive = entity ? this._isActive() : false;
    const iconColor = entity ? this._getIconColor() : null;
    const state = entity ? entity.state : 'off';
    const friendlyName = this._config.name || (entity ? entity.attributes.friendly_name : null) || this._config.entity;
    const layout = this._config.layout || 'horizontal';

    this.innerHTML = `
      <style>
        :host {
          display: block;
        }
        ha-card {
          background: ${isActive ? 'rgba(20, 20, 20, 0.6)' : 'rgba(30, 32, 36, 0.6)'} !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          border-radius: 16px !important;
          border: 1px solid rgba(255,255,255,0.05);
          border-top: ${isActive ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255, 255, 255, 0.15)'} !important;
          border-bottom: ${isActive ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0, 0, 0, 0.4)'} !important;
          box-shadow: ${isActive ? 'inset 2px 2px 5px rgba(0,0,0,0.8), inset -1px -1px 2px rgba(255,255,255,0.1)' : '0 10px 20px -5px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0,0,0,0.3)'} !important;
          --primary-text-color: #e0e0e0;
          --secondary-text-color: #999;
          transition: all 0.2s ease-in-out;
          margin-bottom: 8px;
          width: 95% !important;
          margin-left: auto !important;
          margin-right: auto !important;
          min-height: 60px !important;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transform: ${isActive ? 'translateY(2px)' : 'none'};
          cursor: pointer;
        }
        ha-card:active {
          transform: scale(0.98) ${isActive ? 'translateY(2px)' : ''};
        }
        .card-content {
          display: flex;
          flex-direction: ${layout === 'vertical' ? 'column' : 'row'};
          align-items: center;
          padding: 16px;
          gap: 16px;
        }
        .icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
          width: 48px;
          height: 48px;
        }
        .icon-circle {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          ${iconColor ? `
            background: ${iconColor.color.replace('rgb', 'rgba').replace(')', ', 0.2)')};
            box-shadow: 0 0 12px ${iconColor.shadow};
          ` : `
            background: rgba(255, 255, 255, 0.05);
          `}
          transition: all 0.3s ease;
        }
        .icon-wrapper {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        ha-icon {
          --mdc-icon-size: 24px;
          ${iconColor ? `color: ${iconColor.color} !important; filter: drop-shadow(0 0 6px ${iconColor.shadow});` : 'color: rgba(255, 255, 255, 0.6);'}
        }
        .info {
          flex: 1;
          min-width: 0;
          overflow: hidden;
        }
        .name {
          font-size: 16px;
          font-weight: 500;
          color: #e0e0e0;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .state {
          font-size: 14px;
          color: #999;
          text-transform: capitalize;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      </style>
      <ha-card>
        <div class="card-content">
          <div class="icon-container">
            <div class="icon-circle"></div>
            <div class="icon-wrapper">
              <ha-icon icon="${this._config.icon}"></ha-icon>
            </div>
          </div>
          <div class="info">
            <div class="name">${friendlyName}</div>
            <div class="state">${state}</div>
          </div>
        </div>
      </ha-card>
    `;

    // Add event listeners
    const card = this.querySelector('ha-card');
    if (card) {
      card.addEventListener('click', () => this._handleTap());
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this._handleHold();
      });
      let touchStart = 0;
      card.addEventListener('touchstart', () => {
        touchStart = Date.now();
      });
      card.addEventListener('touchend', (e) => {
        if (Date.now() - touchStart > 500) {
          e.preventDefault();
          this._handleHold();
        } else {
          this._handleTap();
        }
      });
    }
  }
}

customElements.define('prism-button', PrismButtonCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "prism-button",
  name: "Prism Button",
  preview: true,
  description: "A glassmorphism-styled entity card with neumorphism effects and glowing icon circle"
});
