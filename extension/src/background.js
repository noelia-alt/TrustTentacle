// TrustTentacle Background Script - English, cleaned

let API_BASE_URL_DEFAULT = 'http://localhost:3001/api/v1';
let apiBaseCache = null;
const NOTIFY_ICON = 'icons/octopus-logo.png';

async function incrementStat(field, amount = 1) {
  const current = await chrome.storage.local.get({ [field]: 0 });
  const next = (parseInt(current[field], 10) || 0) + amount;
  await chrome.storage.local.set({ [field]: next });
  return next;
}

async function getApiBaseUrl() {
  try {
    const cfg = await chrome.storage.sync.get({ apiBaseUrl: null });
    const base = cfg.apiBaseUrl && cfg.apiBaseUrl.trim().length > 0 ? cfg.apiBaseUrl.trim() : API_BASE_URL_DEFAULT;
    apiBaseCache = base;
    return base;
  } catch {
    return apiBaseCache || API_BASE_URL_DEFAULT;
  }
}

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('TrustTentacle installed!', details);

  if (details.reason === 'install') {
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: NOTIFY_ICON,
      title: 'TrustTentacle Activated!',
      message: 'Your digital octopus guardian is now protecting you from phishing attacks.'
    });

    // Set default settings
    chrome.storage.sync.set({
      enabled: true,
      autoCheck: true,
      notifications: true,
      checkLevel: 'basic',
      theme: 'ocean',
      apiBaseUrl: API_BASE_URL_DEFAULT
    });
    chrome.storage.local.set({
      installDate: Date.now(),
      urlsChecked: 0,
      threatsBlocked: 0,
      reportsSubmitted: 0
    });
  }

  // Create context menu to check links
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'tt-check-link',
        title: 'TrustTentacle: Check link',
        contexts: ['link']
      });
      chrome.contextMenus.create({
        id: 'tt-check-page',
        title: 'TrustTentacle: Check this page',
        contexts: ['page']
      });
      chrome.contextMenus.create({
        id: 'tt-report-page',
        title: 'TrustTentacle: Report this page as phishing',
        contexts: ['page']
      });
      chrome.contextMenus.create({
        id: 'tt-report-link',
        title: 'TrustTentacle: Report link as phishing',
        contexts: ['link']
      });
    });
  } catch (e) {
    console.warn('Context menu creation failed:', e);
  }
});

// Ensure menus also exist after browser restart
chrome.runtime.onStartup.addListener(() => {
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({ id: 'tt-check-link', title: 'TrustTentacle: Check link', contexts: ['link'] });
      chrome.contextMenus.create({ id: 'tt-check-page', title: 'TrustTentacle: Check this page', contexts: ['page'] });
      chrome.contextMenus.create({ id: 'tt-report-page', title: 'TrustTentacle: Report this page as phishing', contexts: ['page'] });
      chrome.contextMenus.create({ id: 'tt-report-link', title: 'TrustTentacle: Report link as phishing', contexts: ['link'] });
    });
  } catch (e) {
    console.warn('Context menu creation onStartup failed:', e);
  }
});

