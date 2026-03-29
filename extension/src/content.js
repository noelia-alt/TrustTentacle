// TrustTentacle content script - browser-side risk UX and privacy-by-design signals

(function () {
  'use strict';

  if (window.trustTentacleInjected) return;
  window.trustTentacleInjected = true;

  const CONFIG = {
    CHECK_DELAY: 2000,
    NOTIFICATION_DURATION: 5000,
    WALLET_ACTION_PATTERN: /(connect wallet|connect|wallet|sign|approve|claim|mint|swap|bridge)/i
  };

  let isChecking = false;
  let lastCheckUrl = '';
  let notificationElement = null;
  let riskPanelElement = null;
  let currentVerdict = 'UNKNOWN';
  let currentVerificationResult = null;
  let walletShieldHandler = null;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  function initialize() {
    console.log('TrustTentacle initialized on:', window.location.hostname);
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
      await delay(CONFIG.CHECK_DELAY);

      const result = await chrome.runtime.sendMessage({
        type: 'CHECK_URL',
        url: currentUrl,
        domSignals: getSanitizedDomSignals(),
        pageContext: getPageContextSignals()
      });

      if (result && !result.error) {
        handleVerificationResult(result);
      } else {
        console.error('Verification failed:', result?.error);
      }
    } catch (error) {
      console.error('Page verification error:', error);
    } finally {
      isChecking = false;
    }
  }

  function handleVerificationResult(result) {
    currentVerificationResult = result;
    currentVerdict = result?.verdict || 'UNKNOWN';

    if (result.verdict === 'SAFE') {
      disarmWalletRiskShield();
      removeRiskPanel();
      if (result.tentacles?.blockchain?.isOfficial) {
        showNotification(`Verified official site: ${result.tentacles.blockchain.entity?.name || result.domain}`, 'safe');
      }
      return;
    }

    if (result.verdict === 'DANGEROUS') {
      showNotification('Dangerous site detected. Review indicators before interacting.', 'danger');
      highlightSuspiciousElements();
      engageWalletRiskShield();
      showRiskPanel(result, true);
      return;
    }

    disarmWalletRiskShield();

    if (result.verdict === 'SUSPICIOUS') {
      showNotification('Suspicious site detected. Review the risk indicators.', 'warning');
      showRiskPanel(result, false);
      return;
    }

    if (result.verdict === 'UNVERIFIED' && hasLoginForms()) {
      showNotification('This site is unverified. Use caution with credentials.', 'caution');
      showRiskPanel(result, false);
    }

    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach((warning) => console.warn('TrustTentacle warning:', warning));
    }
  }

  function showNotification(message, type = 'info') {
    if (notificationElement) notificationElement.remove();

    notificationElement = document.createElement('div');
    notificationElement.className = `trust-tentacle-notification trust-tentacle-${type}`;

    const content = document.createElement('div');
    content.className = 'trust-tentacle-content';

    const icon = document.createElement('div');
    icon.className = 'trust-tentacle-icon';
    icon.textContent = 'TT';

    const msg = document.createElement('div');
    msg.className = 'trust-tentacle-message';
    msg.textContent = String(message || '');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'trust-tentacle-close';
    closeBtn.textContent = 'x';
    closeBtn.addEventListener('click', removeNotification);

    content.appendChild(icon);
    content.appendChild(msg);
    content.appendChild(closeBtn);
    notificationElement.appendChild(content);
    document.body.appendChild(notificationElement);

    setTimeout(() => {
      if (notificationElement && currentVerdict !== 'DANGEROUS') {
        removeNotification();
      }
    }, CONFIG.NOTIFICATION_DURATION);
  }

  function removeNotification() {
    if (notificationElement) {
      notificationElement.remove();
      notificationElement = null;
    }
  }

  function showRiskPanel(result, isDangerous) {
    removeRiskPanel();

    const panel = document.createElement('div');
    panel.className = isDangerous
      ? 'trust-tentacle-risk-overlay'
      : 'trust-tentacle-risk-drawer';

    const container = document.createElement('div');
    container.className = 'trust-tentacle-risk-container';

    const header = document.createElement('div');
    header.className = 'trust-tentacle-risk-header';

    const titleWrap = document.createElement('div');
    const eyebrow = document.createElement('div');
    eyebrow.className = 'trust-tentacle-risk-eyebrow';
    eyebrow.textContent = isDangerous ? 'Threat blocked' : 'Risk indicators';

    const title = document.createElement('h3');
    title.textContent = isDangerous ? 'Interaction shield active' : 'Review before proceeding';

    titleWrap.appendChild(eyebrow);
    titleWrap.appendChild(title);

    const badge = document.createElement('div');
    badge.className = `trust-tentacle-risk-badge trust-tentacle-risk-${String(result.verdict || 'UNKNOWN').toLowerCase()}`;
    badge.textContent = result.verdict || 'UNKNOWN';

    header.appendChild(titleWrap);
    header.appendChild(badge);

    const summary = document.createElement('p');
    summary.className = 'trust-tentacle-risk-summary';
    summary.textContent =
      result.recommendations?.[0] ||
      'TrustTentacle collected multiple signals that require user review.';

    const actions = document.createElement('div');
    actions.className = 'trust-tentacle-risk-actions';

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'trust-tentacle-btn-primary';
    toggleBtn.textContent = 'Show Risk Indicators';

    const indicatorsSection = document.createElement('div');
    indicatorsSection.className = 'trust-tentacle-risk-indicators hidden';

    const indicators = buildRiskIndicators(result);
    indicators.forEach((indicator) => {
      indicatorsSection.appendChild(createIndicatorRow(indicator));
    });

    toggleBtn.addEventListener('click', () => {
      const hidden = indicatorsSection.classList.contains('hidden');
      indicatorsSection.classList.toggle('hidden');
      toggleBtn.textContent = hidden ? 'Hide Risk Indicators' : 'Show Risk Indicators';
    });

    const reportBtn = document.createElement('button');
    reportBtn.className = 'trust-tentacle-btn-secondary';
    reportBtn.textContent = 'Report This Site';
    reportBtn.addEventListener('click', () => showReportDialog());

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'trust-tentacle-btn-secondary';
    dismissBtn.textContent = isDangerous ? 'Dismiss Overlay' : 'Close';
    dismissBtn.addEventListener('click', removeRiskPanel);

    actions.appendChild(toggleBtn);
    actions.appendChild(reportBtn);
    actions.appendChild(dismissBtn);

    container.appendChild(header);
    container.appendChild(summary);
    container.appendChild(actions);
    container.appendChild(indicatorsSection);
    panel.appendChild(container);

    if (isDangerous) {
      panel.addEventListener('click', (event) => {
        if (event.target === panel) {
          removeRiskPanel();
        }
      });
    }

    document.body.appendChild(panel);
    riskPanelElement = panel;
  }

  function removeRiskPanel() {
    if (riskPanelElement) {
      riskPanelElement.remove();
      riskPanelElement = null;
    }
  }

  function buildRiskIndicators(result) {
    if (Array.isArray(result?.riskIndicators) && result.riskIndicators.length > 0) {
      return result.riskIndicators;
    }

    return (result?.warnings || []).slice(0, 4).map((warning) => ({
      severity: 'MEDIUM',
      title: String(warning),
      detail: '',
      source: 'warning'
    }));
  }

  function createIndicatorRow(indicator) {
    const row = document.createElement('div');
    row.className = 'trust-tentacle-indicator-row';

    const severity = document.createElement('div');
    severity.className = `trust-tentacle-indicator-severity trust-tentacle-indicator-${String(indicator.severity || 'MEDIUM').toLowerCase()}`;
    severity.textContent = indicator.severity || 'MEDIUM';

    const body = document.createElement('div');
    body.className = 'trust-tentacle-indicator-body';

    const title = document.createElement('div');
    title.className = 'trust-tentacle-indicator-title';
    title.textContent = indicator.title || 'Risk signal';

    const detail = document.createElement('div');
    detail.className = 'trust-tentacle-indicator-detail';
    detail.textContent = indicator.detail || '';

    const source = document.createElement('div');
    source.className = 'trust-tentacle-indicator-source';
    source.textContent = `Source: ${indicator.source || 'analysis'}`;

    body.appendChild(title);
    if (indicator.detail) body.appendChild(detail);
    body.appendChild(source);

    row.appendChild(severity);
    row.appendChild(body);

    return row;
  }

  function highlightSuspiciousElements() {
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input[type="password"], input[type="email"], input[name*="login"], input[name*="user"]');
    [...forms, ...inputs].forEach((element) => element.classList.add('trust-tentacle-suspicious'));
  }

  function engageWalletRiskShield() {
    markWalletActionElements();

    if (walletShieldHandler) return;

    walletShieldHandler = (event) => {
      if (currentVerdict !== 'DANGEROUS') return;
      const target = event.target;
      const actionable = getWalletActionElement(target);
      if (!actionable) return;

      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') {
        event.stopImmediatePropagation();
      }
      showNotification('Wallet interaction blocked on dangerous site.', 'danger');
    };

    document.addEventListener('click', walletShieldHandler, true);
  }

  function disarmWalletRiskShield() {
    if (walletShieldHandler) {
      document.removeEventListener('click', walletShieldHandler, true);
      walletShieldHandler = null;
    }

    document.querySelectorAll('.trust-tentacle-wallet-guarded').forEach((element) => {
      element.classList.remove('trust-tentacle-wallet-guarded');
    });
  }

  function markWalletActionElements() {
    getInteractiveElements().forEach((element) => {
      if (CONFIG.WALLET_ACTION_PATTERN.test(getElementActionText(element))) {
        element.classList.add('trust-tentacle-wallet-guarded');
      }
    });
  }

  function monitorNavigation() {
    let observedUrl = location.href;

    new MutationObserver(() => {
      const nextUrl = location.href;
      if (nextUrl !== observedUrl) {
        observedUrl = nextUrl;
        removeRiskPanel();
        removeNotification();
        disarmWalletRiskShield();
        setTimeout(checkCurrentPage, 1000);
      }
    }).observe(document, { subtree: true, childList: true });

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
      originalPushState.apply(history, arguments);
      setTimeout(checkCurrentPage, 1000);
    };

    history.replaceState = function () {
      originalReplaceState.apply(history, arguments);
      setTimeout(checkCurrentPage, 1000);
    };

    window.addEventListener('popstate', () => {
      setTimeout(checkCurrentPage, 1000);
    });
  }

  function monitorForms() {
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (hasPasswordField(form) && !isCurrentSiteSafe()) {
        const shouldProceed = confirm(
          'TrustTentacle warning:\n\n' +
          'You are about to submit sensitive information to a site that is not verified as safe.\n\n' +
          'Do you want to continue?'
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
        showNotification('Be careful: you are entering a password on an unverified site.', 'caution');
      }
    });
  }

  function handleMessage(message) {
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
      default:
        break;
    }
  }

  function showReportDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'trust-tentacle-report-dialog';

    const content = document.createElement('div');
    content.className = 'trust-tentacle-dialog-content';

    const h3 = document.createElement('h3');
    h3.textContent = 'Report phishing site';

    const p1 = document.createElement('p');
    p1.textContent = 'Help protect the community by reporting this suspicious site:';

    const p2 = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = window.location.href;
    p2.appendChild(strong);

    const textarea = document.createElement('textarea');
    textarea.setAttribute('rows', '4');
    textarea.placeholder = 'Describe what makes this site suspicious...';

    const buttons = document.createElement('div');
    buttons.className = 'trust-tentacle-dialog-buttons';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'trust-tentacle-btn-primary';
    submitBtn.textContent = 'Submit Report';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'trust-tentacle-btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => dialog.remove());

    submitBtn.addEventListener('click', async () => {
      const description = textarea.value.trim();
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
          showNotification('Report submitted. Thank you for protecting the community.', 'safe');
          dialog.remove();
        } else {
          throw new Error(result?.error || 'Report submission failed');
        }
      } catch (error) {
        console.error('Report submission error:', error);
        alert('Failed to submit report. Please try again later.');
      }
    });

    buttons.appendChild(submitBtn);
    buttons.appendChild(cancelBtn);
    content.appendChild(h3);
    content.appendChild(p1);
    content.appendChild(p2);
    content.appendChild(textarea);
    content.appendChild(buttons);
    dialog.appendChild(content);
    document.body.appendChild(dialog);
  }

  function getSanitizedDomSignals() {
    const clonedBody = document.body ? document.body.cloneNode(true) : null;
    if (!clonedBody) {
      return {};
    }

    const counters = {
      passwordFields: 0,
      emailFields: 0,
      cardLikeFields: 0,
      seedPhraseFields: 0,
      removedNodes: 0,
      walletButtons: 0
    };

    const redactNodes = (selector, field) => {
      const elements = clonedBody.querySelectorAll(selector);
      counters[field] = elements.length;
      elements.forEach((element) => {
        if (typeof element.value === 'string' && element.value.length > 0) {
          element.setAttribute('value', '[REDACTED_BY_TRUSTTENTACLE]');
        }
        if (element.textContent && element.textContent.trim()) {
          element.textContent = '[REDACTED_BY_TRUSTTENTACLE]';
        }
      });
    };

    redactNodes('input[type="password"]', 'passwordFields');
    redactNodes('input[type="email"]', 'emailFields');
    redactNodes('input[name*="card" i], input[name*="cvv" i], input[autocomplete*="cc-" i]', 'cardLikeFields');
    redactNodes('input[name*="seed" i], textarea[name*="phrase" i], textarea[name*="seed" i]', 'seedPhraseFields');

    const heavyNodes = clonedBody.querySelectorAll('script, style, svg, iframe');
    counters.removedNodes = heavyNodes.length;
    heavyNodes.forEach((element) => element.remove());

    counters.walletButtons = countWalletButtons(clonedBody);

    return {
      redactionApplied: true,
      ...counters,
      htmlSampleLength: clonedBody.innerHTML.slice(0, 4000).length
    };
  }

  function getPageContextSignals() {
    return {
      hasLoginForm: hasLoginForms(),
      hasWalletLanguage: countWalletButtons(document) > 0,
      pageTitleLength: String(document.title || '').length
    };
  }

  function countWalletButtons(root) {
    return getInteractiveElements(root).filter((element) => CONFIG.WALLET_ACTION_PATTERN.test(getElementActionText(element))).length;
  }

  function getInteractiveElements(root = document) {
    return Array.from(
      root.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]')
    );
  }

  function getWalletActionElement(target) {
    const actionable = target?.closest?.('button, a, [role="button"], input[type="button"], input[type="submit"]');
    if (!actionable) return null;
    return CONFIG.WALLET_ACTION_PATTERN.test(getElementActionText(actionable)) ? actionable : null;
  }

  function getElementActionText(element) {
    return [
      element.textContent || '',
      element.getAttribute?.('aria-label') || '',
      element.getAttribute?.('title') || '',
      element.value || ''
    ].join(' ').toLowerCase();
  }

  function shouldSkipCheck(url) {
    const skipPatterns = [
      /^chrome:/,
      /^chrome-extension:/,
      /^moz-extension:/,
      /^about:/,
      /^file:/,
      /^data:/,
      /localhost:3001/
    ];
    return skipPatterns.some((pattern) => pattern.test(url));
  }

  function hasLoginForms() {
    const selectors = [
      'input[type="password"]',
      'input[name*="password"]',
      'input[name*="login"]',
      'input[name*="user"]',
      'form[action*="login"]',
      'form[action*="signin"]'
    ];
    return selectors.some((selector) => document.querySelector(selector));
  }

  function hasPasswordField(form) {
    return form?.querySelector?.('input[type="password"]') !== null;
  }

  function isCurrentSiteSafe() {
    return currentVerdict === 'SAFE';
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
})();
