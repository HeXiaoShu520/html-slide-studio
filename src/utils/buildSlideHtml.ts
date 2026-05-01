import type { Slide } from '../store/useAppStore'

const PRESENT_SCRIPT = `
const pages=[...document.querySelectorAll('.page')];
let cur=0,busy=false;
pages.forEach((p,i)=>{
  p.style.position='fixed';
  p.style.inset='0';
  p.style.transition='transform .45s cubic-bezier(.4,0,.2,1),opacity .45s';
  p.style.transform=i===0?'translate(0,0)':'translate(0,100%)';
  p.style.opacity=i===0?'1':'0';
  p.style.overflow='auto';
});
function updateNav(){
  const btns=document.querySelectorAll('.pnav button');
  if(btns[0])btns[0].disabled=cur===0;
  if(btns[2])btns[2].disabled=cur===pages.length-1;
}
function go(d,axis){
  axis=axis||'y';
  if(busy||cur+d<0||cur+d>=pages.length)return;
  busy=true;
  const from=pages[cur],to=pages[cur+d];
  const sign=d>0?1:-1;
  to.style.transform='translate('+(axis==='x'?(sign*100):0)+'%,'+(axis==='y'?(sign*100):0)+'%)';
  to.style.opacity='1';
  void to.offsetWidth;
  to.style.transform='translate(0,0)';
  from.style.transform='translate('+(axis==='x'?(-sign*100):0)+'%,'+(axis==='y'?(-sign*100):0)+'%)';
  from.style.opacity='0';
  cur+=d;
  const c=document.getElementById('pc');
  if(c)c.textContent=(cur+1)+' / '+pages.length;
  updateNav();
  setTimeout(()=>{busy=false;from.classList.remove('entered');to.classList.remove('entered');void to.offsetWidth;to.classList.add('entered');},480);
}
function replayPage(){const p=pages[cur];p.classList.remove('visible');void p.offsetWidth;p.classList.add('visible');}
document.addEventListener('keydown',e=>{
  if(['ArrowDown','ArrowUp',' '].includes(e.key))e.preventDefault();
  if(e.key==='ArrowDown')go(1,'y');
  if(e.key==='ArrowUp')go(-1,'y');
  if(e.key===' ')replayPage();
});
`

export function buildSlideHtml(slideHtml: string, globalCss: string, themeCSS: string, enterAnim = false): string {
  // 完整 HTML 文档直接原样渲染，不套壳
  if (/^\s*<!DOCTYPE\s/i.test(slideHtml) || /^\s*<html[\s>]/i.test(slideHtml)) {
    return slideHtml
  }
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
<style>${themeCSS}${globalCss}
.page{position:relative}
${enterAnim ? '' : '.animate-in,.animate-fade,.animate-left,.animate-right{animation:none!important;opacity:1!important;transform:none!important}'}
.pnav{position:fixed;bottom:24px;right:24px;display:flex;gap:8px;z-index:999}
.pnav button{height:32px;padding:0 14px;border-radius:16px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:13px;backdrop-filter:blur(8px);white-space:nowrap}
.pnav button:hover{background:rgba(0,102,255,0.6)}
.pnav button:disabled{opacity:0.3;cursor:not-allowed;pointer-events:none}
[data-hl]{outline:2px solid rgba(0,153,255,0.8)!important;outline-offset:2px;box-shadow:0 0 0 4px rgba(0,153,255,0.15)!important;transition:outline .15s,box-shadow .15s}
</style>
</head><body style="margin:0">${annotated}
<div class="pnav"><button onclick="go(-1)">上一页</button><button onclick="replayPage()">播放</button><button onclick="go(1)">下一页</button></div>
<script>
var pg=document.querySelector('.page');if(pg)pg.classList.add('entered');
function go(d){parent.postMessage({type:'slide-nav',d},'*')}
function replayPage(){const pg=document.querySelector('.page');if(!pg)return;pg.classList.remove('visible');void pg.offsetWidth;pg.classList.add('visible');}
document.addEventListener('keydown',e=>{
  if(e.key===' '){e.preventDefault();replayPage();}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();go(e.key==='ArrowDown'?1:-1);}
});
document.addEventListener('contextmenu',e=>{
  e.preventDefault();
  const sel=window.getSelection()?.toString().trim();
  const elText=(e.target?.closest('[data-line]')||e.target)?.textContent?.trim()||'';
  const text=sel||elText;
  if(text)parent.postMessage({type:'iframe-contextmenu',sel:sel||'',elText,x:e.clientX,y:e.clientY},'*');
});
window.addEventListener('message',e=>{
  if(e.data?.type==='slide-state'){
    const btns=document.querySelectorAll('.pnav button');
    if(btns[0])btns[0].disabled=e.data.cur===0;
    if(btns[2])btns[2].disabled=e.data.cur===e.data.total-1;
    return;
  }
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

export function buildPresentHtml(slides: Slide[], globalCss: string, themeCSS: string, projectName: string, startIndex = 0): string {
  const allHtml = slides.map(s => s.html).join('\n<!-- PAGE -->\n')
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${projectName}</title>
<style>
body{margin:0;overflow:hidden}
.pnav{position:fixed;bottom:24px;right:24px;display:flex;gap:8px;z-index:999}
.pnav button{height:32px;padding:0 14px;border-radius:16px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:13px;backdrop-filter:blur(8px);white-space:nowrap}
.pnav button:hover{background:rgba(0,102,255,0.6)}
.pnav button:disabled{opacity:0.3;cursor:not-allowed;pointer-events:none}
.pc{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.5);font-size:13px;z-index:999}
${themeCSS}${globalCss}
</style>
</head><body>
${allHtml}
<!-- SLIDE-NAV-BEGIN -->
<div class="pnav"><button id="btn-prev">上一页</button><button id="btn-replay">播放</button><button id="btn-next">下一页</button></div>
<div class="pc" id="pc"></div>
<script>${PRESENT_SCRIPT}cur=${startIndex};pages.forEach((p,i)=>{p.style.transform=i===${startIndex}?'translate(0,0)':'translate(0,100%)';p.style.opacity=i===${startIndex}?'1':'0';});document.getElementById('btn-prev').onclick=function(){go(-1);};document.getElementById('btn-next').onclick=function(){go(1);};document.getElementById('btn-replay').onclick=function(){replayPage();};updateNav();setTimeout(()=>{pages[cur].classList.add('entered');},50);<\/script>
<!-- SLIDE-NAV-END -->
</body></html>`
}
