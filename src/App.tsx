import { useEffect } from 'react'
import TopBar from './components/TopBar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import AIPanel from './components/AIPanel'
import GrapesEditor from './editor/GrapesEditor'
import { useAppStore } from './store/useAppStore'

export default function App() {
  const { previewHtml, setPreviewHtml } = useAppStore()

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data === 'close-preview') setPreviewHtml(null)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden relative">
        <LeftPanel />
        <GrapesEditor />
        <RightPanel />
        {previewHtml && (
          <div className="absolute inset-0 z-50 flex flex-col bg-black">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--atag-bg-panel)] border-b border-[var(--atag-border)] shrink-0">
              <span className="text-xs text-[var(--atag-text-muted)]">预览 / 演示</span>
              <button
                className="text-xs text-[var(--atag-text-muted)] hover:text-[var(--atag-text)] px-2 py-1 rounded hover:bg-[rgba(255,255,255,0.05)]"
                onClick={() => setPreviewHtml(null)}
              >
                关闭 ✕
              </button>
            </div>
            <iframe
              className="flex-1 w-full border-none"
              srcDoc={previewHtml}
              sandbox="allow-scripts"
            />
          </div>
        )}
      </div>
      <AIPanel />
    </div>
  )
}
