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
import { buildSlideHtml, buildPresentHtml } from './utils/buildSlideHtml'

export default function App() {
  const { slides, currentSlideIndex, currentTheme, globalCss, updateCurrentSlide, setPreviewHtml, previewHtml, showAIPanel } = useAppStore()
  const editorRef = useRef<CodeEditorHandle>(null)
  const aiRef = useRef<AIAssistantHandle>(null)
  const previewRef = useRef<PreviewFrameHandle>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; sel: string; elText: string } | null>(null)
  const ctxMenuRef = useRef<HTMLDivElement>(null)

  const currentSlide = slides[currentSlideIndex]
  const themeCSS = getThemeCSS(currentTheme)

  const handleCodeChange = useCallback((html: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => updateCurrentSlide(html), 300)
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
            <button
              onClick={() => currentSlide && setPreviewHtml(buildSlideHtml(currentSlide.html, globalCss, themeCSS))}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--atag-border)', background: 'transparent', color: 'var(--atag-text-muted)', cursor: 'pointer', fontSize: 12 }}
            ><Eye size={13} />预览本页</button>
            <button
              onClick={() => setPreviewHtml(buildPresentHtml(slides, globalCss, themeCSS, useAppStore.getState().projectName))}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--atag-border)', background: 'transparent', color: 'var(--atag-text-muted)', cursor: 'pointer', fontSize: 12 }}
            ><Play size={13} />预览全文</button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {currentSlide && (
              <PreviewFrame ref={previewRef} slideHtml={currentSlide.html} globalCss={globalCss} themeCSS={themeCSS} />
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
