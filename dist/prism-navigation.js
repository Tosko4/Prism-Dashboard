/**
 * Prism Navigation Card
 * A centered navigation bar for dashboard views with glassmorphism styling
 */

class PrismNavigationCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = null;
    this._currentPath = '';
  }

  static getStubConfig() {
    return {
      tab_1_name: "Home",
      tab_1_path: "home",
      tab_1_icon: "mdi:home",
      tab_2_name: "Rooms",
      tab_2_path: "rooms",
      tab_2_icon: "",
      active_color: "#2196f3",
      show_icons: true
    };
  }

  static getConfigForm() {
    return {
      schema: [
        {
          name: "active_color",
          label: "Active Tab Color",
          selector: { color_rgb: {} }
        },
        {
          name: "show_icons",
          label: "Show Icons next to Text",
          selector: { boolean: {} }
        },
        {
          name: "icon_only",
          label: "Icon Only Mode (hide text, show only icons)",
          selector: { boolean: {} }
        },
        // Tab 1
        {
          type: 'expandable',
          name: '',
          title: '📍 Tab 1',
          schema: [
            { name: "tab_1_name", label: "Name (displayed text)", selector: { text: {} } },
            { name: "tab_1_path", label: "Path (view path, e.g. 'erdgeschoss')", selector: { text: {} } },
            { name: "tab_1_icon", label: "Icon (optional, e.g. mdi:home)", selector: { icon: {} } }
          ]
        },
        // Tab 2
        {
          type: 'expandable',
          name: '',
          title: '📍 Tab 2',
          schema: [
            { name: "tab_2_name", label: "Name", selector: { text: {} } },
            { name: "tab_2_path", label: "Path", selector: { text: {} } },
            { name: "tab_2_icon", label: "Icon", selector: { icon: {} } }
          ]
        },
        // Tab 3
        {
          type: 'expandable',
          name: '',
          title: '📍 Tab 3',
          schema: [
            { name: "tab_3_name", label: "Name", selector: { text: {} } },
            { name: "tab_3_path", label: "Path", selector: { text: {} } },
            { name: "tab_3_icon", label: "Icon", selector: { icon: {} } }
          ]
        },
        // Tab 4
        {
          type: 'expandable',
          name: '',
          title: '📍 Tab 4',
          schema: [
            { name: "tab_4_name", label: "Name", selector: { text: {} } },
            { name: "tab_4_path", label: "Path", selector: { text: {} } },
            { name: "tab_4_icon", label: "Icon", selector: { icon: {} } }
          ]
        },
        // Tab 5
        {
          type: 'expandable',
          name: '',
          title: '📍 Tab 5',
          schema: [
            { name: "tab_5_name", label: "Name", selector: { text: {} } },
            { name: "tab_5_path", label: "Path", selector: { text: {} } },
            { name: "tab_5_icon", label: "Icon", selector: { icon: {} } }
          ]
        },
        // Tab 6
        {
          type: 'expandable',
          name: '',
          title: '📍 Tab 6',
          schema: [
            { name: "tab_6_name", label: "Name", selector: { text: {} } },
            { name: "tab_6_path", label: "Path", selector: { text: {} } },
            { name: "tab_6_icon", label: "Icon", selector: { icon: {} } }
          ]
        },
        // Tab 7
        {
          type: 'expandable',
          name: '',
          title: '📍 Tab 7',
          schema: [
            { name: "tab_7_name", label: "Name", selector: { text: {} } },
            { name: "tab_7_path", label: "Path", selector: { text: {} } },
            { name: "tab_7_icon", label: "Icon", selector: { icon: {} } }
          ]
        },
        // Tab 8
        {
          type: 'expandable',
          name: '',
          title: '📍 Tab 8',
          schema: [
            { name: "tab_8_name", label: "Name", selector: { text: {} } },
            { name: "tab_8_path", label: "Path", selector: { text: {} } },
            { name: "tab_8_icon", label: "Icon", selector: { icon: {} } }
          ]
        }
      ]
    };
  }

  setConfig(config) {
    // Build tabs array from individual tab_X fields OR from tabs array
    let tabs = [];
    
    if (config.tabs && Array.isArray(config.tabs)) {
      // Legacy support: tabs array directly provided
      tabs = config.tabs;
    } else {
      // New format: individual tab_X_name, tab_X_path, tab_X_icon fields
      for (let i = 1; i <= 8; i++) {
        const name = config[`tab_${i}_name`];
        const path = config[`tab_${i}_path`];
        const icon = config[`tab_${i}_icon`];
        
        // Only add tab if at least name OR path is defined
        if (name || path) {
          tabs.push({
            name: name || path || `Tab ${i}`,
            path: path || name?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `tab-${i}`,
            icon: icon || ''
          });
        }
      }
    }
    
    if (tabs.length === 0) {
      throw new Error('Please define at least one tab (set Tab 1 Name and Path)');
    }
    
    this._config = { 
      ...config,
      tabs: tabs,
      active_color: this._normalizeColor(config.active_color) || '#2196f3',
      show_icons: config.show_icons || false,
      icon_only: config.icon_only || false
    };
    
    this._updateCard();
  }

  _normalizeColor(color) {
    if (Array.isArray(color) && color.length >= 3) {
      const r = color[0].toString(16).padStart(2, '0');
      const g = color[1].toString(16).padStart(2, '0');
      const b = color[2].toString(16).padStart(2, '0');
      return `#${r}${g}${b}`;
    }
    return color;
  }

  set hass(hass) {
    this._hass = hass;
    // Get current path from URL
    this._currentPath = this._getCurrentPath();
    if (this._config) {
      this._updateCard();
    }
  }

  _getCurrentPath() {
    // Try to get the current view path from the URL
    const path = window.location.pathname;
    // Extract view name from path like /lovelace/erdgeschoss or /dashboard-name/view-name
    const match = path.match(/\/([^\/]+)\/([^\/]+)$/);
    if (match) {
      return match[2];
    }
    // Fallback: try to get from hash
    const hash = window.location.hash;
    if (hash) {
      const hashMatch = hash.match(/#([^\/]+)/);
      if (hashMatch) return hashMatch[1];
    }
    // Default to first segment after lovelace
    const segments = path.split('/').filter(s => s);
    if (segments.length >= 2 && segments[0].includes('lovelace')) {
      return segments[1];
    }
    if (segments.length >= 2) {
      return segments[segments.length - 1];
    }
    return '';
  }

  getCardSize() {
    return 1;
  }

  connectedCallback() {
    if (this._config) {
      this._updateCard();
    }
    
    // Listen for URL changes to update active state
    window.addEventListener('popstate', () => this._handlePathChange());
    window.addEventListener('location-changed', () => this._handlePathChange());
    
    // Also listen for custom event from HA
    window.addEventListener('hass-more-info', () => {
      setTimeout(() => this._handlePathChange(), 100);
    });
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', () => this._handlePathChange());
    window.removeEventListener('location-changed', () => this._handlePathChange());
  }

  _handlePathChange() {
    const newPath = this._getCurrentPath();
    if (newPath !== this._currentPath) {
      this._currentPath = newPath;
      this._updateCard();
    }
  }

  _isTabActive(tab) {
    if (!tab.path) return false;
    const tabPath = tab.path.toLowerCase().replace(/[^a-z0-9]/g, '');
    const currentPath = this._currentPath.toLowerCase().replace(/[^a-z0-9]/g, '');
    return tabPath === currentPath;
  }

  _handleTabClick(tab) {
    if (!tab.path) return;
    
    // Navigate to the view
    const event = new CustomEvent('hass-navigate', {
      bubbles: true,
      composed: true,
      detail: { path: tab.path }
    });
    this.dispatchEvent(event);
    
    // Fallback: direct navigation
    const currentUrl = window.location.pathname;
    const basePath = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
    const newPath = `${basePath}/${tab.path}`;
    
    // Use History API
    history.pushState(null, '', newPath);
    window.dispatchEvent(new Event('location-changed'));
    
    // Update state immediately
    this._currentPath = tab.path;
    this._updateCard();
  }

  _updateCard() {
    if (!this._config) return;
    
    const tabs = this._config.tabs || [];
    const activeColor = this._config.active_color || '#2196f3';
    const showIcons = this._config.show_icons;
    const iconOnly = this._config.icon_only;
    
    // Re-check current path
    this._currentPath = this._getCurrentPath();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          justify-content: center;
          width: 100%;
          box-sizing: border-box;
        }
        
        .nav-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 8px 16px;
          border-radius: 50px;
          background: rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 
            inset 2px 2px 5px rgba(0, 0, 0, 0.5),
            inset -1px -1px 3px rgba(255, 255, 255, 0.08),
            0 8px 32px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .nav-tab {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          margin: 0 4px;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.5);
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 25px;
          white-space: nowrap;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        .nav-tab:hover {
          color: rgba(255, 255, 255, 0.85);
          background: rgba(255, 255, 255, 0.05);
        }
        
        .nav-tab.active {
          color: ${activeColor};
          font-weight: 600;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .nav-tab.active::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background: ${activeColor};
          border-radius: 1px;
          box-shadow: 0 0 8px ${activeColor};
        }
        
        .nav-tab:active {
          transform: scale(0.96);
        }
        
        .nav-tab ha-icon {
          --mdc-icon-size: 18px;
          transition: all 0.25s ease;
        }
        
        .nav-tab.active ha-icon {
          filter: drop-shadow(0 0 4px ${activeColor});
        }
        
        .nav-tab-text {
          line-height: 1;
        }
        
        /* Icon only mode */
        .nav-tab.icon-only {
          padding: 12px 16px;
        }
        
        .nav-tab.icon-only .nav-tab-text {
          display: none;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .nav-container {
            padding: 6px 12px;
          }
          
          .nav-tab {
            padding: 8px 14px;
            font-size: 11px;
            letter-spacing: 1.5px;
          }
          
          .nav-tab ha-icon {
            --mdc-icon-size: 16px;
          }
        }
        
        @media (max-width: 480px) {
          .nav-tab {
            padding: 8px 10px;
            font-size: 10px;
            letter-spacing: 1px;
            margin: 0 2px;
          }
          
          .nav-tab.icon-only {
            padding: 10px 12px;
          }
        }
      </style>
      
      <div class="nav-container">
        ${tabs.map(tab => {
          const isActive = this._isTabActive(tab);
          const hasIcon = showIcons && tab.icon;
          const isIconOnly = iconOnly && tab.icon;
          
          return `
            <button class="nav-tab ${isActive ? 'active' : ''} ${isIconOnly ? 'icon-only' : ''}" 
                    data-path="${tab.path || ''}">
              ${hasIcon || isIconOnly ? `<ha-icon icon="${tab.icon}"></ha-icon>` : ''}
              <span class="nav-tab-text">${tab.name || ''}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;

    // Add event listeners
    this._setupEventListeners();
  }

  _setupEventListeners() {
    const tabs = this.shadowRoot.querySelectorAll('.nav-tab');
    tabs.forEach(tabElement => {
      tabElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const path = tabElement.dataset.path;
        const tab = this._config.tabs.find(t => t.path === path);
        if (tab) {
          this._handleTabClick(tab);
        }
      });
    });
  }
}

customElements.define('prism-navigation', PrismNavigationCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "prism-navigation",
  name: "Prism Navigation",
  preview: true,
  description: "A centered navigation bar for switching between dashboard views with glassmorphism styling"
});
