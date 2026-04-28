import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { Layers, LayoutGrid, Film, Plus, Trash2 } from 'lucide-react'
import { getThemeCSS } from '../themes/themeCSS'

export default function LeftPanel() {
  const { editor, leftPanelTab, setLeftPanelTab, slides, currentSlideIndex, setCurrentSlideIndex, addSlide, deleteSlide, currentTheme, globalCss } = useAppStore()
  const blocksRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return
    const timer = setTimeout(() => {
      try {
        if (blocksRef.current) {
          const blocksEl = editor.BlockManager.render()
          if (blocksEl) { blocksRef.current.innerHTML = ''; blocksRef.current.appendChild(blocksEl) }
        }
        if (layersRef.current) {
          const layersEl = editor.LayerManager.render()
          if (layersEl) { layersRef.current.innerHTML = ''; layersRef.current.appendChild(layersEl) }
        }
      } catch (err) { console.error('Panel render error:', err) }
    }, 100)
    return () => clearTimeout(timer)
  }, [editor])

  const themeCSS = getThemeCSS(currentTheme)

  return (
    <div className="w-64 bg-[var(--atag-bg-panel)] border-r border-[var(--atag-border)] flex flex-col shrink-0 overflow-hidden">
      <div className="flex border-b border-[var(--atag-border)]">
        <TabBtn active={leftPanelTab === 'slides'} icon={<Film size={15} />} label="幻灯片" onClick={() => setLeftPanelTab('slides')} />
        <TabBtn active={leftPanelTab === 'blocks'} icon={<LayoutGrid size={15} />} label="组件" onClick={() => setLeftPanelTab('blocks')} />
        <TabBtn active={leftPanelTab === 'layers'} icon={<Layers size={15} />} label="图层" onClick={() => setLeftPanelTab('layers')} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 幻灯片列表 */}
        <div style={{ display: leftPanelTab === 'slides' ? 'flex' : 'none' }} className="flex-col gap-2 p-2">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${i === currentSlideIndex ? 'border-[var(--atag-primary)]' : 'border-transparent hover:border-[rgba(255,255,255,0.2)]'}`}
              onClick={() => setCurrentSlideIndex(i)}
            >
              {/* 缩略图 */}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  srcDoc={`<!DOCTYPE html><html><head><style>*{margin:0;box-sizing:border-box}body{transform-origin:top left;transform:scale(0.18);width:556%;height:556%;overflow:hidden;background:var(--bg-main)}${themeCSS}${globalCss}${slide.css}</style></head><body>${slide.html}</body></html>`}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                  sandbox="allow-same-origin"
                />
              </div>
              {/* 序号 */}
              <div className="absolute bottom-1 left-1.5 text-xs text-white/50">{i + 1}</div>
              {/* 删除按钮 */}
              {slides.length > 1 && (
                <button
                  className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-5 h-5 rounded bg-black/60 text-white/70 hover:text-red-400"
                  onClick={(e) => { e.stopPropagation(); deleteSlide(i) }}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}
          <button
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-dashed border-[var(--atag-border)] text-xs text-[var(--atag-text-muted)] hover:text-[var(--atag-text)] hover:border-[var(--atag-primary)] transition-colors"
            onClick={addSlide}
          >
            <Plus size={14} /> 新建幻灯片
          </button>
        </div>

        <div ref={blocksRef} style={{ display: leftPanelTab === 'blocks' ? 'block' : 'none' }} />
        <div ref={layersRef} style={{ display: leftPanelTab === 'layers' ? 'block' : 'none' }} />
      </div>
    </div>
  )
}

function TabBtn({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1 py-3 text-xs transition-colors ${active ? 'text-[var(--atag-primary)] border-b-2 border-[var(--atag-primary)]' : 'text-[var(--atag-text-muted)] hover:text-[var(--atag-text)]'}`}
    >
      {icon}{label}
    </button>
  )
}
