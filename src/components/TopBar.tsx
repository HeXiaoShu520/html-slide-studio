import { Play, Download, Sparkles, FolderOpen, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAppStore, type ThemeId } from '../store/useAppStore'
import { getThemeCSS } from '../themes/themeCSS'
import { buildPresentHtml } from '../utils/buildSlideHtml'

const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'none', label: '原始主题' },
  { id: 'dark-tech', label: '暗黑科技' },
  { id: 'mechanical', label: '机械工业' },
]

function ApiSettings() {
  const [open, setOpen] = useState(false)
  const [endpoint, setEndpoint] = useState(() => localStorage.getItem('atag-api-endpoint') || 'https://api.openai.com/v1/chat/completions')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('atag-api-key') || '')
  const [model, setModel] = useState(() => localStorage.getItem('atag-model') || 'gpt-4o')
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    setTimeout(() => window.addEventListener('mousedown', handler), 0)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  const save = (key: string, val: string) => localStorage.setItem(key, val)

  const testConnection = async () => {
    if (!apiKey) return
    setTestStatus('loading')
    try {
      const isAnthropic = endpoint.includes('anthropic.com')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (isAnthropic) { headers['x-api-key'] = apiKey; headers['anthropic-version'] = '2023-06-01' }
      else headers['Authorization'] = `Bearer ${apiKey}`
      const body = isAnthropic
        ? { model, max_tokens: 8, messages: [{ role: 'user', content: 'hi' }] }
        : { model, max_tokens: 8, messages: [{ role: 'user', content: 'hi' }] }
      const full = endpoint.endsWith('/chat/completions') ? endpoint : endpoint.replace(/\/$/, '') + '/chat/completions'
      headers['x-target'] = full
      const res = await fetch('/api-proxy', { method: 'POST', headers, body: JSON.stringify(body) })
      setTestStatus(res.ok ? 'ok' : 'fail')
    } catch {
      setTestStatus('fail')
    }
  }

  const statusColor = { idle: 'var(--atag-text-muted)', loading: '#facc15', ok: '#4ade80', fail: '#f87171' }[testStatus]
  const statusLabel = { idle: '测试连通', loading: '测试中…', ok: '连通成功', fail: '连接失败' }[testStatus]

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button onClick={() => { setOpen(o => !o); setTestStatus('idle') }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-colors hover:bg-white/5"
        style={{ color: 'var(--atag-text-muted)', border: '1px solid var(--atag-border)' }}>
        <Settings size={14} /><span>API 设置</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 3000, width: 340, background: 'var(--atag-bg-panel)', border: '1px solid var(--atag-border)', borderRadius: 12, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--atag-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>API 配置</div>
          {[
            { label: 'OpenAI Base URL', key: 'atag-api-endpoint', val: endpoint, set: setEndpoint, type: 'text' },
            { label: 'API Key', key: 'atag-api-key', val: apiKey, set: setApiKey, type: 'password' },
            { label: '模型', key: 'atag-model', val: model, set: setModel, type: 'text' },
          ].map(({ label, key, val, set, type }) => (
            <div key={key}>
              <div style={{ fontSize: 11, color: 'var(--atag-text-muted)', marginBottom: 4 }}>{label}</div>
              <input type={type} value={val}
                onChange={e => { set(e.target.value); save(key, e.target.value); setTestStatus('idle') }}
                style={{ width: '100%', background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--atag-text)', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          <button onClick={testConnection} disabled={testStatus === 'loading' || !apiKey}
            style={{ marginTop: 4, padding: '7px 0', borderRadius: 8, border: '1px solid var(--atag-border)', background: 'transparent', color: statusColor, fontSize: 12, cursor: apiKey ? 'pointer' : 'not-allowed', transition: 'color .2s' }}>
            {statusLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export default function TopBar() {
  const { projectName, setProjectName, setShowAIPanel, setPreviewHtml, slides, globalCss, currentTheme } = useAppStore()

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
      const { setSlides, setProjectName, setTheme } = useAppStore.getState()
      setProjectName(file.name.replace(/\.html$/, ''))

      // 提取 <head> 内的全局样式注入为 globalCss（保留原始配色和基础类）
      const headMatch = text.match(/<head[\s\S]*?<\/head>/i)
      const headStyles = headMatch
        ? [...headMatch[0].matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n')
        : ''
      if (headStyles.trim()) useAppStore.getState().setGlobalCss(headStyles)

      // 剔除导航块（AI生成的 SLIDE-NAV 标记 或 工具导出注入的 pnav/pc/PRESENT_SCRIPT）
      const stripNav = (s: string) =>
        s.replace(/<!--\s*SLIDE-NAV-BEGIN\s*-->[\s\S]*?<!--\s*SLIDE-NAV-END\s*-->/gi, '')
         .replace(/<div class="pnav">[\s\S]*?<\/div>/g, '')
         .replace(/<div class="pc"[^>]*>[\s\S]*?<\/div>/g, '')
         .replace(/<script[^>]*>[\s\S]*?querySelectorAll\('\.page'\)[\s\S]*?<\/script>/gi, '')

      // 优先按 <!-- PAGE --> 分隔符拆分（标准格式）
      const segments = text.split(/<!--\s*PAGE\s*-->/)
        .map(s => {
          s = s.replace(/^[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '')
          return stripNav(s).trim()
        })
        .filter(s => s.includes('class="page"') || s.includes("class='page'"))
      if (segments.length > 0) {
        setSlides(segments.map((html, i) => ({ id: crypto.randomUUID(), title: `第 ${i + 1} 页`, html })))
        setTheme('none')
        return
      }

      // 回退：DOMParser 查找 .page 元素
      const doc = new DOMParser().parseFromString(text, 'text/html')
      const pages = [...doc.querySelectorAll('.page')]
      if (pages.length === 0) return alert('未找到 .page 元素')
      const rawStyles = [...doc.querySelectorAll('style')].map(s => s.textContent || '').join('\n')
      setSlides(pages.map((p, i) => {
        const pid = `pg-${Date.now()}-${i}`
        p.id = pid
        const scopedCss = rawStyles.replace(/\.page([\s,{:.#\[>~+]|$)/g, `#${pid}.page$1`)
        return { id: crypto.randomUUID(), title: `第 ${i + 1} 页`, html: `<style>${scopedCss}</style>\n${p.outerHTML}` }
      }))
      setTheme('none')
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

      <ApiSettings />

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
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm transition-colors hover:bg-white/5"
      style={{ color: 'var(--atag-text-muted)', border: '1px solid var(--atag-border)' }}>
      {icon}<span>{label}</span>
    </button>
  )
}
