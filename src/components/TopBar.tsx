/**
 * TopBar.tsx — 顶部工具栏
 *
 * ============================================================
 * HTML 文件导入完整流程说明
 * ============================================================
 *
 * 【1. 读取文件】
 *   用户点击"打开"按钮，触发 <input type="file"> 选择 .html 文件，
 *   通过 file.text() 读取为字符串 text。
 *
 * 【2. 提取全局样式（globalCss）】
 *   用正则匹配 <head>...</head> 块，提取其中所有 <style> 标签内容合并。
 *   这些样式来自文件头部（<!DOCTYPE html> 到第一个 <!-- PAGE --> 之间），
 *   在后续 split 时会随 <head> 一起被丢弃，因此提前通过 setGlobalCss 保存。
 *   最终由 buildSlideHtml 在渲染每页时重新注入到 <style> 中。
 *
 * 【3. stripNav — 剔除导航块】
 *   每个 segment 在处理前先剔除以下内容，避免导入后出现重复导航按钮：
 *   - <!-- SLIDE-NAV-BEGIN --> ... <!-- SLIDE-NAV-END --> 整块（AI 生成格式）
 *   - <div class="pnav">...</div>（工具导出注入的导航按钮）
 *   - <div class="pc" ...>...</div>（页码显示）
 *   - 包含 querySelectorAll('.page') 的 <script> 块（翻页脚本）
 *
 * 【4. 路径1：按 <!-- PAGE --> 分隔符拆分（标准格式）】
 *   适用于：工具导出的文件、AI 按规范生成的文件。
 *
 *   split 步骤：
 *   a) text.split(/<!--\s*PAGE\s*-->/) 拆出 N+1 个 segment
 *      （N 页内容 + 第0个含 DOCTYPE/head 的头部 segment）
 *   b) 每个 segment 执行 strip <body>：
 *      - 用非贪婪正则 /^[\s\S]*?<body[^>]*>/ 删除 <body> 之前的所有内容
 *      - 用 /<\/body>[\s\S]*$/ 删除 </body> 之后的内容
 *      - 对于没有 <body> 标签的 segment（第2页起），非贪婪匹配0字符，
 *        替换不生效，内容完整保留
 *   c) 执行 stripNav 剔除导航块
 *   d) filter：用正则 /class=["'][^"']*\bpage\b/ 过滤，
 *      兼容 class="page"、class="page p2-page" 等多 class 形式
 *      （注意：不能用 includes('class="page"')，会漏掉多 class 情况）
 *   e) 每个通过 filter 的 segment 作为一个 slide 的 html
 *
 * 【5. 路径2：DOMParser fallback（无 <!-- PAGE --> 分隔符的文件）】
 *   适用于：旧格式文件、手写 HTML、所有 .page 在同一个 <body> 内的文件。
 *
 *   a) DOMParser 解析整个 HTML 文档
 *   b) querySelectorAll('.page') 找到所有页面元素
 *   c) 提取文档中所有 <style> 内容合并为 rawStyles
 *   d) 给每页分配唯一 id（pg-timestamp-index），
 *      将 rawStyles 中的 .page 选择器替换为 #pid.page，
 *      避免多页共存时样式互相污染（CSS scoping）
 *   e) 每页输出 <style>scopedCss</style>\n<div class="page" id="pid">...</div>
 *
 * 【6. 合成（buildSlideHtml）】
 *   每页 slide.html 在预览时由 buildSlideHtml 包壳：
 *   注入 themeCSS + globalCss + 基础样式 + data-line 行号 + iframe 通信脚本，
 *   生成完整 <!DOCTYPE html> 文档写入 iframe。
 * ============================================================
 */
import { Play, Download, Sparkles, FolderOpen, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAppStore, type ThemeId } from '../store/useAppStore'
import { getThemeCSS } from '../themes/themeCSS'
import { buildPresentHtml } from '../utils/buildSlideHtml'

// 可选主题列表，id 对应 themeCSS 中的主题键
const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'none', label: '原始主题' },
  { id: 'dark-tech', label: '暗黑科技' },
  { id: 'mechanical', label: '机械工业' },
]

