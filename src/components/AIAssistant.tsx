import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2, Sparkles, Settings, FileText, Square, Layers } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type ContextMode = 'none' | 'element' | 'page' | 'all'

export default function AIAssistant() {
  const { editor } = useAppStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [contextMode, setContextMode] = useState<ContextMode>('element')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('atag-api-key') || '')
  const [apiEndpoint, setApiEndpoint] = useState(() => localStorage.getItem('atag-api-endpoint') || 'https://api.openai.com/v1/chat/completions')
  const [model, setModel] = useState(() => localStorage.getItem('atag-model') || 'gpt-4o')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveSettings = () => {
    localStorage.setItem('atag-api-key', apiKey)
    localStorage.setItem('atag-api-endpoint', apiEndpoint)
    localStorage.setItem('atag-model', model)
  }

  useEffect(() => {
    saveSettings()
  }, [apiKey, apiEndpoint, model])

  const getContext = () => {
    if (!editor) return ''

    if (contextMode === 'none') return ''

    if (contextMode === 'element') {
      const selected = editor.getSelected()
      if (selected) {
        return `当前选中元素：\n${selected.toHTML()}`
      }
      return ''
    }

    if (contextMode === 'page') {
      const selected = editor.getSelected()
      if (selected) {
        let parent = selected.parent()
        while (parent && !parent.getClasses().includes('page')) {
          parent = parent.parent()
        }
        if (parent) {
          return `当前页面内容：\n${parent.toHTML()}`
        }
      }
      return ''
    }

    if (contextMode === 'all') {
      return `完整文档内容：\n${editor.getHtml()}`
    }

    return ''
  }

  const handleSend = async () => {
    if (!input.trim() || !editor) return
    if (!apiKey) {
      alert('请先配置 API Key')
      setShowSettings(true)
      return
    }

    const userMsg: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const context = getContext()
    const systemPrompt = `你是 HTML Slide Studio 的 AI 助手。用户正在编辑演示文档，你可以：
1. 回答关于编辑器使用的问题
2. 根据用户需求生成 HTML 代码片段（使用 class="page"、"card"、"flow-container" 等）
3. 优化或修改用户选中的元素

${context ? `\n${context}\n` : ''}
回复时：
- 如果生成 HTML 代码，用 \`\`\`html 包裹
- 保持简洁专业
- 使用 CSS 变量：var(--primary), var(--bg-card) 等`

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: input },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const reply = data.choices?.[0]?.message?.content || '无响应'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `错误: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const applyCode = (code: string) => {
    if (!editor) return
    const selected = editor.getSelected()
    if (selected) {
      selected.replaceWith(code)
    } else {
      editor.addComponents(code)
    }
  }

  return (
    <>
      {/* 悬浮按钮 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#0066FF] to-[#00D9FF] text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center z-40"
          title="AI 助手"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* 侧边抽屉 */}
      {open && (
        <div className="fixed right-0 top-0 bottom-0 w-96 bg-[var(--atag-bg-panel)] border-l border-[var(--atag-border)] flex flex-col z-50 shadow-2xl">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--atag-border)] shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[var(--atag-primary)]" />
              <span className="text-sm font-medium">AI 助手</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-[var(--atag-text-muted)] hover:text-[var(--atag-text)]"
                title="设置"
              >
                <Settings size={18} />
              </button>
              <button onClick={() => setOpen(false)} className="text-[var(--atag-text-muted)] hover:text-[var(--atag-text)]">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 设置面板 */}
          {showSettings && (
            <div className="p-4 border-b border-[var(--atag-border)] bg-[var(--atag-bg-card)] space-y-3 shrink-0">
              <div>
                <label className="text-xs text-[var(--atag-text-muted)] block mb-1">API Endpoint</label>
                <input
                  className="w-full bg-[var(--atag-bg-panel)] border border-[var(--atag-border)] rounded px-2 py-1.5 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
              </div>
              <div>
                <label className="text-xs text-[var(--atag-text-muted)] block mb-1">API Key</label>
                <input
                  type="password"
                  className="w-full bg-[var(--atag-bg-panel)] border border-[var(--atag-border)] rounded px-2 py-1.5 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="text-xs text-[var(--atag-text-muted)] block mb-1">模型</label>
                <input
                  className="w-full bg-[var(--atag-bg-panel)] border border-[var(--atag-border)] rounded px-2 py-1.5 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o"
                />
              </div>
            </div>
          )}

          {/* 上下文模式选择 */}
          <div className="px-4 py-2 border-b border-[var(--atag-border)] shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setContextMode('none')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  contextMode === 'none'
                    ? 'bg-[var(--atag-primary)] text-white'
                    : 'text-[var(--atag-text-muted)] hover:bg-[var(--atag-bg-card)]'
                }`}
                title="无上下文"
              >
                <X size={12} />
                <span>无</span>
              </button>
              <button
                onClick={() => setContextMode('element')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  contextMode === 'element'
                    ? 'bg-[var(--atag-primary)] text-white'
                    : 'text-[var(--atag-text-muted)] hover:bg-[var(--atag-bg-card)]'
                }`}
                title="选中元素"
              >
                <Square size={12} />
                <span>元素</span>
              </button>
              <button
                onClick={() => setContextMode('page')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  contextMode === 'page'
                    ? 'bg-[var(--atag-primary)] text-white'
                    : 'text-[var(--atag-text-muted)] hover:bg-[var(--atag-bg-card)]'
                }`}
                title="当前页面"
              >
                <FileText size={12} />
                <span>页面</span>
              </button>
              <button
                onClick={() => setContextMode('all')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  contextMode === 'all'
                    ? 'bg-[var(--atag-primary)] text-white'
                    : 'text-[var(--atag-text-muted)] hover:bg-[var(--atag-bg-card)]'
                }`}
                title="完整文档"
              >
                <Layers size={12} />
                <span>全部</span>
              </button>
            </div>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-xs text-[var(--atag-text-muted)] text-center mt-8 space-y-2">
                <p>💡 使用提示：</p>
                <p className="mt-2">• 选择上下文模式（无/元素/页面/全部）</p>
                <p>• 选中元素后提问，或直接输入需求</p>
                <p>• 例如："优化这段文字"、"生成一个流程图"</p>
                {!apiKey && (
                  <p className="mt-4 text-[var(--atag-primary)]">⚠️ 请先点击设置图标配置 API</p>
                )}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                  msg.role === 'user'
                    ? 'bg-[var(--atag-primary)] text-white'
                    : 'bg-[var(--atag-bg-card)] text-[var(--atag-text)] border border-[var(--atag-border)]'
                }`}>
                  {msg.content.includes('```html') ? (
                    <div>
                      <pre className="whitespace-pre-wrap font-mono text-xs mb-2">{msg.content}</pre>
                      <button
                        onClick={() => {
                          const match = msg.content.match(/```html\n([\s\S]*?)\n```/)
                          if (match) applyCode(match[1])
                        }}
                        className="text-xs px-2 py-1 bg-[var(--atag-primary)] text-white rounded hover:opacity-90"
                      >
                        应用到画布
                      </button>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2">
                  <Loader2 size={14} className="animate-spin text-[var(--atag-primary)]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框 */}
          <div className="p-3 border-t border-[var(--atag-border)] shrink-0">
            <div className="flex gap-2">
              <input
                className="flex-1 bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
                placeholder="输入消息..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-3 py-2 bg-gradient-to-r from-[#0066FF] to-[#00D9FF] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
