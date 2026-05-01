import { useRef, useCallback, useEffect, useState } from 'react'
import { Eye, Play } from 'lucide-react'
import TopBar from './components/TopBar'
import SlideStrip from './components/SlideStrip'
import CodeEditor, { type CodeEditorHandle } from './components/CodeEditor'
import PreviewFrame, { type PreviewFrameHandle } from './components/PreviewFrame'
import SnippetPanel from './components/SnippetPanel'
import AIPanel from './components/AIPanel'
import AIAssistant, { type AIAssistantHandle } from './components/AIAssistant'
import { useAppStore } from './store/useAppStore'
import { getThemeCSS } from './themes/themeCSS'
import { buildPresentHtml } from './utils/buildSlideHtml'

export default function App() {
  const { slides, currentSlideIndex, currentTheme, globalCss, updateCurrentSlide, setPreviewHtml, previewHtml, showAIPanel, setTheme } = useAppStore()
  const editorRef = useRef<CodeEditorHandle>(null)
  const aiRef = useRef<AIAssistantHandle>(null)
  const previewRef = useRef<PreviewFrameHandle>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; sel: string; elText: string } | null>(null)
  const ctxMenuRef = useRef<HTMLDivElement>(null)
  const [previewSlideHtml, setPreviewSlideHtml] = useState(() => slides[currentSlideIndex]?.html ?? '')
  const [refreshInterval, setRefreshInterval] = useState(1)
  const refreshIntervalRef = useRef(1)
  const [enterAnim, setEnterAnim] = useState(false)

  const currentSlide = slides[currentSlideIndex]
  const themeCSS = getThemeCSS(currentTheme)

  // 切换页面或重新导入时立即同步预览
  useEffect(() => { setPreviewSlideHtml(currentSlide?.html ?? '') }, [currentSlideIndex, slides])

  const handleCodeChange = useCallback((html: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const delay = refreshIntervalRef.current * 1000
    if (delay <= 0) { updateCurrentSlide(html); return }
    debounceRef.current = setTimeout(() => {
      updateCurrentSlide(html)
      setPreviewSlideHtml(html)
    }, delay)
  }, [updateCurrentSlide])

  const handleCursorLine = useCallback((line: number) => {
    const iframe = previewRef.current?.getIframe()
    iframe?.contentWindow?.postMessage({ type: 'highlight-line', line }, '*')
  }, [])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // 预览区右键菜单：监听 iframe postMessage + 点击关闭
  useEffect(() => {
    const hide = () => setCtxMenu(null)
    let hideTimer: ReturnType<typeof setTimeout> | null = null
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'slide-nav') {
        const { slides, currentSlideIndex, setCurrentSlideIndex } = useAppStore.getState()
        const next = Math.max(0, Math.min(slides.length - 1, currentSlideIndex + e.data.d))
        setCurrentSlideIndex(next)
        // 通知 iframe 更新按钮状态
        setTimeout(() => {
          const iframe = previewRef.current?.getIframe()
          const { slides: s, currentSlideIndex: cur } = useAppStore.getState()
          iframe?.contentWindow?.postMessage({ type: 'slide-state', cur, total: s.length }, '*')
        }, 0)
        return
      }
      if (e.data?.type === 'iframe-contextmenu') {
        const rect = previewRef.current?.getIframeRect()
        const x = (rect?.left ?? 0) + e.data.x
        const y = (rect?.top ?? 0) + e.data.y
        const sel = e.data.sel ?? ''
        const elText = e.data.elText ?? ''
        if (sel || elText) {
          if (useAppStore.getState().previewHtml) return
          if (hideTimer) clearTimeout(hideTimer)
          setCtxMenu({ x, y, sel, elText })
          // 延迟注册 click 关闭，避免当前右键事件链触发
          hideTimer = setTimeout(() => window.addEventListener('click', hide, { once: true }), 100)
        }
      }
    }
    // 阻止 iframe 元素上的原生右键菜单
    const blockCtx = (e: MouseEvent) => {
      const iframe = previewRef.current?.getIframe()
      if (iframe && e.target === iframe) {
        e.preventDefault()
      }
    }
    window.addEventListener('message', onMsg)
    window.addEventListener('contextmenu', blockCtx, true)
    return () => {
      if (hideTimer) clearTimeout(hideTimer)
      window.removeEventListener('click', hide)
      window.removeEventListener('message', onMsg)
      window.removeEventListener('contextmenu', blockCtx, true)
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--atag-bg-dark)' }}>
      <TopBar />
      <SlideStrip />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 左侧：片段面板 + 代码编辑器 + AI助手 */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '50%', borderRight: '1px solid var(--atag-border)', overflow: 'hidden' }}>
          <SnippetPanel editorRef={editorRef} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <CodeEditor
              ref={editorRef}
              value={currentSlide?.html ?? ''}
              onChange={handleCodeChange}
              onQuoteToAI={(text) => aiRef.current?.appendContext(text)}
              onCursorLine={handleCursorLine}
            />
          </div>
          <AIAssistant
            ref={aiRef}
            editorRef={editorRef}
            getCurrentCode={() => useAppStore.getState().slides[useAppStore.getState().currentSlideIndex]?.html ?? ''}
          />
        </div>
        {/* 右侧：预览区 */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: '1px solid var(--atag-border)', background: 'var(--atag-bg-panel)', flexShrink: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--atag-text-muted)', userSelect: 'none' }}>
              刷新间隔
              <input type="number" value={refreshInterval}
                onChange={e => { const v = Number(e.target.value); setRefreshInterval(v); refreshIntervalRef.current = v }}
                style={{ width: 56, background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', borderRadius: 4, padding: '2px 6px', fontSize: 12, color: 'var(--atag-text)', outline: 'none', appearance: 'textfield' }} />
              s
            </label>
            <button onClick={() => {
                if (debounceRef.current) clearTimeout(debounceRef.current)
                const html = editorRef.current?.getValue() ?? useAppStore.getState().slides[useAppStore.getState().currentSlideIndex]?.html ?? ''
                updateCurrentSlide(html)
                setPreviewSlideHtml(html)
              }}
              style={{ padding: '2px 8px', borderRadius: 4, border: '1px solid var(--atag-border)', background: 'transparent', color: 'var(--atag-text-muted)', cursor: 'pointer', fontSize: 12 }}>刷新</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--atag-text-muted)', cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={enterAnim} onChange={e => setEnterAnim(e.target.checked)} style={{ cursor: 'pointer' }} />
              入场动画
            </label>
            <div style={{ width: 1, height: 16, background: 'var(--atag-border)', margin: '0 2px' }} />
            <button
              onClick={() => setPreviewHtml(buildPresentHtml(slides, globalCss, themeCSS, useAppStore.getState().projectName, currentSlideIndex))}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--atag-border)', background: 'transparent', color: 'var(--atag-text-muted)', cursor: 'pointer', fontSize: 12 }}
            ><Eye size={13} />从本页播放</button>
            <button
              onClick={() => setPreviewHtml(buildPresentHtml(slides, globalCss, themeCSS, useAppStore.getState().projectName, 0))}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--atag-border)', background: 'transparent', color: 'var(--atag-text-muted)', cursor: 'pointer', fontSize: 12 }}
            ><Play size={13} />从头播放</button>
            <div style={{ width: 1, height: 16, background: 'var(--atag-border)', margin: '0 2px' }} />
            {(['none', 'dark-tech', 'mechanical'] as const).map(id => (
              <button key={id} onClick={() => setTheme(id)}
                style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer', border: '1px solid ' + (currentTheme === id ? 'var(--atag-primary)' : 'var(--atag-border)'), background: currentTheme === id ? 'var(--atag-primary)' : 'transparent', color: currentTheme === id ? '#fff' : 'var(--atag-text-muted)' }}>
                {{ none: '原始', 'dark-tech': '暗黑', mechanical: '机械' }[id]}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {currentSlide && (
              <PreviewFrame ref={previewRef} slideHtml={previewSlideHtml} globalCss={globalCss} themeCSS={themeCSS} slideIndex={currentSlideIndex} slideCount={slides.length} enterAnim={enterAnim} />
            )}
          </div>
        </div>
      </div>

      {/* 演示模式全屏 */}
      {previewHtml && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#000' }}>
          <iframe
            srcDoc={previewHtml}
            sandbox="allow-scripts allow-same-origin"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="present"
          />
          {/* 关闭按钮：顶部居中 */}
          <button
            onClick={() => setPreviewHtml(null)}
            style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1001, padding: '6px 20px', borderRadius: 20, background: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: 13, backdropFilter: 'blur(8px)' }}
          >
            关闭
          </button>
        </div>
      )}

      {showAIPanel && <AIPanel />}

      {/* 预览区右键菜单 */}
      {ctxMenu && (
        <div
          ref={ctxMenuRef}
          style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, zIndex: 2000, background: 'var(--atag-bg-panel)', border: '1px solid var(--atag-border)', borderRadius: 8, padding: '4px 0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', minWidth: 160 }}
        >
          {[
            ...(ctxMenu.sel ? [{ label: '复制选中内容', action: () => navigator.clipboard.writeText(ctxMenu.sel) }] : []),
            { label: '复制元素文字', action: () => navigator.clipboard.writeText(ctxMenu.elText) },
            { label: '引用到 AI 助手', action: () => aiRef.current?.appendContext(ctxMenu.sel || ctxMenu.elText, !ctxMenu.sel) },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => { item.action(); setCtxMenu(null) }}
              style={{ display: 'block', width: '100%', padding: '7px 14px', background: 'none', border: 'none', color: 'var(--atag-text)', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >{item.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}
