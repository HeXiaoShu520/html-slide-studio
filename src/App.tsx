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
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; text: string } | null>(null)

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
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'iframe-contextmenu') {
        const rect = previewRef.current?.getIframeRect()
        const x = (rect?.left ?? 0) + e.data.x
        const y = (rect?.top ?? 0) + e.data.y
        const text = e.data.sel || e.data.text
        if (text) setCtxMenu({ x, y, text })
      }
    }
    // 阻止 iframe 元素上的原生右键菜单
    const blockCtx = (e: MouseEvent) => {
      const iframe = previewRef.current?.getIframe()
      if (iframe && (e.target === iframe || iframe.contains(e.target as Node))) {
        e.preventDefault()
      }
    }
    window.addEventListener('click', hide)
    window.addEventListener('message', onMsg)
    window.addEventListener('contextmenu', blockCtx, true)
    return () => {
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
            ><Play size={13} />播放全文</button>
            <button
              onClick={() => currentSlide && aiRef.current?.appendContext('当前页面HTML：\n' + currentSlide.html)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 6, border: '1px solid var(--atag-border)', background: 'transparent', color: 'var(--atag-text-muted)', cursor: 'pointer', fontSize: 12, marginLeft: 'auto' }}
            >引用当前页</button>
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
          onClick={e => e.stopPropagation()}
          style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, zIndex: 2000, background: 'var(--atag-bg-panel)', border: '1px solid var(--atag-border)', borderRadius: 8, padding: '4px 0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', minWidth: 160 }}
        >
          <button
            onClick={() => { aiRef.current?.appendContext(ctxMenu.text); setCtxMenu(null) }}
            style={{ display: 'block', width: '100%', padding: '7px 14px', background: 'none', border: 'none', color: 'var(--atag-text)', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            引用到 AI 助手
          </button>
        </div>
      )}
    </div>
  )
}
