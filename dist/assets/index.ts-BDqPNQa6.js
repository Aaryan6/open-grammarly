import{g as H}from"./storage-BKXZSGVt.js";const M=["password","hidden","file","checkbox","radio","submit","button","image","reset","color","range"];function y(n){const e=n.tagName.toLowerCase();if(e==="input"){const t=n,i=(t.type||"text").toLowerCase();return!(M.includes(i)||t.readOnly||t.disabled)}if(e==="textarea"){const t=n;return!t.readOnly&&!t.disabled}return n.contentEditable==="true"||n.isContentEditable}function A(n){const e="input, textarea, [contenteditable]";document.querySelectorAll(e).forEach(s=>{y(s)&&n(s)});const i=new MutationObserver(s=>{for(const r of s)for(const o of r.addedNodes)o instanceof Element&&(y(o)?n(o):o.querySelectorAll(e).forEach(d=>{y(d)&&n(d)}))});return i.observe(document.body,{childList:!0,subtree:!0}),i}class ${container;shadowRoot;currentTooltip=null;currentHighlight=null;activeElements=new Map;updateScheduled=!1;constructor(){this.container=document.createElement("div"),this.container.id="open-grammarly-root",this.container.style.position="fixed",this.container.style.top="0",this.container.style.left="0",this.container.style.width="100vw",this.container.style.height="100vh",this.container.style.pointerEvents="none",this.container.style.zIndex="2147483647",document.body.appendChild(this.container),this.shadowRoot=this.container.attachShadow({mode:"open"}),this.injectStyles(),document.addEventListener("mousedown",e=>{this.currentTooltip&&!this.container.contains(e.target)&&this.closeTooltip()}),window.addEventListener("scroll",()=>this.scheduleUpdate(),{passive:!0,capture:!0}),window.addEventListener("resize",()=>this.scheduleUpdate(),{passive:!0})}scheduleUpdate(){this.updateScheduled||(this.updateScheduled=!0,requestAnimationFrame(()=>{this.updatePositions(),this.updateScheduled=!1}))}updatePositions(){this.currentTooltip&&this.closeTooltip(),this.shadowRoot.querySelectorAll(".og-underline, .og-textarea-badge").forEach(e=>e.remove()),this.activeElements.forEach((e,t)=>{if(!document.body.contains(e.element)){this.activeElements.delete(t);return}e.element instanceof HTMLTextAreaElement||e.element instanceof HTMLInputElement?this.renderTextareaBadge(e.element,e.corrections,e.onApply):this.renderContentEditableHighlights(e.element,e.corrections,e.onApply)})}injectStyles(){const e=document.createElement("style");e.textContent=`
      :host {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
      }
      .og-underline {
        position: absolute;
        height: 4px;
        /* Fallback solid border in case gradient doesn't render */
        border-bottom: 2px solid #ff3333;
        background: linear-gradient(45deg, transparent 65%, #ff3333 65%, #ff3333 75%, transparent 75%),
                    linear-gradient(-45deg, transparent 65%, #ff3333 65%, #ff3333 75%, transparent 75%);
        background-size: 8px 4px;
        pointer-events: auto;
        cursor: pointer;
        z-index: 2147483647;
        display: block !important;
        box-sizing: border-box;
      }
      .og-grammar, .og-spelling { 
        border-bottom-color: #ff3333;
        background: linear-gradient(45deg, transparent 65%, #ff3333 65%, #ff3333 75%, transparent 75%),
                    linear-gradient(-45deg, transparent 65%, #ff3333 65%, #ff3333 75%, transparent 75%);
        background-size: 8px 4px;
      }
      
      /* Highlight overlay shown on hover */
      .og-highlight {
        position: absolute;
        background: rgba(220, 38, 38, 0.25);
        pointer-events: none;
        z-index: 2147483646;
        border-radius: 2px;
      }
      
      .og-tooltip {
        position: fixed;
        background: white;
        border-radius: 8px;
        padding: 0;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        z-index: 20000;
        pointer-events: auto;
        min-width: 200px;
        max-width: 280px;
        border: 1px solid #e5e7eb;
        color: #111827;
        overflow: hidden;
      }
      .og-title {
        font-size: 13px;
        font-weight: 400;
        color: #6b7280;
        padding: 12px 14px 8px;
        border-bottom: none;
      }
      .og-suggestion {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        color: #2563eb;
        font-weight: 600;
        font-size: 15px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .og-suggestion:hover {
        background: #f3f4f6;
      }
      .og-dismiss {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        color: #6b7280;
        font-size: 13px;
        cursor: pointer;
        border-top: 1px solid #f3f4f6;
        transition: background 0.15s;
      }
      .og-dismiss:hover {
        background: #f9fafb;
      }
      .og-dismiss svg {
        width: 16px;
        height: 16px;
        opacity: 0.7;
      }
      
      .og-textarea-badge {
        position: absolute;
        background: #2563eb;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        pointer-events: auto;
        cursor: pointer;
        z-index: 10;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      
      .og-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1f2937;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 13px;
        max-width: 320px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: og-slide-in 0.3s ease-out;
        z-index: 2147483647;
      }
      .og-toast.og-error {
        background: #dc2626;
      }
      .og-toast.og-warning {
        background: #d97706;
      }
      .og-toast.og-success {
        background: #059669;
      }
      .og-toast-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
        padding: 0;
        margin-left: auto;
        opacity: 0.7;
      }
      .og-toast-close:hover {
        opacity: 1;
      }
      .og-toast-action {
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      }
      .og-toast-action:hover {
        background: rgba(255,255,255,0.3);
      }
      @keyframes og-slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `,this.shadowRoot.appendChild(e)}highlightCorrections(e,t,i){const s=this.getElementId(e);this.clearHighlights(e),t.length===0&&this.closeTooltip(),t.length>0?this.activeElements.set(s,{element:e,corrections:t,onApply:i}):this.activeElements.delete(s),e instanceof HTMLTextAreaElement||e instanceof HTMLInputElement?this.renderTextareaBadge(e,t,i):this.renderContentEditableHighlights(e,t,i)}getCorrections(e){return this.activeElements.get(this.getElementId(e))?.corrections??[]}clearHighlights(e){const t=this.getElementId(e);this.shadowRoot.querySelectorAll(`.og-underline[data-element-id="${t}"], .og-textarea-badge[data-element-id="${t}"]`).forEach(i=>i.remove())}getElementId(e){return e.dataset.ogId||(e.dataset.ogId=Math.random().toString(36).substr(2,9)),e.dataset.ogId}renderContentEditableHighlights(e,t,i){const s=this.getElementId(e);t.forEach(r=>{const o=this.getRangeForIndices(e,r.start,r.end);if(!o)return;const c=Array.from(o.getClientRects());c.forEach((d,u)=>{if(d.width===0)return;const a=document.createElement("div");a.className=`og-underline og-${r.type}`,a.dataset.elementId=s,a.style.left=`${d.left}px`,a.style.top=`${d.bottom-2}px`,a.style.width=`${d.width}px`,a.onmouseenter=l=>{l.stopPropagation(),this.showHighlight(c),this.showTooltip(e,r,d.left,d.bottom,i)},this.shadowRoot.appendChild(a)})})}renderTextareaBadge(e,t,i){const s=this.getElementId(e),r=e.getBoundingClientRect();if(t.length===0)return;t.forEach(c=>{const d=this.getInputRects(e,c.start,c.end);d.forEach(u=>{const a=document.createElement("div");a.className=`og-underline og-${c.type}`,a.dataset.elementId=s,a.style.left=`${u.left}px`,a.style.top=`${u.bottom-2}px`,a.style.width=`${u.width}px`,a.onmouseenter=l=>{l.stopPropagation(),this.showHighlight(d),this.showTooltip(e,c,u.left,u.bottom,i)},this.shadowRoot.appendChild(a)})});const o=document.createElement("div");o.className="og-textarea-badge",o.dataset.elementId=s,o.style.left=`${r.right-30}px`,o.style.top=`${r.bottom-30}px`,o.textContent=t.length.toString(),o.onmouseenter=c=>{c.stopPropagation(),this.showTooltip(e,t[0],r.left,r.bottom,i)},this.shadowRoot.appendChild(o)}getInputRects(e,t,i){const s=e instanceof HTMLInputElement,r=getComputedStyle(e),o=document.createElement("div");["boxSizing","width","height","borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth","borderStyle","paddingTop","paddingRight","paddingBottom","paddingLeft","fontFamily","fontSize","fontWeight","fontStyle","fontVariant","letterSpacing","lineHeight","textTransform","textIndent","wordSpacing","tabSize","direction"].forEach(h=>{o.style[h]=r[h]});const d=e.getBoundingClientRect();o.style.position="fixed",o.style.left=`${d.left}px`,o.style.top=`${d.top}px`,o.style.visibility="hidden",o.style.pointerEvents="none",o.style.overflow="hidden",o.style.whiteSpace=s?"pre":"pre-wrap",o.style.wordWrap="break-word";const u=e.value,a=document.createTextNode(u.substring(0,t)),l=document.createElement("span");l.textContent=u.substring(t,i)||"​";const p=document.createTextNode(u.substring(i));o.append(a,l,p),document.body.appendChild(o),o.scrollTop=e.scrollTop,o.scrollLeft=e.scrollLeft;const g=d,x=Array.from(l.getClientRects()).filter(h=>h.width>0&&h.bottom>g.top&&h.top<g.bottom&&h.right>g.left&&h.left<g.right).map(h=>new DOMRect(h.left,h.top,h.width,h.height));return o.remove(),x}getRangeForIndices(e,t,i){const s=document.createRange();let r=0,o=null,c=0,d=null,u=0;const a=l=>{if(l.nodeType===Node.TEXT_NODE){const p=r+(l.textContent?.length||0);!o&&t>=r&&t<p&&(o=l,c=t-r),!d&&i>=r&&i<=p&&(d=l,u=i-r),r=p}else for(let p=0;p<l.childNodes.length&&(a(l.childNodes[p]),!d);p++);};if(a(e),o&&d)try{return s.setStart(o,c),s.setEnd(d,u),s}catch{return null}return null}showTooltip(e,t,i,s,r){this.closeTooltip();const o=document.createElement("div");o.className="og-tooltip",o.style.left=`${i}px`,o.style.top=`${s+8}px`;const c=t.type==="spelling"?"Spelling mistake":t.type==="grammar"?"Grammar issue":t.explanation||"Suggestion";o.innerHTML=`
      <div class="og-title">${this.escapeHtml(c)}</div>
      <div class="og-suggestion">${this.escapeHtml(t.suggestion)}</div>
      <div class="og-dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Dismiss
      </div>
    `,o.querySelector(".og-suggestion")?.addEventListener("click",()=>{r(t),this.closeTooltip()}),o.querySelector(".og-dismiss")?.addEventListener("click",()=>{this.closeTooltip(),this.highlightCorrections(e,this.getCorrections(e).filter(u=>u!==t),r)}),this.shadowRoot.appendChild(o),this.currentTooltip=o;const d=o.getBoundingClientRect();d.right>window.innerWidth&&(o.style.left=`${window.innerWidth-d.width-20}px`),d.bottom>window.innerHeight&&(o.style.top=`${s-d.height-8}px`)}escapeHtml(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}closeTooltip(){this.currentTooltip&&(this.currentTooltip.remove(),this.currentTooltip=null),this.clearHighlight()}showHighlight(e){this.clearHighlight(),e.forEach(t=>{if(t.width===0)return;const i=document.createElement("div");i.className="og-highlight",i.style.left=`${t.left}px`,i.style.top=`${t.top}px`,i.style.width=`${t.width}px`,i.style.height=`${t.height}px`,this.shadowRoot.appendChild(i)})}clearHighlight(){this.shadowRoot.querySelectorAll(".og-highlight").forEach(e=>e.remove())}showToast(e,t="info",i){this.shadowRoot.querySelectorAll(".og-toast").forEach(c=>c.remove());const s=document.createElement("div");s.className=`og-toast og-${t}`;let r=`<span>${this.escapeHtml(e)}</span>`;i?.action&&i?.onAction&&(r+=`<button class="og-toast-action">${i.action}</button>`),r+='<button class="og-toast-close">×</button>',s.innerHTML=r,s.querySelector(".og-toast-close")?.addEventListener("click",()=>{s.remove()}),i?.action&&i?.onAction&&s.querySelector(".og-toast-action")?.addEventListener("click",()=>{i.onAction(),s.remove()}),this.shadowRoot.appendChild(s);const o=i?.duration??(t==="error"?8e3:5e3);o>0&&setTimeout(()=>{this.shadowRoot.contains(s)&&s.remove()},o)}}function R(){if(location.hostname!=="docs.google.com")return null;const n=location.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);return n?{kind:n[1],id:n[2]}:null}function z(n){const e=[];let t="",i=!1;for(let s=0;s<n.length;s++){const r=n[s];i?r==='"'&&n[s+1]==='"'?(t+='"',s++):r==='"'?i=!1:t+=r:r==='"'?i=!0:r===","||r===`
`||r==="\r"?(t.trim()&&e.push(t.trim()),t=""):t+=r}return t.trim()&&e.push(t.trim()),e}async function O(n){const e=`https://docs.google.com/${n.kind}/d/${n.id}`;let t;if(n.kind==="document")t=`${e}/export?format=txt`;else if(n.kind==="presentation")t=`${e}/export/txt`;else{const o=(location.hash.match(/gid=(\d+)/)||[])[1];t=`${e}/export?format=csv${o?`&gid=${o}`:""}`}const i=await chrome.runtime.sendMessage({type:"FETCH_TEXT",url:t});if(!i?.success)throw new Error(i?.error||"Could not read document");const s=i.text;return(n.kind==="spreadsheets"?z(s).join(`
`):s).replace(/^\uFEFF/,"")}const w=2e4,E=n=>new Promise(e=>setTimeout(e,n));function v(n,e,t,i,s={}){const r={key:e,code:t,keyCode:i,which:i,bubbles:!0,cancelable:!0,...s};n.dispatchEvent(new KeyboardEvent("keydown",r)),n.dispatchEvent(new KeyboardEvent("keyup",r))}function q(){const n=document.activeElement;if(n instanceof HTMLInputElement&&n.type==="text")return n;const e=document.querySelectorAll('input.docs-findinput-input, .docs-findinput input, [class*="findinput"] input, input[aria-label^="Find"]');return Array.from(e).find(t=>t.offsetParent!==null)||null}async function _(n,e){const i=document.querySelector(".docs-texteventtarget-iframe")?.contentDocument;if(!i)return!1;const s=/Mac/i.test(navigator.platform);v(i.activeElement||i.body,"f","KeyF",70,s?{metaKey:!0}:{ctrlKey:!0});let r=null;for(let o=0;o<20&&!r;o++)await E(50),r=q();if(!r)return!1;r.focus(),r.select(),document.execCommand("insertText",!1,n)||(r.value=n,r.dispatchEvent(new Event("input",{bubbles:!0}))),await E(150);for(let o=0;o<=e;o++)v(r,"Enter","Enter",13),await E(60);return v(r,"Escape","Escape",27),!0}function P(n,e){const t=n.toLowerCase(),i=e.original.toLowerCase();let s=0;for(let r=t.indexOf(i);r!==-1&&r<e.start;r=t.indexOf(i,r+1))s++;return s}function F(n){const e=R();if(!e)return;const t=document.createElement("div");t.style.cssText="position:fixed;right:16px;bottom:16px;z-index:2147483647;";const i=t.attachShadow({mode:"closed"});i.innerHTML=`
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
    <button class="fab">Check document</button>`;const s=i.querySelector(".panel"),r=i.querySelector(".body"),o=i.querySelector(".fab");i.querySelector(".close").addEventListener("click",()=>s.classList.remove("open"));const c=a=>{r.innerHTML="";const l=document.createElement("div");l.className="msg",l.textContent=a,r.appendChild(l)};let d="";const u=a=>{if(r.innerHTML="",!a.length)return c("No issues found 🎉");for(const l of a){const p=document.createElement("div");p.className="item",e.kind==="document"&&(p.style.cursor="pointer",p.title="Click to jump to this text in the document",p.addEventListener("click",()=>_(l.original,P(d,l))));const g=document.createElement("div"),x=document.createElement("span");x.className="orig",x.textContent=l.original;const h=document.createElement("span");h.className="sug",h.textContent=l.suggestion,g.append(x," → ",h);const b=document.createElement("div");b.className="exp",b.textContent=l.explanation;const m=document.createElement("button");m.className="copy",m.textContent="Copy fix",m.addEventListener("click",async N=>{N.stopPropagation(),await navigator.clipboard.writeText(l.suggestion),m.textContent="Copied",setTimeout(()=>m.textContent="Copy fix",1500)}),p.append(g,b,m),r.appendChild(p)}};o.addEventListener("click",async()=>{s.classList.add("open"),c("Reading document…"),o.disabled=!0;try{let a=await O(e);if(a.trim().length<5)return c("Nothing to check yet.");const l=a.length>w;l&&(a=a.slice(0,w)),d=a,c("Analyzing…");const p=await n(a);if(!p.success)return c(p.error||"Analysis failed");if(u(p.data.corrections),l){const g=document.createElement("div");g.className="msg",g.textContent=`Only the first ${w} characters were checked.`,r.appendChild(g)}}catch(a){c(a?.message||"Something went wrong")}finally{o.disabled=!1}}),document.documentElement.appendChild(t)}const k=new Set,f=new $;let T=!1,S=null;function W(n){const e=n.target;T||f.highlightCorrections(e,[],()=>{}),C(e)}function B(n){const e=n.target;f.highlightCorrections(e,[],()=>{}),setTimeout(()=>C(e),100)}async function C(n){const e=n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement?n.value:n.innerText;if(e.length<5){f.highlightCorrections(n,[],()=>{});return}const t=(n._analysisCall??0)+1;n._analysisCall=t;const i=n._analysisTimeout;i&&clearTimeout(i);let s=5e3;try{s=(await H()).debounceSeconds*1e3}catch{}n._analysisCall===t&&(n._analysisTimeout=setTimeout(()=>L(n,e),s))}async function L(n,e){let t;try{t=await chrome.runtime.sendMessage({type:"ANALYZE_TEXT",text:e})}catch{return}t&&(t.success?f.highlightCorrections(n,t.data.corrections,i=>{I(n,i)}):t.error?.includes("API key")?f.showToast("API key not configured","error",{action:"Open Settings",onAction:()=>{chrome.runtime.sendMessage({type:"OPEN_OPTIONS"})}}):t.error?.includes("disabled")||f.showToast(`Analysis failed: ${t.error}`,"error"))}function I(n,e){const t=f.getCorrections(n).filter(o=>o!==e);T=!0;const i=D(n,e);if(T=!1,!i)return;const s=e.suggestion.length-(e.end-e.start),r=t.filter(o=>o.end<=e.start||o.start>=e.end).map(o=>o.start>=e.end?{...o,start:o.start+s,end:o.end+s}:o);f.highlightCorrections(n,r,o=>I(n,o))}function D(n,e){if(n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement){const t=n.value,i=t.substring(0,e.start)+e.suggestion+t.substring(e.end);return n.value=i,n.dispatchEvent(new Event("input",{bubbles:!0})),!0}else try{const t=n.innerText||n.textContent||"",i=t.substring(e.start,e.end);let s=e.start;if(i!==e.original){const d=Math.max(0,e.start-10),u=Math.min(t.length,e.end+10),l=t.substring(d,u).indexOf(e.original);if(l===-1)return!1;s=d+l}const r=window.getSelection();if(!r)return!1;const o=X(n,s,s+e.original.length);if(!o)return!1;const c=document.createRange();return c.setStart(o.startNode,o.startOffset),c.setEnd(o.endNode,o.endOffset),r.removeAllRanges(),r.addRange(c),document.execCommand("insertText",!1,e.suggestion),n.dispatchEvent(new Event("input",{bubbles:!0})),!0}catch{return!1}}function X(n,e,t){let i=0,s=null,r=0,o=null,c=0;const d=document.createTreeWalker(n,NodeFilter.SHOW_TEXT,null);let u;for(;u=d.nextNode();){const a=u.textContent?.length||0,l=i+a;if(!s&&e>=i&&e<l&&(s=u,r=e-i),!o&&t>=i&&t<=l&&(o=u,c=t-i),i=l,s&&o)break}return s&&o?{startNode:s,startOffset:r,endNode:o,endOffset:c}:null}chrome.runtime.onMessage.addListener((n,e,t)=>{if(n.type==="RUN_ANALYSIS_NOW"){const i=document.activeElement,s=i&&U(i)?i:S;if(!s||!document.contains(s))return;const r=s instanceof HTMLInputElement||s instanceof HTMLTextAreaElement?s.value:s.innerText;if(r.length<5){t({started:!1,reason:"short"});return}const o=s._analysisTimeout;o&&clearTimeout(o),s._analysisCall=(s._analysisCall??0)+1,L(s,r),t({started:!0});return}});function U(n){const e=n.tagName.toLowerCase();return e==="input"||e==="textarea"||n.isContentEditable}A(n=>{k.has(n)||(n.addEventListener("input",W),n.addEventListener("paste",B),n.addEventListener("focus",()=>{S=n,C(n)}),k.add(n))});window===window.top&&F(async n=>{try{return await chrome.runtime.sendMessage({type:"ANALYZE_TEXT",text:n})}catch{return{success:!1,error:"Extension was reloaded; refresh the page."}}});chrome.runtime.sendMessage({type:"PING"},()=>{chrome.runtime.lastError});
