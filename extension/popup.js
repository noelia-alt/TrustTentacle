// TrustTentacle Popup Script - The Octopus Interface 🐙

class TrustTentaclePopup {
  constructor() {
    this.currentTab = null;
    this.verificationResult = null;
    this.settings = {};
    this.stats = {};
    
    this.init();
  }

  async init() {
    console.log('🐙 TrustTentacle popup initializing...');
    
    // Get current tab
    await this.getCurrentTab();
    
    // Load settings and stats
    await this.loadSettings();
    await this.loadStats();
    
    // Setup UI
    this.setupUI();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load verification result if available
    await this.loadVerificationResult();
    
    console.log('🐙 Popup initialized successfully');
  }

  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      // Update UI with current site info
      this.updateSiteInfo(tab.url);
    } catch (error) {
      console.error('Error getting current tab:', error);
    }
  }

  updateSiteInfo(url) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      document.getElementById('currentUrl').textContent = url;
      document.getElementById('currentDomain').textContent = domain;
      document.getElementById('reportUrl').textContent = url;
    } catch (error) {
      document.getElementById('currentUrl').textContent = 'URL inválida';
      document.getElementById('currentDomain').textContent = '---';
    }
  }

  async loadSettings() {
    try {
      this.settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      this.updateSettingsUI();
    } catch (error) {
      console.error('Error loading settings:', error);
      // Default settings
      this.settings = {
        enabled: true,
        autoCheck: true,
        notifications: true,
        checkLevel: 'basic'
      };
    }
  }

  async loadStats() {
    try {
      this.stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
      this.updateStatsUI();
    } catch (error) {
      console.error('Error loading stats:', error);
      this.stats = {
        urlsChecked: 0,
        threatsBlocked: 0,
        reportsSubmitted: 0
      };
    }
  }

  async loadVerificationResult() {
    if (!this.currentTab) return;
    
    try {
      const result = await chrome.storage.local.get([`result_${this.currentTab.id}`]);
      const verificationData = result[`result_${this.currentTab.id}`];
      
      if (verificationData && Date.now() - verificationData.timestamp < 300000) { // 5 minutes
        this.verificationResult = verificationData;
        this.updateVerificationUI(verificationData);
      } else {
        this.showVerificationStatus('pending');
      }
    } catch (error) {
      console.error('Error loading verification result:', error);
    }
  }

  setupUI() {
    // Update settings UI
    this.updateSettingsUI();
    
    // Update stats UI
    this.updateStatsUI();
    
    // Set initial tentacle states
    this.resetTentacleStates();
  }

  setupEventListeners() {
    // Main action buttons
    document.getElementById('checkSiteBtn').addEventListener('click', () => this.checkCurrentSite());
    document.getElementById('reportPhishingBtn').addEventListener('click', () => this.showReportModal());
    
    // Settings modal
    document.getElementById('settingsBtn').addEventListener('click', () => this.showSettingsModal());
    document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideSettingsModal());
    document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());
    
    // Report modal
    document.getElementById('closeReportBtn').addEventListener('click', () => this.hideReportModal());
    document.getElementById('cancelReportBtn').addEventListener('click', () => this.hideReportModal());
    document.getElementById('submitReportBtn').addEventListener('click', () => this.submitReport());
    
    // Info panel
    document.getElementById('closeInfoBtn').addEventListener('click', () => this.hideInfoPanel());
    
    // About button
    document.getElementById('aboutBtn').addEventListener('click', () => this.showAbout());
    
    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.hideAllModals();
      }
    });
  }

  async checkCurrentSite() {
    if (!this.currentTab) return;
    
    this.showVerificationStatus('checking');
    this.animateTentacles('checking');
    
    try {
      const result = await chrome.runtime.sendMessage({
        type: 'CHECK_URL',
        url: this.currentTab.url
      });
      
      if (result && !result.error) {
        this.verificationResult = result;
        this.updateVerificationUI(result);
        this.updateStats();
      } else {
        throw new Error(result?.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Site check failed:', error);
      this.showVerificationStatus('error', 'Error al verificar el sitio');
      this.animateTentacles('error');
    }
  }

  updateVerificationUI(result) {
    // Update main status
    this.showVerificationStatus(result.verdict.toLowerCase(), this.getVerdictMessage(result));
    
    // Update tentacles based on result
    this.updateTentacleStates(result.tentacles);
    
    // Show additional info if available
    if (result.warnings && result.warnings.length > 0) {
      this.showInfoPanel(result);
    }
  }

  showVerificationStatus(status, message = null) {
    const indicator = document.getElementById('statusIndicator');
    const statusDetails = document.getElementById('statusDetails');
    
    // Remove all status classes
    indicator.className = 'status-indicator';
    
    let icon, text, details;
    
    switch (status) {
      case 'safe':
        indicator.classList.add('safe');
        icon = '✅';
        text = 'SITIO SEGURO';
        details = message || 'Este sitio ha sido verificado como oficial';
        break;
      case 'dangerous':
        indicator.classList.add('danger');
        icon = '⚠️';
        text = 'PELIGRO';
        details = message || 'Este sitio ha sido reportado como malicioso';
        break;
      case 'suspicious':
        indicator.classList.add('warning');
        icon = '⚠️';
        text = 'SOSPECHOSO';
        details = message || 'Este sitio muestra características sospechosas';
        break;
      case 'unverified':
        indicator.classList.add('warning');
        icon = '❓';
        text = 'NO VERIFICADO';
        details = message || 'Este sitio no está en nuestra base de datos';
        break;
      case 'checking':
        icon = '🔍';
        text = 'VERIFICANDO...';
        details = 'Los tentáculos están explorando...';
        break;
      case 'error':
        indicator.classList.add('danger');
        icon = '❌';
        text = 'ERROR';
        details = message || 'No se pudo verificar el sitio';
        break;
      default:
        icon = '⏳';
        text = 'PENDIENTE';
        details = 'Haz clic en "Verificar Sitio" para comenzar';
    }
    
    document.querySelector('.status-icon').textContent = icon;
    document.querySelector('.status-text').textContent = text;
    statusDetails.textContent = details;
  }

  getVerdictMessage(result) {
    switch (result.verdict) {
      case 'SAFE':
        if (result.tentacles?.blockchain?.entity) {
          return `Sitio oficial de ${result.tentacles.blockchain.entity.name}`;
        }
        return 'Sitio verificado como seguro';
      case 'DANGEROUS':
        return 'Sitio reportado como malicioso';
      case 'SUSPICIOUS':
        return 'Sitio con características sospechosas';
      case 'UNVERIFIED':
        return 'Sitio no verificado - procede con precaución';
      default:
        return 'Estado desconocido';
    }
  }

  updateTentacleStates(tentacles) {
    if (!tentacles) return;
    
    Object.entries(tentacles).forEach(([key, data]) => {
      const element = document.querySelector(`[data-tentacle="${this.mapTentacleName(key)}"]`);
      if (element) {
        element.className = 'tentacle-item';
        
        if (data.status === 'completed') {
          if (data.isOfficial || data.confidence > 70) {
            element.classList.add('success');
          } else if (data.confidence > 30 || data.isReported) {
            element.classList.add('warning');
          } else {
            element.classList.add('success');
          }
        } else if (data.status === 'error') {
          element.classList.add('error');
        }
      }
    });
  }

  mapTentacleName(apiName) {
    const mapping = {
      'blockchain': 'blockchain',
      'phishingReports': 'community',
      'externalAPIs': 'threat',
      'ssl': 'ssl'
    };
    return mapping[apiName] || apiName;
  }

  animateTentacles(state) {
    const items = document.querySelectorAll('.tentacle-item');
    
    items.forEach((item, index) => {
      item.className = 'tentacle-item';
      
      if (state === 'checking') {
        setTimeout(() => {
          item.classList.add('checking');
        }, index * 200);
      } else if (state === 'error') {
        item.classList.add('error');
      }
    });
  }

  resetTentacleStates() {
    const items = document.querySelectorAll('.tentacle-item');
    items.forEach(item => {
      item.className = 'tentacle-item';
    });
  }

  showInfoPanel(result) {
    const panel = document.getElementById('infoPanel');
    const content = document.getElementById('infoContent');
    
    let html = '';
    
    if (result.warnings && result.warnings.length > 0) {
      html += '<h5>⚠️ Advertencias:</h5><ul>';
      result.warnings.forEach(warning => {
        html += `<li>${warning}</li>`;
      });
      html += '</ul>';
    }
    
    if (result.recommendations && result.recommendations.length > 0) {
      html += '<h5>💡 Recomendaciones:</h5><ul>';
      result.recommendations.forEach(rec => {
        html += `<li>${rec}</li>`;
      });
      html += '</ul>';
    }
    
    if (result.confidence !== undefined) {
      html += `<p><strong>Nivel de confianza:</strong> ${result.confidence}%</p>`;
    }
    
    content.innerHTML = html;
    panel.style.display = 'block';
  }

  hideInfoPanel() {
    document.getElementById('infoPanel').style.display = 'none';
  }

  showSettingsModal() {
    document.getElementById('settingsModal').style.display = 'flex';
  }

  hideSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
  }

  showReportModal() {
    document.getElementById('reportModal').style.display = 'flex';
  }

  hideReportModal() {
    document.getElementById('reportModal').style.display = 'none';
  }

  hideAllModals() {
    document.getElementById('settingsModal').style.display = 'none';
    document.getElementById('reportModal').style.display = 'none';
  }

  updateSettingsUI() {
    document.getElementById('autoCheckEnabled').checked = this.settings.autoCheck;
    document.getElementById('notificationsEnabled').checked = this.settings.notifications;
    document.getElementById('checkLevel').value = this.settings.checkLevel;
  }

  async saveSettings() {
    const newSettings = {
      enabled: this.settings.enabled,
      autoCheck: document.getElementById('autoCheckEnabled').checked,
      notifications: document.getElementById('notificationsEnabled').checked,
      checkLevel: document.getElementById('checkLevel').value
    };
    
    try {
      await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: newSettings
      });
      
      this.settings = newSettings;
      this.hideSettingsModal();
      
      // Show success feedback
      this.showTemporaryMessage('Configuración guardada ✅');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showTemporaryMessage('Error al guardar configuración ❌');
    }
  }

  async submitReport() {
    const description = document.getElementById('reportDescription').value;
    const category = document.getElementById('reportCategory').value;
    
    if (description.length < 10) {
      this.showTemporaryMessage('Por favor, proporciona una descripción más detallada');
      return;
    }
    
    try {
      const reportData = {
        url: this.currentTab.url,
        description: description,
        category: category,
        evidence: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          pageTitle: this.currentTab.title,
          reportedFrom: 'popup'
        }
      };
      
      const result = await chrome.runtime.sendMessage({
        type: 'REPORT_PHISHING',
        data: reportData
      });
      
      if (result && !result.error) {
        this.hideReportModal();
        this.showTemporaryMessage('Reporte enviado exitosamente! Gracias por ayudar a la comunidad 🐙');
        
        // Clear form
        document.getElementById('reportDescription').value = '';
        
        // Update stats
        this.stats.reportsSubmitted++;
        this.updateStatsUI();
      } else {
        throw new Error(result?.error || 'Report submission failed');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      this.showTemporaryMessage('Error al enviar el reporte. Inténtalo de nuevo.');
    }
  }

  updateStatsUI() {
    document.getElementById('sitesChecked').textContent = this.stats.urlsChecked || 0;
    document.getElementById('threatsBlocked').textContent = this.stats.threatsBlocked || 0;
  }

  async updateStats() {
    this.stats.urlsChecked = (this.stats.urlsChecked || 0) + 1;
    if (this.verificationResult && (this.verificationResult.verdict === 'DANGEROUS' || this.verificationResult.verdict === 'SUSPICIOUS')) {
      this.stats.threatsBlocked = (this.stats.threatsBlocked || 0) + 1;
    }
    this.updateStatsUI();
  }

  showAbout() {
    const aboutInfo = `
      🐙 TrustTentacle v1.0.0
      
      Tu guardián digital inteligente para el Octopus Hackathon 2025.
      
      Características:
      • 8 tentáculos de verificación
      • Blockchain descentralizado
      • IA para detección de phishing
      • Reportes comunitarios
      
      Desarrollado con 🧠 y ☕
      
      "En el océano digital, solo el pulpo más inteligente puede protegerte"
    `;
    
    alert(aboutInfo);
  }

  showTemporaryMessage(message, duration = 3000) {
    // Create temporary message element
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      animation: fadeInOut ${duration}ms ease-in-out;
    `;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl);
      }
    }, duration);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TrustTentaclePopup();
});

// Add CSS animation for temporary messages
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    20%, 80% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  }
`;
document.head.appendChild(style);
