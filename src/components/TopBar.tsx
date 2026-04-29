import { Play, Download, Sparkles, FolderOpen } from 'lucide-react'
import { useAppStore, type ThemeId } from '../store/useAppStore'
import { getThemeCSS } from '../themes/themeCSS'
import { buildPresentHtml } from '../utils/buildSlideHtml'

const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'dark-tech', label: '暗黑科技' },
  { id: 'mechanical', label: '机械工业' },
]

export default function TopBar() {
  const { projectName, setProjectName, currentTheme, setTheme, setShowAIPanel, setPreviewHtml, slides, globalCss } = useAppStore()

  const handleExport = () => {
    const html = buildPresentHtml(slides, globalCss, getThemeCSS(currentTheme), projectName)
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })),
      download: `${projectName}.html`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handlePresent = () => {
    setPreviewHtml(buildPresentHtml(slides, globalCss, getThemeCSS(currentTheme), projectName))
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.html'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, 'text/html')
      const pages = [...doc.querySelectorAll('.page')]
      if (pages.length === 0) return alert('未找到 .page 元素')
      const { setSlides, setProjectName } = useAppStore.getState()
      setProjectName(file.name.replace(/\.html$/, ''))
      setSlides(pages.map((p, i) => ({ id: crypto.randomUUID(), title: `第 ${i + 1} 页`, html: p.outerHTML })))
    }
    input.click()
  }

  return (
    <div className="flex items-center h-12 px-4 shrink-0 gap-3 select-none"
      style={{ background: 'var(--atag-bg-panel)', borderBottom: '1px solid var(--atag-border)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
        style={{ background: 'linear-gradient(135deg,#0066FF,#00D9FF)' }}>S</div>

      <input
        className="bg-transparent border-none text-sm outline-none w-36"
        style={{ color: 'var(--atag-text)' }}
        value={projectName}
        onChange={e => setProjectName(e.target.value)}
      />

      <div className="w-px h-5 shrink-0" style={{ background: 'var(--atag-border)' }} />

      <div className="flex items-center gap-1">
        {THEMES.map(t => (
          <button key={t.id} onClick={() => setTheme(t.id)}
            className="px-2.5 py-1 rounded text-xs transition-colors"
            style={{
              background: currentTheme === t.id ? 'var(--atag-primary)' : 'transparent',
              color: currentTheme === t.id ? '#fff' : 'var(--atag-text-muted)',
              border: '1px solid ' + (currentTheme === t.id ? 'var(--atag-primary)' : 'var(--atag-border)'),
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 shrink-0" style={{ background: 'var(--atag-border)' }} />

      <button onClick={() => setShowAIPanel(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(135deg,#0066FF,#00D9FF)' }}>
        <Sparkles size={14} /><span>AI 生成</span>
      </button>

      <Btn icon={<FolderOpen size={15} />} label="打开" onClick={handleImport} />
      <Btn icon={<Download size={15} />} label="导出" onClick={handleExport} />
      <Btn icon={<Play size={15} />} label="演示" onClick={handlePresent} />

    </div>
  )
}

function Btn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/5"
      style={{ color: 'var(--atag-text-muted)', border: '1px solid var(--atag-border)' }}>
      {icon}<span>{label}</span>
    </button>
  )
}
