import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/useAppStore'
import { Paintbrush, Settings, Zap } from 'lucide-react'

export default function RightPanel() {
  const { editor, rightPanelTab, setRightPanelTab } = useAppStore()
  const stylesRef = useRef<HTMLDivElement>(null)
  const traitsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    // 延迟渲染，确保编辑器完全初始化
    const timer = setTimeout(() => {
      try {
        if (stylesRef.current) {
          const smEl = editor.StyleManager.render()
          stylesRef.current.innerHTML = ''
          stylesRef.current.appendChild(smEl)
        }

        if (traitsRef.current) {
          const tmEl = editor.TraitManager.render()
          traitsRef.current.innerHTML = ''
          traitsRef.current.appendChild(tmEl)
        }
      } catch (err) {
        console.error('Panel render error:', err)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [editor])

  return (
    <div className="w-60 bg-[var(--atag-bg-panel)] border-l border-[var(--atag-border)] flex flex-col shrink-0 overflow-hidden">
      {/* Tab 切换 */}
      <div className="flex border-b border-[var(--atag-border)]">
        <TabBtn
          active={rightPanelTab === 'style'}
          icon={<Paintbrush size={14} />}
          label="样式"
          onClick={() => setRightPanelTab('style')}
        />
        <TabBtn
          active={rightPanelTab === 'traits'}
          icon={<Settings size={14} />}
          label="属性"
          onClick={() => setRightPanelTab('traits')}
        />
        <TabBtn
          active={rightPanelTab === 'animation'}
          icon={<Zap size={14} />}
          label="动画"
          onClick={() => setRightPanelTab('animation')}
        />
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-2">
        <div ref={stylesRef} style={{ display: rightPanelTab === 'style' ? 'block' : 'none' }} />
        <div ref={traitsRef} style={{ display: rightPanelTab === 'traits' ? 'block' : 'none' }} />
        {rightPanelTab === 'animation' && <AnimationPanel />}
      </div>
    </div>
  )
}

function AnimationPanel() {
  const { editor } = useAppStore()

  const animations = [
    { label: '淡入上移', className: 'animate-fadeInUp' },
    { label: '淡入', className: 'animate-fadeIn' },
    { label: '左侧滑入', className: 'animate-slideInLeft' },
    { label: '右侧滑入', className: 'animate-slideInRight' },
  ]

  const applyAnimation = (cls: string) => {
    const selected = editor?.getSelected()
    if (!selected) return
    // 移除已有动画类
    animations.forEach((a) => selected.removeClass(a.className))
    selected.addClass(cls)
  }

  const removeAnimation = () => {
    const selected = editor?.getSelected()
    if (!selected) return
    animations.forEach((a) => selected.removeClass(a.className))
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--atag-text-muted)] mb-3">选中元素后，点击应用入场动画</p>
      {animations.map((a) => (
        <button
          key={a.className}
          onClick={() => applyAnimation(a.className)}
          className="w-full text-left text-xs px-3 py-2 rounded-lg bg-[var(--atag-bg-card)] border border-[var(--atag-border)] text-[var(--atag-text)] hover:border-[var(--atag-primary)] transition-colors"
        >
          {a.label}
        </button>
      ))}
      <button
        onClick={removeAnimation}
        className="w-full text-left text-xs px-3 py-2 rounded-lg bg-transparent border border-[var(--atag-border)] text-[var(--atag-text-muted)] hover:text-red-400 hover:border-red-400/50 transition-colors mt-2"
      >
        移除动画
      </button>
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
