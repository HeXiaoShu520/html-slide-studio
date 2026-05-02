import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Send, Loader2, Bot, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import type { CodeEditorHandle } from './CodeEditor'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface AIAssistantHandle {
  appendContext: (text: string, isElement?: boolean) => void
}

interface Props {
  editorRef: React.RefObject<CodeEditorHandle | null>
  getCurrentCode: () => string
}

const SYSTEM_PROMPT = `你是一个 HTML 演示文档助手。用户会给你当前页面的完整 HTML 代码，以及可能框选的部分代码片段作为上下文。
你的任务是根据用户的指令修改代码。

规则：
1. 只输出修改后的完整 HTML 代码，用 \`\`\`html ... \`\`\` 包裹
2. 不要输出任何解释，除非用户明确要求解释
3. 保持代码结构清晰，使用 CSS 变量（--primary 等）和全局类（.page .card 等）
4. 如果用户只是问问题而不是要修改代码，正常回答即可，不需要输出代码`

async function callAI(endpoint: string, apiKey: string, model: string, apiType: string, messages: Message[], system: string): Promise<string> {
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
  console.log('[callAI] 请求体:', JSON.stringify(body, null, 2))
  const res = await fetch('/api-proxy', { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  console.log('[callAI] 原始响应:', data)
  console.log('[callAI] choices[0]:', data.choices?.[0])
  console.log('[callAI] message:', data.choices?.[0]?.message)

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

  console.error('[callAI] 无法解析响应格式:', data)
  throw new Error('无法解析 API 响应格式')
}

const AIAssistant = forwardRef<AIAssistantHandle, Props>(function AIAssistant({ editorRef, getCurrentCode }, ref) {
  const [open, setOpen] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [quotedContext, setQuotedContext] = useState<{ text: string; isElement: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    appendContext: (text: string, isElement = false) => {
      setOpen(true)
      setQuotedContext({ text, isElement })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }))

  const apiKey = localStorage.getItem('atag-api-key') || ''
  const apiEndpoint = localStorage.getItem('atag-api-endpoint') || 'https://api.openai.com/v1/chat/completions'
  const model = localStorage.getItem('atag-model') || 'gpt-4o'
  const apiType = localStorage.getItem('atag-api-type') || 'openai'

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    if (!apiKey) { alert('请先在顶栏 API 设置中配置 API Key'); return }

    const selection = editorRef.current?.getSelection() || ''
    const fullCode = getCurrentCode()
    const ctx = quotedContext?.text || selection

    // 只在第一次对话时发送完整代码
    let userContent: string
    if (messages.length === 0) {
      userContent = ctx
        ? `当前页面完整代码：\n\`\`\`html\n${fullCode}\n\`\`\`\n\n${quotedContext?.isElement ? '引用的页面元素内容' : '引用片段'}：\n\`\`\`\n${ctx}\n\`\`\`\n\n指令：${input}`
        : `当前页面完整代码：\n\`\`\`html\n${fullCode}\n\`\`\`\n\n指令：${input}`
    } else {
      userContent = ctx
        ? `${quotedContext?.isElement ? '引用的页面元素内容' : '引用片段'}：\n\`\`\`\n${ctx}\n\`\`\`\n\n指令：${input}`
        : input
    }

    const newMessages: Message[] = [...messages, { role: 'user', content: userContent }]
    setMessages(newMessages)
    setInput('')
    setQuotedContext(null)
    setLoading(true)

    console.log('=== AI 对话助手 - 请求开始 ===')
    console.log('用户输入:', input)
    console.log('是否首次对话:', messages.length === 0)
    console.log('引用上下文:', ctx ? ctx.slice(0, 100) + '...' : '无')
    console.log('完整消息:', newMessages)
    console.log('API 配置:', { endpoint: apiEndpoint, model, apiType })

    try {
      const reply = await callAI(apiEndpoint, apiKey, model, apiType, newMessages, SYSTEM_PROMPT)
      console.log('=== AI 响应 ===')
      console.log('响应内容:', reply)
      console.log('响应长度:', reply.length)
      setMessages(m => [...m, { role: 'assistant', content: reply }])

      // 如果回复包含代码块，自动应用
      const match = reply.match(/```html?\n([\s\S]*?)```/)
      if (match) editorRef.current?.replaceAll(match[1].trim())
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: `错误：${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--atag-border)', background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.98) 100%)', height: open ? '280px' : '40px', flexShrink: 0, transition: 'height .25s cubic-bezier(0.4, 0, 0.2, 1)', backdropFilter: 'blur(12px)' }}>
      {/* 标题栏 */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', height: 40, flexShrink: 0, borderBottom: open ? '1px solid rgba(100,116,139,0.2)' : 'none', background: open ? 'rgba(0,0,0,0.2)' : 'transparent' }}
      >
        <div style={{ width: 20, height: 20, borderRadius: 6, background: 'linear-gradient(135deg, #0066FF 0%, #00D9FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,102,255,0.3)' }}>
          <Bot size={12} color="#fff" />
        </div>
        <span onClick={() => setOpen(o => !o)} style={{ fontSize: 13, color: '#e2e8f0', flex: 1, cursor: 'pointer', fontWeight: 500, letterSpacing: '0.01em' }}>AI 对话助手</span>
        {open && messages.length > 0 && (
          <button onClick={() => setMessages([])} title="清空历史" style={{ padding: 5, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', transition: 'all .2s', ':hover': { background: 'rgba(239,68,68,0.2)' } }}>
            <Trash2 size={12} />
          </button>
        )}
        <div onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 4, transition: 'background .2s' }}>
          {open ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronUp size={14} color="#94a3b8" />}
        </div>
      </div>

      {open && (
        <>
          {/* 消息列表 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 12, color: '#64748b', opacity: .8, textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
                框选代码后输入指令<br/>AI 将智能修改当前页面
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'slideIn 0.3s ease-out' }}>
                <div style={{
                  maxWidth: '82%', padding: '8px 12px', borderRadius: 10, fontSize: 12, lineHeight: 1.6,
                  background: m.role === 'user'
                    ? 'linear-gradient(135deg, rgba(0,102,255,0.9) 0%, rgba(0,217,255,0.8) 100%)'
                    : 'rgba(30,41,59,0.6)',
                  color: m.role === 'user' ? '#fff' : '#e2e8f0',
                  border: m.role === 'user' ? 'none' : '1px solid rgba(100,116,139,0.2)',
                  boxShadow: m.role === 'user'
                    ? '0 2px 8px rgba(0,102,255,0.25)'
                    : '0 2px 6px rgba(0,0,0,0.15)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  backdropFilter: 'blur(8px)',
                }}>
                  {m.role === 'user'
                    ? (() => {
                        const clean = m.content.replace(/当前页面完整代码：[\s\S]*?```\n\n/, '')
                        const quoteMatch = clean.match(/^引用片段：\n```\n([\s\S]*?)\n```\n\n指令：([\s\S]*)$/)
                        const plainMatch = clean.match(/^指令：([\s\S]*)$/)
                        if (quoteMatch) return (
                          <>
                            <div style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: 'rgba(0,217,255,0.15)', border: '1px solid rgba(0,217,255,0.3)', color: '#00D9FF', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              引用：{quoteMatch[1].slice(0, 60)}{quoteMatch[1].length > 60 ? '…' : ''}
                            </div>
                            {quoteMatch[2]}
                          </>
                        )
                        return plainMatch ? plainMatch[1] : clean
                      })()
                    : (m.content.includes('```') ? '✓ 代码已更新' : m.content)
                  }
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--atag-text-muted)' }}>
                <Loader2 size={12} className="animate-spin" />生成中...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* 引用块 */}
          {quotedContext && (
            <div style={{ margin: '0 12px 6px', padding: '7px 12px', borderRadius: 8, background: 'rgba(0,217,255,0.12)', border: '1px solid rgba(0,217,255,0.3)', display: 'flex', alignItems: 'flex-start', gap: 8, boxShadow: '0 2px 6px rgba(0,217,255,0.15)' }}>
              <span style={{ fontSize: 11, color: '#00D9FF', flexShrink: 0, marginTop: 1, fontWeight: 600 }}>{quotedContext.isElement ? '📌 元素' : '📎 引用'}</span>
              <span style={{ fontSize: 11, color: '#cbd5e1', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quotedContext.text}</span>
              <button onClick={() => setQuotedContext(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1, transition: 'color .2s' }}>×</button>
            </div>
          )}
          {/* 输入框 */}
          <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderTop: '1px solid rgba(100,116,139,0.2)', flexShrink: 0, background: 'rgba(0,0,0,0.15)' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="输入指令，如：把标题改为红色..."
              style={{ flex: 1, background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(100,116,139,0.25)', borderRadius: 8, padding: '7px 12px', fontSize: 12, color: '#e2e8f0', outline: 'none', transition: 'all .2s', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ padding: '7px 12px', borderRadius: 8, background: loading || !input.trim() ? 'rgba(100,116,139,0.3)' : 'linear-gradient(135deg, #0066FF 0%, #00D9FF 100%)', border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', transition: 'all .2s', boxShadow: loading || !input.trim() ? 'none' : '0 2px 8px rgba(0,102,255,0.3)' }}
            >
              <Send size={13} color="#fff" />
            </button>
          </div>
        </>
      )}
    </div>
  )
})

export default AIAssistant
