import { observeDOM, TextField } from './dom-observer';
import { UIInjector } from './ui-injector';
import { Correction } from '../lib/openrouter';
import { getSettings } from '../lib/storage';
import { initGoogleWorkspace } from './google-workspace';

const analyzedFields = new Set<TextField>();
const ui = new UIInjector();
let applying = false;
let lastFocused: TextField | null = null;
let checkButton: HTMLElement | null = null;
let badge: HTMLElement | null = null;
let hiddenForPage = false;

function setBadge(count: number | 'loading' | null) {
  if (!badge) return;
  const loading = count === 'loading';
  badge.textContent = loading || count === null ? '' : String(count);
  badge.classList.toggle('spin', loading);
  badge.style.display = count === null ? 'none' : 'block';
}

const isGoogleDoc = location.hostname === 'docs.google.com'
  && /^\/(document|spreadsheets|presentation)\/d\//.test(location.pathname);

// Floating button (top frame only) to launch the analysis manually; Google Docs has its own panel
function showCheckButton() {
  if (checkButton || hiddenForPage || isGoogleDoc || window !== window.top) return;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    button { background:#15c39a; color:#fff; border:0; border-radius:999px; padding:10px 16px; font:600 13px system-ui,sans-serif; box-shadow:0 2px 8px rgba(0,0,0,.3); cursor:pointer; }
    .badge.spin { color:transparent; border-color:#15c39a; border-top-color:#d6f5ee; animation:og-spin .8s linear infinite; }
    @keyframes og-spin { to { transform:rotate(360deg); } }
    .wrap { position:relative; display:inline-block; }
    .hide { position:absolute; top:-8px; left:-8px; width:18px; height:18px; padding:0; border-radius:50%; background:#fff; color:#202124; border:1px solid #bbb; font:700 12px/16px system-ui,sans-serif; box-shadow:0 1px 3px rgba(0,0,0,.3); display:none; }
    .wrap:hover .hide { display:block; }
    .badge { position:absolute; top:-6px; right:-6px; min-width:20px; height:20px; padding:0 5px; border-radius:999px; background:#fff; color:#202124; border:2px solid #15c39a; font:700 11px/16px system-ui,sans-serif; text-align:center; box-sizing:border-box; display:none; }
  </style><div class="wrap"><button class="main">Check Grammar</button><span class="badge"></span><button class="hide" title="Hide until page reload" aria-label="Hide">×</button></div>`;
  badge = root.querySelector<HTMLElement>('.badge');
  const button = root.querySelector('button.main')!;
  const hideBtn = root.querySelector<HTMLElement>('button.hide')!;
  hideBtn.addEventListener('mousedown', (e) => e.preventDefault());
  hideBtn.addEventListener('click', () => {
    host.remove();
    hiddenForPage = true;
  });
  // Keep focus in the text field so it stays the analysis target
  button.addEventListener('mousedown', (e) => e.preventDefault());
  button.addEventListener('click', () => {
    const result = runAnalysisNow();
    if (!result) ui.showToast('Click into a text field first.', 'error');
    else if (!result.started) ui.showToast('Write a bit more text first.', 'error');
  });
  document.documentElement.appendChild(host);
  checkButton = host;
}

function handleInput(event: Event) {
  const target = event.target as TextField;
  
  // Clear highlights on user edits, but keep them when we applied a suggestion ourselves
  if (!applying) {
    ui.highlightCorrections(target, [], () => {});
    setBadge(null);
  }
  
  analyzeField(target);
}

function handlePaste(event: Event) {
  const target = event.target as TextField;
  
  // Clear highlights and analyze after paste completes
  ui.highlightCorrections(target, [], () => {});
  setBadge(null);
  
  // Small delay to let paste complete
  setTimeout(() => analyzeField(target), 100);
}

async function analyzeField(target: TextField) {
  const text = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement 
    ? target.value 
    : (target as HTMLElement).innerText;

  if (text.length < 5) {
    ui.highlightCorrections(target, [], () => {}); // Clear highlights
    setBadge(null);
    return;
  }

  const call = ((target as any)._analysisCall ?? 0) + 1;
  (target as any)._analysisCall = call;
  const timeoutId = (target as any)._analysisTimeout;
  if (timeoutId) clearTimeout(timeoutId);

  let delayMs = 5000;
  try {
    delayMs = (await getSettings()).debounceSeconds * 1000;
  } catch {
    // Extension context invalidated; keep default
  }
  // Drop this call if a newer one started while settings were loading
  if ((target as any)._analysisCall !== call) return;

  (target as any)._analysisTimeout = setTimeout(() => runAnalysis(target, text), delayMs);
}

async function runAnalysis(target: TextField, text: string) {
  let response: any;
  setBadge('loading');
  try {
    response = await chrome.runtime.sendMessage({ type: 'ANALYZE_TEXT', text });
  } catch {
    setBadge(null);
    return; // Extension was reloaded or service worker unavailable
  }
  if (!response) {
    setBadge(null);
    return;
  }

  if (response.success) {
    ui.highlightCorrections(target, response.data.corrections, (correction) => {
      applyCorrection(target, correction);
    });
    setBadge(response.data.corrections.length);
  } else {
    setBadge(null);
    // Show toast notification for errors
    if (response.error?.includes('API key')) {
      ui.showToast('API key not configured', 'error', {
        action: 'Open Settings',
        onAction: () => {
          chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
        }
      });
    } else if (response.error?.includes('disabled')) {
      // Silent - extension is disabled
    } else {
      ui.showToast(`Analysis failed: ${response.error}`, 'error');
    }
  }
}

function applyCorrection(target: TextField, correction: Correction) {
  const others = ui.getCorrections(target).filter(c => c !== correction);
  applying = true;
  const applied = replaceText(target, correction);
  applying = false;
  if (!applied) return;

  // Keep the remaining suggestions, shifted by the length change; drop overlapping ones
  const delta = correction.suggestion.length - (correction.end - correction.start);
  const remaining = others
    .filter(c => c.end <= correction.start || c.start >= correction.end)
    .map(c => c.start >= correction.end ? { ...c, start: c.start + delta, end: c.end + delta } : c);
  ui.highlightCorrections(target, remaining, (c) => applyCorrection(target, c));
  setBadge(remaining.length);
}

function replaceText(target: TextField, correction: Correction): boolean {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    // For input/textarea - use exact position from correction
    const val = target.value;
    const newVal = val.substring(0, correction.start) + correction.suggestion + val.substring(correction.end);
    // Frameworks (e.g. Oracle JET/Preact) listen to real user input events, so simulate typing first
    target.focus();
    target.setSelectionRange(correction.start, correction.end);
    let inserted = false;
    try {
      inserted = document.execCommand('insertText', false, correction.suggestion);
    } catch {
      inserted = false;
    }
    if (inserted && target.value === newVal) return true;
    // Fallback: native setter bypasses framework-patched value properties
    const proto = target instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(target, newVal);
    target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: correction.suggestion }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  } else {
    // For contenteditable - find and replace only the specific text
    try {
      // Offsets match the text nodes (same space the underlines use); innerText can differ (e.g. paragraph breaks)
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null);
      let currentText = '';
      let n: Node | null;
      while ((n = walker.nextNode())) currentText += n.textContent ?? '';
      const norm = (t: string) => t.replace(/\u00a0/g, ' ');
      let startIndex = correction.start;
      if (norm(currentText.substring(correction.start, correction.end)) !== norm(correction.original)) {
        const searchStart = Math.max(0, correction.start - 50);
        const found = norm(currentText).indexOf(norm(correction.original), searchStart);
        if (found === -1 || found > correction.end + 50) {
          console.warn('[open-grammarly] could not locate text to replace', correction);
          return false;
        }
        startIndex = found;
      }

      // Use Selection API to select only the specific text and replace it
      // This preserves undo stack better than replacing all content
      const selection = window.getSelection();
      if (!selection) return false;
      
      // Find the text node and offset for the correction
      const result = findTextNodeAtPosition(target, startIndex, startIndex + correction.original.length);
      if (!result) {
        console.warn('[open-grammarly] no text node for range', correction);
        return false;
      }
      
      const range = document.createRange();
      range.setStart(result.startNode, result.startOffset);
      range.setEnd(result.endNode, result.endOffset);
      
      // Clicking the tooltip may have moved focus away; the editor must be focused for insertText
      target.focus();
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Rich editors sync their model from the DOM selection asynchronously, so insert after a short delay
      const before = target.innerText;
      setTimeout(() => {
        applying = true;
        try {
          target.focus();
          selection.removeAllRanges();
          selection.addRange(range);
          let inserted = false;
          try {
            inserted = document.execCommand('insertText', false, correction.suggestion);
          } catch {
            inserted = false;
          }
          console.debug('[open-grammarly] insertText', inserted);
          const changed = () => target.innerText !== before;
          setTimeout(() => {
            if (changed()) return;
            // Editor ignored insertText: emulate pasting the suggestion, which most editors handle themselves
            console.debug('[open-grammarly] trying paste');
            applying = true;
            target.focus();
            selection.removeAllRanges();
            selection.addRange(range);
            const data = new DataTransfer();
            data.setData('text/plain', correction.suggestion);
            const pasteEvent = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true });
            const notHandled = target.dispatchEvent(pasteEvent);
            applying = false;
            setTimeout(() => {
              if (changed() || !notHandled) return;
              // Last resort: edit the DOM directly and notify the editor
              console.debug('[open-grammarly] fallback DOM edit');
              range.deleteContents();
              range.insertNode(document.createTextNode(correction.suggestion));
              target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: correction.suggestion }));
            }, 200);
          }, 200);
        } finally {
          applying = false;
        }
      }, 50);
      return true;
    } catch (error) {
      console.warn('[open-grammarly] replace failed', error);
      return false;
    }
  }
}

// Helper function to find text node at a specific character position
function findTextNodeAtPosition(element: HTMLElement, start: number, end: number): { startNode: Text, startOffset: number, endNode: Text, endOffset: number } | null {
  let charCount = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  let node: Text | null;
  
  while (node = walker.nextNode() as Text | null) {
    const nodeLength = node.textContent?.length || 0;
    const nextCount = charCount + nodeLength;
    
    if (!startNode && start >= charCount && start < nextCount) {
      startNode = node;
      startOffset = start - charCount;
    }
    
    if (!endNode && end >= charCount && end <= nextCount) {
      endNode = node;
      endOffset = end - charCount;
    }
    
    charCount = nextCount;
    
    if (startNode && endNode) break;
  }
  
  if (startNode && endNode) {
    return { startNode, startOffset, endNode, endOffset };
  }
  return null;
}

function runAnalysisNow(): { started: boolean; reason?: string } | null {
  const active = document.activeElement as HTMLElement | null;
  const focused = active && isTextField(active) ? active : lastFocused;
  if (!focused || !document.contains(focused)) return null; // Only the frame holding a field responds
  const text = focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement
    ? focused.value
    : focused.innerText;
  if (text.length < 5) return { started: false, reason: 'short' };
  const timeoutId = (focused as any)._analysisTimeout;
  if (timeoutId) clearTimeout(timeoutId);
  (focused as any)._analysisCall = ((focused as any)._analysisCall ?? 0) + 1;
  runAnalysis(focused as TextField, text);
  return { started: true };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'RUN_ANALYSIS_NOW') {
    const result = runAnalysisNow();
    if (result) sendResponse(result);
    return;
  }
});

function isTextField(el: Element): el is TextField {
  const name = el.tagName.toLowerCase();
  return name === 'input' || name === 'textarea' || (el as HTMLElement).isContentEditable;
}

observeDOM((el) => {
  if (analyzedFields.has(el)) return;
  
  el.addEventListener('input', handleInput);
  el.addEventListener('paste', handlePaste);
  el.addEventListener('focus', () => {
    lastFocused = el;
    showCheckButton();
    analyzeField(el);
  });
  analyzedFields.add(el);
});

if (window === window.top) {
  initGoogleWorkspace(async (text) => {
    try {
      return await chrome.runtime.sendMessage({ type: 'ANALYZE_TEXT', text });
    } catch {
      return { success: false, error: 'Extension was reloaded; refresh the page.' };
    }
  });
}

// Test connection to background
chrome.runtime.sendMessage({ type: 'PING' }, () => {
  if (chrome.runtime.lastError) {
    // Silent fail
  }
});
