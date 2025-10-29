// TrustTentacle Content Script - The Tentacles in Action 🐙

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.trustTentacleInjected) {
    return;
  }
  window.trustTentacleInjected = true;

  console.log('🐙 TrustTentacle tentacles deployed on:', window.location.hostname);

  // Configuration
  const CONFIG = {
    API_BASE_URL: 'http://localhost:3001/api/v1',
    CHECK_DELAY: 2000, // Wait 2s after page load
    NOTIFICATION_DURATION: 5000,
    SUSPICIOUS_PATTERNS: [
      /login/i,
      /signin/i,
      /account/i,
      /verify/i,
      /update/i,
      /secure/i
    ]
  };

  // State
  let isChecking = false;
  let lastCheckUrl = '';
  let notificationElement = null;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  function initialize() {
    console.log('🐙 Initializing TrustTentacle on page...');
    
    // Check current URL
    checkCurrentPage();
    
    // Monitor for dynamic navigation (SPA)
    monitorNavigation();
    
    // Monitor for suspicious form interactions
    monitorForms();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(handleMessage);
  }

  async function checkCurrentPage() {
    const currentUrl = window.location.href;
    
    // Skip if already checking or same URL
    if (isChecking || currentUrl === lastCheckUrl) {
      return;
    }

    // Skip for certain URLs
    if (shouldSkipCheck(currentUrl)) {
      return;
    }

    isChecking = true;
    lastCheckUrl = currentUrl;

    try {
      console.log('🔍 Checking current page:', currentUrl);
      
      // Wait a bit for page to stabilize
      await delay(CONFIG.CHECK_DELAY);
      
      // Send check request to background script
      const result = await chrome.runtime.sendMessage({
        type: 'CHECK_URL',
        url: currentUrl
      });

      if (result && !result.error) {
        handleVerificationResult(result);
      } else {
        console.error('❌ Verification failed:', result?.error);
      }

    } catch (error) {
      console.error('❌ Page check error:', error);
    } finally {
      isChecking = false;
    }
  }

  function handleVerificationResult(result) {
    console.log('🐙 Verification result:', result);

    // Show notification based on verdict
    switch (result.verdict) {
      case 'DANGEROUS':
        showNotification('⚠️ DANGER: This site has been reported as malicious!', 'danger');
        highlightSuspiciousElements();
        break;
      
      case 'SUSPICIOUS':
        showNotification('⚠️ WARNING: This site shows suspicious characteristics', 'warning');
        break;
      
      case 'UNVERIFIED':
        if (hasLoginForms()) {
          showNotification('🔍 CAUTION: This site is not verified. Be careful with personal information.', 'caution');
        }
        break;
      
      case 'SAFE':
        if (result.tentacles?.blockchain?.isOfficial) {
          showNotification(`✅ VERIFIED: Official site of ${result.tentacles.blockchain.entity?.name}`, 'safe');
        }
        break;
    }

    // Add warnings if any
    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        console.warn('🐙 Warning:', warning);
      });
    }
  }

  function showNotification(message, type = 'info') {
    // Remove existing notification
    if (notificationElement) {
      notificationElement.remove();
    }

    // Create notification element
    notificationElement = document.createElement('div');
    notificationElement.className = `trust-tentacle-notification trust-tentacle-${type}`;
    notificationElement.innerHTML = `
      <div class="trust-tentacle-content">
        <div class="trust-tentacle-icon">🐙</div>
        <div class="trust-tentacle-message">${message}</div>
        <button class="trust-tentacle-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add to page
    document.body.appendChild(notificationElement);

    // Auto-remove after duration
    setTimeout(() => {
      if (notificationElement) {
        notificationElement.remove();
        notificationElement = null;
      }
    }, CONFIG.NOTIFICATION_DURATION);
  }

  function highlightSuspiciousElements() {
    // Highlight login forms and input fields
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input[type="password"], input[type="email"], input[name*="login"], input[name*="user"]');
    
    [...forms, ...inputs].forEach(element => {
      element.classList.add('trust-tentacle-suspicious');
    });
  }

  function monitorNavigation() {
    // Monitor for SPA navigation
    let lastUrl = location.href;
    
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('🐙 Navigation detected:', url);
        setTimeout(checkCurrentPage, 1000);
      }
    }).observe(document, { subtree: true, childList: true });

    // Monitor history changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
      originalPushState.apply(history, arguments);
      setTimeout(checkCurrentPage, 1000);
    };

    history.replaceState = function() {
      originalReplaceState.apply(history, arguments);
      setTimeout(checkCurrentPage, 1000);
    };

    window.addEventListener('popstate', () => {
      setTimeout(checkCurrentPage, 1000);
    });
  }

  function monitorForms() {
    // Monitor form submissions on suspicious sites
    document.addEventListener('submit', async (event) => {
      const form = event.target;
      
      if (hasPasswordField(form) && !isCurrentSiteSafe()) {
        const shouldProceed = confirm(
          '🐙 TrustTentacle Warning:\n\n' +
          'You are about to submit sensitive information to a site that is not verified as safe.\n\n' +
          'Are you sure you want to continue?'
        );
        
        if (!shouldProceed) {
          event.preventDefault();
          console.log('🐙 Form submission blocked by user choice');
        }
      }
    });

    // Monitor for credential autofill
    document.addEventListener('input', (event) => {
      const input = event.target;
      if (input.type === 'password' && input.value.length > 0 && !isCurrentSiteSafe()) {
        showNotification('🔐 Be careful! You\'re entering a password on an unverified site.', 'caution');
      }
    });
  }

  function handleMessage(message, sender, sendResponse) {
    console.log('🐙 Content script received message:', message);

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
    // Create and show reporting dialog
    const dialog = document.createElement('div');
    dialog.className = 'trust-tentacle-report-dialog';
    dialog.innerHTML = `
      <div class="trust-tentacle-dialog-content">
        <h3>🎣 Report Phishing Site</h3>
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

    // Add submit function to window (for onclick)
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
            description: description,
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
          showNotification('✅ Report submitted! Thank you for helping protect the community.', 'safe');
          dialog.remove();
        } else {
          throw new Error(result?.error || 'Report submission failed');
        }
      } catch (error) {
        console.error('❌ Report submission error:', error);
        alert('Failed to submit report. Please try again later.');
      }
    };
  }

  // Utility functions
  function shouldSkipCheck(url) {
    const skipPatterns = [
      /^chrome:/,
      /^chrome-extension:/,
      /^moz-extension:/,
      /^about:/,
      /^file:/,
      /^data:/,
      /localhost:3001/ // Skip our own API
    ];

    return skipPatterns.some(pattern => pattern.test(url));
  }

  function hasLoginForms() {
    const loginIndicators = [
      'input[type="password"]',
      'input[name*="password"]',
      'input[name*="login"]',
      'input[name*="user"]',
      'form[action*="login"]',
      'form[action*="signin"]'
    ];

    return loginIndicators.some(selector => document.querySelector(selector));
  }

  function hasPasswordField(form) {
    return form.querySelector('input[type="password"]') !== null;
  }

  function isCurrentSiteSafe() {
    // This would check the last verification result
    // For now, we'll assume unsafe unless proven otherwise
    return false;
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  console.log('🐙 TrustTentacle content script loaded and ready!');

})();
