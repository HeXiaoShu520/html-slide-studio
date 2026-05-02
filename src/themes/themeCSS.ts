export type ThemeId = 'dark-tech' | 'mechanical' | 'none'

const THEMES: Record<ThemeId, { primary: string; primaryLight: string; bgMain: string; bgCard: string; textColor: string }> = {
  'dark-tech': {
    primary: '#0066FF', primaryLight: '#00D9FF',
    bgMain: '#0a0e1a', bgCard: 'rgba(255,255,255,0.05)', textColor: '#c8d6e5',
  },
  'mechanical': {
    primary: '#7b8fa1', primaryLight: '#a8bbc8',
    bgMain: '#1a1a1a', bgCard: 'rgba(255,255,255,0.06)', textColor: '#b0b8c1',
  },
}

// 不依赖主题变量的基础组件类，任何主题下都可用
export const BASE_COMPONENT_CSS = `
.linebreak{display:block;width:100%;height:1.2em}
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;width:100%;max-width:1000px}
.card{background:var(--bg-card,rgba(255,255,255,0.07));border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:30px;margin:10px;transition:transform .3s,box-shadow .3s}
.card:hover{transform:translateY(-5px);box-shadow:0 10px 40px rgba(0,102,255,0.2)}
.badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:.85em;background:var(--gradient,linear-gradient(135deg,#0066FF,#00D9FF));color:#fff}
.icon-circle{width:60px;height:60px;border-radius:50%;background:var(--gradient,linear-gradient(135deg,#0066FF,#00D9FF));display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:15px}
.flow-container{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin:20px 0}
.flow-step{background:var(--bg-card,rgba(255,255,255,0.07));border:1px solid var(--primary,#0066FF);border-radius:12px;padding:20px;text-align:center;min-width:150px}
.flow-arrow{color:var(--primary,#0066FF);font-size:24px}
.timeline{position:relative;max-width:600px;margin:20px auto;padding-left:30px;border-left:2px solid var(--primary,#0066FF)}
.timeline-item{position:relative;margin-bottom:30px;padding-left:20px}
.timeline-item::before{content:'';position:absolute;left:-36px;top:5px;width:12px;height:12px;border-radius:50%;background:var(--primary,#0066FF)}
.code-block{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:20px;font-family:'Consolas',monospace;font-size:14px;color:#c9d1d9;overflow-x:auto;white-space:pre;margin:15px 0}
.packet-table{width:100%;border-collapse:collapse;margin:15px 0}
.packet-table th,.packet-table td{border:1px solid rgba(255,255,255,0.15);padding:10px 15px;text-align:left}
.packet-table th{background:var(--primary,#0066FF);color:#fff}
.packet-table tr:nth-child(even){background:rgba(255,255,255,0.03)}
@keyframes fadeInUp{to{opacity:1;transform:translateY(0)}}
@keyframes fadeInDown{to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{to{opacity:1}}
@keyframes slideInLeft{to{opacity:1;transform:translateX(0)}}
@keyframes slideInRight{to{opacity:1;transform:translateX(0)}}
@keyframes zoomIn{to{opacity:1;transform:scale(1)}}
@keyframes zoomOut{to{opacity:1;transform:scale(1)}}
@keyframes rotateIn{to{opacity:1;transform:rotate(0) scale(1)}}
@keyframes bounceIn{0%{opacity:0;transform:scale(0.3)}50%{transform:scale(1.05)}70%{transform:scale(0.9)}100%{opacity:1;transform:scale(1)}}
@keyframes flipIn{to{opacity:1;transform:perspective(400px) rotateY(0)}}
.animate-in{opacity:0;transform:translateY(30px)}
.animate-down{opacity:0;transform:translateY(-30px)}
.animate-fade{opacity:0}
.animate-left{opacity:0;transform:translateX(-50px)}
.animate-right{opacity:0;transform:translateX(50px)}
.animate-zoom{opacity:0;transform:scale(0.8)}
.animate-zoom-out{opacity:0;transform:scale(1.2)}
.animate-rotate{opacity:0;transform:rotate(-180deg) scale(0.8)}
.animate-bounce{opacity:0;transform:scale(0.3)}
.animate-flip{opacity:0;transform:perspective(400px) rotateY(90deg)}
.page.entered .animate-in{animation:fadeInUp .5s ease-out forwards}
.page.entered .animate-down{animation:fadeInDown .5s ease-out forwards}
.page.entered .animate-fade{animation:fadeIn .5s ease-out forwards}
.page.entered .animate-left{animation:slideInLeft .5s ease-out forwards}
.page.entered .animate-right{animation:slideInRight .5s ease-out forwards}
.page.entered .animate-zoom{animation:zoomIn .5s cubic-bezier(.34,1.56,.64,1) forwards}
.page.entered .animate-zoom-out{animation:zoomOut .5s cubic-bezier(.34,1.56,.64,1) forwards}
.page.entered .animate-rotate{animation:rotateIn .5s cubic-bezier(.34,1.56,.64,1) forwards}
.page.entered .animate-bounce{animation:bounceIn .5s cubic-bezier(.68,-0.55,.27,1.55) forwards}
.page.entered .animate-flip{animation:flipIn .5s ease-out forwards}
`

export function getThemeCSS(themeId: ThemeId): string {
  if (themeId === 'none') return BASE_COMPONENT_CSS
  const t = THEMES[themeId]
  return `
:root {
  --primary: ${t.primary};
  --primary-light: ${t.primaryLight};
  --bg-main: ${t.bgMain};
  --bg-card: ${t.bgCard};
  --text-color: ${t.textColor};
  --gradient: linear-gradient(135deg, ${t.primary}, ${t.primaryLight});
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Microsoft YaHei',sans-serif;background:var(--bg-main);color:var(--text-color);line-height:1.6}
h1,h2,h3{color:#fff}
h1{font-size:2.5em;margin-bottom:0.5em}
h2{font-size:1.8em;margin-bottom:0.4em}
h3{font-size:1.3em;margin-bottom:0.3em}
p{margin-bottom:1em;color:var(--text-color)}
.page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 40px;position:relative}
${BASE_COMPONENT_CSS}`
}
