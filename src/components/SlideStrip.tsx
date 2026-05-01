import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { buildSlideHtml } from '../utils/buildSlideHtml'
import { getThemeCSS } from '../themes/themeCSS'

export default function SlideStrip() {
  const { slides, currentSlideIndex, currentTheme, globalCss, setCurrentSlideIndex, addSlide, deleteSlide, moveSlide, insertSlide } = useAppStore()
  const themeCSS = getThemeCSS(currentTheme)

  // 右键菜单
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; index: number } | null>(null)

  // 拖拽状态：insertBefore 表示插入到第几个之前（0~slides.length）
  const dragIndex = useRef<number | null>(null)
  const [insertBefore, setInsertBefore] = useState<number | null>(null)

  const getInsertIndex = (e: React.DragEvent, i: number) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    return e.clientX < rect.left + rect.width / 2 ? i : i + 1
  }

  const handleContextMenu = (e: React.MouseEvent, i: number) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY, index: i })
    setTimeout(() => window.addEventListener('click', () => setCtxMenu(null), { once: true }), 0)
  }

  const copyToSide = (i: number, offset: 1 | -1) => {
    const slide = slides[i]
    const at = i + (offset === 1 ? 1 : 0)
    insertSlide({ id: crypto.randomUUID(), title: `第 ${at + 1} 页`, html: slide.html }, at)
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 overflow-x-auto shrink-0"
      style={{ background: 'var(--atag-bg-panel)', borderBottom: '1px solid var(--atag-border)', height: '100px' }}
      onClick={() => ctxMenu && setCtxMenu(null)}
    >
      {slides.map((slide, i) => (
        <div key={slide.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {/* 插入线：在此缩略图左侧 */}
          {insertBefore === i && dragIndex.current !== i && dragIndex.current !== i - 1 && (
            <div style={{ position: 'absolute', left: -6, top: 0, bottom: 0, width: 3, background: 'var(--atag-primary)', borderRadius: 2, zIndex: 10 }} />
          )}
          <div
            onClick={() => setCurrentSlideIndex(i)}
            onContextMenu={(e) => handleContextMenu(e, i)}
            draggable
            onDragStart={() => { dragIndex.current = i }}
            onDragOver={(e) => { e.preventDefault(); setInsertBefore(getInsertIndex(e, i)) }}
            onDragLeave={() => setInsertBefore(null)}
            onDrop={(e) => {
              if (dragIndex.current !== null) {
                const to = getInsertIndex(e, i)
                const from = dragIndex.current
                if (to !== from && to !== from + 1) moveSlide(from, to > from ? to - 1 : to)
              }
              dragIndex.current = null
              setInsertBefore(null)
            }}
            onDragEnd={() => { dragIndex.current = null; setInsertBefore(null) }}
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
              第 {i + 1} 页
            </div>
          </div>
          {/* 插入线：最后一个缩略图右侧 */}
          {i === slides.length - 1 && insertBefore === slides.length && dragIndex.current !== i && (
            <div style={{ position: 'absolute', right: -6, top: 0, bottom: 0, width: 3, background: 'var(--atag-primary)', borderRadius: 2, zIndex: 10 }} />
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

      {ctxMenu && (
        <div
          style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, zIndex: 3000, background: 'var(--atag-bg-panel)', border: '1px solid var(--atag-border)', borderRadius: 8, padding: '4px 0', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', minWidth: 140 }}
          onClick={e => e.stopPropagation()}
        >
          {[
            { label: '复制到右边', action: () => copyToSide(ctxMenu.index, 1) },
            { label: '复制到左边', action: () => copyToSide(ctxMenu.index, -1) },
            { label: '删除', action: () => { if (slides.length > 1) deleteSlide(slides[ctxMenu.index].id) }, danger: true },
          ].map(item => (
            <button key={item.label} onClick={() => { item.action(); setCtxMenu(null) }}
              style={{ display: 'block', width: '100%', padding: '7px 14px', background: 'none', border: 'none', color: item.danger ? '#f87171' : 'var(--atag-text)', fontSize: 13, textAlign: 'left', cursor: slides.length <= 1 && item.danger ? 'not-allowed' : 'pointer', opacity: slides.length <= 1 && item.danger ? 0.4 : 1 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >{item.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}
