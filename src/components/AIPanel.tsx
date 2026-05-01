import { useState, useRef } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { SYSTEM_PROMPT } from '../utils/slidePrompt'

const HINTS = [
  { label: '技术方案', text: '生成技术方案介绍演示，包含：封面、背景与痛点、解决方案、核心功能（卡片）、技术架构、实施步骤、预期收益。' },
  { label: '协议讲解', text: '生成技术协议或规范的教学演示，包含：封面、背景介绍、核心概念（卡片）、工作流程图、关键细节、应用场景。' },
  { label: '培训手册', text: '生成操作培训手册演示，包含：封面、培训目标、操作流程（步骤图）、关键操作说明、常见问题、注意事项。' },
  { label: '产品发布', text: '生成产品发布介绍演示，包含：封面（产品名+slogan）、产品亮点（3-4个核心特性卡片）、功能详解、技术规格、应用场景。' },
  { label: '项目汇报', text: '生成项目汇报演示，包含：封面、项目背景与目标、项目进展（时间线）、已完成成果、遇到的问题与解决方案、下一步计划。' },
]

async function callAI(endpoint: string, apiKey: string, model: string, system: string, user: string): Promise<string> {
  if (!endpoint.endsWith('/chat/completions') && !endpoint.includes('anthropic.com')) endpoint = endpoint.replace(/\/$/, '') + '/chat/completions'
  const isAnthropic = endpoint.includes('anthropic.com')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  let body: object

  if (isAnthropic) {
    headers['x-api-key'] = apiKey
    headers['anthropic-version'] = '2023-06-01'
    body = { model, max_tokens: 8192, system, messages: [{ role: 'user', content: user }] }
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`
    body = { model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }
  }

  const full = endpoint.endsWith('/chat/completions') ? endpoint : endpoint.replace(/\/$/, '') + '/chat/completions'
  headers['x-target'] = full
  const res = await fetch('/api-proxy', { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`API 错误 ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return isAnthropic ? data.content[0].text : data.choices[0].message.content
}

export default function AIPanel() {
  const { showAIPanel, setShowAIPanel, setSlides } = useAppStore()
  const [hintIdx, setHintIdx] = useState<number | null>(null)
  const [sysPrompt, setSysPrompt] = useState('')
  const [userContent, setUserContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [size, setSize] = useState({ w: 680, h: 520 })
  const panelRef = useRef<HTMLDivElement>(null)

  if (!showAIPanel) return null

  const handleHint = (i: number) => {
    setHintIdx(i)
    setSysPrompt(HINTS[i].text)
  }

  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX, startY = e.clientY
    const startW = size.w, startH = size.h
    const onMove = (ev: MouseEvent) => {
      setSize({ w: Math.max(400, startW + ev.clientX - startX), h: Math.max(360, startH + ev.clientY - startY) })
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleGenerate = async () => {
    const apiKey = localStorage.getItem('atag-api-key') || ''
    const apiEndpoint = localStorage.getItem('atag-api-endpoint') || 'https://api.openai.com/v1/chat/completions'
    const model = localStorage.getItem('atag-model') || 'gpt-4o'
    if (!apiKey) { setError('请先在顶栏 API 设置中配置 API Key'); return }
    if (!sysPrompt && !userContent) { setError('请填写生成指令或附加内容'); return }
    setError('')
    setLoading(true)
    const prompt = [sysPrompt, userContent].filter(Boolean).join('\n\n')
    try {
      const userMsg = prompt
      let html = await callAI(apiEndpoint, apiKey, model, SYSTEM_PROMPT, userMsg)
      html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()

      // 按 <div class="page" 分割，每段作为独立 slide
      const parts = html.split(/(?=<div\s[^>]*class="[^"]*\bpage\b)/)
        .map(s => s.trim()).filter(Boolean)

      const slides = parts.length > 0
        ? parts.map((part, i) => ({ id: crypto.randomUUID(), title: `第 ${i + 1} 页`, html: part }))
        : [{ id: crypto.randomUUID(), title: '第 1 页', html }]

      setSlides(slides)
      setShowAIPanel(false)
    } catch (err: any) {
      setError(err.message || '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <style>{`@keyframes atag-slide{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}`}</style>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div ref={panelRef} className="border rounded-2xl flex flex-col shadow-2xl relative"
        style={{ background: 'var(--atag-bg-panel)', borderColor: 'var(--atag-border)', width: size.w, height: size.h, minWidth: 400, minHeight: 360 }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: loading ? 'none' : '1px solid var(--atag-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0066FF,#00D9FF)' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span className="text-base font-medium" style={{ color: 'var(--atag-text)' }}>AI 文档生成</span>
          </div>
          <button onClick={() => setShowAIPanel(false)} style={{ color: 'var(--atag-text-muted)' }}><X size={20} /></button>
        </div>
        {loading && (
          <div style={{ height: 3, background: 'var(--atag-border)', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ height: '100%', width: '40%', background: 'linear-gradient(90deg,#0066FF,#00D9FF)', animation: 'atag-slide 1.2s ease-in-out infinite', borderRadius: 2 }} />
          </div>
        )}
        {!loading && <div style={{ height: 1, background: 'var(--atag-border)', flexShrink: 0 }} />}

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {/* 预设按钮 */}
          <div className="flex gap-2 flex-wrap">
            {HINTS.map((h, i) => (
              <button key={i} onClick={() => handleHint(i)}
                className="text-sm px-4 py-1.5 rounded-lg border font-medium transition-all"
                style={{
                  borderColor: hintIdx === i ? 'var(--atag-primary)' : 'var(--atag-border)',
                  background: hintIdx === i ? 'rgba(0,102,255,0.15)' : 'var(--atag-bg-card)',
                  color: hintIdx === i ? 'var(--atag-primary)' : 'var(--atag-text)',
                }}>
                {h.label}
              </button>
            ))}
          </div>

          {/* 生成指令 */}
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--atag-text-muted)' }}>生成指令</label>
            <textarea rows={4} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-y"
              style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', color: 'var(--atag-text)' }}
              placeholder="选择预设或手动填写生成指令..."
              value={sysPrompt} onChange={e => { setSysPrompt(e.target.value); setHintIdx(null) }} />
          </div>

          {/* 附加内容 */}
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: 'var(--atag-text-muted)' }}>附加内容 <span style={{ fontWeight: 400 }}>（可选）</span></label>
            <textarea rows={3} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-y"
              style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', color: 'var(--atag-text)' }}
              placeholder="补充具体主题、关键词、参考文本..."
              value={userContent} onChange={e => setUserContent(e.target.value)} />
          </div>

          {error && <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>{error}</div>}
        </div>

        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid var(--atag-border)' }}>
          <button onClick={() => setShowAIPanel(false)}
            className="text-sm px-5 py-2 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--atag-border)', color: 'var(--atag-text-muted)' }}>
            取消
          </button>
          <button onClick={handleGenerate} disabled={loading}
            className="flex items-center gap-2 text-sm px-6 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#0066FF,#00D9FF)' }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {loading ? '生成中...' : '开始生成'}
          </button>
        </div>
        {/* 右下角拖拽手柄 */}
        <div onMouseDown={onResizeStart}
          style={{ position: 'absolute', right: 0, bottom: 0, width: 16, height: 16, cursor: 'nwse-resize', zIndex: 10 }} />
      </div>
    </div>
    </>
  )
}
