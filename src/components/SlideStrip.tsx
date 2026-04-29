import { useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { buildSlideHtml } from '../utils/buildSlideHtml'
import { getThemeCSS } from '../themes/themeCSS'

export default function SlideStrip() {
  const { slides, currentSlideIndex, currentTheme, globalCss, setCurrentSlideIndex, addSlide, deleteSlide } = useAppStore()
  const themeCSS = getThemeCSS(currentTheme)
  const stripRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={stripRef}
      className="flex items-center gap-2 px-3 py-2 overflow-x-auto shrink-0"
      style={{ background: 'var(--atag-bg-panel)', borderBottom: '1px solid var(--atag-border)', height: '100px' }}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          onClick={() => setCurrentSlideIndex(i)}
          className="relative shrink-0 cursor-pointer rounded-lg overflow-hidden"
          style={{
            width: '120px', height: '72px',
            border: i === currentSlideIndex ? '2px solid var(--atag-primary)' : '2px solid var(--atag-border)',
            background: '#0a0e1a',
          }}
        >
          <iframe
            srcDoc={buildSlideHtml(slide.html, globalCss, themeCSS)}
            sandbox="allow-scripts allow-same-origin"
            style={{ width: '960px', height: '540px', border: 'none', transform: 'scale(0.125)', transformOrigin: '0 0', pointerEvents: 'none' }}
            title={slide.title}
          />
          <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 text-[9px] text-center truncate"
            style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.7)' }}>
            {i + 1}. {slide.title}
          </div>
          {slides.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id) }}
              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(255,50,50,0.8)' }}
            >
              <X size={10} color="#fff" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addSlide}
        className="shrink-0 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
        style={{ width: '40px', height: '72px', border: '2px dashed var(--atag-border)', color: 'var(--atag-text-muted)' }}
        title="新增页面"
      >
        <Plus size={18} />
      </button>
    </div>
  )
}
