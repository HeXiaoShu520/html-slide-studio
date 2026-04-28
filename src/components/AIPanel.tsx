import { useState } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { getThemeCSS } from '../themes/themeCSS'
import { AI_STYLES } from '../themes/aiStyles'

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

const SYSTEM_PROMPT = `你是一个专业的 HTML 演示文档生成器。

## 输出格式要求（严格遵守）

输出完整的 HTML 片段，结构如下：
1. 最前面一个全局 <style> 标签，包含基础布局和动画初始状态
2. 每个 <div class="page"> 内部嵌一个 <style> 标签，包含该页专属动画

结构模板：
\`\`\`
<style>
:root { --primary: #0066FF; --primary-light: #00D9FF; }
.page { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px 80px; }
/* 动画初始状态：所有带动画的元素默认暂停，由 JS 触发 */
[class*="-anim"] { animation-play-state: paused; }
.page.visible [class*="-anim"] { animation-play-state: running; }
</style>

<div class="page">
  <style>
    .p1-title { animation: fadeUp1 0.6s 0.1s ease both; }
    @keyframes fadeUp1 { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
  </style>
  <h1 class="p1-title p1-anim">标题</h1>
</div>
\`\`\`

**重要规则**：
- 每页类名加页码前缀（p1-、p2-...）避免冲突
- 所有需要动画的元素必须同时加 \`pN-anim\` 类（如 p1-anim、p2-anim），用于 JS 控制播放
- 动画元素初始 opacity 必须为 0（在 @keyframes from 中设置）

## 动画规范（必须执行）

**每一页都必须有动画**，根据以下风格要求和内容语义选择动画：

{{ANIMATION_DESCRIPTION}}

## 设计原则

1. **每页精简**：一页只展示 1-3 个核心要点
2. **视觉层次**：大标题、副标题、图标、色块区分层次
3. **留白**：保持呼吸感
4. **图标**：使用 Font Awesome（<i class="fas fa-xxx">）
5. **卡片**：深色背景 + 圆角 + 边框 + hover 上移效果

## 样式规范

{{STYLE_DESCRIPTION}}
- 每页必须用 class="page" 包裹

只输出 HTML 代码，不要任何解释文字。`

