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
let wheelLock=false;
document.addEventListener('wheel',e=>{e.preventDefault();if(wheelLock)return;wheelLock=true;setTimeout(()=>wheelLock=false,600);go(e.deltaY>0?1:-1)},{passive:false});
document.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowRight'||e.key===' ')go(1);if(e.key==='ArrowUp'||e.key==='ArrowLeft')go(-1)});
`

export function buildSlideHtml(slideHtml: string, globalCss: string, themeCSS: string): string {
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>${themeCSS}${globalCss}
.replay-btn{position:fixed;bottom:20px;right:20px;width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:15px;backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:999}
.replay-btn:hover{background:rgba(0,102,255,0.6)}
</style>
</head><body style="margin:0">${slideHtml}
<button class="replay-btn" onclick="(function(){const p=document.querySelector('.page');if(!p)return;p.classList.remove('visible');void p.offsetWidth;p.classList.add('visible')})()" title="重播动画">↺</button>
<script>
const p=document.querySelector('.page');
if(p){const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');else e.target.classList.remove('visible')})},{threshold:0.4});io.observe(p);}
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
${themeCSS}${globalCss}
</style>
</head><body>
<div class="pw" id="pw">${allHtml}</div>
<div class="pnav"><button onclick="go(-1)">↑</button><button onclick="replayPage()">↺</button><button onclick="go(1)">↓</button></div>
<div class="pc" id="pc">1 / ${slides.length}</div>
<script>${PRESENT_SCRIPT}<\/script>
</body></html>`
}
