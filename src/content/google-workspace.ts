import { Correction } from '../lib/openrouter';

// Docs/Slides render text on a canvas, so there is no editable DOM to hook into.
// Instead we read the saved document through Google's export endpoints (same-origin,
// using the user's session) and list suggestions in a side panel.

type Kind = 'document' | 'spreadsheets' | 'presentation';

function getDocInfo(): { kind: Kind; id: string } | null {
  if (location.hostname !== 'docs.google.com') return null;
  const m = location.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
  return m ? { kind: m[1] as Kind, id: m[2] } : null;
}

function parseCsv(csv: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (quoted) {
      if (ch === '"' && csv[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',' || ch === '\n' || ch === '\r') {
      if (cell.trim()) cells.push(cell.trim());
      cell = '';
    } else cell += ch;
  }
  if (cell.trim()) cells.push(cell.trim());
  return cells;
}

async function fetchDocText(info: { kind: Kind; id: string }): Promise<string> {
  const base = `https://docs.google.com/${info.kind}/d/${info.id}`;
  let url: string;
  if (info.kind === 'document') url = `${base}/export?format=txt`;
  else if (info.kind === 'presentation') url = `${base}/export/txt`;
  else {
    const gid = (location.hash.match(/gid=(\d+)/) || [])[1];
    url = `${base}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
  }
  const res = await chrome.runtime.sendMessage({ type: 'FETCH_TEXT', url });
  if (!res?.success) throw new Error(res?.error || 'Could not read document');
  const raw: string = res.text;
  const text = info.kind === 'spreadsheets' ? parseCsv(raw).join('\n') : raw;
  return text.replace(/^\uFEFF/, '');
}

const MAX_CHARS = 20000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function pressKey(target: EventTarget, key: string, code: string, keyCode: number, mods: KeyboardEventInit = {}) {
  const init = { key, code, keyCode, which: keyCode, bubbles: true, cancelable: true, ...mods } as KeyboardEventInit;
  target.dispatchEvent(new KeyboardEvent('keydown', init));
  target.dispatchEvent(new KeyboardEvent('keyup', init));
}

function findInput(): HTMLInputElement | null {
  const active = document.activeElement;
  if (active instanceof HTMLInputElement && active.type === 'text') return active;
  const candidates = document.querySelectorAll<HTMLInputElement>(
    'input.docs-findinput-input, .docs-findinput input, [class*="findinput"] input, input[aria-label^="Find"]'
  );
  return Array.from(candidates).find((el) => el.offsetParent !== null) || null;
}

// Docs has no DOM for its text, so we drive its own Find bar to select the match
async function selectInDoc(text: string, occurrence: number): Promise<boolean> {
  const iframe = document.querySelector<HTMLIFrameElement>('.docs-texteventtarget-iframe');
  const doc = iframe?.contentDocument;
  if (!doc) return false;
  const isMac = /Mac/i.test(navigator.platform);
  pressKey(doc.activeElement || doc.body, 'f', 'KeyF', 70, isMac ? { metaKey: true } : { ctrlKey: true });

  let input: HTMLInputElement | null = null;
  for (let i = 0; i < 20 && !input; i++) {
    await sleep(50);
    input = findInput();
  }
  if (!input) return false;

  input.focus();
  input.select();
  // execCommand fires the same input events as typing, which Docs listens for
  if (!document.execCommand('insertText', false, text)) {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  await sleep(150);
  // The first Enter jumps to match 1, so press it occurrence+1 times
  for (let i = 0; i <= occurrence; i++) {
    pressKey(input, 'Enter', 'Enter', 13);
    await sleep(60);
  }
  pressKey(input, 'Escape', 'Escape', 27);
  return true;
}

function occurrenceIndex(text: string, c: Correction): number {
  const hay = text.toLowerCase();
  const needle = c.original.toLowerCase();
  let count = 0;
  for (let i = hay.indexOf(needle); i !== -1 && i < c.start; i = hay.indexOf(needle, i + 1)) count++;
  return count;
}

export function initGoogleWorkspace(
  analyze: (text: string) => Promise<{ success: boolean; data?: { corrections: Correction[] }; error?: string }>
) {
  const info = getDocInfo();
  if (!info) return;

  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
    <style>
      * { box-sizing: border-box; font-family: system-ui, sans-serif; }
      button { cursor: pointer; }
      .fab { background:#15c39a; color:#fff; border:0; border-radius:999px; padding:10px 16px; font-size:13px; font-weight:600; box-shadow:0 2px 8px rgba(0,0,0,.3); }
      .panel { display:none; width:340px; max-height:60vh; background:#fff; color:#202124; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,.3); overflow:hidden; flex-direction:column; margin-bottom:8px; }
      .panel.open { display:flex; }
      .head { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-bottom:1px solid #e0e0e0; font-weight:600; font-size:13px; }
      .head button { border:0; background:none; font-size:16px; }
      .body { overflow:auto; padding:8px 12px; font-size:12px; }
      .item { border-bottom:1px solid #eee; padding:8px 0; }
      .orig { color:#c5221f; text-decoration:line-through; }
      .sug { color:#188038; font-weight:600; }
      .exp { color:#5f6368; margin:4px 0; }
      .copy { border:1px solid #15c39a; color:#0b8a6c; background:#fff; border-radius:6px; padding:3px 8px; font-size:11px; }
      .msg { color:#5f6368; padding:8px 0; }
    </style>
    <div class="panel"><div class="head"><span>Open Grammarly</span><button class="close" title="Close">×</button></div><div class="body"></div></div>
    <button class="fab">Check document</button>`;

  const panel = root.querySelector('.panel') as HTMLElement;
  const body = root.querySelector('.body') as HTMLElement;
  const fab = root.querySelector('.fab') as HTMLButtonElement;
  root.querySelector('.close')!.addEventListener('click', () => panel.classList.remove('open'));

  const message = (text: string) => {
    body.innerHTML = '';
    const d = document.createElement('div');
    d.className = 'msg';
    d.textContent = text;
    body.appendChild(d);
  };

  let currentText = '';
  const render = (corrections: Correction[]) => {
    body.innerHTML = '';
    if (!corrections.length) return message('No issues found 🎉');
    for (const c of corrections) {
      const item = document.createElement('div');
      item.className = 'item';
      if (info.kind === 'document') {
        item.style.cursor = 'pointer';
        item.title = 'Click to jump to this text in the document';
        item.addEventListener('click', () => selectInDoc(c.original, occurrenceIndex(currentText, c)));
      }
      const line = document.createElement('div');
      const o = document.createElement('span');
      o.className = 'orig';
      o.textContent = c.original;
      const s = document.createElement('span');
      s.className = 'sug';
      s.textContent = c.suggestion;
      line.append(o, ' → ', s);
      const exp = document.createElement('div');
      exp.className = 'exp';
      exp.textContent = c.explanation;
      const copy = document.createElement('button');
      copy.className = 'copy';
      copy.textContent = 'Copy fix';
      copy.addEventListener('click', async (e) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(c.suggestion);
        copy.textContent = 'Copied';
        setTimeout(() => (copy.textContent = 'Copy fix'), 1500);
      });
      item.append(line, exp, copy);
      body.appendChild(item);
    }
  };

  fab.addEventListener('click', async () => {
    panel.classList.add('open');
    message('Reading document…');
    fab.disabled = true;
    try {
      let text = await fetchDocText(info);
      if (text.trim().length < 5) return message('Nothing to check yet.');
      const truncated = text.length > MAX_CHARS;
      if (truncated) text = text.slice(0, MAX_CHARS);
      currentText = text;
      message('Analyzing…');
      const res = await analyze(text);
      if (!res.success) return message(res.error || 'Analysis failed');
      render(res.data!.corrections);
      if (truncated) {
        const note = document.createElement('div');
        note.className = 'msg';
        note.textContent = `Only the first ${MAX_CHARS} characters were checked.`;
        body.appendChild(note);
      }
    } catch (e: any) {
      message(e?.message || 'Something went wrong');
    } finally {
      fab.disabled = false;
    }
  });

  document.documentElement.appendChild(host);
}
