import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { Send, Loader2, Bot, ChevronDown, ChevronUp } from 'lucide-react'
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

async function callAI(endpoint: string, apiKey: string, model: string, messages: Message[], system: string): Promise<string> {
  const isAnthropic = endpoint.includes('anthropic.com')
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
  const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return isAnthropic ? data.content[0].text : data.choices[0].message.content
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    if (!apiKey) { alert('请先在 AI 生成面板中配置 API Key'); return }

    const selection = editorRef.current?.getSelection() || ''
    const fullCode = getCurrentCode()
    const ctx = quotedContext?.text || selection

    const userContent = ctx
      ? `当前页面完整代码：\n\`\`\`html\n${fullCode}\n\`\`\`\n\n${quotedContext?.isElement ? '引用的页面元素内容' : '引用片段'}：\n\`\`\`\n${ctx}\n\`\`\`\n\n指令：${input}`
      : `当前页面完整代码：\n\`\`\`html\n${fullCode}\n\`\`\`\n\n指令：${input}`

    const newMessages: Message[] = [...messages, { role: 'user', content: userContent }]
    setMessages(newMessages)
    setInput('')
    setQuotedContext(null)
    setLoading(true)

    try {
      const reply = await callAI(apiEndpoint, apiKey, model, newMessages, SYSTEM_PROMPT)
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
    <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--atag-border)', background: 'var(--atag-bg-panel)', height: open ? '260px' : '36px', flexShrink: 0, transition: 'height .2s' }}>
      {/* 标题栏 */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 36, cursor: 'pointer', flexShrink: 0, borderBottom: open ? '1px solid var(--atag-border)' : 'none' }}
      >
        <Bot size={14} color="var(--atag-primary)" />
        <span style={{ fontSize: 12, color: 'var(--atag-text-muted)', flex: 1 }}>AI 助手</span>
        {open ? <ChevronDown size={13} color="var(--atag-text-muted)" /> : <ChevronUp size={13} color="var(--atag-text-muted)" />}
      </div>

      {open && (
        <>
          {/* 消息列表 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--atag-text-muted)', opacity: .6, textAlign: 'center', marginTop: 16 }}>
                框选代码后输入指令，AI 将修改当前页面
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '6px 10px', borderRadius: 8, fontSize: 12, lineHeight: 1.5,
                  background: m.role === 'user' ? 'rgba(0,102,255,0.25)' : 'rgba(255,255,255,0.06)',
                  color: 'var(--atag-text)',
                  border: '1px solid ' + (m.role === 'user' ? 'rgba(0,102,255,0.4)' : 'rgba(255,255,255,0.08)'),
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
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
            <div style={{ margin: '0 10px 4px', padding: '5px 10px', borderRadius: 6, background: 'rgba(0,217,255,0.08)', border: '1px solid rgba(0,217,255,0.25)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#00D9FF', flexShrink: 0, marginTop: 1 }}>{quotedContext.isElement ? '元素内容' : '引用'}</span>
              <span style={{ fontSize: 11, color: 'var(--atag-text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quotedContext.text}</span>
              <button onClick={() => setQuotedContext(null)} style={{ background: 'none', border: 'none', color: 'var(--atag-text-muted)', cursor: 'pointer', fontSize: 13, padding: 0, lineHeight: 1 }}>×</button>
            </div>
          )}
          {/* 输入框 */}
          <div style={{ display: 'flex', gap: 6, padding: '6px 10px', borderTop: '1px solid var(--atag-border)', flexShrink: 0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="输入指令，如：把标题改为红色..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--atag-border)', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: 'var(--atag-text)', outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ padding: '5px 10px', borderRadius: 6, background: 'var(--atag-primary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: loading || !input.trim() ? .5 : 1 }}
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
