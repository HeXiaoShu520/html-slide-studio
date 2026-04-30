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

## 交互控制（必须遵守）

**动画播放**：
- 动画通过 .page.visible 触发：.page 获得 .visible 类时启动动画
- 可用 JS（setTimeout 序列、IntersectionObserver 等）实现复杂时序动画
- 可自定义 @keyframes、CSS transition、JS 驱动的动画效果

**翻页控制**：
- 禁止滚轮翻页
- 支持键盘方向键（↑↓←→）翻页
- 导航按钮（上一页/播放/下一页）由系统自动注入到每页右下角（.pnav），**严禁在页面代码里写任何按钮（button、a、图标按钮均不允许）**，包括重播、刷新、replay、redo 等任何形式的交互按钮
- 可用导航相关全局类：.pnav（固定右下角导航栏）、.pc（页码显示）

每个 .page 必须设置 position:relative。

**CSS 命名隔离**：每页私有 CSS 类名必须加唯一前缀（如页码 p1-、p2-），避免多页共存时冲突。例如：.p1-stage、.p1-node、.p1-bubble。动画触发选择器写成 .page.visible .p1-bubble { animation: ... }。

## 代码规范（必须遵守）

**注释要求**：
- 代码注释覆盖率不低于 30%，每个重要元素、动画、变量都要有中文注释说明用途
- <style> 开头写一段总注释，说明本页的视觉主题和动画逻辑
- 每个 CSS 类定义前加注释，说明它是什么元素、有什么效果
- 每个 @keyframes 前加注释，描述动画的运动轨迹和视觉效果
- <script> 开头写注释说明脚本的整体逻辑

**代码分层**（每层之间加空行分隔）：
1. 顶部总注释块（页面主题、动画说明）
2. CSS 变量 / 根样式
3. 布局类（.page、容器、舞台）
4. 节点 / 元素样式
5. 动画元素样式（气泡、数据包等）
6. @keyframes 动画定义
7. 动画触发规则（.page.visible .xxx）

**示例注释风格**：

/* ── 布局：舞台容器，相对定位，用于放置绝对定位的节点 ── */
.stage { position: relative; height: 360px; }

/* 左侧节点：Tester 诊断仪，固定在舞台左侧垂直居中 */
.node-a { left: 5%; top: 50%; transform: translateY(-50%); }

/* 动画：数据包从左向右飞行，模拟报文在总线上传输 */
@keyframes fly {
  0%   { opacity: 0; transform: translateX(0); }       /* 起点：左侧，不可见 */
  12%  { opacity: 1; }                                  /* 淡入出现 */
  82%  { opacity: 1; transform: translateX(38vw); }    /* 到达右侧 */
  100% { opacity: 0; transform: translateX(38vw); }    /* 淡出消失 */
}

## 设计原则

1. 追求视觉精美，优先使用**舞台式绝对定位布局**：节点固定在左右两侧，中间有总线/连接线，气泡/数据包用 @keyframes 动画飞行
2. 背景使用 radial-gradient 多层渐变，营造深邃科技感
3. 每页动画只传达一个完整流程或主题；场景复杂时拆成多页分别展示
4. 使用 emoji 或 Font Awesome 图标（<i class="fas fa-xxx">）
5. 每页必须用 class="page" 包裹

## 高质量页面示例（参考此风格）

\`\`\`html
<style>
  .stage { position:relative; height:360px; border:1px solid rgba(255,255,255,.2); border-radius:24px; background:rgba(255,255,255,.04); }
  .node { position:absolute; width:160px; padding:16px; border-radius:20px; background:rgba(7,13,31,.8); border:1px solid rgba(255,255,255,.2); text-align:center; }
  .node-a { left:5%; top:50%; transform:translateY(-50%); }
  .node-b { right:5%; top:50%; transform:translateY(-50%); }
  .bus { position:absolute; left:15%; right:15%; top:50%; height:3px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent); }
  .bubble { position:absolute; padding:12px 14px; border-radius:14px; background:rgba(12,18,42,.9); border:1px solid rgba(91,188,255,.4); opacity:0; transform:translateY(10px) scale(.96); left:25%; top:60px; }
  .packet { position:absolute; width:48px; height:30px; border-radius:10px; display:grid; place-items:center; font-weight:800; opacity:0; background:linear-gradient(135deg,#5bbcff,#2b65ff); left:180px; top:calc(50% - 15px); }
  .page.visible .bubble { animation:showB .7s ease .3s forwards; }
  .page.visible .packet { animation:fly 1.8s cubic-bezier(.35,.02,.18,1) .8s forwards; }
  @keyframes showB { to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes fly { 0%{opacity:0;transform:translateX(0)} 12%{opacity:1} 82%{opacity:1;transform:translateX(calc(100vw*.38))} 100%{opacity:0;transform:translateX(calc(100vw*.38))} }
</style>
<div class="page" style="background:radial-gradient(circle at top left,#162a5c 0,transparent 35%),#0b1020; display:flex; align-items:center; justify-content:center;">
  <div style="max-width:1100px;width:100%">
    <h1 style="font-size:clamp(26px,4vw,44px);margin:0 0 24px">页面标题</h1>
    <div class="stage">
      <div class="bus"></div>
      <div class="node node-a"><div style="font-size:28px">💻</div><h3>节点A</h3></div>
      <div class="node node-b"><div style="font-size:28px">🚗</div><h3>节点B</h3></div>
      <div class="bubble">数据内容</div>
      <div class="packet">22</div>
    </div>
  </div>
</div>
\`\`\`

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
