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

    // Health check banner (non-blocking)
    try {
      const health = await chrome.runtime.sendMessage({ type: 'GET_HEALTH' });
      if (!health?.ok) {
        this.showHealthBanner('Backend offline - using demo heuristics only');
      }
    } catch {
      this.showHealthBanner('Backend offline - using demo heuristics only');
    }
  }

  showHealthBanner(text) {
    try {
      const container = document.querySelector('.popup-container') || document.body;
      const bar = document.createElement('div');
      bar.style.cssText = 'background:#7c2d12;color:#fff;padding:6px 10px;font-size:12px;text-align:center';
      bar.textContent = text;
      container.prepend(bar);
    } catch {}
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
        checkLevel: 'basic',
        apiBaseUrl: 'http://localhost:3001/api/v1'
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
    document.getElementById('closeReportBtn').addEventListener('click', () => this.hideReportModal());
    document.getElementById('cancelReportBtn').addEventListener('click', () => this.hideReportModal());
    document.getElementById('closeInfoBtn').addEventListener('click', () => this.hideInfoPanel());
    document.getElementById('aboutBtn').addEventListener('click', () => this.showAbout());

    // Open dashboard in new tab
    const openDash = document.getElementById('openDashboardBtn');
    if (openDash) {
      openDash.addEventListener('click', () => {
        const url = 'http://localhost:5173';
        chrome.tabs.create({ url });
      });
    }

    // Listen for background events to show toasts
    chrome.runtime.onMessage.addListener((message) => {
      if (message?.type === 'REPORT_SUBMITTED' && message.source !== 'popup') {
        let host = '';
        try { host = new URL(message.url).hostname } catch {}
        this.showTemporaryMessage(`Report submitted${host ? ': ' + host : ''}`, 2500);
        // Increment local stats and refresh
        this.stats.reportsSubmitted = (this.stats.reportsSubmitted || 0) + 1;
        this.updateStatsUI();
        const statsBox = document.querySelector('.stats');
        if (statsBox) {
          statsBox.classList.remove('stat-bump');
          void statsBox.offsetWidth;
          statsBox.classList.add('stat-bump');
        }
      }
    });

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
        const host = (() => { try { return new URL(this.currentTab.url).hostname } catch { return '' } })();
        this.showTemporaryMessage(`Checked: ${result.verdict}${host ? ' - ' + host : ''}`, 2500);
      } else {
        throw new Error(result?.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Site check failed:', error);
      this.showVerificationStatus('error', 'Could not verify this site');
      this.animateTentacles('error');
      this.showTemporaryMessage('Check failed');
    }
  }

  updateVerificationUI(result) {
    this.showVerificationStatus(result.verdict.toLowerCase(), this.getVerdictMessage(result));
    this.updateTentacleStates(result.tentacles);
    if (
      (result.riskIndicators && result.riskIndicators.length > 0) ||
      (result.warnings && result.warnings.length > 0) ||
      (result.recommendations && result.recommendations.length > 0)
    ) {
      this.showInfoPanel(result);
    } else {
      this.hideInfoPanel();
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
        icon = 'ALERT';
        text = 'DANGER';
        details = message || 'This site has been reported as malicious';
        break;
      case 'suspicious':
        indicator.classList.add('warning');
        icon = 'WARN';
        text = 'SUSPICIOUS';
        details = message || 'This site shows suspicious characteristics';
        break;
      case 'unverified':
        indicator.classList.add('warning');
        icon = 'INFO';
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
        icon = 'ERR';
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
        if (result.riskIndicators?.length) {
          return result.riskIndicators[0].title;
        }
        if (result.tentacles?.phishingReports?.isBlacklisted) {
          return 'Multiple community reports classify this site as malicious';
        }
        if (result.warnings?.length) {
          return result.warnings[0];
        }
        return 'Multiple high-risk indicators were detected';
      case 'SUSPICIOUS':
        if (result.riskIndicators?.length) {
          return result.riskIndicators[0].title;
        }
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
        const statusEl = element.querySelector('.tentacle-status');
        element.className = 'tentacle-item';
        if (data.status === 'completed') {
          if (data.isOfficial || (data.confidence || 0) > 70) {
            element.classList.add('success');
            if (statusEl) statusEl.textContent = 'OK';
          } else if ((data.confidence || 0) > 30 || data.isReported) {
            element.classList.add('warning');
            if (statusEl) statusEl.textContent = 'WARN';
          } else {
            element.classList.add('success');
            if (statusEl) statusEl.textContent = 'OK';
          }
        } else if (data.status === 'error') {
          element.classList.add('error');
          if (statusEl) statusEl.textContent = 'ERR';
        } else if (statusEl) {
          statusEl.textContent = '...';
        }
      }
    });
  }

  mapTentacleName(apiName) {
    const mapping = {
      blockchain: 'blockchain',
      phishingReports: 'community',
      externalAPIs: 'threat',
      ssl: 'threat',
      demoHeuristics: 'heuristic',
      aiDetection: 'heuristic'
    };
    return mapping[apiName] || apiName;
  }

  animateTentacles(state) {
    const items = document.querySelectorAll('.tentacle-item');
    items.forEach((item, index) => {
      item.className = 'tentacle-item';
      const statusEl = item.querySelector('.tentacle-status');
      if (state === 'checking') {
        if (statusEl) statusEl.textContent = '...';
        setTimeout(() => { item.classList.add('checking'); }, index * 200);
      } else if (state === 'error') {
        item.classList.add('error');
        if (statusEl) statusEl.textContent = 'ERR';
      }
    });
  }

  resetTentacleStates() {
    const items = document.querySelectorAll('.tentacle-item');
    items.forEach((item) => {
      item.className = 'tentacle-item';
      const statusEl = item.querySelector('.tentacle-status');
      if (statusEl) statusEl.textContent = '...';
    });
  }

  showInfoPanel(result) {
    const panel = document.getElementById('infoPanel');
    const content = document.getElementById('infoContent');
    content.textContent = '';

    if (result.riskIndicators && result.riskIndicators.length > 0) {
      const h = document.createElement('h5');
      h.textContent = 'Risk Indicators';
      content.appendChild(h);

      const list = document.createElement('div');
      list.className = 'risk-indicators';

      result.riskIndicators.forEach((indicator) => {
        const item = document.createElement('div');
        item.className = 'risk-indicator-item';

        const top = document.createElement('div');
        top.className = 'risk-indicator-top';

        const title = document.createElement('div');
        title.className = 'risk-indicator-title';
        title.textContent = String(indicator.title || 'Risk signal');

        const severity = document.createElement('span');
        severity.className = `severity-badge severity-${String(indicator.severity || 'medium').toLowerCase()}`;
        severity.textContent = String(indicator.severity || 'MEDIUM');

        top.appendChild(title);
        top.appendChild(severity);

        item.appendChild(top);

        if (indicator.detail) {
          const detail = document.createElement('div');
          detail.className = 'risk-indicator-detail';
          detail.textContent = String(indicator.detail);
          item.appendChild(detail);
        }

        if (indicator.source) {
          const source = document.createElement('div');
          source.className = 'risk-indicator-source';
          source.textContent = `Source: ${String(indicator.source)}`;
          item.appendChild(source);
        }

        list.appendChild(item);
      });

      content.appendChild(list);
    }

    const addListSection = (title, items) => {
      if (!items || items.length === 0) return;
      const h = document.createElement('h5');
      h.textContent = title;
      const ul = document.createElement('ul');
      items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = String(item);
        ul.appendChild(li);
      });
      content.appendChild(h);
      content.appendChild(ul);
    };

    addListSection('Warnings', result.warnings);
    addListSection('Recommendations', result.recommendations);

    if (result.confidence !== undefined) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = 'Confidence level:';
      p.appendChild(strong);
      p.appendChild(document.createTextNode(` ${result.confidence}%`));
      content.appendChild(p);
    }

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
    const apiInput = document.getElementById('apiBaseUrl');
    if (apiInput) {
      apiInput.value = this.settings.apiBaseUrl || 'http://localhost:3001/api/v1';
    }
  }

  async saveSettings() {
    const newSettings = {
      enabled: this.settings.enabled !== false,
      autoCheck: document.getElementById('autoCheckEnabled').checked,
      notifications: document.getElementById('notificationsEnabled').checked,
      checkLevel: document.getElementById('checkLevel').value,
      apiBaseUrl: (document.getElementById('apiBaseUrl').value || '').trim() || 'http://localhost:3001/api/v1'
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
    const bump = (el) => {
      if (!el) return;
      el.classList.remove('stat-bump');
      void el.offsetWidth; // reflow to restart animation
      el.classList.add('stat-bump');
    };

    const scEl = document.getElementById('sitesChecked');
    const tbEl = document.getElementById('threatsBlocked');
    const rpEl = document.getElementById('reportsSubmitted');

    if (scEl) {
      const next = String(this.stats.urlsChecked || 0);
      const prev = scEl.textContent;
      scEl.textContent = next;
      if (prev !== next) bump(scEl);
    }
    if (tbEl) {
      const next = String(this.stats.threatsBlocked || 0);
      const prev = tbEl.textContent;
      tbEl.textContent = next;
      if (prev !== next) bump(tbEl);
    }
    if (rpEl) {
      const next = String(this.stats.reportsSubmitted || 0);
      const prev = rpEl.textContent;
      rpEl.textContent = next;
      if (prev !== next) bump(rpEl);
    }
  }

  async updateStats() {
    const prevSites = this.stats.urlsChecked || 0;
    const prevThreats = this.stats.threatsBlocked || 0;

    this.stats.urlsChecked = prevSites + 1;
    let verdict = this.verificationResult?.verdict;
    if (verdict === 'DANGEROUS' || verdict === 'SUSPICIOUS') {
      this.stats.threatsBlocked = prevThreats + 1;
    }

    this.updateStatsUI();

    // Flash appropriate color based on event
    const scEl = document.getElementById('sitesChecked');
    const tbEl = document.getElementById('threatsBlocked');
    const flash = (el, cls) => {
      if (!el) return;
      el.classList.remove('stat-flash-ok','stat-flash-warn','stat-flash-danger');
      void el.offsetWidth;
      el.classList.add(cls);
      setTimeout(() => el.classList.remove(cls), 600);
    };

    // Always flash green for a successful site check increment
    if (this.stats.urlsChecked !== prevSites && scEl) flash(scEl, 'stat-flash-ok');

    if (this.stats.threatsBlocked !== prevThreats && tbEl) {
      flash(tbEl, verdict === 'DANGEROUS' ? 'stat-flash-danger' : 'stat-flash-warn');
    }
  }

  showAbout() {
    const aboutInfo = [
      'TrustTentacle v1.0.0',
      '',
      'Browser-first anti-phishing MVP for the Octopus Hackathon 2025.',
      '',
      'Core MVP:',
      '- Heuristic analysis',
      '- Verified domain checks',
      '- Community reports',
      '- Live dashboard integration',
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
