import{g as O}from"./storage-BDjIbO7L.js";const q=["password","hidden","file","checkbox","radio","submit","button","image","reset","color","range"];function T(n){const e=n.tagName.toLowerCase();if(e==="input"){const t=n,o=(t.type||"text").toLowerCase();return!(q.includes(o)||t.readOnly||t.disabled)}if(e==="textarea"){const t=n;return!t.readOnly&&!t.disabled}return n.contentEditable==="true"||n.isContentEditable}function _(n){const e="input, textarea, [contenteditable]";document.querySelectorAll(e).forEach(r=>{T(r)&&n(r)});const o=new MutationObserver(r=>{for(const s of r)for(const i of s.addedNodes)i instanceof Element&&(T(i)?n(i):i.querySelectorAll(e).forEach(a=>{T(a)&&n(a)}))});return o.observe(document.body,{childList:!0,subtree:!0}),o}class F{container;shadowRoot;currentTooltip=null;currentHighlight=null;activeElements=new Map;updateScheduled=!1;constructor(){this.container=document.createElement("div"),this.container.id="open-grammarly-root",this.container.style.position="fixed",this.container.style.top="0",this.container.style.left="0",this.container.style.width="100vw",this.container.style.height="100vh",this.container.style.pointerEvents="none",this.container.style.zIndex="2147483647",document.body.appendChild(this.container),this.shadowRoot=this.container.attachShadow({mode:"open"}),this.injectStyles(),document.addEventListener("mousedown",e=>{this.currentTooltip&&!this.container.contains(e.target)&&this.closeTooltip()}),window.addEventListener("scroll",()=>this.scheduleUpdate(),{passive:!0,capture:!0}),window.addEventListener("resize",()=>this.scheduleUpdate(),{passive:!0})}scheduleUpdate(){this.updateScheduled||(this.updateScheduled=!0,requestAnimationFrame(()=>{this.updatePositions(),this.updateScheduled=!1}))}updatePositions(){this.currentTooltip&&this.closeTooltip(),this.shadowRoot.querySelectorAll(".og-underline").forEach(e=>e.remove()),this.activeElements.forEach((e,t)=>{if(!document.body.contains(e.element)){this.activeElements.delete(t);return}e.element instanceof HTMLTextAreaElement||e.element instanceof HTMLInputElement?this.renderTextareaBadge(e.element,e.corrections,e.onApply):this.renderContentEditableHighlights(e.element,e.corrections,e.onApply)})}injectStyles(){const e=document.createElement("style");e.textContent=`
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
      
      
      .og-toast {
        position: fixed;
        bottom: 76px;
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
    `,this.shadowRoot.appendChild(e)}highlightCorrections(e,t,o){const r=this.getElementId(e);this.clearHighlights(e),t.length===0&&this.closeTooltip(),t.length>0?this.activeElements.set(r,{element:e,corrections:t,onApply:o}):this.activeElements.delete(r),e instanceof HTMLTextAreaElement||e instanceof HTMLInputElement?this.renderTextareaBadge(e,t,o):this.renderContentEditableHighlights(e,t,o)}getCorrections(e){return this.activeElements.get(this.getElementId(e))?.corrections??[]}clearHighlights(e){const t=this.getElementId(e);this.shadowRoot.querySelectorAll(`.og-underline[data-element-id="${t}"]`).forEach(o=>o.remove())}getElementId(e){return e.dataset.ogId||(e.dataset.ogId=Math.random().toString(36).substr(2,9)),e.dataset.ogId}renderContentEditableHighlights(e,t,o){const r=this.getElementId(e);t.forEach(s=>{const i=this.getRangeForIndices(e,s.start,s.end);if(!i)return;const l=Array.from(i.getClientRects());l.forEach((a,c)=>{if(a.width===0)return;const h=document.createElement("div");h.className=`og-underline og-${s.type}`,h.dataset.elementId=r,h.style.left=`${a.left}px`,h.style.top=`${a.bottom-2}px`,h.style.width=`${a.width}px`,h.onmouseenter=u=>{u.stopPropagation(),this.showHighlight(l),this.showTooltip(e,s,a.left,a.bottom,o)},this.shadowRoot.appendChild(h)})})}renderTextareaBadge(e,t,o){const r=this.getElementId(e);t.length!==0&&t.forEach(s=>{const i=this.getInputRects(e,s.start,s.end);i.forEach(l=>{const a=document.createElement("div");a.className=`og-underline og-${s.type}`,a.dataset.elementId=r,a.style.left=`${l.left}px`,a.style.top=`${l.bottom-2}px`,a.style.width=`${l.width}px`,a.onmouseenter=c=>{c.stopPropagation(),this.showHighlight(i),this.showTooltip(e,s,l.left,l.bottom,o)},this.shadowRoot.appendChild(a)})})}getInputRects(e,t,o){const r=e instanceof HTMLInputElement,s=getComputedStyle(e),i=document.createElement("div");["boxSizing","width","height","borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth","borderStyle","paddingTop","paddingRight","paddingBottom","paddingLeft","fontFamily","fontSize","fontWeight","fontStyle","fontVariant","letterSpacing","lineHeight","textTransform","textIndent","wordSpacing","tabSize","direction"].forEach(p=>{i.style[p]=s[p]});const a=e.getBoundingClientRect();i.style.position="fixed",i.style.left=`${a.left}px`,i.style.top=`${a.top}px`,i.style.visibility="hidden",i.style.pointerEvents="none",i.style.overflow="hidden",i.style.whiteSpace=r?"pre":"pre-wrap",i.style.wordWrap="break-word";const c=e.value,h=document.createTextNode(c.substring(0,t)),u=document.createElement("span");u.textContent=c.substring(t,o)||"​";const d=document.createTextNode(c.substring(o));i.append(h,u,d),document.body.appendChild(i),i.scrollTop=e.scrollTop,i.scrollLeft=e.scrollLeft;const g=a,f=Array.from(u.getClientRects()).filter(p=>p.width>0&&p.bottom>g.top&&p.top<g.bottom&&p.right>g.left&&p.left<g.right).map(p=>new DOMRect(p.left,p.top,p.width,p.height));return i.remove(),f}getRangeForIndices(e,t,o){const r=document.createRange();let s=0,i=null,l=0,a=null,c=0;const h=u=>{if(u.nodeType===Node.TEXT_NODE){const d=s+(u.textContent?.length||0);!i&&t>=s&&t<d&&(i=u,l=t-s),!a&&o>=s&&o<=d&&(a=u,c=o-s),s=d}else for(let d=0;d<u.childNodes.length&&(h(u.childNodes[d]),!a);d++);};if(h(e),i&&a)try{return r.setStart(i,l),r.setEnd(a,c),r}catch{return null}return null}showTooltip(e,t,o,r,s){this.closeTooltip();const i=document.createElement("div");i.className="og-tooltip",i.style.left=`${o}px`,i.style.top=`${r+8}px`;const l=t.type==="spelling"?"Spelling mistake":t.type==="grammar"?"Grammar issue":t.explanation||"Suggestion";i.innerHTML=`
      <div class="og-title">${this.escapeHtml(l)}</div>
      <div class="og-suggestion">${this.escapeHtml(t.suggestion)}</div>
      <div class="og-dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Dismiss
      </div>
    `,i.querySelector(".og-suggestion")?.addEventListener("click",()=>{s(t),this.closeTooltip()}),i.querySelector(".og-dismiss")?.addEventListener("click",()=>{this.closeTooltip(),this.highlightCorrections(e,this.getCorrections(e).filter(c=>c!==t),s)}),this.shadowRoot.appendChild(i),this.currentTooltip=i;const a=i.getBoundingClientRect();a.right>window.innerWidth&&(i.style.left=`${window.innerWidth-a.width-20}px`),a.bottom>window.innerHeight&&(i.style.top=`${r-a.height-8}px`)}escapeHtml(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}closeTooltip(){this.currentTooltip&&(this.currentTooltip.remove(),this.currentTooltip=null),this.clearHighlight()}showHighlight(e){this.clearHighlight(),e.forEach(t=>{if(t.width===0)return;const o=document.createElement("div");o.className="og-highlight",o.style.left=`${t.left}px`,o.style.top=`${t.top}px`,o.style.width=`${t.width}px`,o.style.height=`${t.height}px`,this.shadowRoot.appendChild(o)})}clearHighlight(){this.shadowRoot.querySelectorAll(".og-highlight").forEach(e=>e.remove())}showToast(e,t="info",o){this.shadowRoot.querySelectorAll(".og-toast").forEach(l=>l.remove());const r=document.createElement("div");r.className=`og-toast og-${t}`;let s=`<span>${this.escapeHtml(e)}</span>`;o?.action&&o?.onAction&&(s+=`<button class="og-toast-action">${o.action}</button>`),s+='<button class="og-toast-close">×</button>',r.innerHTML=s,r.querySelector(".og-toast-close")?.addEventListener("click",()=>{r.remove()}),o?.action&&o?.onAction&&r.querySelector(".og-toast-action")?.addEventListener("click",()=>{o.onAction(),r.remove()}),this.shadowRoot.appendChild(r);const i=o?.duration??(t==="error"?8e3:5e3);i>0&&setTimeout(()=>{this.shadowRoot.contains(r)&&r.remove()},i)}}function P(){if(location.hostname!=="docs.google.com")return null;const n=location.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);return n?{kind:n[1],id:n[2]}:null}function B(n){const e=[];let t="",o=!1;for(let r=0;r<n.length;r++){const s=n[r];o?s==='"'&&n[r+1]==='"'?(t+='"',r++):s==='"'?o=!1:t+=s:s==='"'?o=!0:s===","||s===`
`||s==="\r"?(t.trim()&&e.push(t.trim()),t=""):t+=s}return t.trim()&&e.push(t.trim()),e}async function W(n){const e=`https://docs.google.com/${n.kind}/d/${n.id}`;let t;if(n.kind==="document")t=`${e}/export?format=txt`;else if(n.kind==="presentation")t=`${e}/export/txt`;else{const i=(location.hash.match(/gid=(\d+)/)||[])[1];t=`${e}/export?format=csv${i?`&gid=${i}`:""}`}const o=await chrome.runtime.sendMessage({type:"FETCH_TEXT",url:t});if(!o?.success)throw new Error(o?.error||"Could not read document");const r=o.text;return(n.kind==="spreadsheets"?B(r).join(`
`):r).replace(/^\uFEFF/,"")}const C=2e4,k=n=>new Promise(e=>setTimeout(e,n));function S(n,e,t,o,r={}){const s={key:e,code:t,keyCode:o,which:o,bubbles:!0,cancelable:!0,...r};n.dispatchEvent(new KeyboardEvent("keydown",s)),n.dispatchEvent(new KeyboardEvent("keyup",s))}function D(){const n=document.activeElement;if(n instanceof HTMLInputElement&&n.type==="text")return n;const e=document.querySelectorAll('input.docs-findinput-input, .docs-findinput input, [class*="findinput"] input, input[aria-label^="Find"]');return Array.from(e).find(t=>t.offsetParent!==null)||null}async function X(n,e){const o=document.querySelector(".docs-texteventtarget-iframe")?.contentDocument;if(!o)return!1;const r=/Mac/i.test(navigator.platform);S(o.activeElement||o.body,"f","KeyF",70,r?{metaKey:!0}:{ctrlKey:!0});let s=null;for(let i=0;i<20&&!s;i++)await k(50),s=D();if(!s)return!1;s.focus(),s.select(),document.execCommand("insertText",!1,n)||(s.value=n,s.dispatchEvent(new Event("input",{bubbles:!0}))),await k(150);for(let i=0;i<=e;i++)S(s,"Enter","Enter",13),await k(60);return S(s,"Escape","Escape",27),!0}function U(n,e){const t=n.toLowerCase(),o=e.original.toLowerCase();let r=0;for(let s=t.indexOf(o);s!==-1&&s<e.start;s=t.indexOf(o,s+1))r++;return r}function G(n){const e=P();if(!e)return;const t=document.createElement("div");t.style.cssText="position:fixed;right:16px;bottom:16px;z-index:2147483647;";const o=t.attachShadow({mode:"closed"});o.innerHTML=`
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
      .badge.spin { color:transparent; border-color:#15c39a; border-top-color:#d6f5ee; animation:og-spin .8s linear infinite; }
      @keyframes og-spin { to { transform:rotate(360deg); } }
      .wrap { position:relative; display:inline-block; }
      .badge { position:absolute; top:-6px; right:-6px; min-width:20px; height:20px; padding:0 5px; border-radius:999px; background:#fff; color:#202124; border:2px solid #15c39a; font:700 11px/16px system-ui,sans-serif; text-align:center; box-sizing:border-box; display:none; }
      .msg { color:#5f6368; padding:8px 0; }
    </style>
    <div class="panel"><div class="head"><span>Open Grammarly</span><button class="close" title="Close">×</button></div><div class="body"></div></div>
    <div class="wrap"><button class="fab">Check Grammar</button><span class="badge"></span></div>`;const r=o.querySelector(".panel"),s=o.querySelector(".body"),i=o.querySelector(".fab"),l=o.querySelector(".badge"),a=d=>{l.textContent=d===null||d==="loading"?"":String(d),l.classList.toggle("spin",d==="loading"),l.style.display=d===null?"none":"block"};o.querySelector(".close").addEventListener("click",()=>r.classList.remove("open"));const c=d=>{s.innerHTML="";const g=document.createElement("div");g.className="msg",g.textContent=d,s.appendChild(g)};let h="";const u=d=>{if(s.innerHTML="",!d.length)return c("No issues found 🎉");for(const g of d){const f=document.createElement("div");f.className="item",e.kind==="document"&&(f.style.cursor="pointer",f.title="Click to jump to this text in the document",f.addEventListener("click",()=>X(g.original,U(h,g))));const p=document.createElement("div"),w=document.createElement("span");w.className="orig",w.textContent=g.original;const v=document.createElement("span");v.className="sug",v.textContent=g.suggestion,p.append(w," → ",v);const E=document.createElement("div");E.className="exp",E.textContent=g.explanation;const b=document.createElement("button");b.className="copy",b.textContent="Copy fix",b.addEventListener("click",async z=>{z.stopPropagation(),await navigator.clipboard.writeText(g.suggestion),b.textContent="Copied",setTimeout(()=>b.textContent="Copy fix",1500)}),f.append(p,E,b),s.appendChild(f)}};i.addEventListener("click",async()=>{r.classList.add("open"),c("Reading document…"),i.disabled=!0,a("loading");try{let d=await W(e);if(d.trim().length<5)return c("Nothing to check yet.");const g=d.length>C;g&&(d=d.slice(0,C)),h=d,c("Analyzing…");const f=await n(d);if(!f.success)return c(f.error||"Analysis failed");if(u(f.data.corrections),a(f.data.corrections.length),g){const p=document.createElement("div");p.className="msg",p.textContent=`Only the first ${C} characters were checked.`,s.appendChild(p)}}catch(d){c(d?.message||"Something went wrong")}finally{i.disabled=!1,l.classList.contains("spin")&&a(null)}}),document.documentElement.appendChild(t)}const H=new Set,m=new F;let L=!1,A=null,N=null,y=null;function x(n){if(!y)return;const e=n==="loading";y.textContent=e||n===null?"":String(n),y.classList.toggle("spin",e),y.style.display=n===null?"none":"block"}const j=location.hostname==="docs.google.com"&&/^\/(document|spreadsheets|presentation)\/d\//.test(location.pathname);function K(){if(N||j||window!==window.top)return;const n=document.createElement("div");n.style.cssText="position:fixed;right:16px;bottom:16px;z-index:2147483647;";const e=n.attachShadow({mode:"closed"});e.innerHTML=`<style>
    button { background:#15c39a; color:#fff; border:0; border-radius:999px; padding:10px 16px; font:600 13px system-ui,sans-serif; box-shadow:0 2px 8px rgba(0,0,0,.3); cursor:pointer; }
    .badge.spin { color:transparent; border-color:#15c39a; border-top-color:#d6f5ee; animation:og-spin .8s linear infinite; }
    @keyframes og-spin { to { transform:rotate(360deg); } }
    .wrap { position:relative; display:inline-block; }
    .badge { position:absolute; top:-6px; right:-6px; min-width:20px; height:20px; padding:0 5px; border-radius:999px; background:#fff; color:#202124; border:2px solid #15c39a; font:700 11px/16px system-ui,sans-serif; text-align:center; box-sizing:border-box; display:none; }
  </style><div class="wrap"><button>Check Grammar</button><span class="badge"></span></div>`,y=e.querySelector(".badge");const t=e.querySelector("button");t.addEventListener("mousedown",o=>o.preventDefault()),t.addEventListener("click",()=>{const o=$();o?o.started||m.showToast("Write a bit more text first.","error"):m.showToast("Click into a text field first.","error")}),document.documentElement.appendChild(n),N=n}function V(n){const e=n.target;L||(m.highlightCorrections(e,[],()=>{}),x(null)),I(e)}function Y(n){const e=n.target;m.highlightCorrections(e,[],()=>{}),x(null),setTimeout(()=>I(e),100)}async function I(n){const e=n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement?n.value:n.innerText;if(e.length<5){m.highlightCorrections(n,[],()=>{}),x(null);return}const t=(n._analysisCall??0)+1;n._analysisCall=t;const o=n._analysisTimeout;o&&clearTimeout(o);let r=5e3;try{r=(await O()).debounceSeconds*1e3}catch{}n._analysisCall===t&&(n._analysisTimeout=setTimeout(()=>M(n,e),r))}async function M(n,e){let t;x("loading");try{t=await chrome.runtime.sendMessage({type:"ANALYZE_TEXT",text:e})}catch{x(null);return}if(!t){x(null);return}t.success?(m.highlightCorrections(n,t.data.corrections,o=>{R(n,o)}),x(t.data.corrections.length)):(x(null),t.error?.includes("API key")?m.showToast("API key not configured","error",{action:"Open Settings",onAction:()=>{chrome.runtime.sendMessage({type:"OPEN_OPTIONS"})}}):t.error?.includes("disabled")||m.showToast(`Analysis failed: ${t.error}`,"error"))}function R(n,e){const t=m.getCorrections(n).filter(i=>i!==e);L=!0;const o=Z(n,e);if(L=!1,!o)return;const r=e.suggestion.length-(e.end-e.start),s=t.filter(i=>i.end<=e.start||i.start>=e.end).map(i=>i.start>=e.end?{...i,start:i.start+r,end:i.end+r}:i);m.highlightCorrections(n,s,i=>R(n,i)),x(s.length)}function Z(n,e){if(n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement){const t=n.value,o=t.substring(0,e.start)+e.suggestion+t.substring(e.end);return n.value=o,n.dispatchEvent(new Event("input",{bubbles:!0})),!0}else try{const t=n.innerText||n.textContent||"",o=t.substring(e.start,e.end);let r=e.start;if(o!==e.original){const a=Math.max(0,e.start-10),c=Math.min(t.length,e.end+10),u=t.substring(a,c).indexOf(e.original);if(u===-1)return!1;r=a+u}const s=window.getSelection();if(!s)return!1;const i=J(n,r,r+e.original.length);if(!i)return!1;const l=document.createRange();return l.setStart(i.startNode,i.startOffset),l.setEnd(i.endNode,i.endOffset),s.removeAllRanges(),s.addRange(l),document.execCommand("insertText",!1,e.suggestion),n.dispatchEvent(new Event("input",{bubbles:!0})),!0}catch{return!1}}function J(n,e,t){let o=0,r=null,s=0,i=null,l=0;const a=document.createTreeWalker(n,NodeFilter.SHOW_TEXT,null);let c;for(;c=a.nextNode();){const h=c.textContent?.length||0,u=o+h;if(!r&&e>=o&&e<u&&(r=c,s=e-o),!i&&t>=o&&t<=u&&(i=c,l=t-o),o=u,r&&i)break}return r&&i?{startNode:r,startOffset:s,endNode:i,endOffset:l}:null}function $(){const n=document.activeElement,e=n&&Q(n)?n:A;if(!e||!document.contains(e))return null;const t=e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement?e.value:e.innerText;if(t.length<5)return{started:!1,reason:"short"};const o=e._analysisTimeout;return o&&clearTimeout(o),e._analysisCall=(e._analysisCall??0)+1,M(e,t),{started:!0}}chrome.runtime.onMessage.addListener((n,e,t)=>{if(n.type==="RUN_ANALYSIS_NOW"){const o=$();o&&t(o);return}});function Q(n){const e=n.tagName.toLowerCase();return e==="input"||e==="textarea"||n.isContentEditable}_(n=>{H.has(n)||(n.addEventListener("input",V),n.addEventListener("paste",Y),n.addEventListener("focus",()=>{A=n,K(),I(n)}),H.add(n))});window===window.top&&G(async n=>{try{return await chrome.runtime.sendMessage({type:"ANALYZE_TEXT",text:n})}catch{return{success:!1,error:"Extension was reloaded; refresh the page."}}});chrome.runtime.sendMessage({type:"PING"},()=>{chrome.runtime.lastError});
