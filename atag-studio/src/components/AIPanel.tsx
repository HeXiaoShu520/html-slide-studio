import { useState } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { getThemeCSS } from '../themes/themeCSS'

interface Template {
  label: string
  prompt: string
}

interface Category {
  name: string
  templates: Template[]
}

const CATEGORIES: Category[] = [
  {
    name: '车载技术',
    templates: [
      { label: 'UDS 诊断服务', prompt: '生成一个关于 UDS (ISO 14229) 统一诊断服务的教学演示网页，包含：封面、协议简介、核心服务分类（卡片展示）、通信流程图、报文示例、应用场景。' },
      { label: 'SOME/IP 通信', prompt: '生成一个关于 SOME/IP 面向服务中间件的教学演示网页，包含：封面、协议概述、服务发现机制、通信模式（请求/响应、事件通知）、报文结构、应用场景。' },
      { label: 'DoIP 诊断', prompt: '生成一个关于 DoIP (ISO 13400) 基于IP诊断协议的教学演示网页，包含：封面、协议背景、网络拓扑、连接流程、刷写步骤、故障处理。' },
      { label: 'OTA 升级', prompt: '生成一个关于车载 OTA 空中升级的教学演示网页，包含：封面、OTA 架构、升级流程、安全机制、差分升级、回滚策略。' },
    ],
  },
  {
    name: '技术培训',
    templates: [
      { label: '技术方案介绍', prompt: '生成一个技术方案介绍的演示网页，包含：封面、背景与痛点、解决方案概述、核心功能（卡片展示）、技术架构图、实施步骤、预期收益。' },
      { label: '系统架构说明', prompt: '生成一个系统架构说明的演示网页，包含：封面、系统概述、架构分层图、核心模块说明、数据流程、接口设计、部署方案。' },
      { label: '操作培训手册', prompt: '生成一个操作培训手册演示网页，包含：封面、培训目标、操作流程（步骤图）、关键操作说明、常见问题、注意事项。' },
    ],
  },
  {
    name: '产品展示',
    templates: [
      { label: '产品发布介绍', prompt: '生成一个产品发布介绍的演示网页，包含：封面（产品名+slogan）、产品亮点（3-4个核心特性卡片）、功能详解、技术规格、应用场景、联系方式。' },
      { label: '项目汇报', prompt: '生成一个项目汇报演示网页，包含：封面、项目背景与目标、项目进展（时间线）、已完成成果、遇到的问题与解决方案、下一步计划、总结。' },
    ],
  },
  {
    name: '自定义',
    templates: [
      { label: '自定义内容', prompt: '' },
    ],
  },
]

const SYSTEM_PROMPT = `你是一个专业的 HTML 演示文档生成器。请根据用户需求生成纯 HTML 内容（不要包含 <html>/<head>/<body> 标签，只输出 body 内部的内容）。

设计要求：
- 使用 CSS 变量：var(--primary), var(--primary-light), var(--bg-main), var(--bg-card), var(--text-color)
- 使用 class="page" 作为每一页的容器，每页 min-height: 100vh，内边距 padding: 60px 80px
- 使用 class="card" 作为卡片组件
- 使用 class="card-grid" 作为卡片网格容器
- 使用 class="flow-container" / "flow-step" / "flow-arrow" 作为流程图
- 使用 class="timeline" / "timeline-item" 作为时间线
- 使用 class="code-block" 作为代码块
- 动画类：animate-fadeInUp, animate-fadeIn, animate-slideInLeft
- 风格：深色背景、科技感、专业简洁
- 内容要准确，适合演示展示

只输出 HTML 代码，不要输出任何解释文字或 markdown 标记。`

