// TrustTentacle Popup Script - The Octopus Interface (English)

class TrustTentaclePopup {
  constructor() {
    this.currentTab = null;
    this.verificationResult = null;
    this.settings = {};
    this.stats = {};
    this.init();
  }

  async init() {
    console.log('TrustTentacle popup initializing...');

    await this.getCurrentTab();
    await this.loadSettings();
    await this.loadStats();

    this.setupUI();
    this.setupEventListeners();
    await this.loadVerificationResult();

    console.log('Popup initialized successfully');
  }

  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      this.updateSiteInfo(tab?.url || '');
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
      document.getElementById('currentUrl').textContent = 'Invalid URL';
      document.getElementById('currentDomain').textContent = '---';
    }
  }

  async loadSettings() {
    try {
      this.settings = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      this.updateSettingsUI();
    } catch (error) {
      console.error('Error loading settings:', error);
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
      this.stats = { urlsChecked: 0, threatsBlocked: 0, reportsSubmitted: 0 };
    }
  }

  async loadVerificationResult() {
    if (!this.currentTab) return;
    try {
      const result = await chrome.storage.local.get([`result_${this.currentTab.id}`]);
      const verificationData = result[`result_${this.currentTab.id}`];
      if (verificationData && Date.now() - verificationData.timestamp < 300000) {
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
    this.updateSettingsUI();
    this.updateStatsUI();
    this.resetTentacleStates();
  }

  setupEventListeners() {
    document.getElementById('checkSiteBtn').addEventListener('click', () => this.checkCurrentSite());
    document.getElementById('reportPhishingBtn').addEventListener('click', () => this.showReportModal());

    document.getElementById('settingsBtn').addEventListener('click', () => this.showSettingsModal());
    document.getElementById('closeSettingsBtn').addEventListener('click', () => this.hideSettingsModal());
    document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());

    document.getElementById('submitReportBtn').addEventListener('click', () => this.submitReport());
    document.getElementById('closeInfoBtn').addEventListener('click', () => this.hideInfoPanel());
    document.getElementById('aboutBtn').addEventListener('click', () => this.showAbout());

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
      const result = await chrome.runtime.sendMessage({ type: 'CHECK_URL', url: this.currentTab.url });
      if (result && !result.error) {
        this.verificationResult = result;
        this.updateVerificationUI(result);
        this.updateStats();
      } else {
        throw new Error(result?.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Site check failed:', error);
      this.showVerificationStatus('error', 'Could not verify this site');
      this.animateTentacles('error');
    }
  }

  updateVerificationUI(result) {
    this.showVerificationStatus(result.verdict.toLowerCase(), this.getVerdictMessage(result));
    this.updateTentacleStates(result.tentacles);
    if (result.warnings && result.warnings.length > 0) {
      this.showInfoPanel(result);
    }
  }

  showVerificationStatus(status, message = null) {
    const indicator = document.getElementById('statusIndicator');
    const statusDetails = document.getElementById('statusDetails');
    indicator.className = 'status-indicator';

    let icon, text, details;
    switch (status) {
      case 'safe':
        indicator.classList.add('safe');
        icon = 'OK';
        text = 'SAFE SITE';
        details = message || 'This site is verified as official';
        break;
      case 'dangerous':
        indicator.classList.add('danger');
        icon = 'X';
        text = 'DANGER';
        details = message || 'This site has been reported as malicious';
        break;
      case 'suspicious':
        indicator.classList.add('warning');
        icon = '!';
        text = 'SUSPICIOUS';
        details = message || 'This site shows suspicious characteristics';
        break;
      case 'unverified':
        indicator.classList.add('warning');
        icon = '?';
        text = 'UNVERIFIED';
        details = message || 'This site is not in our database';
        break;
      case 'checking':
        icon = '...';
        text = 'CHECKING...';
        details = 'Tentacles are checking...';
        break;
      case 'error':
        indicator.classList.add('danger');
        icon = '-';
        text = 'ERROR';
        details = message || 'Could not verify this site';
        break;
      default:
        icon = '...';
        text = 'PENDING';
        details = 'Click "Check Site" to start';
    }

    document.querySelector('.status-icon').textContent = icon;
    document.querySelector('.status-text').textContent = text;
    statusDetails.textContent = details;
  }

  getVerdictMessage(result) {
    switch (result.verdict) {
      case 'SAFE':
        if (result.tentacles?.blockchain?.entity) {
          return `Official site of ${result.tentacles.blockchain.entity.name}`;
        }
        return 'Site verified as safe';
      case 'DANGEROUS':
        return 'Site reported as malicious';
      case 'SUSPICIOUS':
        return 'Site with suspicious characteristics';
      case 'UNVERIFIED':
        return 'Site not verified - proceed with caution';
      default:
        return 'Unknown status';
    }
  }

  updateTentacleStates(tentacles) {
    if (!tentacles) return;
    Object.entries(tentacles).forEach(([key, data]) => {
      const element = document.querySelector(`[data-tentacle="${this.mapTentacleName(key)}"]`);
      if (element) {
        element.className = 'tentacle-item';
        if (data.status === 'completed') {
          if (data.isOfficial || (data.confidence || 0) > 70) {
            element.classList.add('success');
          } else if ((data.confidence || 0) > 30 || data.isReported) {
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
      blockchain: 'blockchain',
      phishingReports: 'community',
      externalAPIs: 'threat',
      ssl: 'ssl'
    };
    return mapping[apiName] || apiName;
  }

  animateTentacles(state) {
    const items = document.querySelectorAll('.tentacle-item');
    items.forEach((item, index) => {
      item.className = 'tentacle-item';
      if (state === 'checking') {
        setTimeout(() => { item.classList.add('checking'); }, index * 200);
      } else if (state === 'error') {
        item.classList.add('error');
      }
    });
  }

  resetTentacleStates() {
    const items = document.querySelectorAll('.tentacle-item');
    items.forEach(item => { item.className = 'tentacle-item'; });
  }

  showInfoPanel(result) {
    const panel = document.getElementById('infoPanel');
    const content = document.getElementById('infoContent');
    let html = '';
    if (result.warnings && result.warnings.length > 0) {
      html += '<h5>Warnings:</h5><ul>';
      result.warnings.forEach(warning => { html += `<li>${warning}</li>`; });
      html += '</ul>';
    }
    if (result.recommendations && result.recommendations.length > 0) {
      html += '<h5>Recommendations:</h5><ul>';
      result.recommendations.forEach(rec => { html += `<li>${rec}</li>`; });
      html += '</ul>';
    }
    if (result.confidence !== undefined) {
      html += `<p><strong>Confidence level:</strong> ${result.confidence}%</p>`;
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
    this.hideSettingsModal();
    this.hideReportModal();
  }

  updateSettingsUI() {
    document.getElementById('autoCheckEnabled').checked = !!this.settings.autoCheck;
    document.getElementById('notificationsEnabled').checked = !!this.settings.notifications;
    document.getElementById('checkLevel').value = this.settings.checkLevel || 'basic';
  }

  async saveSettings() {
    const newSettings = {
      enabled: this.settings.enabled !== false,
      autoCheck: document.getElementById('autoCheckEnabled').checked,
      notifications: document.getElementById('notificationsEnabled').checked,
      checkLevel: document.getElementById('checkLevel').value
    };
    try {
      await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: newSettings });
      this.settings = newSettings;
      this.hideSettingsModal();
      this.showTemporaryMessage('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showTemporaryMessage('Error saving settings');
    }
  }

  async submitReport() {
    const description = document.getElementById('reportDescription').value;
    const category = document.getElementById('reportCategory').value;
    if ((description || '').length < 10) {
      this.showTemporaryMessage('Please provide a more detailed description');
      return;
    }
    try {
      const reportData = {
        url: this.currentTab?.url || '',
        description,
        category,
        evidence: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          pageTitle: this.currentTab?.title || '',
          reportedFrom: 'popup'
        }
      };
      const result = await chrome.runtime.sendMessage({ type: 'REPORT_PHISHING', data: reportData });
      if (result && !result.error) {
        this.hideReportModal();
        this.showTemporaryMessage('Report submitted successfully! Thank you for helping the community.');
        document.getElementById('reportDescription').value = '';
        this.stats.reportsSubmitted = (this.stats.reportsSubmitted || 0) + 1;
        this.updateStatsUI();
      } else {
        throw new Error(result?.error || 'Report submission failed');
      }
    } catch (error) {
      console.error('Report submission error:', error);
      this.showTemporaryMessage('Failed to submit the report. Please try again.');
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
    const aboutInfo = [
      'TrustTentacle v1.0.0',
      '',
      'Your smart digital guardian for the Octopus Hackathon 2025.',
      '',
      'Features:',
      '- 8 verification tentacles',
      '- Decentralized blockchain checks',
      '- AI phishing detection',
      '- Community reports',
      '',
      'Built with care for safer browsing.'
    ].join('\n');
    alert(aboutInfo);
  }

  showTemporaryMessage(message, duration = 3000) {
    const el = document.createElement('div');
    el.style.cssText = [
      'position: fixed',
      'top: 20px',
      'left: 50%',
      'transform: translateX(-50%)',
      'background: rgba(0,0,0,0.8)',
      'color: #fff',
      'padding: 12px 20px',
      'border-radius: 8px',
      'font-size: 14px',
      'z-index: 10000',
      `animation: fadeInOut ${duration}ms ease-in-out`
    ].join(';');
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, duration);
  }
}

document.addEventListener('DOMContentLoaded', () => { new TrustTentaclePopup(); });

const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    20%, 80% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  }
`;
document.head.appendChild(style);

