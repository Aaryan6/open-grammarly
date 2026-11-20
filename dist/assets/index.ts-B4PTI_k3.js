import{g as q}from"./storage-BDjIbO7L.js";const _=["password","hidden","file","checkbox","radio","submit","button","image","reset","color","range"];function C(t){const e=t.tagName.toLowerCase();if(e==="input"){const n=t,o=(n.type||"text").toLowerCase();return!(_.includes(o)||n.readOnly||n.disabled)}if(e==="textarea"){const n=t;return!n.readOnly&&!n.disabled}return t.contentEditable==="true"||t.isContentEditable}function D(t){const e="input, textarea, [contenteditable]";document.querySelectorAll(e).forEach(i=>{C(i)&&t(i)});const o=new MutationObserver(i=>{for(const a of i)for(const s of a.addedNodes)s instanceof Element&&(C(s)?t(s):s.querySelectorAll(e).forEach(r=>{C(r)&&t(r)}))});return o.observe(document.body,{childList:!0,subtree:!0}),o}class F{container;shadowRoot;currentTooltip=null;currentHighlight=null;activeElements=new Map;updateScheduled=!1;constructor(){this.container=document.createElement("div"),this.container.id="open-grammarly-root",this.container.style.position="fixed",this.container.style.top="0",this.container.style.left="0",this.container.style.width="100vw",this.container.style.height="100vh",this.container.style.pointerEvents="none",this.container.style.zIndex="2147483647",document.body.appendChild(this.container),this.shadowRoot=this.container.attachShadow({mode:"open"}),this.injectStyles(),document.addEventListener("mousedown",e=>{this.currentTooltip&&!this.container.contains(e.target)&&this.closeTooltip()}),window.addEventListener("scroll",()=>this.scheduleUpdate(),{passive:!0,capture:!0}),window.addEventListener("resize",()=>this.scheduleUpdate(),{passive:!0})}scheduleUpdate(){this.updateScheduled||(this.updateScheduled=!0,requestAnimationFrame(()=>{this.updatePositions(),this.updateScheduled=!1}))}updatePositions(){this.currentTooltip&&this.closeTooltip(),this.shadowRoot.querySelectorAll(".og-underline").forEach(e=>e.remove()),this.activeElements.forEach((e,n)=>{if(!document.body.contains(e.element)){this.activeElements.delete(n);return}e.element instanceof HTMLTextAreaElement||e.element instanceof HTMLInputElement?this.renderTextareaBadge(e.element,e.corrections,e.onApply):this.renderContentEditableHighlights(e.element,e.corrections,e.onApply)})}injectStyles(){const e=document.createElement("style");e.textContent=`
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
      .og-explanation {
        font-size: 12px;
        font-style: italic;
        color: #374151;
        padding: 0 14px 8px;
        line-height: 1.4;
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
    `,this.shadowRoot.appendChild(e)}highlightCorrections(e,n,o){const i=this.getElementId(e);this.clearHighlights(e),n.length===0&&this.closeTooltip(),n.length>0?this.activeElements.set(i,{element:e,corrections:n,onApply:o}):this.activeElements.delete(i),e instanceof HTMLTextAreaElement||e instanceof HTMLInputElement?this.renderTextareaBadge(e,n,o):this.renderContentEditableHighlights(e,n,o)}getCorrections(e){return this.activeElements.get(this.getElementId(e))?.corrections??[]}clearHighlights(e){const n=this.getElementId(e);this.shadowRoot.querySelectorAll(`.og-underline[data-element-id="${n}"]`).forEach(o=>o.remove())}getElementId(e){return e.dataset.ogId||(e.dataset.ogId=Math.random().toString(36).substr(2,9)),e.dataset.ogId}renderContentEditableHighlights(e,n,o){const i=this.getElementId(e);n.forEach(a=>{const s=this.getRangeForIndices(e,a.start,a.end);if(!s)return;const d=Array.from(s.getClientRects());d.forEach((r,c)=>{if(r.width===0)return;const g=document.createElement("div");g.className=`og-underline og-${a.type}`,g.dataset.elementId=i,g.style.left=`${r.left}px`,g.style.top=`${r.bottom-2}px`,g.style.width=`${r.width}px`,g.onmouseenter=p=>{p.stopPropagation(),this.showHighlight(d),this.showTooltip(e,a,r.left,r.bottom,o)},this.shadowRoot.appendChild(g)})})}renderTextareaBadge(e,n,o){const i=this.getElementId(e);n.length!==0&&n.forEach(a=>{const s=this.getInputRects(e,a.start,a.end);s.forEach(d=>{const r=document.createElement("div");r.className=`og-underline og-${a.type}`,r.dataset.elementId=i,r.style.left=`${d.left}px`,r.style.top=`${d.bottom-2}px`,r.style.width=`${d.width}px`,r.onmouseenter=c=>{c.stopPropagation(),this.showHighlight(s),this.showTooltip(e,a,d.left,d.bottom,o)},this.shadowRoot.appendChild(r)})})}getInputRects(e,n,o){const i=e instanceof HTMLInputElement,a=getComputedStyle(e),s=document.createElement("div");["boxSizing","width","height","borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth","borderStyle","paddingTop","paddingRight","paddingBottom","paddingLeft","fontFamily","fontSize","fontWeight","fontStyle","fontVariant","letterSpacing","lineHeight","textTransform","textIndent","wordSpacing","tabSize","direction"].forEach(u=>{s.style[u]=a[u]});const r=e.getBoundingClientRect();s.style.position="fixed",s.style.left=`${r.left}px`,s.style.top=`${r.top}px`,s.style.visibility="hidden",s.style.pointerEvents="none",s.style.overflow="hidden",s.style.whiteSpace=i?"pre":"pre-wrap",s.style.wordWrap="break-word";const c=e.value,g=document.createTextNode(c.substring(0,n)),p=document.createElement("span");p.textContent=c.substring(n,o)||"​";const l=document.createTextNode(c.substring(o));s.append(g,p,l),document.body.appendChild(s),s.scrollTop=e.scrollTop,s.scrollLeft=e.scrollLeft;const h=r,f=Array.from(p.getClientRects()).filter(u=>u.width>0&&u.bottom>h.top&&u.top<h.bottom&&u.right>h.left&&u.left<h.right).map(u=>new DOMRect(u.left,u.top,u.width,u.height));return s.remove(),f}getRangeForIndices(e,n,o){const i=document.createRange();let a=0,s=null,d=0,r=null,c=0;const g=p=>{if(p.nodeType===Node.TEXT_NODE){const l=a+(p.textContent?.length||0);!s&&n>=a&&n<l&&(s=p,d=n-a),!r&&o>=a&&o<=l&&(r=p,c=o-a),a=l}else for(let l=0;l<p.childNodes.length&&(g(p.childNodes[l]),!r);l++);};if(g(e),s&&r)try{return i.setStart(s,d),i.setEnd(r,c),i}catch{return null}return null}showTooltip(e,n,o,i,a){this.closeTooltip();const s=document.createElement("div");s.className="og-tooltip",s.style.left=`${o}px`,s.style.top=`${i+8}px`;const d=n.type==="spelling"?"Spelling mistake":n.type==="grammar"?"Grammar issue":n.explanation||"Suggestion";s.innerHTML=`
      <div class="og-title">${this.escapeHtml(d)}</div>
      ${n.explanation?`<div class="og-explanation">${this.escapeHtml(n.explanation)}</div>`:""}
      <div class="og-suggestion">${this.escapeHtml(n.suggestion)}</div>
      <div class="og-dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Dismiss
      </div>
    `,s.addEventListener("mousedown",c=>c.preventDefault()),s.querySelector(".og-suggestion")?.addEventListener("click",()=>{a(n),this.closeTooltip()}),s.querySelector(".og-dismiss")?.addEventListener("click",()=>{this.closeTooltip(),this.highlightCorrections(e,this.getCorrections(e).filter(c=>c!==n),a)}),this.shadowRoot.appendChild(s),this.currentTooltip=s;const r=s.getBoundingClientRect();r.right>window.innerWidth&&(s.style.left=`${window.innerWidth-r.width-20}px`),r.bottom>window.innerHeight&&(s.style.top=`${i-r.height-8}px`)}escapeHtml(e){return e.replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}closeTooltip(){this.currentTooltip&&(this.currentTooltip.remove(),this.currentTooltip=null),this.clearHighlight()}showHighlight(e){this.clearHighlight(),e.forEach(n=>{if(n.width===0)return;const o=document.createElement("div");o.className="og-highlight",o.style.left=`${n.left}px`,o.style.top=`${n.top}px`,o.style.width=`${n.width}px`,o.style.height=`${n.height}px`,this.shadowRoot.appendChild(o)})}clearHighlight(){this.shadowRoot.querySelectorAll(".og-highlight").forEach(e=>e.remove())}showToast(e,n="info",o){this.shadowRoot.querySelectorAll(".og-toast").forEach(d=>d.remove());const i=document.createElement("div");i.className=`og-toast og-${n}`;let a=`<span>${this.escapeHtml(e)}</span>`;o?.action&&o?.onAction&&(a+=`<button class="og-toast-action">${o.action}</button>`),a+='<button class="og-toast-close">×</button>',i.innerHTML=a,i.querySelector(".og-toast-close")?.addEventListener("click",()=>{i.remove()}),o?.action&&o?.onAction&&i.querySelector(".og-toast-action")?.addEventListener("click",()=>{o.onAction(),i.remove()}),this.shadowRoot.appendChild(i);const s=o?.duration??(n==="error"?8e3:5e3);s>0&&setTimeout(()=>{this.shadowRoot.contains(i)&&i.remove()},s)}}function P(){if(location.hostname!=="docs.google.com")return null;const t=location.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);return t?{kind:t[1],id:t[2]}:null}function W(t){const e=[];let n="",o=!1;for(let i=0;i<t.length;i++){const a=t[i];o?a==='"'&&t[i+1]==='"'?(n+='"',i++):a==='"'?o=!1:n+=a:a==='"'?o=!0:a===","||a===`
`||a==="\r"?(n.trim()&&e.push(n.trim()),n=""):n+=a}return n.trim()&&e.push(n.trim()),e}async function B(t){const e=`https://docs.google.com/${t.kind}/d/${t.id}`;let n;if(t.kind==="document")n=`${e}/export?format=txt`;else if(t.kind==="presentation")n=`${e}/export/txt`;else{const s=(location.hash.match(/gid=(\d+)/)||[])[1];n=`${e}/export?format=csv${s?`&gid=${s}`:""}`}const o=await chrome.runtime.sendMessage({type:"FETCH_TEXT",url:n});if(!o?.success)throw new Error(o?.error||"Could not read document");const i=o.text;return(t.kind==="spreadsheets"?W(i).join(`
`):i).replace(/^\uFEFF/,"")}const k=2e4,S=t=>new Promise(e=>setTimeout(e,t));function L(t,e,n,o,i={}){const a={key:e,code:n,keyCode:o,which:o,bubbles:!0,cancelable:!0,...i};t.dispatchEvent(new KeyboardEvent("keydown",a)),t.dispatchEvent(new KeyboardEvent("keyup",a))}function X(){const t=document.activeElement;if(t instanceof HTMLInputElement&&t.type==="text")return t;const e=document.querySelectorAll('input.docs-findinput-input, .docs-findinput input, [class*="findinput"] input, input[aria-label^="Find"]');return Array.from(e).find(n=>n.offsetParent!==null)||null}async function U(t,e){const o=document.querySelector(".docs-texteventtarget-iframe")?.contentDocument;if(!o)return!1;const i=/Mac/i.test(navigator.platform);L(o.activeElement||o.body,"f","KeyF",70,i?{metaKey:!0}:{ctrlKey:!0});let a=null;for(let s=0;s<20&&!a;s++)await S(50),a=X();if(!a)return!1;a.focus(),a.select(),document.execCommand("insertText",!1,t)||(a.value=t,a.dispatchEvent(new Event("input",{bubbles:!0}))),await S(150);for(let s=0;s<=e;s++)L(a,"Enter","Enter",13),await S(60);return L(a,"Escape","Escape",27),!0}function j(t,e){const n=t.toLowerCase(),o=e.original.toLowerCase();let i=0;for(let a=n.indexOf(o);a!==-1&&a<e.start;a=n.indexOf(o,a+1))i++;return i}function G(t){const e=P();if(!e)return;const n=document.createElement("div");n.style.cssText="position:fixed;right:16px;bottom:16px;z-index:2147483647;";const o=n.attachShadow({mode:"closed"});o.innerHTML=`
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
    <div class="wrap"><button class="fab">Check Grammar</button><span class="badge"></span></div>`;const i=o.querySelector(".panel"),a=o.querySelector(".body"),s=o.querySelector(".fab"),d=o.querySelector(".badge"),r=l=>{d.textContent=l===null||l==="loading"?"":String(l),d.classList.toggle("spin",l==="loading"),d.style.display=l===null?"none":"block"};o.querySelector(".close").addEventListener("click",()=>i.classList.remove("open"));const c=l=>{a.innerHTML="";const h=document.createElement("div");h.className="msg",h.textContent=l,a.appendChild(h)};let g="";const p=l=>{if(a.innerHTML="",!l.length)return c("No issues found 🎉");for(const h of l){const f=document.createElement("div");f.className="item",e.kind==="document"&&(f.style.cursor="pointer",f.title="Click to jump to this text in the document",f.addEventListener("click",()=>U(h.original,j(g,h))));const u=document.createElement("div"),v=document.createElement("span");v.className="orig",v.textContent=h.original;const E=document.createElement("span");E.className="sug",E.textContent=h.suggestion,u.append(v," → ",E);const T=document.createElement("div");T.className="exp",T.textContent=h.explanation;const y=document.createElement("button");y.className="copy",y.textContent="Copy fix",y.addEventListener("click",async O=>{O.stopPropagation(),await navigator.clipboard.writeText(h.suggestion),y.textContent="Copied",setTimeout(()=>y.textContent="Copy fix",1500)}),f.append(u,T,y),a.appendChild(f)}};s.addEventListener("click",async()=>{i.classList.add("open"),c("Reading document…"),s.disabled=!0,r("loading");try{let l=await B(e);if(l.trim().length<5)return c("Nothing to check yet.");const h=l.length>k;h&&(l=l.slice(0,k)),g=l,c("Analyzing…");const f=await t(l);if(!f.success)return c(f.error||"Analysis failed");if(p(f.data.corrections),r(f.data.corrections.length),h){const u=document.createElement("div");u.className="msg",u.textContent=`Only the first ${k} characters were checked.`,a.appendChild(u)}}catch(l){c(l?.message||"Something went wrong")}finally{s.disabled=!1,d.classList.contains("spin")&&r(null)}}),document.documentElement.appendChild(n)}const I=new Set,m=new F;let b=!1,A=null,N=null,w=null,M=!1;function x(t){if(!w)return;const e=t==="loading";w.textContent=e||t===null?"":String(t),w.classList.toggle("spin",e),w.style.display=t===null?"none":"block"}const K=location.hostname==="docs.google.com"&&/^\/(document|spreadsheets|presentation)\/d\//.test(location.pathname);function V(){if(N||M||K||window!==window.top)return;const t=document.createElement("div");t.style.cssText="position:fixed;right:16px;bottom:16px;z-index:2147483647;";const e=t.attachShadow({mode:"closed"});e.innerHTML=`<style>
    button { background:#15c39a; color:#fff; border:0; border-radius:999px; padding:10px 16px; font:600 13px system-ui,sans-serif; box-shadow:0 2px 8px rgba(0,0,0,.3); cursor:pointer; }
    .badge.spin { color:transparent; border-color:#15c39a; border-top-color:#d6f5ee; animation:og-spin .8s linear infinite; }
    @keyframes og-spin { to { transform:rotate(360deg); } }
    .wrap { position:relative; display:inline-block; }
    .hide { position:absolute; top:-8px; left:-8px; width:18px; height:18px; padding:0; border-radius:50%; background:#fff; color:#202124; border:1px solid #bbb; font:700 12px/16px system-ui,sans-serif; box-shadow:0 1px 3px rgba(0,0,0,.3); display:none; }
    .wrap:hover .hide { display:block; }
    .badge { position:absolute; top:-6px; right:-6px; min-width:20px; height:20px; padding:0 5px; border-radius:999px; background:#fff; color:#202124; border:2px solid #15c39a; font:700 11px/16px system-ui,sans-serif; text-align:center; box-sizing:border-box; display:none; }
  </style><div class="wrap"><button class="main">Check Grammar</button><span class="badge"></span><button class="hide" title="Hide until page reload" aria-label="Hide">×</button></div>`,w=e.querySelector(".badge");const n=e.querySelector("button.main"),o=e.querySelector("button.hide");o.addEventListener("mousedown",i=>i.preventDefault()),o.addEventListener("click",()=>{t.remove(),M=!0}),n.addEventListener("mousedown",i=>i.preventDefault()),n.addEventListener("click",()=>{const i=z();i?i.started||m.showToast("Write a bit more text first.","error"):m.showToast("Click into a text field first.","error")}),document.documentElement.appendChild(t),N=t}function Y(t){const e=t.target;b||(m.highlightCorrections(e,[],()=>{}),x(null)),H(e)}function Z(t){const e=t.target;m.highlightCorrections(e,[],()=>{}),x(null),setTimeout(()=>H(e),100)}async function H(t){const e=t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement?t.value:t.innerText;if(e.length<5){m.highlightCorrections(t,[],()=>{}),x(null);return}const n=(t._analysisCall??0)+1;t._analysisCall=n;const o=t._analysisTimeout;o&&clearTimeout(o);let i=5e3;try{i=(await q()).debounceSeconds*1e3}catch{}t._analysisCall===n&&(t._analysisTimeout=setTimeout(()=>R(t,e),i))}async function R(t,e){let n;x("loading");try{n=await chrome.runtime.sendMessage({type:"ANALYZE_TEXT",text:e})}catch{x(null);return}if(!n){x(null);return}n.success?(m.highlightCorrections(t,n.data.corrections,o=>{$(t,o)}),x(n.data.corrections.length)):(x(null),n.error?.includes("API key")?m.showToast("API key not configured","error",{action:"Open Settings",onAction:()=>{chrome.runtime.sendMessage({type:"OPEN_OPTIONS"})}}):n.error?.includes("disabled")||m.showToast(`Analysis failed: ${n.error}`,"error"))}function $(t,e){const n=m.getCorrections(t).filter(s=>s!==e);b=!0;const o=J(t,e);if(b=!1,!o)return;const i=e.suggestion.length-(e.end-e.start),a=n.filter(s=>s.end<=e.start||s.start>=e.end).map(s=>s.start>=e.end?{...s,start:s.start+i,end:s.end+i}:s);m.highlightCorrections(t,a,s=>$(t,s)),x(a.length)}function J(t,e){if(t instanceof HTMLInputElement||t instanceof HTMLTextAreaElement){const n=t.value,o=n.substring(0,e.start)+e.suggestion+n.substring(e.end);t.focus(),t.setSelectionRange(e.start,e.end);let i=!1;try{i=document.execCommand("insertText",!1,e.suggestion)}catch{i=!1}if(i&&t.value===o)return!0;const a=t instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;return Object.getOwnPropertyDescriptor(a,"value")?.set?.call(t,o),t.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:e.suggestion})),t.dispatchEvent(new Event("change",{bubbles:!0})),!0}else try{const n=document.createTreeWalker(t,NodeFilter.SHOW_TEXT,null);let o="",i;for(;i=n.nextNode();)o+=i.textContent??"";const a=p=>p.replace(/\u00a0/g," ");let s=e.start;if(a(o.substring(e.start,e.end))!==a(e.original)){const p=Math.max(0,e.start-50),l=a(o).indexOf(a(e.original),p);if(l===-1||l>e.end+50)return console.warn("[open-grammarly] could not locate text to replace",e),!1;s=l}const d=window.getSelection();if(!d)return!1;const r=Q(t,s,s+e.original.length);if(!r)return console.warn("[open-grammarly] no text node for range",e),!1;const c=document.createRange();c.setStart(r.startNode,r.startOffset),c.setEnd(r.endNode,r.endOffset),t.focus(),d.removeAllRanges(),d.addRange(c);const g=t.innerText;return setTimeout(()=>{b=!0;try{t.focus(),d.removeAllRanges(),d.addRange(c);let p=!1;try{p=document.execCommand("insertText",!1,e.suggestion)}catch{p=!1}console.debug("[open-grammarly] insertText",p);const l=()=>t.innerText!==g;setTimeout(()=>{if(l())return;console.debug("[open-grammarly] trying paste"),b=!0,t.focus(),d.removeAllRanges(),d.addRange(c);const h=new DataTransfer;h.setData("text/plain",e.suggestion);const f=new ClipboardEvent("paste",{clipboardData:h,bubbles:!0,cancelable:!0}),u=t.dispatchEvent(f);b=!1,setTimeout(()=>{l()||!u||(console.debug("[open-grammarly] fallback DOM edit"),c.deleteContents(),c.insertNode(document.createTextNode(e.suggestion)),t.dispatchEvent(new InputEvent("input",{bubbles:!0,inputType:"insertText",data:e.suggestion})))},200)},200)}finally{b=!1}},50),!0}catch(n){return console.warn("[open-grammarly] replace failed",n),!1}}function Q(t,e,n){let o=0,i=null,a=0,s=null,d=0;const r=document.createTreeWalker(t,NodeFilter.SHOW_TEXT,null);let c;for(;c=r.nextNode();){const g=c.textContent?.length||0,p=o+g;if(!i&&e>=o&&e<p&&(i=c,a=e-o),!s&&n>=o&&n<=p&&(s=c,d=n-o),o=p,i&&s)break}return i&&s?{startNode:i,startOffset:a,endNode:s,endOffset:d}:null}function z(){const t=document.activeElement,e=t&&ee(t)?t:A;if(!e||!document.contains(e))return null;const n=e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement?e.value:e.innerText;if(n.length<5)return{started:!1,reason:"short"};const o=e._analysisTimeout;return o&&clearTimeout(o),e._analysisCall=(e._analysisCall??0)+1,R(e,n),{started:!0}}chrome.runtime.onMessage.addListener((t,e,n)=>{if(t.type==="RUN_ANALYSIS_NOW"){const o=z();o&&n(o);return}});function ee(t){const e=t.tagName.toLowerCase();return e==="input"||e==="textarea"||t.isContentEditable}D(t=>{I.has(t)||(t.addEventListener("input",Y),t.addEventListener("paste",Z),t.addEventListener("focus",()=>{A=t,V(),H(t)}),I.add(t))});window===window.top&&G(async t=>{try{return await chrome.runtime.sendMessage({type:"ANALYZE_TEXT",text:t})}catch{return{success:!1,error:"Extension was reloaded; refresh the page."}}});chrome.runtime.sendMessage({type:"PING"},()=>{chrome.runtime.lastError});
