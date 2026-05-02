import type { Slide } from '../store/useAppStore'

// 演示模式的翻页脚本，注入到 buildPresentHtml 生成的独立 HTML 中
// 负责：所有页 fixed 定位叠放、translateY 滑动翻页、.entered 入场动画触发、键盘控制
const PRESENT_SCRIPT = `
const pages=[...document.querySelectorAll('.page')];
let cur=0,busy=false,autoTimer=null;
// 初始化：所有页 fixed 定位，第0页显示并添加 .entered，其余页移到屏幕下方
pages.forEach((p,i)=>{
  p.style.position='fixed';
  p.style.inset='0';
  p.style.transition='transform .4s cubic-bezier(.4,0,.2,1)';
  p.style.transform=i===0?'translate3d(0,0,0)':'translate3d(0,100%,0)';
  p.style.opacity=i===0?'1':'0';
  p.style.overflow='auto';
  p.style.willChange='transform';
  if(i===0)p.classList.add('entered');
});
// 更新上一页/下一页按钮的禁用状态
function updateNav(){
  const btns=document.querySelectorAll('.pnav button');
  if(btns[0])btns[0].disabled=cur===0;
  if(btns[2])btns[2].disabled=cur===pages.length-1;
}
// 翻页：d=1 下一页，d=-1 上一页；axis 保留扩展，当前只用 y 轴
function go(d,axis){
  axis=axis||'y';
  if(busy||cur+d<0||cur+d>=pages.length)return;
  busy=true;
  if(autoTimer){clearTimeout(autoTimer);autoTimer=null;}
  const from=pages[cur],to=pages[cur+d];
  const sign=d>0?1:-1;
  // 移除旧页的 .entered，让动画元素回到初始状态
  from.classList.remove('entered');
  // 开始翻页过渡
  to.style.transform='translate3d('+(axis==='x'?(sign*100):0)+'%,'+(axis==='y'?(sign*100):0)+'%,0)';
  to.style.opacity='1';
  void to.offsetWidth;
  to.style.transform='translate3d(0,0,0)';
  from.style.transform='translate3d('+(axis==='x'?(-sign*100):0)+'%,'+(axis==='y'?(-sign*100):0)+'%,0)';
  from.style.opacity='0';
  cur+=d;
  const c=document.getElementById('pc');
  if(c)c.textContent=(cur+1)+' / '+pages.length;
  updateNav();
  // 翻页完成后添加 .entered 触发入场动画
  setTimeout(()=>{
    busy=false;
    to.classList.add('entered');
    const cfg=window.slideConfigs?.[cur];
    if(cfg?.autoPlay)replayPage();
    if(cfg?.autoNext&&cfg.autoNextDelay>0){
      autoTimer=setTimeout(()=>go(1),cfg.autoNextDelay*1000);
    }
  },480);
}
// 重播当前页的 .visible 演示动画（用户点击"播放"或按空格触发）
function replayPage(){const p=pages[cur];p.classList.remove('visible');void p.offsetWidth;p.classList.add('visible');}
// 键盘控制：↓/空格 下一页，↑ 上一页，空格 重播
document.addEventListener('keydown',e=>{
  if(['ArrowDown','ArrowUp',' '].includes(e.key))e.preventDefault();
  if(e.key==='ArrowDown')go(1,'y');
  if(e.key==='ArrowUp')go(-1,'y');
  if(e.key===' ')replayPage();
});
`

// 单页预览用：将 slide html 片段包装成完整 HTML 文档，注入主题/全局样式
// enterAnim=false 时强制禁用所有入场动画（编辑时默认关闭，避免每次刷新都播放动画）
export function buildSlideHtml(slideHtml: string, globalCss: string, themeCSS: string, enterAnim = false, hideNavButtons = false): string {
  // 给每个顶层标签注入 data-line 行号，供代码编辑器光标位置与预览元素高亮同步
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
.pnav{position:fixed;bottom:24px;right:24px;display:flex;gap:8px;z-index:999${hideNavButtons ? ';opacity:0;pointer-events:none' : ''}}
.pnav button{height:32px;padding:0 14px;border-radius:16px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:13px;backdrop-filter:blur(8px);white-space:nowrap}
.pnav button:hover{background:rgba(0,102,255,0.6)}
.pnav button:disabled{opacity:0.3;cursor:not-allowed;pointer-events:none}
[data-hl]{outline:2px solid rgba(0,153,255,0.8)!important;outline-offset:2px;box-shadow:0 0 0 4px rgba(0,153,255,0.15)!important;transition:outline .15s,box-shadow .15s}
</style>
</head><body style="margin:0">${annotated}
<div class="pnav"><button onclick="go(-1)">上一页</button><button onclick="replayPage()">播放</button><button onclick="go(1)">下一页</button></div>
<script>
// 页面加载后立即触发入场动画
var pg=document.querySelector('.page');if(pg)pg.classList.add('entered');
// 翻页通过 postMessage 通知父窗口（App.tsx），由父窗口切换 currentSlideIndex
function go(d){parent.postMessage({type:'slide-nav',d},'*')}
// 重播当前页演示动画：移除再添加 .visible 触发 CSS 动画重放
function replayPage(){const pg=document.querySelector('.page');if(!pg)return;pg.classList.remove('visible');void pg.offsetWidth;pg.classList.add('visible');}
document.addEventListener('keydown',e=>{
  if(e.key===' '){e.preventDefault();replayPage();}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();go(e.key==='ArrowDown'?1:-1);}
});
// 右键菜单：将选中文字或元素文字通过 postMessage 传给父窗口，触发自定义右键菜单
document.addEventListener('contextmenu',e=>{
  e.preventDefault();
  const sel=window.getSelection()?.toString().trim();
  const elText=(e.target?.closest('[data-line]')||e.target)?.textContent?.trim()||'';
  const text=sel||elText;
  if(text)parent.postMessage({type:'iframe-contextmenu',sel:sel||'',elText,x:e.clientX,y:e.clientY},'*');
});
// 接收父窗口消息：slide-state 更新导航按钮状态；highlight-line 高亮对应行元素
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
  // 找到 data-line <= 当前光标行的最后一个元素
  all.forEach(el=>{
    const l=+el.getAttribute('data-line');
    if(l<=line)best=el;
  });
  if(best){best.setAttribute('data-hl','1');}
});
<\/script>
</body></html>`
}

// 演示/导出用：将所有 slides 合并为单个完整 HTML，包含翻页脚本，可直接浏览器打开
// startIndex 指定从第几页开始播放（"从本页播放"功能用）
export function buildPresentHtml(slides: Slide[], globalCss: string, themeCSS: string, projectName: string, startIndex = 0, hideNavButtons = false, transitionDuration = 0.4, globalAutoNextDelay = -1): string {
  // 各页 html 用 <!-- PAGE --> 拼接，导入时可按此分隔符重新拆分
  const allHtml = slides.map(s => s.html).join('\n<!-- PAGE -->\n')
  const slideConfigs = slides.map(s => {
    const delay = s.autoNextDelay === -1 ? globalAutoNextDelay : (s.autoNextDelay || 3)
    return { autoPlay: s.autoPlay || false, autoNext: s.autoNext || false, autoNextDelay: delay }
  })

  // 动态生成翻页脚本，注入 transitionDuration
  const presentScript = `
