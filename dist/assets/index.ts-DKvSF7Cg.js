import{g as C}from"./storage-BKXZSGVt.js";const S=["password","hidden","file","checkbox","radio","submit","button","image","reset","color","range"];function m(i){const t=i.tagName.toLowerCase();if(t==="input"){const e=i,o=(e.type||"text").toLowerCase();return!(S.includes(o)||e.readOnly||e.disabled)}if(t==="textarea"){const e=i;return!e.readOnly&&!e.disabled}return i.contentEditable==="true"||i.isContentEditable}function I(i){const t="input, textarea, [contenteditable]";document.querySelectorAll(t).forEach(s=>{m(s)&&i(s)});const o=new MutationObserver(s=>{for(const a of s)for(const n of a.addedNodes)n instanceof Element&&(m(n)?i(n):n.querySelectorAll(t).forEach(r=>{m(r)&&i(r)}))});return o.observe(document.body,{childList:!0,subtree:!0}),o}class k{container;shadowRoot;currentTooltip=null;currentHighlight=null;activeElements=new Map;updateScheduled=!1;constructor(){this.container=document.createElement("div"),this.container.id="open-grammarly-root",this.container.style.position="fixed",this.container.style.top="0",this.container.style.left="0",this.container.style.width="100vw",this.container.style.height="100vh",this.container.style.pointerEvents="none",this.container.style.zIndex="2147483647",document.body.appendChild(this.container),this.shadowRoot=this.container.attachShadow({mode:"open"}),this.injectStyles(),document.addEventListener("mousedown",t=>{this.currentTooltip&&!this.container.contains(t.target)&&this.closeTooltip()}),window.addEventListener("scroll",()=>this.scheduleUpdate(),{passive:!0,capture:!0}),window.addEventListener("resize",()=>this.scheduleUpdate(),{passive:!0})}scheduleUpdate(){this.updateScheduled||(this.updateScheduled=!0,requestAnimationFrame(()=>{this.updatePositions(),this.updateScheduled=!1}))}updatePositions(){this.currentTooltip&&this.closeTooltip(),this.shadowRoot.querySelectorAll(".og-underline, .og-textarea-badge").forEach(t=>t.remove()),this.activeElements.forEach((t,e)=>{if(!document.body.contains(t.element)){this.activeElements.delete(e);return}t.element instanceof HTMLTextAreaElement||t.element instanceof HTMLInputElement?this.renderTextareaBadge(t.element,t.corrections,t.onApply):this.renderContentEditableHighlights(t.element,t.corrections,t.onApply)})}injectStyles(){const t=document.createElement("style");t.textContent=`
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
    `,this.shadowRoot.appendChild(t)}highlightCorrections(t,e,o){const s=this.getElementId(t);this.clearHighlights(t),e.length===0&&this.closeTooltip(),e.length>0?this.activeElements.set(s,{element:t,corrections:e,onApply:o}):this.activeElements.delete(s),t instanceof HTMLTextAreaElement||t instanceof HTMLInputElement?this.renderTextareaBadge(t,e,o):this.renderContentEditableHighlights(t,e,o)}getCorrections(t){return this.activeElements.get(this.getElementId(t))?.corrections??[]}clearHighlights(t){const e=this.getElementId(t);this.shadowRoot.querySelectorAll(`.og-underline[data-element-id="${e}"], .og-textarea-badge[data-element-id="${e}"]`).forEach(o=>o.remove())}getElementId(t){return t.dataset.ogId||(t.dataset.ogId=Math.random().toString(36).substr(2,9)),t.dataset.ogId}renderContentEditableHighlights(t,e,o){const s=this.getElementId(t);e.forEach(a=>{const n=this.getRangeForIndices(t,a.start,a.end);if(!n)return;const l=Array.from(n.getClientRects());l.forEach((r,c)=>{if(r.width===0)return;const d=document.createElement("div");d.className=`og-underline og-${a.type}`,d.dataset.elementId=s,d.style.left=`${r.left}px`,d.style.top=`${r.bottom-2}px`,d.style.width=`${r.width}px`,d.onmouseenter=h=>{h.stopPropagation(),this.showHighlight(l),this.showTooltip(t,a,r.left,r.bottom,o)},this.shadowRoot.appendChild(d)})})}renderTextareaBadge(t,e,o){const s=this.getElementId(t),a=t.getBoundingClientRect();if(e.length===0)return;e.forEach(l=>{const r=this.getInputRects(t,l.start,l.end);r.forEach(c=>{const d=document.createElement("div");d.className=`og-underline og-${l.type}`,d.dataset.elementId=s,d.style.left=`${c.left}px`,d.style.top=`${c.bottom-2}px`,d.style.width=`${c.width}px`,d.onmouseenter=h=>{h.stopPropagation(),this.showHighlight(r),this.showTooltip(t,l,c.left,c.bottom,o)},this.shadowRoot.appendChild(d)})});const n=document.createElement("div");n.className="og-textarea-badge",n.dataset.elementId=s,n.style.left=`${a.right-30}px`,n.style.top=`${a.bottom-30}px`,n.textContent=e.length.toString(),n.onmouseenter=l=>{l.stopPropagation(),this.showTooltip(t,e[0],a.left,a.bottom,o)},this.shadowRoot.appendChild(n)}getInputRects(t,e,o){const s=t instanceof HTMLInputElement,a=getComputedStyle(t),n=document.createElement("div");["boxSizing","width","height","borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth","borderStyle","paddingTop","paddingRight","paddingBottom","paddingLeft","fontFamily","fontSize","fontWeight","fontStyle","fontVariant","letterSpacing","lineHeight","textTransform","textIndent","wordSpacing","tabSize","direction"].forEach(g=>{n.style[g]=a[g]});const r=t.getBoundingClientRect();n.style.position="fixed",n.style.left=`${r.left}px`,n.style.top=`${r.top}px`,n.style.visibility="hidden",n.style.pointerEvents="none",n.style.overflow="hidden",n.style.whiteSpace=s?"pre":"pre-wrap",n.style.wordWrap="break-word";const c=t.value,d=document.createTextNode(c.substring(0,e)),h=document.createElement("span");h.textContent=c.substring(e,o)||"​";const u=document.createTextNode(c.substring(o));n.append(d,h,u),document.body.appendChild(n),n.scrollTop=t.scrollTop,n.scrollLeft=t.scrollLeft;const f=r,T=Array.from(h.getClientRects()).filter(g=>g.width>0&&g.bottom>f.top&&g.top<f.bottom&&g.right>f.left&&g.left<f.right).map(g=>new DOMRect(g.left,g.top,g.width,g.height));return n.remove(),T}getRangeForIndices(t,e,o){const s=document.createRange();let a=0,n=null,l=0,r=null,c=0;const d=h=>{if(h.nodeType===Node.TEXT_NODE){const u=a+(h.textContent?.length||0);!n&&e>=a&&e<u&&(n=h,l=e-a),!r&&o>=a&&o<=u&&(r=h,c=o-a),a=u}else for(let u=0;u<h.childNodes.length&&(d(h.childNodes[u]),!r);u++);};if(d(t),n&&r)try{return s.setStart(n,l),s.setEnd(r,c),s}catch{return null}return null}showTooltip(t,e,o,s,a){this.closeTooltip();const n=document.createElement("div");n.className="og-tooltip",n.style.left=`${o}px`,n.style.top=`${s+8}px`;const l=e.type==="spelling"?"Spelling mistake":e.type==="grammar"?"Grammar issue":e.explanation||"Suggestion";n.innerHTML=`
      <div class="og-title">${this.escapeHtml(l)}</div>
      <div class="og-suggestion">${this.escapeHtml(e.suggestion)}</div>
      <div class="og-dismiss">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        Dismiss
      </div>
    `,n.querySelector(".og-suggestion")?.addEventListener("click",()=>{a(e),this.closeTooltip()}),n.querySelector(".og-dismiss")?.addEventListener("click",()=>{this.closeTooltip(),this.highlightCorrections(t,this.getCorrections(t).filter(c=>c!==e),a)}),this.shadowRoot.appendChild(n),this.currentTooltip=n;const r=n.getBoundingClientRect();r.right>window.innerWidth&&(n.style.left=`${window.innerWidth-r.width-20}px`),r.bottom>window.innerHeight&&(n.style.top=`${s-r.height-8}px`)}escapeHtml(t){return t.replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}closeTooltip(){this.currentTooltip&&(this.currentTooltip.remove(),this.currentTooltip=null),this.clearHighlight()}showHighlight(t){this.clearHighlight(),t.forEach(e=>{if(e.width===0)return;const o=document.createElement("div");o.className="og-highlight",o.style.left=`${e.left}px`,o.style.top=`${e.top}px`,o.style.width=`${e.width}px`,o.style.height=`${e.height}px`,this.shadowRoot.appendChild(o)})}clearHighlight(){this.shadowRoot.querySelectorAll(".og-highlight").forEach(t=>t.remove())}showToast(t,e="info",o){this.shadowRoot.querySelectorAll(".og-toast").forEach(l=>l.remove());const s=document.createElement("div");s.className=`og-toast og-${e}`;let a=`<span>${this.escapeHtml(t)}</span>`;o?.action&&o?.onAction&&(a+=`<button class="og-toast-action">${o.action}</button>`),a+='<button class="og-toast-close">×</button>',s.innerHTML=a,s.querySelector(".og-toast-close")?.addEventListener("click",()=>{s.remove()}),o?.action&&o?.onAction&&s.querySelector(".og-toast-action")?.addEventListener("click",()=>{o.onAction(),s.remove()}),this.shadowRoot.appendChild(s);const n=o?.duration??(e==="error"?8e3:5e3);n>0&&setTimeout(()=>{this.shadowRoot.contains(s)&&s.remove()},n)}}const y=new Set,p=new k;let x=!1,w=null;function L(i){const t=i.target;x||p.highlightCorrections(t,[],()=>{}),b(t)}function H(i){const t=i.target;p.highlightCorrections(t,[],()=>{}),setTimeout(()=>b(t),100)}async function b(i){const t=i instanceof HTMLInputElement||i instanceof HTMLTextAreaElement?i.value:i.innerText;if(t.length<5){p.highlightCorrections(i,[],()=>{});return}const e=(i._analysisCall??0)+1;i._analysisCall=e;const o=i._analysisTimeout;o&&clearTimeout(o);let s=5e3;try{s=(await C()).debounceSeconds*1e3}catch{}i._analysisCall===e&&(i._analysisTimeout=setTimeout(()=>E(i,t),s))}async function E(i,t){let e;try{e=await chrome.runtime.sendMessage({type:"ANALYZE_TEXT",text:t})}catch{return}e&&(e.success?p.highlightCorrections(i,e.data.corrections,o=>{v(i,o)}):e.error?.includes("API key")?p.showToast("API key not configured","error",{action:"Open Settings",onAction:()=>{chrome.runtime.sendMessage({type:"OPEN_OPTIONS"})}}):e.error?.includes("disabled")||p.showToast(`Analysis failed: ${e.error}`,"error"))}function v(i,t){const e=p.getCorrections(i).filter(n=>n!==t);x=!0;const o=N(i,t);if(x=!1,!o)return;const s=t.suggestion.length-(t.end-t.start),a=e.filter(n=>n.end<=t.start||n.start>=t.end).map(n=>n.start>=t.end?{...n,start:n.start+s,end:n.end+s}:n);p.highlightCorrections(i,a,n=>v(i,n))}function N(i,t){if(i instanceof HTMLInputElement||i instanceof HTMLTextAreaElement){const e=i.value,o=e.substring(0,t.start)+t.suggestion+e.substring(t.end);return i.value=o,i.dispatchEvent(new Event("input",{bubbles:!0})),!0}else try{const e=i.innerText||i.textContent||"",o=e.substring(t.start,t.end);let s=t.start;if(o!==t.original){const r=Math.max(0,t.start-10),c=Math.min(e.length,t.end+10),h=e.substring(r,c).indexOf(t.original);if(h===-1)return!1;s=r+h}const a=window.getSelection();if(!a)return!1;const n=R(i,s,s+t.original.length);if(!n)return!1;const l=document.createRange();return l.setStart(n.startNode,n.startOffset),l.setEnd(n.endNode,n.endOffset),a.removeAllRanges(),a.addRange(l),document.execCommand("insertText",!1,t.suggestion),i.dispatchEvent(new Event("input",{bubbles:!0})),!0}catch{return!1}}function R(i,t,e){let o=0,s=null,a=0,n=null,l=0;const r=document.createTreeWalker(i,NodeFilter.SHOW_TEXT,null);let c;for(;c=r.nextNode();){const d=c.textContent?.length||0,h=o+d;if(!s&&t>=o&&t<h&&(s=c,a=t-o),!n&&e>=o&&e<=h&&(n=c,l=e-o),o=h,s&&n)break}return s&&n?{startNode:s,startOffset:a,endNode:n,endOffset:l}:null}chrome.runtime.onMessage.addListener((i,t,e)=>{if(i.type==="RUN_ANALYSIS_NOW"){const o=document.activeElement,s=o&&A(o)?o:w;if(!s||!document.contains(s))return;const a=s instanceof HTMLInputElement||s instanceof HTMLTextAreaElement?s.value:s.innerText;if(a.length<5){e({started:!1,reason:"short"});return}const n=s._analysisTimeout;n&&clearTimeout(n),s._analysisCall=(s._analysisCall??0)+1,E(s,a),e({started:!0});return}});function A(i){const t=i.tagName.toLowerCase();return t==="input"||t==="textarea"||i.isContentEditable}I(i=>{y.has(i)||(i.addEventListener("input",L),i.addEventListener("paste",H),i.addEventListener("focus",()=>{w=i,b(i)}),y.add(i))});chrome.runtime.sendMessage({type:"PING"},()=>{chrome.runtime.lastError});
