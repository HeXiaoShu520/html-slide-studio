import { useEffect } from 'react'
import TopBar from './components/TopBar'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'
import AIPanel from './components/AIPanel'
import AIAssistant from './components/AIAssistant'
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
            <button
              className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-white/20 text-white text-sm hover:bg-black/80 backdrop-blur-sm"
              onClick={() => setPreviewHtml(null)}
            >
              ✕ 关闭预览
            </button>
            <iframe
              className="flex-1 w-full border-none"
              srcDoc={previewHtml}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}
      </div>
      <AIPanel />
      <AIAssistant />
    </div>
  )
}