// API 设置面板：管理 endpoint / apiKey / model，持久化到 localStorage
function ApiSettings() {
  const [open, setOpen] = useState(false)
  const [endpoint, setEndpoint] = useState(() => localStorage.getItem('atag-api-endpoint') || 'https://api.openai.com/v1/chat/completions')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('atag-api-key') || '')
  const [model, setModel] = useState(() => localStorage.getItem('atag-model') || 'gpt-4o')
  const [apiType, setApiType] = useState(() => localStorage.getItem('atag-api-type') || 'openai')
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const ref = useRef<HTMLDivElement>(null)

  // 点击面板外部时关闭，延迟注册避免当前点击事件立即触发关闭
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    setTimeout(() => window.addEventListener('mousedown', handler), 0)
    return () => window.removeEventListener('mousedown', handler)
  }, [open])

  // 保存单个配置项到 localStorage
  const save = (key: string, val: string) => localStorage.setItem(key, val)

  const testConnection = async () => {
    if (!apiKey) return
    setTestStatus('loading')
    try {
      const isAnthropic = apiType === 'anthropic'
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
            { label: 'API 类型', key: 'atag-api-type', val: apiType, set: setApiType, type: 'select', options: [{ value: 'openai', label: 'OpenAI' }, { value: 'anthropic', label: 'Anthropic' }] },
            { label: 'Base URL', key: 'atag-api-endpoint', val: endpoint, set: setEndpoint, type: 'text' },
            { label: 'API Key', key: 'atag-api-key', val: apiKey, set: setApiKey, type: 'password' },
            { label: '模型', key: 'atag-model', val: model, set: setModel, type: 'text' },
          ].map(({ label, key, val, set, type, options }) => (
            <div key={key}>
              <div style={{ fontSize: 11, color: 'var(--atag-text-muted)', marginBottom: 4 }}>{label}</div>
              {type === 'select' ? (
                <select value={val} onChange={e => { set(e.target.value); save(key, e.target.value); setTestStatus('idle') }}
                  style={{ width: '100%', background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--atag-text)', outline: 'none', boxSizing: 'border-box' }}>
                  {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              ) : (
                <input type={type} value={val}
                  onChange={e => { set(e.target.value); save(key, e.target.value); setTestStatus('idle') }}
                  style={{ width: '100%', background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--atag-text)', outline: 'none', boxSizing: 'border-box' }} />
              )}
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
  const { projectName, setProjectName, setShowAIPanel, setPreviewHtml, slides, globalCss, currentTheme, hideNavButtons, pageTransitionDuration, setPageTransitionDuration, globalAutoNextDelay } = useAppStore()

  // 导出为独立 HTML 文件，包含完整翻页脚本，可直接用浏览器打开演示
  const handleExport = () => {
    const html = buildPresentHtml(slides, globalCss, getThemeCSS(currentTheme), projectName, 0, hideNavButtons, pageTransitionDuration, globalAutoNextDelay)
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' })),
      download: `${projectName}.html`,
    })
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // 全屏演示：将完整 HTML 写入 previewHtml，触发 App 层的全屏 iframe
  const handlePresent = () => {
    setPreviewHtml(buildPresentHtml(slides, globalCss, getThemeCSS(currentTheme), projectName, 0, hideNavButtons, pageTransitionDuration, globalAutoNextDelay))
  }

  // 导入 HTML 文件，解析出各页 slide
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.html'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      console.log('[TopBar] import file:', file.name, 'size:', text.length, 'hasPAGE:', text.includes('<!-- PAGE -->'))
      const { setSlides, setProjectName, setTheme } = useAppStore.getState()
      setProjectName(file.name.replace(/\.html$/, ''))

      // 提取 <head> 内的全局样式注入为 globalCss
      // 这些样式在 <!DOCTYPE html> 到第一个 <!-- PAGE --> 之间，
      // split 后 strip <body> 时会被丢弃，但通过 setGlobalCss 保留，
      // 最终由 buildSlideHtml 重新注入到每页的 <style> 中
      const headMatch = text.match(/<head[\s\S]*?<\/head>/i)
      const headStyles = headMatch
        ? [...headMatch[0].matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n')
        : ''
      if (headStyles.trim()) useAppStore.getState().setGlobalCss(headStyles)

      // 剔除导航块（AI生成的 SLIDE-NAV 标记 或 工具导出注入的 pnav/pc/PRESENT_SCRIPT）
      // 避免导入后出现重复的导航按钮
      const stripNav = (s: string) =>
        s.replace(/<!--\s*SLIDE-NAV-BEGIN\s*-->[\s\S]*?<!--\s*SLIDE-NAV-END\s*-->/gi, '')
         .replace(/<div class="pnav">[\s\S]*?<\/div>/g, '')
         .replace(/<div class="pc"[^>]*>[\s\S]*?<\/div>/g, '')
         .replace(/<script[^>]*>[\s\S]*?querySelectorAll\('\.page'\)[\s\S]*?<\/script>/gi, '')

      // 路径1：按 <!-- PAGE --> 分隔符拆分（标准格式）
      // 第一个 segment 含 <!DOCTYPE html>/<head>，strip <body> 后丢弃头部，保留页面内容
      // filter 用正则匹配 class 属性中含 page 单词，兼容 class="page p2-page" 等多 class 形式
      const segments = text.split(/<!--\s*PAGE\s*-->/)
        .map(s => {
          // strip <body> 之前的所有内容（含 DOCTYPE/head），以及 </body> 之后的内容
          s = s.replace(/^[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '')
          return stripNav(s).trim()
        })
        .filter(s => /class=["'][^"']*\bpage\b/.test(s))
      console.log('[TopBar] PAGE split segments:', segments.length)
      if (segments.length > 0) {
        setSlides(segments.map((html, i) => ({ id: crypto.randomUUID(), title: `第 ${i + 1} 页`, html })))
        setTheme('none')
        return
      }

      // 路径2：DOMParser fallback，适用于没有 <!-- PAGE --> 分隔符的文件
      // 提取所有 <style> 合并为全局样式，scoped 到各页 id 避免多页样式冲突
      const doc = new DOMParser().parseFromString(text, 'text/html')
      const pages = [...doc.querySelectorAll('.page')]
      console.log('[TopBar] DOMParser fallback pages:', pages.length)
      if (pages.length === 0) return alert('未找到 .page 元素')
      const rawStyles = [...doc.querySelectorAll('style')].map(s => s.textContent || '').join('\n')
      setSlides(pages.map((p, i) => {
        // 给每页分配唯一 id，将全局 .page 选择器 scope 到该 id，避免多页共存时样式互相污染
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
