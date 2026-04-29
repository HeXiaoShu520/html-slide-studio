import { useState } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

const CATEGORIES = [
  {
    name: '车载技术',
    templates: [
      { label: 'UDS 诊断服务', prompt: '生成关于 UDS (ISO 14229) 统一诊断服务的教学演示，包含：封面、协议简介、核心服务分类（卡片）、通信流程图、报文示例、应用场景。' },
      { label: 'SOME/IP 通信', prompt: '生成关于 SOME/IP 面向服务中间件的教学演示，包含：封面、协议概述、服务发现机制、通信模式、报文结构、应用场景。' },
      { label: 'DoIP 诊断', prompt: '生成关于 DoIP (ISO 13400) 基于IP诊断协议的教学演示，包含：封面、协议背景、网络拓扑、连接流程、刷写步骤。' },
      { label: 'OTA 升级', prompt: '生成关于车载 OTA 空中升级的教学演示，包含：封面、OTA 架构、升级流程、安全机制、差分升级、回滚策略。' },
    ],
  },
  {
    name: '技术培训',
    templates: [
      { label: '技术方案介绍', prompt: '生成技术方案介绍演示，包含：封面、背景与痛点、解决方案、核心功能（卡片）、技术架构、实施步骤、预期收益。' },
      { label: '系统架构说明', prompt: '生成系统架构说明演示，包含：封面、系统概述、架构分层图、核心模块、数据流程、接口设计、部署方案。' },
      { label: '操作培训手册', prompt: '生成操作培训手册演示，包含：封面、培训目标、操作流程（步骤图）、关键操作说明、常见问题、注意事项。' },
    ],
  },
  {
    name: '产品展示',
    templates: [
      { label: '产品发布介绍', prompt: '生成产品发布介绍演示，包含：封面（产品名+slogan）、产品亮点（3-4个核心特性卡片）、功能详解、技术规格、应用场景。' },
      { label: '项目汇报', prompt: '生成项目汇报演示，包含：封面、项目背景与目标、项目进展（时间线）、已完成成果、遇到的问题与解决方案、下一步计划。' },
    ],
  },
  { name: '自定义', templates: [{ label: '自定义内容', prompt: '' }] },
]

const SYSTEM_PROMPT = `你是一个专业的 HTML 演示文档生成器。

## 输出格式（严格遵守）

输出多个独立的 HTML 片段，每个片段对应一页幻灯片。每页结构：

\`\`\`html
<style>
/* 该页私有样式（可选） */
.my-el { color: var(--primary); }
</style>

<div class="page">
  <!-- 页面内容 -->
</div>

<script>
// 该页私有脚本（可选）
// 可使用 pageConfig 模式分离数据与逻辑
const config = { title: "标题", items: [...] }
document.querySelector('.title').textContent = config.title
</script>
\`\`\`

## 可用的全局 CSS 类（无需重复定义）

- .page — 全屏居中容器（min-height:100vh, flex, center）
- .card — 卡片（圆角、边框、背景）
- .card-grid — 卡片网格布局
- .badge — 徽章标签
- .icon-circle — 圆形图标容器
- .flow-container / .flow-step / .flow-arrow — 流程图
- .timeline / .timeline-item — 时间线
- .code-block — 代码块
- .packet-table — 表格
- .animate-in / .animate-fade / .animate-left / .animate-right — 入场动画

## 可用的 CSS 变量

--primary, --primary-light, --bg-main, --bg-card, --text-color, --gradient

## 重播按钮（必须）

每个 .page 内必须在右下角放置重播按钮：

\`\`\`html
<button onclick="(function(){const p=this.closest('.page');p.classList.remove('visible');void p.offsetWidth;p.classList.add('visible')}).call(this)" style="position:absolute;bottom:16px;right:16px;width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,0.2);background:rgba(0,0,0,0.5);color:#fff;cursor:pointer;font-size:14px;backdrop-filter:blur(8px)" title="重播动画">↺</button>
\`\`\`

每个 .page 必须设置 position:relative（或已有定位）。

## 设计原则

1. 每页只展示 1-3 个核心要点，保持留白
2. 使用 emoji 或 Font Awesome 图标（<i class="fas fa-xxx">）
3. 动画使用全局类（.animate-in 等），不要自定义复杂动画
4. 每页必须用 class="page" 包裹

只输出 HTML 代码，不要任何解释文字。`