// Handle tab updates - check URLs automatically
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && changeInfo.url) {
    const settings = await getSettings();
    if (settings.enabled && settings.autoCheck) {
      await checkURL(changeInfo.url, tabId);
    }
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === 'tt-check-link' && info.linkUrl) {
      const tId = tab?.id;
      const result = await handleCheckURL(info.linkUrl, tId);
      // Show a compact notification with verdict
      chrome.notifications.create({
        type: 'basic',
        iconUrl: NOTIFY_ICON,
        title: 'Link check result',
        message: `${result.verdict}: ${new URL(info.linkUrl).hostname}`
      });
    } else if (info.menuItemId === 'tt-check-page') {
      const pageUrl = tab?.url;
      if (!pageUrl) throw new Error('No page URL');
      const tId = tab?.id;
      const result = await handleCheckURL(pageUrl, tId);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: NOTIFY_ICON,
        title: 'Page check result',
        message: `${result.verdict}: ${new URL(pageUrl).hostname}`
      });
    } else if (info.menuItemId === 'tt-report-page') {
      const pageUrl = tab?.url;
      if (!pageUrl) throw new Error('No page URL');
      await handleReportPhishing({
        url: pageUrl,
        description: 'Reported via context menu',
        category: 'phishing',
        evidence: {
          reportedVia: 'context_menu',
          reportedFrom: 'context_menu',
          timestamp: new Date().toISOString(),
          pageTitle: tab?.title || ''
        }
      });
    } else if (info.menuItemId === 'tt-report-link' && info.linkUrl) {
      await handleReportPhishing({
        url: info.linkUrl,
        description: 'Reported link via context menu',
        category: 'phishing',
        evidence: {
          reportedVia: 'context_menu',
          reportedFrom: 'context_menu',
          timestamp: new Date().toISOString(),
          pageTitle: tab?.title || ''
        }
      });
    }
  } catch (err) {
    console.error('Context menu check failed:', err);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: NOTIFY_ICON,
      title: 'Check failed',
      message: 'Could not verify the link.'
    });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  switch (command) {
    case 'check-current-site':
      await checkURL(tab.url, tab.id);
      break;
    case 'report-phishing':
      await openReportDialog(tab.url);
      break;
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  switch (message.type) {
    case 'CHECK_URL':
      handleCheckURL(message.url, sender.tab?.id, {
        domSignals: message.domSignals,
        pageContext: message.pageContext,
        preferDomContext: !!message.domSignals
      })
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
    case 'REPORT_PHISHING':
      handleReportPhishing(message.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
    case 'GET_HEALTH':
      (async () => {
        try {
          const base = await getApiBaseUrl();
          const root = base.replace(/\/?api.*/i, '');
          const res = await fetch(`${root.replace(/\/$/, '')}/health`, { method: 'GET' });
          sendResponse({ ok: res.ok });
        } catch (e) {
          sendResponse({ ok: false, error: String(e) });
        }
      })();
      return true;
    case 'GET_SETTINGS':
      getSettings().then(sendResponse);
      return true;
    case 'UPDATE_SETTINGS':
      updateSettings(message.settings).then(sendResponse);
      return true;
    case 'GET_STATS':
      getStats().then(sendResponse);
      return true;
  }
});

