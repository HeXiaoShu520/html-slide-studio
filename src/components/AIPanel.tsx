import { useState, useRef, useEffect } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { SYSTEM_PROMPT } from '../utils/slidePrompt'

type Message = { role: 'user' | 'assistant'; content: string }

const HINTS = [
  { label: '技术方案', text: '生成技术方案介绍演示，包含：封面、背景与痛点、解决方案、核心功能（卡片）、技术架构、实施步骤、预期收益。' },
  { label: '协议讲解', text: '生成技术协议或规范的教学演示，包含：封面、背景介绍、核心概念（卡片）、工作流程图、关键细节、应用场景。' },
  { label: '培训手册', text: '生成操作培训手册演示，包含：封面、培训目标、操作流程（步骤图）、关键操作说明、常见问题、注意事项。' },
  { label: '产品发布', text: '生成产品发布介绍演示，包含：封面（产品名+slogan）、产品亮点（3-4个核心特性卡片）、功能详解、技术规格、应用场景。' },
  { label: '项目汇报', text: '生成项目汇报演示，包含：封面、项目背景与目标、项目进展（时间线）、已完成成果、遇到的问题与解决方案、下一步计划。' },
]

async function callAI(endpoint: string, apiKey: string, model: string, apiType: string, system: string, messages: Message[]): Promise<string> {
  const isAnthropic = apiType === 'anthropic'
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  let body: object

  if (isAnthropic) {
    headers['x-api-key'] = apiKey
    headers['anthropic-version'] = '2023-06-01'
    body = { model, max_tokens: 8192, system, messages }
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`
    body = { model, messages: [{ role: 'system', content: system }, ...messages] }
  }

  const full = endpoint.endsWith('/chat/completions') ? endpoint : endpoint.replace(/\/$/, '') + '/chat/completions'
  headers['x-target'] = full
  const res = await fetch('/api-proxy', { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`API 错误 ${res.status}: ${await res.text()}`)
  const data = await res.json()
  console.log('[AIPanel callAI] 原始响应:', data)
  console.log('[AIPanel callAI] choices[0]:', data.choices?.[0])

  // 兼容多种返回格式
  if (isAnthropic && data.content?.[0]?.text) {
    return data.content[0].text
  }
  if (data.choices?.[0]?.message?.content !== undefined) {
    return data.choices[0].message.content
  }
  if (data.choices?.[0]?.text !== undefined) {
    return data.choices[0].text
  }
  if (data.message?.content !== undefined) {
    return data.message.content
  }
  if (data.text !== undefined) {
    return data.text
  }
  if (data.content !== undefined) {
    return typeof data.content === 'string' ? data.content : data.content[0]?.text || ''
  }

  console.error('[AIPanel callAI] 无法解析响应格式:', data)
  throw new Error('无法解析 API 响应格式')
}

export default function AIPanel() {
  const { showAIPanel, setShowAIPanel, setSlides, slides, currentSlideIndex } = useAppStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [size, setSize] = useState({ w: 680, h: 600 })
  const panelRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [result])

  if (!showAIPanel) return null

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

  const parseAndLoadHtml = (text: string) => {
    const { setSlides, setGlobalCss, setTheme } = useAppStore.getState()

    // 提取全局样式
    const headMatch = text.match(/<head[\s\S]*?<\/head>/i)
    const headStyles = headMatch
      ? [...headMatch[0].matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n')
      : ''
    if (headStyles.trim()) setGlobalCss(headStyles)

    // 剔除导航块
    const stripNav = (s: string) =>
      s.replace(/<!--\s*SLIDE-NAV-BEGIN\s*-->[\s\S]*?<!--\s*SLIDE-NAV-END\s*-->/gi, '')
       .replace(/<div class="pnav">[\s\S]*?<\/div>/g, '')
       .replace(/<div class="pc"[^>]*>[\s\S]*?<\/div>/g, '')
       .replace(/<script[^>]*>[\s\S]*?querySelectorAll\('\.page'\)[\s\S]*?<\/script>/gi, '')

    // 按 <!-- PAGE --> 分隔
    const segments = text.split(/<!--\s*PAGE\s*-->/)
      .map(s => {
        s = s.replace(/^[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*$/i, '')
        return stripNav(s).trim()
      })
      .filter(s => /class=["'][^"']*\bpage\b/.test(s))

    if (segments.length > 0) {
      setSlides(segments.map((html, i) => ({ id: crypto.randomUUID(), title: `第 ${i + 1} 页`, html })))
      setTheme('none')
      console.log('[AIPanel] 加载成功:', segments.length, '页')
    } else {
      console.warn('[AIPanel] 未找到有效页面')
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const apiKey = localStorage.getItem('atag-api-key') || ''
    const apiEndpoint = localStorage.getItem('atag-api-endpoint') || 'https://api.openai.com/v1/chat/completions'
    const model = localStorage.getItem('atag-model') || 'gpt-4o'
    const apiType = localStorage.getItem('atag-api-type') || 'openai'
    if (!apiKey) { setError('请先配置 API Key'); return }

    const userMsg = input.trim()
    setInput('')
    setError('')
    setLoading(true)

    console.log('=== AI 生成助手 - 请求开始 ===')
    console.log('用户输入:', userMsg)
    console.log('系统提示词 (完整):\n', SYSTEM_PROMPT)
    console.log('API 配置:', { endpoint: apiEndpoint, model, apiType })

    try {
      const response = await callAI(apiEndpoint, apiKey, model, apiType, SYSTEM_PROMPT, [{ role: 'user', content: userMsg }])
      console.log('=== AI 响应 ===')
      console.log('响应内容:', response)
      console.log('响应长度:', response.length)
      setResult(response)

      // 解析 HTML 并加载到工程
      parseAndLoadHtml(response)
    } catch (err: any) {
      console.error('=== AI 请求失败 ===', err)
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

        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--atag-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0066FF,#00D9FF)' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span className="text-base font-medium" style={{ color: 'var(--atag-text)' }}>AI 生成助手</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAIPanel(false)} style={{ color: 'var(--atag-text-muted)' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 结果区域 */}
        <div ref={chatRef} className="flex-1 overflow-y-auto px-6 py-4">
          {!result && !loading && (
            <div className="text-center text-sm" style={{ color: 'var(--atag-text-muted)', marginTop: '30%' }}>
              输入需求，一键生成完整 PPT
            </div>
          )}
          {result && (
            <div className="px-3 py-2 rounded-lg text-sm whitespace-pre-wrap"
              style={{ background: 'var(--atag-bg-card)', color: 'var(--atag-text)', border: '1px solid var(--atag-border)' }}>
              {result}
            </div>
          )}
          {loading && (
            <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)' }}>
              <Loader2 size={14} className="animate-spin inline mr-1" />生成中...
            </div>
          )}
        </div>

        {/* 底部输入区 */}
        <div className="px-6 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--atag-border)' }}>
          {error && <div className="px-2 py-1.5 rounded text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>{error}</div>}

          {/* 输入框 */}
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="输入消息... (Shift+Enter 换行)"
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', color: 'var(--atag-text)' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-4 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#0066FF,#00D9FF)' }}>
              <Sparkles size={16} />
            </button>
          </div>
        </div>
        {/* 右下角拖拽手柄 */}
        <div onMouseDown={onResizeStart}
          style={{ position: 'absolute', right: 0, bottom: 0, width: 16, height: 16, cursor: 'nwse-resize', zIndex: 10 }} />
      </div>
    </div>
    </>
  )
}