async function callAI(endpoint: string, apiKey: string, model: string, system: string, user: string): Promise<string> {
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

  const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`API 错误 ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return isAnthropic ? data.content[0].text : data.choices[0].message.content
}

export default function AIPanel() {
  const { showAIPanel, setShowAIPanel, setSlides } = useAppStore()
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

  const isCustom = categoryIdx === CATEGORIES.length - 1
  const currentTemplate = CATEGORIES[categoryIdx].templates[templateIdx]
  const currentPrompt = isCustom ? customPrompt : currentTemplate.prompt

  const handleGenerate = async () => {
    if (!apiKey) { setError('请先配置 API Key'); return }
    if (!currentPrompt && !userContent) { setError('请输入生成内容或选择模板'); return }
    setError('')
    setLoading(true)
    try {
      const userMsg = userContent ? `${currentPrompt}\n\n参考内容：\n${userContent}` : currentPrompt
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="border rounded-2xl w-[680px] max-h-[88vh] flex flex-col shadow-2xl"
        style={{ background: 'var(--atag-bg-panel)', borderColor: 'var(--atag-border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--atag-border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0066FF,#00D9FF)' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <span className="text-base font-medium" style={{ color: 'var(--atag-text)' }}>AI 文档生成</span>
          </div>
          <button onClick={() => setShowAIPanel(false)} style={{ color: 'var(--atag-text-muted)' }}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* API 配置 */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)' }}>
            <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--atag-text-muted)' }}>API 配置</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs mb-1" style={{ color: 'var(--atag-text-muted)' }}>Endpoint</label>
                <input className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--atag-bg-panel)', border: '1px solid var(--atag-border)', color: 'var(--atag-text)' }}
                  value={apiEndpoint} onChange={e => { setApiEndpoint(e.target.value); localStorage.setItem('atag-api-endpoint', e.target.value) }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--atag-text-muted)' }}>API Key</label>
                <input type="password" className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--atag-bg-panel)', border: '1px solid var(--atag-border)', color: 'var(--atag-text)' }}
                  value={apiKey} onChange={e => { setApiKey(e.target.value); localStorage.setItem('atag-api-key', e.target.value) }} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--atag-text-muted)' }}>模型</label>
                <input className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: 'var(--atag-bg-panel)', border: '1px solid var(--atag-border)', color: 'var(--atag-text)' }}
                  placeholder="gpt-4o / claude-opus-4-6" value={model}
                  onChange={e => { setModel(e.target.value); localStorage.setItem('atag-model', e.target.value) }} />
              </div>
            </div>
          </div>

          {/* 类别 */}
          <div>
            <label className="block text-sm mb-3" style={{ color: 'var(--atag-text)' }}>文档类别</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat, i) => (
                <button key={i} onClick={() => { setCategoryIdx(i); setTemplateIdx(0) }}
                  className="text-sm px-4 py-1.5 rounded-lg border transition-all"
                  style={{
                    borderColor: categoryIdx === i ? 'var(--atag-primary)' : 'var(--atag-border)',
                    background: categoryIdx === i ? 'rgba(0,102,255,0.15)' : 'var(--atag-bg-card)',
                    color: categoryIdx === i ? 'var(--atag-primary)' : 'var(--atag-text)',
                  }}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 模板 */}
          {!isCustom && (
            <div>
              <label className="block text-sm mb-3" style={{ color: 'var(--atag-text)' }}>选择模板</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES[categoryIdx].templates.map((t, i) => (
                  <button key={i} onClick={() => setTemplateIdx(i)}
                    className="text-sm px-4 py-2 rounded-lg border text-left transition-all"
                    style={{
                      borderColor: templateIdx === i ? 'var(--atag-primary)' : 'var(--atag-border)',
                      background: templateIdx === i ? 'rgba(0,102,255,0.15)' : 'var(--atag-bg-card)',
                      color: templateIdx === i ? 'var(--atag-primary)' : 'var(--atag-text)',
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 自定义 prompt */}
          {isCustom && (
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--atag-text)' }}>生成指令</label>
              <textarea rows={4} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', color: 'var(--atag-text)' }}
                placeholder="描述你想生成的演示文档内容..."
                value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} />
            </div>
          )}

          {/* 参考内容 */}
          <div>
            <label className="block text-sm mb-2" style={{ color: 'var(--atag-text)' }}>粘贴参考内容（可选）</label>
            <textarea rows={4} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
              style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', color: 'var(--atag-text)' }}
              placeholder="粘贴文档、Markdown 或纯文本..."
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
      </div>
    </div>
  )
}
