import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { Layers, LayoutGrid } from 'lucide-react'

export default function LeftPanel() {
  const { editor, leftPanelTab, setLeftPanelTab } = useAppStore()
  const blocksRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    // 延迟渲染，确保编辑器完全初始化
    const timer = setTimeout(() => {
      try {
        if (blocksRef.current) {
          const blocksEl = editor.BlockManager.render([], { external: true })
          blocksRef.current.innerHTML = ''
          blocksRef.current.appendChild(blocksEl)
        }

        if (layersRef.current) {
          const layersEl = editor.LayerManager.render()
          layersRef.current.innerHTML = ''
          layersRef.current.appendChild(layersEl)
        }
      } catch (err) {
        console.error('Panel render error:', err)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [editor])

  return (
    <div className="w-56 bg-[var(--atag-bg-panel)] border-r border-[var(--atag-border)] flex flex-col shrink-0 overflow-hidden">
      {/* Tab 切换 */}
      <div className="flex border-b border-[var(--atag-border)]">
        <TabBtn
          active={leftPanelTab === 'blocks'}
          icon={<LayoutGrid size={14} />}
          label="组件"
          onClick={() => setLeftPanelTab('blocks')}
        />
        <TabBtn
          active={leftPanelTab === 'layers'}
          icon={<Layers size={14} />}
          label="图层"
          onClick={() => setLeftPanelTab('layers')}
        />
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        <div ref={blocksRef} style={{ display: leftPanelTab === 'blocks' ? 'block' : 'none' }} />
        <div ref={layersRef} style={{ display: leftPanelTab === 'layers' ? 'block' : 'none' }} />
      </div>
    </div>
  )
}

function TabBtn({ active, icon, label, onClick }: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs transition-colors ${
        active
          ? 'text-[var(--atag-primary)] border-b-2 border-[var(--atag-primary)]'
          : 'text-[var(--atag-text-muted)] hover:text-[var(--atag-text)]'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