export default function AIPanel() {
  const { editor, showAIPanel, setShowAIPanel, currentTheme } = useAppStore()
  const [categoryIdx, setCategoryIdx] = useState(0)
  const [templateIdx, setTemplateIdx] = useState(0)
  const [customPrompt, setCustomPrompt] = useState('')
  const [userContent, setUserContent] = useState('')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('atag-api-key') || '')
  const [apiEndpoint, setApiEndpoint] = useState(() => localStorage.getItem('atag-api-endpoint') || 'https://api.openai.com/v1/chat/completions')
  const [model, setModel] = useState(() => localStorage.getItem('atag-model') || 'gpt-4o')
  const [styleId, setStyleId] = useState(AI_STYLES[0].id)
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

    const selectedStyle = AI_STYLES.find(s => s.id === styleId) || AI_STYLES[0]
    const systemPrompt = SYSTEM_PROMPT
      .replace('{{STYLE_DESCRIPTION}}', selectedStyle.description)
      .replace('{{ANIMATION_DESCRIPTION}}', selectedStyle.animationDescription)

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
      html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()

      // 提取顶部全局 <style>（.page 之前的），作为 globalCss
      const globalStyleMatch = html.match(/^([\s\S]*?)<div\s[^>]*class="[^"]*page/i)
      const globalCssRaw = globalStyleMatch
        ? [...globalStyleMatch[1].matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n')
        : ''
      const slideCss = globalCssRaw || getThemeCSS(currentTheme)

      // 解析 HTML，保留每页内嵌的 <style>
      const parser = new DOMParser()
      const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html')
      let pages = Array.from(doc.querySelectorAll('.page'))
      if (pages.length === 0) {
        pages = Array.from(doc.querySelectorAll('.slide')).map(el => {
          el.classList.remove('slide'); el.classList.add('page'); return el
        })
      }

      if (pages.length > 0) {
        const newSlides = pages.map(p => {
          // 提取该页内嵌 <style> 作为 slide.css
          const styleEls = Array.from(p.querySelectorAll('style'))
          const pageCss = styleEls.map(s => s.textContent || '').join('\n')
          styleEls.forEach(s => s.remove())
          return { id: crypto.randomUUID(), html: p.outerHTML, css: pageCss }
        })
        useAppStore.setState({ slides: newSlides, currentSlideIndex: 0, globalCss: slideCss })
        editor.setComponents(newSlides[0].html)
        editor.setStyle(newSlides[0].css)
      } else {
        useAppStore.setState({
          slides: [{ id: crypto.randomUUID(), html: html, css: '' }],
          currentSlideIndex: 0,
          globalCss: slideCss,
        })
        editor.setComponents(html)
        editor.setStyle('')
      }
      editor.setStyle('')
      const iframe = editor.Canvas.getFrameEl() as HTMLIFrameElement
      const iframeDoc = iframe?.contentDocument
      if (iframeDoc) {
        let styleEl = iframeDoc.getElementById('gjs-global-css') as HTMLStyleElement
        if (!styleEl) {
          styleEl = iframeDoc.createElement('style')
          styleEl.id = 'gjs-global-css'
          iframeDoc.head.appendChild(styleEl)
        }
        styleEl.textContent = slideCss
      }
      setShowAIPanel(false)
    } catch (err: any) {
      setError(err.message || '生成失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--atag-bg-panel)] border border-[var(--atag-border)] rounded-2xl w-[720px] max-h-[90vh] flex flex-col shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--atag-border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0066FF] to-[#00D9FF] flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-base font-medium">AI 文档生成</span>
          </div>
          <button onClick={() => setShowAIPanel(false)} className="text-[var(--atag-text-muted)] hover:text-[var(--atag-text)] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* API 配置 */}
          <details className="group">
            <summary className="text-sm text-[var(--atag-text)] cursor-pointer hover:text-[var(--atag-primary)] transition-colors flex items-center gap-2 select-none">
              <span>API 配置</span>
              <span className="text-xs text-[var(--atag-text-muted)]">（点击展开）</span>
            </summary>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs text-[var(--atag-text-muted)] mb-1.5">API Endpoint</label>
                <input className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)] transition-colors"
                  placeholder="https://api.openai.com/v1/chat/completions" value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-[var(--atag-text-muted)] mb-1.5">API Key</label>
                <input className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)] transition-colors"
                  placeholder="sk-..." type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-[var(--atag-text-muted)] mb-1.5">模型名称</label>
                <input className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)] transition-colors"
                  placeholder="gpt-4o" value={model} onChange={(e) => setModel(e.target.value)} />
              </div>
            </div>
          </details>

          {/* 风格选择 */}
          <div>
            <label className="block text-sm text-[var(--atag-text)] mb-3">生成风格</label>
            <div className="flex gap-2.5 flex-wrap">
              {AI_STYLES.map((s) => (
                <button key={s.id} onClick={() => setStyleId(s.id)}
                  className={`text-sm px-4 py-2 rounded-lg border transition-all ${
                    styleId === s.id
                      ? 'border-[var(--atag-primary)] bg-[rgba(0,102,255,0.15)] text-[var(--atag-primary)] shadow-sm'
                      : 'border-[var(--atag-border)] bg-[var(--atag-bg-card)] text-[var(--atag-text)] hover:border-[var(--atag-primary)]'
                  }`}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* 类别选择 */}
          <div>
            <label className="block text-sm text-[var(--atag-text)] mb-3">文档类别</label>
            <div className="flex gap-2.5 flex-wrap">
              {CATEGORIES.map((cat, i) => (
                <button key={i} onClick={() => handleCategoryChange(i)}
                  className={`text-sm px-4 py-2 rounded-lg border transition-all ${
                    categoryIdx === i
                      ? 'border-[var(--atag-primary)] bg-[rgba(0,102,255,0.15)] text-[var(--atag-primary)] shadow-sm'
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
              <label className="block text-sm text-[var(--atag-text)] mb-3">选择模板</label>
              <div className="grid grid-cols-2 gap-2.5">
                {currentCategory.templates.map((t, i) => (
                  <button key={i} onClick={() => setTemplateIdx(i)}
                    className={`text-sm px-4 py-2.5 rounded-lg border text-left transition-all ${
                      templateIdx === i
                        ? 'border-[var(--atag-primary)] bg-[rgba(0,102,255,0.15)] text-[var(--atag-primary)] shadow-sm'
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
              <label className="block text-sm text-[var(--atag-text)] mb-2">生成指令</label>
              <textarea
                className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)] resize-none transition-colors"
                rows={4}
                placeholder="描述你想生成的演示文档内容..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
            </div>
          )}

          {/* 补充内容 */}
          <div>
            <label className="block text-sm text-[var(--atag-text)] mb-2">粘贴参考内容（可选）</label>
            <textarea
              className="w-full bg-[var(--atag-bg-card)] border border-[var(--atag-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--atag-text)] outline-none focus:border-[var(--atag-primary)] resize-none transition-colors"
              rows={5}
              placeholder="粘贴文档、Markdown 或纯文本，AI 将基于此生成演示网页..."
              value={userContent}
              onChange={(e) => setUserContent(e.target.value)}
            />
          </div>

          {error && <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-[var(--atag-border)] flex justify-end gap-3">
          <button onClick={() => setShowAIPanel(false)}
            className="text-sm px-5 py-2.5 rounded-lg border border-[var(--atag-border)] text-[var(--atag-text-muted)] hover:text-[var(--atag-text)] hover:border-[var(--atag-text-muted)] transition-colors">
            取消
          </button>
          <button onClick={handleGenerate} disabled={loading}
            className="flex items-center gap-2 text-sm px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#00D9FF] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg shadow-blue-500/20">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? '生成中...' : '开始生成'}
          </button>
        </div>
      </div>
    </div>
  )
}
