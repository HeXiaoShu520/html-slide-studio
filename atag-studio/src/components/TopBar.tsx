import {
  Monitor, Tablet, Smartphone, Sparkles, Play, Download,
  Undo2, Redo2, Eye, Code, Save, FolderOpen, FileDown
} from 'lucide-react'
import { useAppStore, THEMES, type ThemeId, saveProject, exportProjectFile, importProjectFile } from '../store/useAppStore'
import { getThemeCSS } from '../themes/themeCSS'

export default function TopBar() {
  const {
    editor, projectName, setProjectName,
    currentTheme, setTheme, viewMode, setViewMode,
    setShowAIPanel
  } = useAppStore()

  const handleUndo = () => editor?.UndoManager.undo()
  const handleRedo = () => editor?.UndoManager.redo()

  const handleDevice = (device: string) => {
    editor?.setDevice(device)
  }

  const handleSave = () => {
    if (!editor) return
    saveProject(editor, projectName, currentTheme)
    // 简单提示
    const btn = document.activeElement as HTMLElement
    const tip = btn?.getAttribute('title')
    if (tip) {
      btn.setAttribute('title', '已保存 ✓')
      setTimeout(() => btn.setAttribute('title', tip), 1500)
    }
  }

  const handleExportProject = () => {
    if (!editor) return
    exportProjectFile(editor, projectName, currentTheme)
  }

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
      } catch (err: any) {
        alert('导入失败: ' + err.message)
      }
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
    const html = editor.getHtml()
    const css = editor.getCss()
    const themeCSS = getThemeCSS(currentTheme)
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${projectName} - 预览</title>
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
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(fullHtml)
      win.document.close()
    }
  }

  const handlePresent = () => {
    if (!editor) return
    const html = editor.getHtml()
    const css = editor.getCss()
    const themeCSS = getThemeCSS(currentTheme)
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${projectName} - 演示</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
html{scroll-behavior:smooth}
body{margin:0;padding:0;background:var(--bg-main);color:var(--text-color);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;overflow:hidden}
${themeCSS}
${css}
.page{min-height:100vh;scroll-snap-align:start}
.present-wrap{height:100vh;overflow-y:scroll;scroll-snap-type:y mandatory}
.present-nav{position:fixed;bottom:24px;right:24px;display:flex;gap:8px;z-index:999}
.present-nav button{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)}
.present-nav button:hover{background:rgba(0,102,255,0.6)}
.present-counter{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);color:rgba(255,255,255,0.5);font-size:13px;z-index:999}
</style>
</head>
<body>
<div class="present-wrap" id="pw">${html}</div>
<div class="present-nav">
  <button onclick="go(-1)" title="上一页">&#8593;</button>
  <button onclick="go(1)" title="下一页">&#8595;</button>
  <button onclick="document.exitFullscreen?document.exitFullscreen():0" title="退出">&#10005;</button>
</div>
<div class="present-counter" id="pc"></div>
<script>
const pw=document.getElementById('pw'),pc=document.getElementById('pc');
const pages=[...pw.querySelectorAll('.page')];
let cur=0;
function go(d){cur=Math.max(0,Math.min(pages.length-1,cur+d));pages[cur].scrollIntoView({behavior:'smooth'});upd()}
function upd(){pc.textContent=(cur+1)+' / '+pages.length}
pw.addEventListener('scroll',()=>{const st=pw.scrollTop,vh=window.innerHeight;cur=Math.round(st/vh);upd()});
document.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key===' '||e.key==='PageDown')go(1);if(e.key==='ArrowUp'||e.key==='PageUp')go(-1);if(e.key==='Escape'&&document.exitFullscreen)document.exitFullscreen()});
upd();
if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen();
<\/script>
</body>
</html>`
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(fullHtml)
      win.document.close()
    }
  }

  return (
    <div className="flex items-center h-12 bg-[var(--atag-bg-panel)] border-b border-[var(--atag-border)] px-3 gap-2 shrink-0 select-none">
      {/* Logo & 项目名 */}
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#00D9FF] flex items-center justify-center text-white text-xs font-bold">A</div>
        <input
          className="bg-transparent border-none text-sm text-[var(--atag-text)] w-32 outline-none focus:border-b focus:border-[var(--atag-primary)]"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

      {/* 撤销/重做 */}
      <div className="flex items-center gap-1 border-r border-[var(--atag-border)] pr-3 mr-1">
        <ToolBtn icon={<Undo2 size={16} />} tip="撤销" onClick={handleUndo} />
        <ToolBtn icon={<Redo2 size={16} />} tip="重做" onClick={handleRedo} />
      </div>

      {/* 设备切换 */}
      <div className="flex items-center gap-1 border-r border-[var(--atag-border)] pr-3 mr-1">
        <ToolBtn icon={<Monitor size={16} />} tip="桌面" onClick={() => handleDevice('Desktop')} />
        <ToolBtn icon={<Tablet size={16} />} tip="平板" onClick={() => handleDevice('Tablet')} />
        <ToolBtn icon={<Smartphone size={16} />} tip="手机" onClick={() => handleDevice('Mobile')} />
      </div>

      {/* 主题选择 */}
      <select
        className="bg-[var(--atag-bg-card)] text-[var(--atag-text)] text-xs border border-[var(--atag-border)] rounded px-2 py-1 outline-none cursor-pointer"
        value={currentTheme}
        onChange={(e) => setTheme(e.target.value as ThemeId)}
      >
        {Object.values(THEMES).map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {/* 弹性空间 */}
      <div className="flex-1" />

      {/* 右侧操作 */}
      <ToolBtn
        icon={<Sparkles size={16} />}
        tip="AI 生成"
        highlight
        onClick={() => setShowAIPanel(true)}
      />
      <ToolBtn icon={<Play size={16} />} tip="演示模式" onClick={handlePresent} />
      <ToolBtn icon={<Eye size={16} />} tip="预览" onClick={handlePreview} />
      <ToolBtn icon={<Code size={16} />} tip="源码" onClick={() => setViewMode(viewMode === 'code' ? 'edit' : 'code')} />
      <ToolBtn icon={<FolderOpen size={16} />} tip="打开 HTML 项目" onClick={handleImportProject} />
      <ToolBtn icon={<Save size={16} />} tip="保存到浏览器" onClick={handleSave} />
      <ToolBtn icon={<FileDown size={16} />} tip="另存为 HTML" onClick={handleExportProject} />
      <button
        className="flex items-center gap-1.5 bg-gradient-to-r from-[#0066FF] to-[#00D9FF] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity ml-2"
        onClick={handleExport}
      >
        <Download size={14} />
        导出 HTML
      </button>
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