const pages=[...document.querySelectorAll('.page')];
let cur=0,busy=false,autoTimer=null;
pages.forEach((p,i)=>{
  p.style.position='fixed';
  p.style.inset='0';
  p.style.transition='transform ${transitionDuration}s cubic-bezier(.4,0,.2,1)';
  p.style.transform=i===0?'translate3d(0,0,0)':'translate3d(0,100%,0)';
  p.style.opacity=i===0?'1':'0';
  p.style.overflow='auto';
  p.style.willChange='transform';
  if(i===0)p.classList.add('entered');
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
  if(autoTimer){clearTimeout(autoTimer);autoTimer=null;}
  const from=pages[cur],to=pages[cur+d];
  const sign=d>0?1:-1;
  from.classList.remove('entered');
  to.style.transform='translate3d('+(axis==='x'?(sign*100):0)+'%,'+(axis==='y'?(sign*100):0)+'%,0)';
  to.style.opacity='1';
  void to.offsetWidth;
  to.style.transform='translate3d(0,0,0)';
  from.style.transform='translate3d('+(axis==='x'?(-sign*100):0)+'%,'+(axis==='y'?(-sign*100):0)+'%,0)';
  from.style.opacity='0';
  cur+=d;
  const c=document.getElementById('pc');
  if(c)c.textContent=(cur+1)+' / '+pages.length;
  updateNav();
  setTimeout(()=>{
    busy=false;
    to.classList.add('entered');
    const cfg=window.slideConfigs?.[cur];
    if(cfg?.autoPlay)replayPage();
    if(cfg?.autoNext&&cfg.autoNextDelay>0){
      autoTimer=setTimeout(()=>go(1),cfg.autoNextDelay*1000);
    }
  },${transitionDuration * 1000 + 80});
}
function replayPage(){const p=pages[cur];p.classList.remove('visible');void p.offsetWidth;p.classList.add('visible');}
document.addEventListener('keydown',e=>{
  if(['ArrowDown','ArrowUp',' '].includes(e.key))e.preventDefault();
  if(e.key==='ArrowDown')go(1,'y');
  if(e.key==='ArrowUp')go(-1,'y');
  if(e.key===' ')replayPage();
});
`
  return `<!DOCTYPE html><html lang="zh-CN"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${projectName}</title>
<style>
body{margin:0;overflow:hidden}
.pnav{position:fixed;bottom:24px;right:24px;display:flex;gap:8px;z-index:999${hideNavButtons ? ';opacity:0;pointer-events:none' : ''}}
.pnav button{height:32px;padding:0 14px;border-radius:16px;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:13px;backdrop-filter:blur(8px);white-space:nowrap}
.pnav button:hover{background:rgba(0,102,255,0.6)}
.pnav button:disabled{opacity:0.3;cursor:not-allowed;pointer-events:none}
.pc{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.5);font-size:13px;z-index:999${hideNavButtons ? ';opacity:0' : ''}}
${themeCSS}${globalCss}
</style>
</head><body>
${allHtml}
<!-- SLIDE-NAV-BEGIN -->
<div class="pnav"><button id="btn-prev">上一页</button><button id="btn-replay">播放</button><button id="btn-next">下一页</button></div>
<div class="pc" id="pc"></div>
<script>window.slideConfigs=${JSON.stringify(slideConfigs)};${presentScript}cur=${startIndex};pages.forEach((p,i)=>{p.style.transform=i===${startIndex}?'translate3d(0,0,0)':'translate3d(0,100%,0)';p.style.opacity=i===${startIndex}?'1':'0';if(i===${startIndex})p.classList.add('entered');});document.getElementById('btn-prev').onclick=function(){go(-1);};document.getElementById('btn-next').onclick=function(){go(1);};document.getElementById('btn-replay').onclick=function(){replayPage();};updateNav();setTimeout(()=>{const cfg=window.slideConfigs?.[cur];if(cfg?.autoPlay)replayPage();if(cfg?.autoNext&&cfg.autoNextDelay>0)autoTimer=setTimeout(()=>go(1),cfg.autoNextDelay*1000);},50);<\/script>
<!-- SLIDE-NAV-END -->
</body></html>`
}