export default function AIPanel() {
  const { editor, showAIPanel, setShowAIPanel, currentTheme } = useAppStore()
  const [categoryIdx, setCategoryIdx] = useState(0)
  const [templateIdx, setTemplateIdx] = useState(0)
  const [customPrompt, setCustomPrompt] = useState('')
  const [userContent, setUserContent] = useState('')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('atag-api-key') || '')
  const [apiEndpoint, setApiEndpoint] = useState(() => localStorage.getItem('atag-api-endpoint') || 'https://api.openai.com/v1/chat/completions')
  const [model, setModel] = useState(() => localStorage.getItem('atag-model') || 'gpt-4o')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!showAIPanel) return null

  const currentCategory = CATEGORIES[categoryIdx]
  const currentTemplate = currentCategory.templates[templateIdx]
  const isCustom = categoryIdx === CATEGORIES.length - 1
  const currentPrompt = isCustom ? customPrompt : currentTemplate.prompt

  const handleCategoryChange = (i: number) => {
    setCategoryIdx(i)
    setTemplateIdx(0)
  }

  const handleGenerate = async () => {
    if (!editor) return
    if (!apiKey) { setError('请先配置 API Key'); return }
    if (!currentPrompt && !userContent) { setError('请输入生成内容或选择模板'); return }

    setError('')
    setLoading(true)
    localStorage.setItem('atag-api-key', apiKey)
    localStorage.setItem('atag-api-endpoint', apiEndpoint)
    localStorage.setItem('atag-model', model)

    const userMessage = userContent
      ? `${currentPrompt}\n\n以下是用户提供的内容，请基于此生成：\n\n${userContent}`
      : currentPrompt

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
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
      <div className="bg-[var(--atag-bg-panel)] border border-[var(--atag-border)] rounded-2xl w-[660px] max-h-[88vh] flex flex-col shadow-2xl">
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

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* API 配置 */}
          <details className="group">
            <summary className="text-xs text-[var(--atag-text-muted)] cursor-pointer hover:text-[var(--atag-text)]">
              API 配置（点击展开）
            </summary>
            <div className="mt-2 space-y-2">
              <input className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
                placeholder="API Endpoint" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} />
              <input className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
                placeholder="API Key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              <input className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)]"
                placeholder="模型名称 (如 gpt-4o)" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </details>

          {/* 类别选择 */}
          <div>
            <label className="text-xs text-[var(--atag-text-muted)] mb-2 block">文档类别</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat, i) => (
                <button key={i} onClick={() => handleCategoryChange(i)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    categoryIdx === i
                      ? 'border-[var(--atag-primary)] bg-[rgba(0,102,255,0.15)] text-[var(--atag-primary)]'
                      : 'border-[var(--atag-border)] bg-[var(--atag-bg-card)] text-[var(--atag-text)] hover:border-[var(--atag-primary)]'
                  }`}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 模板选择（非自定义类别） */}
          {!isCustom && (
            <div>
              <label className="text-xs text-[var(--atag-text-muted)] mb-2 block">选择模板</label>
              <div className="grid grid-cols-2 gap-2">
                {currentCategory.templates.map((t, i) => (
                  <button key={i} onClick={() => setTemplateIdx(i)}
                    className={`text-xs px-3 py-2 rounded-lg border text-left transition-colors ${
                      templateIdx === i
                        ? 'border-[var(--atag-primary)] bg-[rgba(0,102,255,0.15)] text-[var(--atag-primary)]'
                        : 'border-[var(--atag-border)] bg-[var(--atag-bg-card)] text-[var(--atag-text)] hover:border-[var(--atag-primary)]'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 自定义提示词 */}
          {isCustom && (
            <div>
              <label className="text-xs text-[var(--atag-text-muted)] mb-2 block">生成指令</label>
              <textarea
                className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)] resize-none h-20"
                placeholder="描述你想生成的演示文档内容..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
            </div>
          )}

          {/* 补充内容 */}
          <div>
            <label className="text-xs text-[var(--atag-text-muted)] mb-2 block">粘贴参考内容（可选）</label>
            <textarea
              className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2 text-xs text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)] resize-none h-28"
              placeholder="粘贴文档、Markdown 或纯文本，AI 将基于此生成演示网页..."
              value={userContent}
              onChange={(e) => setUserContent(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* 底部 */}
        <div className="px-5 py-4 border-t border-[var(--atag-border)] flex justify-end gap-3">
          <button onClick={() => setShowAIPanel(false)}
            className="text-xs px-4 py-2 rounded-lg border border-[var(--atag-border)] text-[var(--atag-text-muted)] hover:text-[var(--atag-text)]">
            取消
          </button>
          <button onClick={handleGenerate} disabled={loading}
            className="flex items-center gap-1.5 text-xs px-5 py-2 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#00D9FF] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? '生成中...' : '开始生成'}
          </button>
        </div>
      </div>
    </div>
  )
}
