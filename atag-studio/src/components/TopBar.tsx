import {
  Monitor, Tablet, Smartphone, Play, Download,
  Undo2, Redo2, Eye, Code, Sparkles, FolderOpen, FileDown, Save
} from 'lucide-react'
import { useAppStore, THEMES, type ThemeId, saveProject, exportProjectFile, importProjectFile } from '../store/useAppStore'
import { getThemeCSS } from '../themes/themeCSS'

export default function TopBar() {
  const {
    editor, projectName, setProjectName,
    currentTheme, setTheme, viewMode, setViewMode,
    setShowAIPanel, setPreviewHtml,
  } = useAppStore()

  const handleUndo = () => editor?.UndoManager.undo()
  const handleRedo = () => editor?.UndoManager.redo()
  const handleDevice = (device: string) => editor?.setDevice(device)

  const handleSave = () => { if (editor) saveProject(editor, projectName, currentTheme) }

  const handleExportProject = () => { if (editor) exportProjectFile(editor, projectName, currentTheme) }

  const handleImportProject = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.html'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !editor) return
      try {
        const { projectName: name, theme, html, css } = await importProjectFile(file)
        editor.setComponents(html)
        editor.setStyle(css)
        setProjectName(name)
        setTheme(theme)
      } catch (err: any) { alert('导入失败: ' + err.message) }
    }
    input.click()
  }

  const handleExport = () => {
    if (!editor) return
    const html = editor.getHtml()
    const css = editor.getCss()
    const themeCSS = getThemeCSS(currentTheme)
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${projectName}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
html{scroll-behavior:smooth}
body{margin:0;padding:0;background:var(--bg-main);color:var(--text-color);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
${themeCSS}
${css}
</style>
</head>
<body>${html}</body>
</html>`
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePreview = () => {
    if (!editor) return
    const themeCSS = getThemeCSS(currentTheme)
    const html = editor.getHtml()
    const css = editor.getCss()
    setPreviewHtml(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><style>html{scroll-behavior:smooth}body{margin:0;padding:0;font-family:-apple-system,sans-serif}${themeCSS}${css}</style></head><body>${html}</body></html>`)
  }

  const handlePresent = () => {
    if (!editor) return
    const themeCSS = getThemeCSS(currentTheme)
    const html = editor.getHtml()
    const css = editor.getCss()
    setPreviewHtml(`<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><style>html{scroll-behavior:smooth}body{margin:0;padding:0;font-family:-apple-system,sans-serif;overflow:hidden}${themeCSS}${css}.page{min-height:100vh;scroll-snap-align:start}.pw{height:100vh;overflow-y:scroll;scroll-snap-type:y mandatory}.pnav{position:fixed;bottom:24px;right:24px;display:flex;gap:8px;z-index:999}.pnav button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:16px;backdrop-filter:blur(8px)}.pnav button:hover{background:rgba(0,102,255,0.6)}.pc{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.5);font-size:13px;z-index:999}</style></head><body><div class="pw" id="pw">${html}</div><div class="pnav"><button onclick="go(-1)">↑</button><button onclick="go(1)">↓</button></div><div class="pc" id="pc"></div><script>const pw=document.getElementById('pw'),pc=document.getElementById('pc');const pages=[...pw.querySelectorAll('.page')];let cur=0;function go(d){cur=Math.max(0,Math.min(pages.length-1,cur+d));pages[cur].scrollIntoView({behavior:'smooth'});upd()}function upd(){pc.textContent=(cur+1)+' / '+pages.length}pw.addEventListener('scroll',()=>{cur=Math.round(pw.scrollTop/window.innerHeight);upd()});document.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key===' ')go(1);if(e.key==='ArrowUp')go(-1);if(e.key==='Escape')window.parent.postMessage('close-preview','*')});upd();<\/script></body></html>`)
  }

  return (
    <div className="flex items-center h-12 bg-[var(--atag-bg-panel)] border-b border-[var(--atag-border)] px-3 gap-2 shrink-0 select-none">
      {/* 左：Logo + 项目名 + 撤销重做 */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#00D9FF] flex items-center justify-center text-white text-xs font-bold">A</div>
        <input
          className="bg-transparent border-none text-sm text-[var(--atag-text)] w-28 outline-none focus:border-b focus:border-[var(--atag-primary)]"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <div className="flex items-center gap-0.5 border-l border-[var(--atag-border)] pl-2 ml-1">
          <ToolBtn icon={<Undo2 size={15} />} tip="撤销" onClick={handleUndo} />
          <ToolBtn icon={<Redo2 size={15} />} tip="重做" onClick={handleRedo} />
        </div>
      </div>

      {/* 中：所有操作按钮 */}
      <div className="flex-1 flex items-center justify-center gap-1">
        <button
          className="flex items-center gap-1.5 bg-gradient-to-r from-[#0066FF] to-[#00D9FF] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
          onClick={() => setShowAIPanel(true)}
        >
          <Sparkles size={13} />
          AI 生成
        </button>
        <div className="w-px h-5 bg-[var(--atag-border)] mx-1" />
        <ToolBtn icon={<FolderOpen size={15} />} tip="打开项目" onClick={handleImportProject} />
        <ToolBtn icon={<Save size={15} />} tip="保存" onClick={handleSave} />
        <ToolBtn icon={<FileDown size={15} />} tip="另存为 HTML" onClick={handleExportProject} />
        <div className="w-px h-5 bg-[var(--atag-border)] mx-1" />
        <ToolBtn icon={<Eye size={15} />} tip="预览" onClick={handlePreview} />
        <ToolBtn icon={<Play size={15} />} tip="演示模式" onClick={handlePresent} />
        <ToolBtn icon={<Code size={15} />} tip="源码" onClick={() => setViewMode(viewMode === 'code' ? 'edit' : 'code')} />
        <div className="w-px h-5 bg-[var(--atag-border)] mx-1" />
        <button
          className="flex items-center gap-1.5 border border-[var(--atag-border)] text-[var(--atag-text)] text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
          onClick={handleExport}
        >
          <Download size={13} />
          导出 HTML
        </button>
      </div>

      {/* 右：设备 + 主题 */}
      <div className="flex items-center gap-1">
        <ToolBtn icon={<Monitor size={15} />} tip="桌面" onClick={() => handleDevice('Desktop')} />
        <ToolBtn icon={<Tablet size={15} />} tip="平板" onClick={() => handleDevice('Tablet')} />
        <ToolBtn icon={<Smartphone size={15} />} tip="手机" onClick={() => handleDevice('Mobile')} />
        <select
          className="bg-[var(--atag-bg-card)] text-[var(--atag-text)] text-xs border border-[var(--atag-border)] rounded px-2 py-1 outline-none cursor-pointer ml-1"
          value={currentTheme}
          onChange={(e) => setTheme(e.target.value as ThemeId)}
        >
          {Object.values(THEMES).map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function ToolBtn({ icon, tip, onClick, highlight }: {
  icon: React.ReactNode
  tip: string
  onClick?: () => void
  highlight?: boolean
}) {
  return (
    <button
      title={tip}
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${
        highlight
          ? 'text-[var(--atag-primary)] hover:bg-[rgba(0,102,255,0.15)]'
          : 'text-[var(--atag-text-muted)] hover:text-[var(--atag-text)] hover:bg-[rgba(255,255,255,0.05)]'
      }`}
    >
      {icon}
    </button>
  )
}
