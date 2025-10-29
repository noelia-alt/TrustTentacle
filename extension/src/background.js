// TrustTentacle Background Script - The Octopus Brain 🐙

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('🐙 TrustTentacle installed!', details);
  
  if (details.reason === 'install') {
    // Show welcome notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'TrustTentacle Activated! 🐙',
      message: 'Your digital octopus guardian is now protecting you from phishing attacks.'
    });

    // Set default settings
    chrome.storage.sync.set({
      enabled: true,
      autoCheck: true,
      notifications: true,
      checkLevel: 'basic',
      theme: 'ocean'
    });
  }
});

// Handle tab updates - check URLs automatically
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only check when URL changes and page is loading
  if (changeInfo.status === 'loading' && changeInfo.url) {
    const settings = await getSettings();
    
    if (settings.enabled && settings.autoCheck) {
      await checkURL(changeInfo.url, tabId);
    }
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
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
  console.log('🐙 Background received message:', message);

  switch (message.type) {
    case 'CHECK_URL':
      handleCheckURL(message.url, sender.tab?.id)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true; // Keep message channel open for async response

    case 'REPORT_PHISHING':
      handleReportPhishing(message.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
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
async function checkURL(url, tabId) {
  try {
    console.log(`🔍 Checking URL: ${url}`);
    
    const settings = await getSettings();
    
    const response = await fetch(`${API_BASE_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        checkLevel: settings.checkLevel || 'basic'
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('🐙 Verification result:', result);

    // Update badge based on result
    await updateBadge(tabId, result.verdict);

    // Show notification if needed
    if (settings.notifications && (result.verdict === 'DANGEROUS' || result.verdict === 'SUSPICIOUS')) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-48.png',
        title: `⚠️ ${result.verdict === 'DANGEROUS' ? 'Danger' : 'Warning'}`,
        message: result.verdict === 'DANGEROUS' 
          ? 'This site has been reported as dangerous!'
          : 'This site shows suspicious characteristics.'
      });
    }

    // Store result for popup
    await chrome.storage.local.set({
      [`result_${tabId}`]: {
        ...result,
        timestamp: Date.now()
      }
    });

    return result;

  } catch (error) {
    console.error('❌ URL check failed:', error);
    await updateBadge(tabId, 'ERROR');
    throw error;
  }
}

// Handle URL check requests
async function handleCheckURL(url, tabId) {
  return await checkURL(url, tabId);
}

// Handle phishing reports
async function handleReportPhishing(reportData) {
  try {
    const response = await fetch(`${API_BASE_URL}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    });

    if (!response.ok) {
      throw new Error(`Report failed: ${response.status}`);
    }

    const result = await response.json();
    
    // Show success notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-48.png',
      title: 'Report Submitted! 🐙',
      message: 'Thank you for helping protect the community!'
    });

    return result;

  } catch (error) {
    console.error('❌ Report submission failed:', error);
    throw error;
  }
}

// Update browser badge
async function updateBadge(tabId, verdict) {
  const badgeConfig = {
    'SAFE': { text: '✓', color: '#4CAF50' },
    'UNVERIFIED': { text: '?', color: '#FF9800' },
    'SUSPICIOUS': { text: '!', color: '#FF5722' },
    'DANGEROUS': { text: '⚠', color: '#F44336' },
    'ERROR': { text: '✗', color: '#9E9E9E' }
  };

  const config = badgeConfig[verdict] || badgeConfig['ERROR'];
  
  await chrome.action.setBadgeText({
    text: config.text,
    tabId: tabId
  });
  
  await chrome.action.setBadgeBackgroundColor({
    color: config.color,
    tabId: tabId
  });
}

// Settings management
async function getSettings() {
  const result = await chrome.storage.sync.get({
    enabled: true,
    autoCheck: true,
    notifications: true,
    checkLevel: 'basic',
    theme: 'ocean'
  });
  return result;
}

async function updateSettings(newSettings) {
  await chrome.storage.sync.set(newSettings);
  console.log('🐙 Settings updated:', newSettings);
}

// Get extension statistics
async function getStats() {
  const result = await chrome.storage.local.get({
    urlsChecked: 0,
    threatsBlocked: 0,
    reportsSubmitted: 0,
    installDate: Date.now()
  });
  
  return {
    ...result,
    daysSinceInstall: Math.floor((Date.now() - result.installDate) / (1000 * 60 * 60 * 24))
  };
}

// Open report dialog
async function openReportDialog(url) {
  // This would open a more detailed reporting interface
  console.log('🎣 Opening report dialog for:', url);
  
  // For now, we'll just send a basic report
  const reportData = {
    url: url,
    description: 'Reported via keyboard shortcut',
    category: 'phishing',
    evidence: {
      reportedVia: 'extension_shortcut',
      timestamp: new Date().toISOString()
    }
  };

  try {
    await handleReportPhishing(reportData);
  } catch (error) {
    console.error('❌ Quick report failed:', error);
  }
}

// Periodic cleanup of old results
chrome.alarms.create('cleanup', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'cleanup') {
    const items = await chrome.storage.local.get();
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    const toRemove = [];
    for (const [key, value] of Object.entries(items)) {
      if (key.startsWith('result_') && value.timestamp < cutoff) {
        toRemove.push(key);
      }
    }
    
    if (toRemove.length > 0) {
      await chrome.storage.local.remove(toRemove);
      console.log(`🧹 Cleaned up ${toRemove.length} old results`);
    }
  }
});

console.log('🐙 TrustTentacle background script loaded!');
