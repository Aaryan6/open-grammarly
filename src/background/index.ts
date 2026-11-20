import { analyzeText } from '../lib/openrouter';
import { getSettings } from '../lib/storage';

// Purge text history stored by earlier versions
chrome.storage.local.remove('history');

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'analyzeSelection',
    title: 'Analyze with Open Grammarly',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'analyzeSelection' && tab?.id != null) {
    // Same path as the popup's Run Analysis button; the focused field in the page is analyzed
    chrome.tabs.sendMessage(tab.id, { type: 'RUN_ANALYSIS_NOW' }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PING') {
    sendResponse({ success: true, message: 'PONG' });
    return;
  }
  if (request.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return;
  }
  if (request.type === 'FETCH_TEXT') {
    // Export URLs redirect cross-origin, which content-script fetches can't follow
    fetch(request.url, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return sendResponse({ success: false, error: `Could not read document (HTTP ${res.status})` });
        sendResponse({ success: true, text: await res.text() });
      })
      .catch((e) => sendResponse({ success: false, error: e?.message || 'Fetch failed' }));
    return true;
  }
  if (request.type === 'ANALYZE_TEXT') {
    handleAnalysis(request.text).then(response => {
      sendResponse(response);
    });
    return true; // Keep channel open for async response
  }
});

async function handleAnalysis(text: string) {
  try {
    const settings = await getSettings();
    const key = settings.provider === 'google' ? settings.googleKey : settings.openRouterKey;
    if (!key) {
      const name = settings.provider === 'google' ? 'Google AI' : 'OpenRouter';
      return { success: false, error: `API key not set. Please open extension options and enter your ${name} key.` };
    }
    if (!settings.enabled) {
      return { success: false, error: 'Extension is disabled' };
    }
    const results = await analyzeText(text, settings);
    await recordStats(results);
    return { success: true, data: results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function recordStats(results: { overallScore: number }) {
  await chrome.storage.local.set({ stats: { lastScore: results.overallScore } });
}
