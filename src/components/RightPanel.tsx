import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { Paintbrush, Zap } from 'lucide-react'

export default function RightPanel() {
  const { editor, rightPanelTab, setRightPanelTab } = useAppStore()
  const stylesRef = useRef<HTMLDivElement>(null)

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
      } catch (err) {
        console.error('Panel render error:', err)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [editor])

  return (
    <div className="w-72 bg-[var(--atag-bg-panel)] border-l border-[var(--atag-border)] flex flex-col shrink-0 overflow-hidden">
      {/* Tab 切换 */}
      <div className="flex border-b border-[var(--atag-border)]">
        <TabBtn
          active={rightPanelTab === 'style'}
          icon={<Paintbrush size={16} />}
          label="样式"
          onClick={() => setRightPanelTab('style')}
        />
        <TabBtn
          active={rightPanelTab === 'animation'}
          icon={<Zap size={16} />}
          label="动画"
          onClick={() => setRightPanelTab('animation')}
        />
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-3">
        <div ref={stylesRef} style={{ visibility: rightPanelTab === 'style' ? 'visible' : 'hidden', height: rightPanelTab === 'style' ? 'auto' : 0, overflow: 'hidden' }} />
        {rightPanelTab === 'animation' && <AnimationPanel />}
      </div>
    </div>
  )
}

function AnimationPanel() {
  const { editor, currentSlideIndex, slides } = useAppStore()
  const [selectedEl, setSelectedEl] = useState<any>(null)
  const [animationProps, setAnimationProps] = useState({
    duration: '0.6s',
    delay: '0s',
    timingFunction: 'ease',
    iterationCount: '1',
  })

  useEffect(() => {
    if (!editor) return
    const handler = () => {
      const sel = editor.getSelected()
      setSelectedEl(sel)
      if (sel) {
        // 读取元素的 animation 样式
        const style = sel.getStyle()
        const animStr = style.animation || style['animation-name'] || ''
        // 简单解析 animation 属性（如 "fadeUp 0.6s 0.1s ease"）
        const parts = animStr.split(/\s+/)
        if (parts.length >= 2) {
          setAnimationProps({
            duration: parts[1] || '0.6s',
            delay: parts[2] || '0s',
            timingFunction: parts[3] || 'ease',
            iterationCount: parts[4] || '1',
          })
        }
      }
    }
    editor.on('component:selected', handler)
    return () => editor.off('component:selected', handler)
  }, [editor])

  const updateAnimation = (key: string, value: string) => {
    if (!selectedEl) return
    const newProps = { ...animationProps, [key]: value }
    setAnimationProps(newProps)

    // 重新构建 animation 属性
    const style = selectedEl.getStyle()
    const animName = (style.animation || '').split(/\s+/)[0] || 'fadeIn'
    const newAnim = `${animName} ${newProps.duration} ${newProps.delay} ${newProps.timingFunction} ${newProps.iterationCount}`
    selectedEl.setStyle({ animation: newAnim })
  }

  const replayAnimation = () => {
    if (!selectedEl || !editor) return
    const el = selectedEl.getEl() as HTMLElement
    if (!el) return
    // 强制重新触发：克隆节点替换自身
    const parent = el.parentNode
    if (!parent) return
    const clone = el.cloneNode(true) as HTMLElement
    parent.replaceChild(clone, el)
    // 更新 selectedEl 引用指向新节点（GrapesJS 内部仍持有原引用，视觉上已重播）
  }

  if (!selectedEl) {
    return (
      <div className="text-sm text-[var(--atag-text-muted)] text-center py-8">
        选中元素后编辑动画参数
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-[var(--atag-text-muted)] mb-2">
        当前元素：<span className="text-[var(--atag-text)]">{selectedEl.getName() || selectedEl.get('tagName')}</span>
      </div>

      <div>
        <label className="block text-xs text-[var(--atag-text-muted)] mb-1">时长 (duration)</label>
        <input
          type="text"
          value={animationProps.duration}
          onChange={(e) => updateAnimation('duration', e.target.value)}
          className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded px-2 py-1.5 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
          placeholder="0.6s"
        />
      </div>

      <div>
        <label className="block text-xs text-[var(--atag-text-muted)] mb-1">延迟 (delay)</label>
        <input
          type="text"
          value={animationProps.delay}
          onChange={(e) => updateAnimation('delay', e.target.value)}
          className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded px-2 py-1.5 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
          placeholder="0s"
        />
      </div>

      <div>
        <label className="block text-xs text-[var(--atag-text-muted)] mb-1">缓动函数 (timing)</label>
        <select
          value={animationProps.timingFunction}
          onChange={(e) => updateAnimation('timingFunction', e.target.value)}
          className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded px-2 py-1.5 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)] cursor-pointer"
        >
          <option value="ease">缓入缓出 (ease)</option>
          <option value="ease-in">加速 (ease-in)</option>
          <option value="ease-out">减速 (ease-out)</option>
          <option value="ease-in-out">慢快慢 (ease-in-out)</option>
          <option value="linear">匀速 (linear)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-[var(--atag-text-muted)] mb-1">循环次数</label>
        <input
          type="text"
          value={animationProps.iterationCount}
          onChange={(e) => updateAnimation('iterationCount', e.target.value)}
          className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded px-2 py-1.5 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
          placeholder="1 或 infinite"
        />
      </div>

      <button
        onClick={replayAnimation}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--atag-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Zap size={14} />
        重播动画
      </button>

      <button
        onClick={() => {
          if (!selectedEl) return
          selectedEl.setStyle({ animation: '' })
          setAnimationProps({ duration: '0.6s', delay: '0s', timingFunction: 'ease', iterationCount: '1' })
        }}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[var(--atag-border)] text-[var(--atag-text-muted)] text-sm hover:text-[var(--atag-text)] transition-colors"
      >
        取消动画
      </button>

      <div className="pt-2 border-t border-[var(--atag-border)]">
        <p className="text-xs text-[var(--atag-text-muted)] mb-2">快速应用预设动画</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '淡入上移', anim: 'fadeInUp 0.6s ease both' },
            { label: '淡入', anim: 'fadeIn 0.6s ease both' },
            { label: '左滑入', anim: 'slideInLeft 0.6s ease both' },
            { label: '右滑入', anim: 'slideInRight 0.6s ease both' },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                selectedEl.setStyle({ animation: preset.anim })
                const parts = preset.anim.split(/\s+/)
                setAnimationProps({
                  duration: parts[1] || '0.6s',
                  delay: '0s',
                  timingFunction: parts[2] || 'ease',
                  iterationCount: '1',
                })
              }}
              className="text-xs px-2 py-1.5 rounded bg-[var(--atag-bg-card)] border border-[var(--atag-border)] text-[var(--atag-text)] hover:border-[var(--atag-primary)] transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
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
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
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
