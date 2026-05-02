import { useState, useRef, useEffect } from 'react'
import { X, Send, Sparkles } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function AIChatPanel() {
  const { showAIChat, setShowAIChat, slides, setSlides } = useAppStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  if (!showAIChat) return null

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const apiKey = localStorage.getItem('atag-api-key') || ''
      const endpoint = localStorage.getItem('atag-api-endpoint') || 'https://api.openai.com/v1/chat/completions'
      const model = localStorage.getItem('atag-model') || 'gpt-4o'

      if (!apiKey) {
        setMessages(prev => [...prev, { role: 'assistant', content: '请先配置 API Key' }])
        setLoading(false)
        return
      }

      // 构建上下文：包含当前幻灯片信息
      const context = `当前有 ${slides.length} 页幻灯片。你可以帮助用户修改、优化幻灯片内容。`

      const response = await callAI(endpoint, apiKey, model, context, [...messages, { role: 'user', content: userMsg }])
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `错误: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="border rounded-2xl flex flex-col shadow-2xl"
        style={{ background: 'var(--atag-bg-panel)', borderColor: 'var(--atag-border)', width: 600, height: 700 }}>

        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--atag-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0066FF,#00D9FF)' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span className="text-base font-medium" style={{ color: 'var(--atag-text)' }}>AI 助手</span>
          </div>
          <button onClick={() => setShowAIChat(false)} style={{ color: 'var(--atag-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* 聊天区域 */}
        <div ref={chatRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="text-center text-sm" style={{ color: 'var(--atag-text-muted)', marginTop: '40%' }}>
              开始对话，我可以帮你修改和优化幻灯片
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%] px-4 py-2.5 rounded-lg text-sm"
                style={{
                  background: msg.role === 'user' ? 'linear-gradient(135deg,#0066FF,#00D9FF)' : 'var(--atag-bg-card)',
                  color: msg.role === 'user' ? '#fff' : 'var(--atag-text)',
                  border: msg.role === 'assistant' ? '1px solid var(--atag-border)' : 'none'
                }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-lg text-sm" style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)' }}>
                <span className="animate-pulse">思考中...</span>
              </div>
            </div>
          )}
        </div>

        {/* 输入框 */}
        <div className="px-6 py-4" style={{ borderTop: '1px solid var(--atag-border)' }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="输入消息..."
              className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', color: 'var(--atag-text)' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#0066FF,#00D9FF)' }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

async function callAI(endpoint: string, apiKey: string, model: string, system: string, messages: Message[]): Promise<string> {
  const isAnthropic = endpoint.includes('anthropic.com')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (isAnthropic) {
    headers['x-api-key'] = apiKey
    headers['anthropic-version'] = '2023-06-01'
  } else {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  const body = isAnthropic
    ? { model, max_tokens: 4096, system, messages }
    : { model, messages: [{ role: 'system', content: system }, ...messages] }

  const full = endpoint.endsWith('/chat/completions') ? endpoint : endpoint.replace(/\/$/, '') + '/chat/completions'
  headers['x-target'] = full

  const res = await fetch('/api-proxy', { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`API 错误 ${res.status}`)

  const data = await res.json()
  return isAnthropic ? data.content[0].text : data.choices[0].message.content
}
