import { observeDOM, TextField } from './dom-observer';
import { UIInjector } from './ui-injector';
import { Correction } from '../lib/openrouter';
import { getSettings } from '../lib/storage';

const analyzedFields = new Set<TextField>();
const ui = new UIInjector();
let applying = false;
let lastFocused: TextField | null = null;

function handleInput(event: Event) {
  const target = event.target as TextField;
  
  // Clear highlights on user edits, but keep them when we applied a suggestion ourselves
  if (!applying) ui.highlightCorrections(target, [], () => {});
  
  analyzeField(target);
}

function handlePaste(event: Event) {
  const target = event.target as TextField;
  
  // Clear highlights and analyze after paste completes
  ui.highlightCorrections(target, [], () => {});
  
  // Small delay to let paste complete
  setTimeout(() => analyzeField(target), 100);
}

async function analyzeField(target: TextField) {
  const text = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement 
    ? target.value 
    : (target as HTMLElement).innerText;

  if (text.length < 5) {
    ui.highlightCorrections(target, [], () => {}); // Clear highlights
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
  try {
    response = await chrome.runtime.sendMessage({ type: 'ANALYZE_TEXT', text });
  } catch {
    return; // Extension was reloaded or service worker unavailable
  }
  if (!response) return;

  if (response.success) {
    ui.highlightCorrections(target, response.data.corrections, (correction) => {
      applyCorrection(target, correction);
    });
  } else {
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
}

function replaceText(target: TextField, correction: Correction): boolean {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    // For input/textarea - use exact position from correction
    const val = target.value;
    const newVal = val.substring(0, correction.start) + correction.suggestion + val.substring(correction.end);
    target.value = newVal;
    target.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  } else {
    // For contenteditable - find and replace only the specific text
    try {
      const currentText = target.innerText || target.textContent || '';
      
      // Verify the text at the specified position matches
      const textAtPosition = currentText.substring(correction.start, correction.end);
      
      // Use the exact position from the correction
      let startIndex = correction.start;
      
      // If the text doesn't match at the expected position, try to find it nearby
      if (textAtPosition !== correction.original) {
        const searchStart = Math.max(0, correction.start - 10);
        const searchEnd = Math.min(currentText.length, correction.end + 10);
        const searchArea = currentText.substring(searchStart, searchEnd);
        const foundIndex = searchArea.indexOf(correction.original);
        
        if (foundIndex === -1) {
          return false; // Can't find the text
        }
        startIndex = searchStart + foundIndex;
      }
      
      // Use Selection API to select only the specific text and replace it
      // This preserves undo stack better than replacing all content
      const selection = window.getSelection();
      if (!selection) return false;
      
      // Find the text node and offset for the correction
      const result = findTextNodeAtPosition(target, startIndex, startIndex + correction.original.length);
      if (!result) return false;
      
      const range = document.createRange();
      range.setStart(result.startNode, result.startOffset);
      range.setEnd(result.endNode, result.endOffset);
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Use insertText to replace only the selected text (preserves undo)
      document.execCommand('insertText', false, correction.suggestion);
      
      target.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    } catch (error) {
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'RUN_ANALYSIS_NOW') {
    const active = document.activeElement as HTMLElement | null;
    const focused = active && isTextField(active) ? active : lastFocused;
    if (!focused || !document.contains(focused)) return; // Only the frame holding a field responds
    const text = focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement
      ? focused.value
      : focused.innerText;
    if (text.length < 5) {
      sendResponse({ started: false, reason: 'short' });
      return;
    }
    const timeoutId = (focused as any)._analysisTimeout;
    if (timeoutId) clearTimeout(timeoutId);
    (focused as any)._analysisCall = ((focused as any)._analysisCall ?? 0) + 1;
    runAnalysis(focused as TextField, text);
    sendResponse({ started: true });
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
    analyzeField(el);
  });
  analyzedFields.add(el);
});

// Test connection to background
chrome.runtime.sendMessage({ type: 'PING' }, () => {
  if (chrome.runtime.lastError) {
    // Silent fail
  }
});
