import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { AI_STYLES } from '../themes/aiStyles'

const CONVERT_PROMPT = `你是一个专业的 HTML 演示文档转换器。

将用户提供的 HTML 内容重新排版为演示文档格式。

## 输出格式要求（严格遵守）

输出完整的 HTML 片段：
1. 一个 <style> 标签，包含所有样式
2. 多个 <div class="page"> 标签，每个代表一张幻灯片

## 转换规则

- 分析原始内容，按逻辑拆分为多张幻灯片（每页 1-3 个核心要点）
- 保留原始内容的所有信息，不要删减
- 每页必须用 class="page" 包裹
- 每页都要有入场动画，遵循以下动画风格：

{{ANIMATION_DESCRIPTION}}

## 样式规范

{{STYLE_DESCRIPTION}}
- 每页必须用 class="page" 包裹

只输出 HTML 代码，不要任何解释文字。`

interface Props {
  rawHtml: string
  apiKey: string
  apiEndpoint: string
  model: string
  onConfirm: (html: string) => void
  onCancel: () => void
}

export default function ImportConvertDialog({ rawHtml, apiKey, apiEndpoint, model, onConfirm, onCancel }: Props) {
  const [styleId, setStyleId] = useState(AI_STYLES[0].id)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConvert = async () => {
    if (!apiKey) { setError('请先在 AI 生成面板配置 API Key'); return }
    setError('')
    setLoading(true)
    try {
      const selectedStyle = AI_STYLES.find(s => s.id === styleId) || AI_STYLES[0]
      const systemPrompt = CONVERT_PROMPT
        .replace('{{STYLE_DESCRIPTION}}', selectedStyle.description)
        .replace('{{ANIMATION_DESCRIPTION}}', selectedStyle.animationDescription)
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `请将以下 HTML 内容转换为演示文档：\n\n${rawHtml}` },
          ],
          max_tokens: 8000,
          temperature: 0.7,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error((errData as any).error?.message || `HTTP ${res.status}`)
      }
      const data = await res.json()
      let html = data.choices?.[0]?.message?.content || ''
      html = html.replace(/^```html?\n?/i, '').replace(/\n?```$/i, '').trim()
      onConfirm(html)
    } catch (err: any) {
      setError(err.message || '转换失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[var(--atag-bg-panel)] border border-[var(--atag-border)] rounded-2xl w-[480px] shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-[var(--atag-primary)]" />
          <span className="text-sm font-medium">检测到非标准 HTML</span>
        </div>
        <p className="text-xs text-[var(--atag-text-muted)]">
          该文件没有 <code className="text-[var(--atag-primary)]">.page</code> 结构，可以选择风格让 AI 自动重构后导入，或直接作为单页导入。
        </p>

        <div>
          <label className="text-xs text-[var(--atag-text-muted)] mb-2 block">选择转换风格</label>
          <div className="flex gap-2 flex-wrap">
            {AI_STYLES.map((s) => (
              <button key={s.id} onClick={() => setStyleId(s.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  styleId === s.id
                    ? 'border-[var(--atag-primary)] bg-[rgba(0,102,255,0.15)] text-[var(--atag-primary)]'
                    : 'border-[var(--atag-border)] bg-[var(--atag-bg-card)] text-[var(--atag-text)] hover:border-[var(--atag-primary)]'
                }`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onCancel}
            className="text-xs px-4 py-2 rounded-lg border border-[var(--atag-border)] text-[var(--atag-text-muted)] hover:text-[var(--atag-text)]">
            直接导入
          </button>
          <button onClick={handleConvert} disabled={loading}
            className="flex items-center gap-1.5 text-xs px-5 py-2 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#00D9FF] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {loading ? 'AI 重构中...' : 'AI 重构导入'}
          </button>
        </div>
      </div>
    </div>
  )
}
