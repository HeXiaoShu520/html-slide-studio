import {
  Monitor, Tablet, Smartphone, Play, Download,
  Undo2, Redo2, Eye, Code, Sparkles, FolderOpen, FileDown, Save
} from 'lucide-react'
import { useState } from 'react'
import { useAppStore, THEMES, type ThemeId, saveProject, exportProjectFile, importProjectFile } from '../store/useAppStore'
import { getThemeCSS } from '../themes/themeCSS'
import ImportConvertDialog from './ImportConvertDialog'

export default function TopBar() {
  const {
    editor, projectName, setProjectName,
    currentTheme, setTheme, viewMode, setViewMode,
    setShowAIPanel, setPreviewHtml,
    updateCurrentSlide, globalCss, setGlobalCss,
  } = useAppStore()

  const [importConvertData, setImportConvertData] = useState<{
    rawHtml: string
    projectName: string
  } | null>(null)

  const handleUndo = () => editor?.UndoManager.undo()
  const handleRedo = () => editor?.UndoManager.redo()
  const handleDevice = (device: string) => editor?.setDevice(device)

  const handleSave = () => {
    if (editor) updateCurrentSlide(editor.getHtml(), editor.getCss() || '')
    saveProject(projectName, currentTheme, useAppStore.getState().slides)
  }

  const handleExportProject = () => {
    if (editor) updateCurrentSlide(editor.getHtml(), editor.getCss() || '')
    const st = useAppStore.getState()
    exportProjectFile(projectName, currentTheme, st.slides, st.globalCss)
  }

  const handleImportProject = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.html'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !editor) return
      try {
        const { projectName: name, theme, slides, globalCss: gCss } = await importProjectFile(file)
        // 检测是否为非标准格式（单页且无 .page 结构）
        const isNonStandard = slides.length === 1 && !slides[0].html.includes('class="page"') && !slides[0].html.includes("class='page'")
        if (isNonStandard) {
          setImportConvertData({ rawHtml: slides[0].html, projectName: name })
          return
        }
        applyImport(name, theme, slides, gCss)
      } catch (err: any) { alert('导入失败: ' + err.message) }
    }
    input.click()
  }

  const applyImport = (name: string, theme: ThemeId, slides: ReturnType<typeof useAppStore.getState>['slides'], gCss: string) => {
    if (!editor) return
    setProjectName(name)
    setTheme(theme)
    setGlobalCss(gCss)
    useAppStore.setState({ slides, currentSlideIndex: 0 })
    editor.setComponents(slides[0].html)
    editor.setStyle(slides[0].css || '')
    try {
      const iframe = editor.Canvas.getFrameEl() as HTMLIFrameElement
      const doc = iframe?.contentDocument
      if (doc) {
        let el = doc.getElementById('gjs-global-css') as HTMLStyleElement
        if (!el) { el = doc.createElement('style'); el.id = 'gjs-global-css'; doc.head.appendChild(el) }
        el.textContent = gCss
      }
    } catch { /* cross-origin */ }
  }

  const handleExport = () => {
    if (!editor) return
    updateCurrentSlide(editor.getHtml(), editor.getCss() || '')
    const themeCSS = getThemeCSS(currentTheme)
    const state = useAppStore.getState()
    const allSlides = state.slides
    const allHtml = allSlides.map(s => s.html).join('\n')
    const perSlideCss = allSlides.map(s => s.css).filter(Boolean).join('\n')
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${projectName}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
html{scroll-behavior:smooth}
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
${themeCSS}
${state.globalCss}
${perSlideCss}
</style>
</head>
<body>${allHtml}</body>
</html>`
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const PRESENT_SCRIPT = `
const pages=[...document.querySelectorAll('.page')];
let cur=0;
// IntersectionObserver 触发动画
const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('visible')}
    else{e.target.classList.remove('visible')}
  })
},{threshold:0.4});
pages.forEach(p=>io.observe(p));
// 重播按钮
pages.forEach((p,i)=>{
  const btn=document.createElement('button');
  btn.textContent='↺';
  btn.title='重播动画';
  btn.style.cssText='position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.4);color:#fff;cursor:pointer;font-size:14px;z-index:10;backdrop-filter:blur(8px)';
  btn.onclick=()=>{p.classList.remove('visible');void p.offsetWidth;p.classList.add('visible')};
  p.style.position='relative';
  p.appendChild(btn);
});
`

  const buildPreviewHtml = (presentMode = false) => {
    const themeCSS = getThemeCSS(currentTheme)
    const st = useAppStore.getState()
    const allHtml = st.slides.map(s => s.html).join('\n')
    const perSlideCss = st.slides.map(s => s.css).filter(Boolean).join('\n')
    const presentCss = presentMode ? `.pw{height:100vh;overflow-y:scroll;scroll-snap-type:y mandatory}.page{scroll-snap-align:start}.pnav{position:fixed;bottom:24px;right:24px;display:flex;gap:8px;z-index:999}.pnav button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:16px;backdrop-filter:blur(8px)}.pnav button:hover{background:rgba(0,102,255,0.6)}.pc{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.5);font-size:13px;z-index:999}` : ''
    const navHtml = presentMode ? `<div class="pnav"><button onclick="go(-1)">↑</button><button onclick="go(1)">↓</button></div><div class="pc" id="pc"></div>` : ''
    const navScript = presentMode ? `function go(d){cur=Math.max(0,Math.min(pages.length-1,cur+d));pages[cur].scrollIntoView({behavior:'smooth'});document.getElementById('pc').textContent=(cur+1)+' / '+pages.length}document.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowRight'||e.key===' ')go(1);if(e.key==='ArrowUp'||e.key==='ArrowLeft')go(-1);if(e.key==='Escape')window.parent.postMessage('close-preview','*')});document.getElementById('pc').textContent='1 / '+pages.length;` : ''
    const bodyStyle = presentMode ? 'overflow:hidden' : ''
    const bodyWrap = presentMode ? `<div class="pw" id="pw">${allHtml}</div>${navHtml}` : allHtml
    return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>html{scroll-behavior:smooth}body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;${bodyStyle}}${themeCSS}${st.globalCss}${perSlideCss}${presentCss}</style></head><body>${bodyWrap}<script>${PRESENT_SCRIPT}${navScript}<\/script></body></html>`
  }

  const handlePreview = () => {
    if (editor) updateCurrentSlide(editor.getHtml(), editor.getCss() || '')
    setPreviewHtml(buildPreviewHtml(false))
  }

  const handlePresent = () => {
    if (editor) updateCurrentSlide(editor.getHtml(), editor.getCss() || '')
    setPreviewHtml(buildPreviewHtml(true))
  }

  return (
    <>
    <div className="flex items-center h-14 bg-[var(--atag-bg-panel)] border-b border-[var(--atag-border)] px-4 gap-3 shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#00D9FF] flex items-center justify-center text-white text-sm font-bold">A</div>
        <input
          className="bg-transparent border-none text-base text-[var(--atag-text)] w-32 outline-none focus:border-b focus:border-[var(--atag-primary)]"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

      <div className="flex-1 flex items-center justify-center gap-3">
        {/* 编辑操作 */}
        <div className="flex items-center gap-1">
          <ToolBtn icon={<Undo2 size={16} />} tip="撤销 (Ctrl+Z)" onClick={handleUndo} />
          <ToolBtn icon={<Redo2 size={16} />} tip="重做 (Ctrl+Y)" onClick={handleRedo} />
        </div>

        <div className="w-px h-6 bg-[var(--atag-border)]" />

        {/* AI 生成 */}
        <button
          className="flex items-center gap-2 bg-gradient-to-r from-[#0066FF] to-[#00D9FF] text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
          onClick={() => setShowAIPanel(true)}
        >
          <Sparkles size={16} />
          <span>AI 生成</span>
        </button>

        <div className="w-px h-6 bg-[var(--atag-border)]" />

        {/* 文件操作 */}
        <div className="flex items-center gap-1">
          <TextBtn icon={<FolderOpen size={16} />} label="打开" onClick={handleImportProject} />
          <TextBtn icon={<Save size={16} />} label="保存" onClick={handleSave} />
          <TextBtn icon={<Download size={16} />} label="导出" onClick={handleExport} />
        </div>

        <div className="w-px h-6 bg-[var(--atag-border)]" />

        {/* 预览操作 */}
        <div className="flex items-center gap-1">
          <TextBtn icon={<Eye size={16} />} label="预览" onClick={handlePreview} />
          <TextBtn icon={<Play size={16} />} label="演示" onClick={handlePresent} />
        </div>

      </div>
    </div>
    {importConvertData && (
      <ImportConvertDialog
        rawHtml={importConvertData.rawHtml}
        apiKey={localStorage.getItem('atag-api-key') || ''}
        apiEndpoint={localStorage.getItem('atag-api-endpoint') || 'https://api.openai.com/v1/chat/completions'}
        model={localStorage.getItem('atag-model') || 'gpt-4o'}
        onConfirm={(html) => {
          const parser = new DOMParser()
          const doc = parser.parseFromString(`<div>${html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')}</div>`, 'text/html')
          const styleMatches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)]
          const gCss = styleMatches.map(m => m[1]).join('\n')
          let pages = Array.from(doc.querySelectorAll('.page'))
          if (pages.length === 0) pages = Array.from(doc.querySelectorAll('.slide'))
          const slides = pages.length > 0
            ? pages.map(p => ({ id: crypto.randomUUID(), html: p.outerHTML, css: '' }))
            : [{ id: crypto.randomUUID(), html: html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim(), css: '' }]
          applyImport(importConvertData.projectName, currentTheme, slides, gCss)
          setImportConvertData(null)
        }}
        onCancel={() => {
          // 直接导入原始内容
          const slides = [{ id: crypto.randomUUID(), html: importConvertData.rawHtml, css: '' }]
          applyImport(importConvertData.projectName, currentTheme, slides, '')
          setImportConvertData(null)
        }}
      />
    )}
    </>
  )
}

function ToolBtn({ icon, tip, onClick, highlight }: { icon: React.ReactNode; tip: string; onClick?: () => void; highlight?: boolean }) {
  return (
    <button title={tip} onClick={onClick}
      className={`p-2 rounded-lg transition-colors ${highlight ? 'text-[var(--atag-primary)] hover:bg-[rgba(0,102,255,0.15)]' : 'text-[var(--atag-text-muted)] hover:text-[var(--atag-text)] hover:bg-[rgba(255,255,255,0.05)]'}`}
    >{icon}</button>
  )
}

function TextBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-[var(--atag-text-muted)] hover:text-[var(--atag-text)] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
    >{icon}<span>{label}</span></button>
  )
}
