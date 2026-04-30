import type { Slide } from '../store/useAppStore'

const PRESENT_SCRIPT = `
const pages=[...document.querySelectorAll('.page')];
let cur=0;
const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');else e.target.classList.remove('visible')})
},{threshold:0.4});
pages.forEach(p=>io.observe(p));
function go(d){cur=Math.max(0,Math.min(pages.length-1,cur+d));pages[cur].scrollIntoView({behavior:'smooth'});const c=document.getElementById('pc');if(c)c.textContent=(cur+1)+' / '+pages.length}
function replayPage(){const p=pages[cur];p.classList.remove('visible');void p.offsetWidth;p.classList.add('visible')}
document.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowRight')go(1);if(e.key==='ArrowUp'||e.key==='ArrowLeft')go(-1);if(e.key===' '){e.preventDefault();replayPage();}});
`

export function buildSlideHtml(slideHtml: string, globalCss: string, themeCSS: string): string {
  // 给每个顶层标签注入 data-line 行号，供高亮同步使用
  let lineNum = 1
  const annotated = slideHtml
    .replace(/^([ \t]*<[a-zA-Z][^>]*?)>/gm, (_match, p1) => {
      const result = `${p1} data-line="${lineNum}">`
      lineNum++
      return result
    })
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>${themeCSS}${globalCss}
.replay-btn{position:fixed;bottom:20px;right:20px;width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:15px;backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:999}
.replay-btn:hover{background:rgba(0,102,255,0.6)}
[data-hl]{outline:2px solid rgba(0,153,255,0.8)!important;outline-offset:2px;box-shadow:0 0 0 4px rgba(0,153,255,0.15)!important;transition:outline .15s,box-shadow .15s}
</style>
</head><body style="margin:0">${annotated}
<button class="replay-btn" onclick="(function(){const p=document.querySelector('.page');if(!p)return;p.classList.remove('visible');void p.offsetWidth;p.classList.add('visible')})()" title="重播动画 (空格)">↺</button>
<script>
const p=document.querySelector('.page');
if(p){const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');else e.target.classList.remove('visible')})},{threshold:0.4});io.observe(p);}
function replay(){const pg=document.querySelector('.page');if(!pg)return;pg.classList.remove('visible');void pg.offsetWidth;pg.classList.add('visible')}
document.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();replay();}});
document.addEventListener('mousedown',e=>{
  if(e.button!==2)return;
  const sel=window.getSelection()?.toString().trim();
  const el=e.target;
  const outerHtml=el?.outerHTML?.slice(0,500)||'';
  const tag=el?.tagName?.toLowerCase()||'';
  const cls=el?.className||'';
  const text=sel||(el?.innerText||el?.textContent||'').trim().slice(0,200);
  const context=sel
    ? '选中文字：'+sel+'\n所在元素：<'+tag+(cls?' class="'+cls+'"':'')+'>\nHTML：'+outerHtml
    : '元素：<'+tag+(cls?' class="'+cls+'"':'')+'>\n内容：'+text+'\nHTML：'+outerHtml;
  parent.postMessage({type:'iframe-contextmenu',text:context,x:e.clientX,y:e.clientY},'*');
});
document.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('message',e=>{
  if(e.data?.type!=='highlight-line')return;
  const line=e.data.line;
  document.querySelectorAll('[data-hl]').forEach(el=>el.removeAttribute('data-hl'));
  const all=document.querySelectorAll('[data-line]');
  let best=null;
  all.forEach(el=>{
    const l=+el.getAttribute('data-line');
    if(l<=line)best=el;
  });
  if(best){best.setAttribute('data-hl','1');}
});
<\/script>
</body></html>`
}

export function buildPresentHtml(slides: Slide[], globalCss: string, themeCSS: string, projectName: string): string {
  const allHtml = slides.map(s => s.html).join('\n')
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${projectName}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
html{scroll-behavior:smooth}
body{margin:0;overflow:hidden}
.pw{height:100vh;overflow-y:scroll;scroll-snap-type:y mandatory}
.page{scroll-snap-align:start}
.pnav{position:fixed;bottom:24px;right:24px;display:flex;gap:8px;z-index:999}
.pnav button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:16px;backdrop-filter:blur(8px)}
.pnav button:hover{background:rgba(0,102,255,0.6)}
.pc{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.5);font-size:13px;z-index:999}
body{overflow:hidden}
${themeCSS}${globalCss}
</style>
</head><body>
<div class="pw" id="pw">${allHtml}</div>
<div class="pnav"><button onclick="go(-1)">↑</button><button onclick="replayPage()">↺</button><button onclick="go(1)">↓</button></div>
<div class="pc" id="pc">1 / ${slides.length}</div>
<script>${PRESENT_SCRIPT}<\/script>
</body></html>`
}
