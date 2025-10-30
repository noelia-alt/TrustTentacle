// TrustTentacle Content Script - Tentacles in Action (English)

(function() {
  'use strict';

  if (window.trustTentacleInjected) return;
  window.trustTentacleInjected = true;

  console.log('TrustTentacle tentacles deployed on:', window.location.hostname);

  const CONFIG = {
    API_BASE_URL: 'http://localhost:3001/api/v1',
    CHECK_DELAY: 2000,
    NOTIFICATION_DURATION: 5000,
    SUSPICIOUS_PATTERNS: [/login/i, /signin/i, /account/i, /verify/i, /update/i, /secure/i]
  };

  let isChecking = false;
  let lastCheckUrl = '';
  let notificationElement = null;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  function initialize() {
    console.log('Initializing TrustTentacle on page...');
    checkCurrentPage();
    monitorNavigation();
    monitorForms();
    chrome.runtime.onMessage.addListener(handleMessage);
  }

  async function checkCurrentPage() {
    const currentUrl = window.location.href;
    if (isChecking || currentUrl === lastCheckUrl) return;
    if (shouldSkipCheck(currentUrl)) return;
    isChecking = true;
    lastCheckUrl = currentUrl;
    try {
      console.log('Checking current page:', currentUrl);
      await delay(CONFIG.CHECK_DELAY);
      const result = await chrome.runtime.sendMessage({ type: 'CHECK_URL', url: currentUrl });
      if (result && !result.error) {
        handleVerificationResult(result);
      } else {
        console.error('Verification failed:', result?.error);
      }
    } catch (error) {
      console.error('Page check error:', error);
    } finally {
      isChecking = false;
    }
  }

  function handleVerificationResult(result) {
    console.log('Verification result:', result);
    switch (result.verdict) {
      case 'DANGEROUS':
        showNotification('DANGER: This site has been reported as malicious!', 'danger');
        highlightSuspiciousElements();
        break;
      case 'SUSPICIOUS':
        showNotification('WARNING: This site shows suspicious characteristics', 'warning');
        break;
      case 'UNVERIFIED':
        if (hasLoginForms()) {
          showNotification('CAUTION: This site is not verified. Be careful with personal information.', 'caution');
        }
        break;
      case 'SAFE':
        if (result.tentacles?.blockchain?.isOfficial) {
          showNotification(`VERIFIED: Official site of ${result.tentacles.blockchain.entity?.name}`, 'safe');
        }
        break;
    }
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(w => console.warn('Warning:', w));
    }
  }

  function showNotification(message, type = 'info') {
    if (notificationElement) notificationElement.remove();
    notificationElement = document.createElement('div');
    notificationElement.className = `trust-tentacle-notification trust-tentacle-${type}`;
    notificationElement.innerHTML = `
      <div class="trust-tentacle-content">
        <div class="trust-tentacle-icon">TT</div>
        <div class="trust-tentacle-message">${message}</div>
        <button class="trust-tentacle-close" onclick="this.parentElement.parentElement.remove()">x</button>
      </div>
    `;
    document.body.appendChild(notificationElement);
    setTimeout(() => {
      if (notificationElement) {
        notificationElement.remove();
        notificationElement = null;
      }
    }, CONFIG.NOTIFICATION_DURATION);
  }

  function highlightSuspiciousElements() {
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input[type="password"], input[type="email"], input[name*="login"], input[name*="user"]');
    [...forms, ...inputs].forEach(el => el.classList.add('trust-tentacle-suspicious'));
  }

  function monitorNavigation() {
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('Navigation detected:', url);
        setTimeout(checkCurrentPage, 1000);
      }
    }).observe(document, { subtree: true, childList: true });

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function() { originalPushState.apply(history, arguments); setTimeout(checkCurrentPage, 1000); };
    history.replaceState = function() { originalReplaceState.apply(history, arguments); setTimeout(checkCurrentPage, 1000); };
    window.addEventListener('popstate', () => { setTimeout(checkCurrentPage, 1000); });
  }

  function monitorForms() {
    document.addEventListener('submit', async (event) => {
      const form = event.target;
      if (hasPasswordField(form) && !isCurrentSiteSafe()) {
        const shouldProceed = confirm(
          'TrustTentacle Warning:\n\n' +
          'You are about to submit sensitive information to a site that is not verified as safe.\n\n' +
          'Are you sure you want to continue?'
        );
        if (!shouldProceed) {
          event.preventDefault();
          console.log('Form submission blocked by user choice');
        }
      }
    });

    document.addEventListener('input', (event) => {
      const input = event.target;
      if (input.type === 'password' && input.value.length > 0 && !isCurrentSiteSafe()) {
        showNotification("Be careful! You're entering a password on an unverified site.", 'caution');
      }
    });
  }

  function handleMessage(message, sender, sendResponse) {
    console.log('Content script received message:', message);
    switch (message.type) {
      case 'SHOW_REPORT_DIALOG':
        showReportDialog();
        break;
      case 'HIGHLIGHT_SUSPICIOUS':
        highlightSuspiciousElements();
        break;
      case 'SHOW_NOTIFICATION':
        showNotification(message.message, message.notificationType);
        break;
    }
  }

  function showReportDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'trust-tentacle-report-dialog';
    dialog.innerHTML = `
      <div class="trust-tentacle-dialog-content">
        <h3>Report Phishing Site</h3>
        <p>Help protect the community by reporting this suspicious site:</p>
        <p><strong>${window.location.href}</strong></p>
        <textarea placeholder="Describe what makes this site suspicious..." rows="4"></textarea>
        <div class="trust-tentacle-dialog-buttons">
          <button class="trust-tentacle-btn-primary" onclick="submitReport()">Submit Report</button>
          <button class="trust-tentacle-btn-secondary" onclick="this.closest('.trust-tentacle-report-dialog').remove()">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);

    window.submitReport = async function() {
      const description = dialog.querySelector('textarea').value;
      if (description.length < 10) {
        alert('Please provide a more detailed description (at least 10 characters).');
        return;
      }
      try {
        const result = await chrome.runtime.sendMessage({
          type: 'REPORT_PHISHING',
          data: {
            url: window.location.href,
            description,
            category: 'phishing',
            evidence: {
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              pageTitle: document.title,
              reportedFrom: 'content_script'
            }
          }
        });
        if (result && !result.error) {
          showNotification('Report submitted! Thank you for helping protect the community.', 'safe');
          dialog.remove();
        } else {
          throw new Error(result?.error || 'Report submission failed');
        }
      } catch (error) {
        console.error('Report submission error:', error);
        alert('Failed to submit report. Please try again later.');
      }
    };
  }

  function shouldSkipCheck(url) {
    const skipPatterns = [/^chrome:/, /^chrome-extension:/, /^moz-extension:/, /^about:/, /^file:/, /^data:/, /localhost:3001/];
    return skipPatterns.some(p => p.test(url));
  }

  function hasLoginForms() {
    const selectors = [
      'input[type="password"]', 'input[name*="password"]', 'input[name*="login"]', 'input[name*="user"]',
      'form[action*="login"]', 'form[action*="signin"]'
    ];
    return selectors.some(sel => document.querySelector(sel));
  }

  function hasPasswordField(form) { return form.querySelector('input[type="password"]') !== null; }
  function isCurrentSiteSafe() { return false; }
  function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

  console.log('TrustTentacle content script loaded and ready!');
})();

