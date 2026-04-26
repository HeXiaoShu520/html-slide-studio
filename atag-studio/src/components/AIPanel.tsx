import { useState } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { getThemeCSS } from '../themes/themeCSS'

const SCENE_TEMPLATES: { label: string; prompt: string }[] = [
  {
    label: 'UDS 诊断服务',
    prompt: '生成一个关于 UDS (ISO 14229) 统一诊断服务的教学演示网页，包含：封面、协议简介、核心服务分类（卡片展示）、通信流程图、报文示例、应用场景。',
  },
  {
    label: 'SOME/IP 通信',
    prompt: '生成一个关于 SOME/IP 面向服务中间件的教学演示网页，包含：封面、协议概述、服务发现机制、通信模式（请求/响应、事件通知）、报文结构、应用场景。',
  },
  {
    label: 'DoIP 诊断',
    prompt: '生成一个关于 DoIP (ISO 13400) 基于IP诊断协议的教学演示网页，包含：封面、协议背景、网络拓扑、连接流程、刷写步骤、故障处理。',
  },
  {
    label: '相机标定',
    prompt: '生成一个关于 ADAS 相机标定的教学演示网页，包含：封面、标定原理、标定类型（内参/外参）、标定流程、标定板要求、精度验证。',
  },
  {
    label: 'OTA 升级',
    prompt: '生成一个关于车载 OTA 空中升级的教学演示网页，包含：封面、OTA 架构、升级流程、安全机制、差分升级、回滚策略。',
  },
  {
    label: '自定义主题',
    prompt: '',
  },
]

export default function AIPanel() {
  const { editor, showAIPanel, setShowAIPanel, currentTheme } = useAppStore()
  const [selectedScene, setSelectedScene] = useState(0)
  const [customPrompt, setCustomPrompt] = useState('')
  const [userContent, setUserContent] = useState('')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('atag-api-key') || '')
  const [apiEndpoint, setApiEndpoint] = useState(() => localStorage.getItem('atag-api-endpoint') || 'https://api.openai.com/v1/chat/completions')
  const [model, setModel] = useState(() => localStorage.getItem('atag-model') || 'gpt-4o')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!showAIPanel) return null

  const currentPrompt = selectedScene === SCENE_TEMPLATES.length - 1
    ? customPrompt
    : SCENE_TEMPLATES[selectedScene].prompt

  const handleGenerate = async () => {
    if (!editor) return
    if (!apiKey) { setError('请先配置 API Key'); return }
    if (!currentPrompt && !userContent) { setError('请输入生成内容或选择场景'); return }

    setError('')
    setLoading(true)

    // 保存配置
    localStorage.setItem('atag-api-key', apiKey)
    localStorage.setItem('atag-api-endpoint', apiEndpoint)
    localStorage.setItem('atag-model', model)

    const systemPrompt = `你是一个专业的车载技术教学网页生成器。请根据用户需求生成纯 HTML 内容（不要包含 <html>/<head>/<body> 标签，只输出 body 内部的内容）。

设计要求：
- 使用 CSS 变量：var(--primary), var(--primary-light), var(--bg-main), var(--bg-card), var(--text-color), var(--gradient)
- 使用 class="page" 作为每一页的容器，每页 min-height: 100vh
- 使用 class="card" 作为卡片组件
- 使用 class="card-grid" 作为卡片网格容器
- 使用 class="flow-container" / "flow-step" / "flow-arrow" 作为流程图
- 使用 class="timeline" / "timeline-item" 作为时间线
- 使用 class="code-block" 作为代码块
- 使用 class="packet-table" 作为报文表格
- 使用 class="badge" 作为标签
- 使用 class="icon-circle" 作为图标圆
- 动画类：animate-fadeInUp, animate-fadeIn, animate-slideInLeft, animate-slideInRight
- 风格：深色背景、科技感、专业、简洁
- 内容要专业准确，适合技术培训

只输出 HTML 代码，不要输出任何解释文字或 markdown 标记。`

    const userMessage = userContent
      ? `${currentPrompt}\n\n以下是用户提供的技术文档内容，请基于此生成：\n\n${userContent}`
      : currentPrompt

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
            { role: 'user', content: userMessage },
          ],
          max_tokens: 8000,
          temperature: 0.7,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error?.message || `HTTP ${res.status}`)
      }

      const data = await res.json()
      let html = data.choices?.[0]?.message?.content || ''

      // 清理可能的 markdown 包裹
      html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()

      editor.setComponents(html)
      editor.setStyle(getThemeCSS(currentTheme))
      setShowAIPanel(false)
    } catch (err: any) {
      setError(err.message || '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[var(--atag-bg-panel)] border border-[var(--atag-border)] rounded-2xl w-[640px] max-h-[85vh] flex flex-col shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--atag-border)]">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--atag-primary)]" />
            <span className="text-sm font-medium">AI 文档生成</span>
          </div>
          <button onClick={() => setShowAIPanel(false)} className="text-[var(--atag-text-muted)] hover:text-[var(--atag-text)]">
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* API 配置 */}
          <details className="group">
            <summary className="text-xs text-[var(--atag-text-muted)] cursor-pointer hover:text-[var(--atag-text)]">
              API 配置（点击展开）
            </summary>
            <div className="mt-2 space-y-2">
              <input
                className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
                placeholder="API Endpoint"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
              />
              <input
                className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
                placeholder="API Key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <input
                className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
                placeholder="模型名称 (如 gpt-4o)"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
          </details>

          {/* 场景选择 */}
          <div>
            <label className="text-xs text-[var(--atag-text-muted)] mb-2 block">选择场景模板</label>
            <div className="grid grid-cols-3 gap-2">
              {SCENE_TEMPLATES.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedScene(i)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                    selectedScene === i
                      ? 'border-[var(--atag-primary)] bg-[rgba(0,102,255,0.15)] text-[var(--atag-primary)]'
                      : 'border-[var(--atag-border)] bg-[var(--atag-bg-card)] text-[var(--atag-text)] hover:border-[var(--atag-primary)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 自定义提示词 */}
          {selectedScene === SCENE_TEMPLATES.length - 1 && (
            <div>
              <label className="text-xs text-[var(--atag-text-muted)] mb-2 block">自定义生成指令</label>
              <textarea
                className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)] resize-none h-20"
                placeholder="描述你想生成的演示文档内容..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
            </div>
          )}

          {/* 用户内容输入 */}
          <div>
            <label className="text-xs text-[var(--atag-text-muted)] mb-2 block">粘贴技术文档内容（可选）</label>
            <textarea
              className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)] resize-none h-32"
              placeholder="粘贴你的技术文档、Markdown 或纯文本内容，AI 将基于此生成演示网页..."
              value={userContent}
              onChange={(e) => setUserContent(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>

        {/* 底部 */}
        <div className="px-5 py-4 border-t border-[var(--atag-border)] flex justify-end gap-3">
          <button
            onClick={() => setShowAIPanel(false)}
            className="text-xs px-4 py-2 rounded-lg border border-[var(--atag-border)] text-[var(--atag-text-muted)] hover:text-[var(--atag-text)]"
          >
            取消
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-5 py-2 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#00D9FF] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? '生成中...' : '开始生成'}
          </button>
        </div>
      </div>
    </div>
  )
}