// Main URL checking function
async function checkURL(url, tabId, context = {}) {
  try {
    console.log(`Checking URL: ${url}`);
    const settings = await getSettings();
    const base = await getApiBaseUrl();
    const cacheKey = tabId ? `result_${tabId}` : null;
    const cached = cacheKey ? await chrome.storage.local.get([cacheKey]) : {};
    const cachedResult = cacheKey ? cached[cacheKey] : null;
    const cacheIsFresh = cachedResult && cachedResult.url === url && Date.now() - cachedResult.timestamp < 15000;
    const cachedHasDomContext = !!cachedResult?.analysisContext?.domSignalsProcessed;

    if (cacheIsFresh && (!context.preferDomContext || cachedHasDomContext)) {
      return cachedResult;
    }

    const response = await fetch(`${base.replace(/\/$/, '')}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        checkLevel: settings.checkLevel || 'basic',
        domSignals: context.domSignals || undefined,
        pageContext: context.pageContext || undefined
      })
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const result = await response.json();
    console.log('Verification result:', result);

    await updateBadge(tabId, result.verdict);

    if (settings.notifications && (result.verdict === 'DANGEROUS' || result.verdict === 'SUSPICIOUS')) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: NOTIFY_ICON,
        title: (result.verdict === 'DANGEROUS' ? 'Danger' : 'Warning'),
        message: result.verdict === 'DANGEROUS'
          ? 'This site has been reported as dangerous!'
          : 'This site shows suspicious characteristics.'
      });
    }

    if (cacheKey) {
      await chrome.storage.local.set({
        [cacheKey]: { ...result, timestamp: Date.now() }
      });
    }

    const shouldCountMetrics = !(cacheIsFresh && cachedResult?.url === url);
    if (shouldCountMetrics) {
      await incrementStat('urlsChecked', 1);
      if (result.verdict === 'DANGEROUS' || result.verdict === 'SUSPICIOUS') {
        await incrementStat('threatsBlocked', 1);
      }
    }

    return result;
  } catch (error) {
    console.error('URL check failed:', error);
    await updateBadge(tabId, 'ERROR');
    throw error;
  }
}

async function handleCheckURL(url, tabId, context = {}) {
  return await checkURL(url, tabId, context);
}

// Handle phishing reports
async function handleReportPhishing(reportData) {
  try {
    const base = await getApiBaseUrl();
    const response = await fetch(`${base.replace(/\/$/, '')}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    if (!response.ok) throw new Error(`Report failed: ${response.status}`);
    const result = await response.json();

    chrome.notifications.create({
      type: 'basic',
      iconUrl: NOTIFY_ICON,
      title: 'Report Submitted!',
      message: 'Thank you for helping protect the community!'
    });

    // Notify any open extension pages (e.g., popup) to show a toast
    try {
      chrome.runtime.sendMessage({
        type: 'REPORT_SUBMITTED',
        url: reportData.url,
        source: reportData.evidence?.reportedFrom || 'background'
      });
    } catch {}

    await incrementStat('reportsSubmitted', 1);

    return result;
  } catch (error) {
    console.error('Report submission failed:', error);
    throw error;
  }
}

// Update browser badge
async function updateBadge(tabId, verdict) {
  const badgeConfig = {
    SAFE: { text: 'OK', color: '#4CAF50' },
    UNVERIFIED: { text: '?', color: '#FF9800' },
    SUSPICIOUS: { text: '!', color: '#FF5722' },
    DANGEROUS: { text: 'X', color: '#F44336' },
    ERROR: { text: '-', color: '#9E9E9E' }
  };
  const config = badgeConfig[verdict] || badgeConfig.ERROR;
  await chrome.action.setBadgeText({ text: config.text, tabId });
  await chrome.action.setBadgeBackgroundColor({ color: config.color, tabId });
}

// Settings management
async function getSettings() {
  const result = await chrome.storage.sync.get({
    enabled: true,
    autoCheck: true,
    notifications: true,
    checkLevel: 'basic',
    theme: 'ocean',
    apiBaseUrl: API_BASE_URL_DEFAULT
  });
  return result;
}

async function updateSettings(newSettings) {
  await chrome.storage.sync.set(newSettings);
  console.log('Settings updated:', newSettings);
}

// Get extension statistics
async function getStats() {
  const result = await chrome.storage.local.get({
    urlsChecked: 0,
    threatsBlocked: 0,
    reportsSubmitted: 0,
    installDate: Date.now()
  });
  if (!result.installDate) {
    result.installDate = Date.now();
    await chrome.storage.local.set({ installDate: result.installDate });
  }
  return {
    ...result,
    daysSinceInstall: Math.floor((Date.now() - result.installDate) / (1000 * 60 * 60 * 24))
  };
}

// Open report dialog (simple path delegates to REPORT_PHISHING)
async function openReportDialog(url) {
  console.log('Opening report dialog for:', url);
  const reportData = {
    url,
    description: 'Reported via keyboard shortcut',
    category: 'phishing',
    evidence: { reportedVia: 'extension_shortcut', timestamp: new Date().toISOString() }
  };
  try {
    await handleReportPhishing(reportData);
  } catch (error) {
    console.error('Quick report failed:', error);
  }
}

// Periodic cleanup of old results
chrome.alarms.create('cleanup', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanup') {
    const items = await chrome.storage.local.get();
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    const toRemove = [];
    for (const [key, value] of Object.entries(items)) {
      if (key.startsWith('result_') && value.timestamp < cutoff) {
        toRemove.push(key);
      }
    }
    if (toRemove.length > 0) {
      await chrome.storage.local.remove(toRemove);
      console.log(`Cleaned up ${toRemove.length} old results`);
    }
  }
});

console.log('TrustTentacle background script loaded!');

