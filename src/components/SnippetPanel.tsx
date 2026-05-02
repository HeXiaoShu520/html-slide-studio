import React, { useState, useMemo, useRef } from 'react'
import type { CodeEditorHandle } from './CodeEditor'

interface Field { key: string; label: string; default: string; type?: 'text' | 'textarea' | 'number' | 'image' | 'video'; min?: number; max?: number }
interface Snippet {
  label: string
  icon: string
  group: string
  fields?: Field[]
  build: (v: Record<string, string>) => string
}

const SNIPPETS: Snippet[] = [
  { label: '标题', icon: '𝐇', group: '文字', fields: [{ key: 't', label: '标题文本', default: '标题文本' }], build: v => `<h2 style="font-size:2em;color:#fff;margin-bottom:0.4em">${v.t}</h2>` },
  { label: '副标题', icon: '𝐡', group: '文字', fields: [{ key: 't', label: '副标题文本', default: '副标题文本' }], build: v => `<h3 style="font-size:1.3em;color:var(--primary);margin-bottom:0.4em">${v.t}</h3>` },
  { label: '段落', icon: '¶', group: '文字', fields: [{ key: 't', label: '段落内容', default: '在此输入段落内容。', type: 'textarea' }], build: v => `<p style="font-size:1.1em;line-height:1.8;max-width:700px">${v.t}</p>` },
  { label: '单卡片', icon: '▭', group: '卡片', fields: [{ key: 'title', label: '卡片标题', default: '卡片标题' }, { key: 'body', label: '卡片内容', default: '卡片内容描述文本。', type: 'textarea' }], build: v => `<div class="card" style="max-width:500px">\n  <h3 style="margin-bottom:8px">${v.title}</h3>\n  <p>${v.body}</p>\n</div>` },
  {
    label: '卡片网格', icon: '⊞', group: '卡片',
    fields: [{ key: 'items', label: '卡片内容（每行：标题|描述）', default: '模块一|描述文本\n模块二|描述文本\n模块三|描述文本', type: 'textarea' }],
    build: v => {
      const lines = v.items.split('\n').filter(Boolean)
      const cards = lines.map(l => { const [t, d] = l.split('|'); return `  <div class="card"><h3>${t?.trim()||''}</h3><p>${d?.trim()||''}</p></div>` })
      return `<div class="card-grid">\n${cards.join('\n')}\n</div>`
    },
  },
  {
    label: '表格', icon: '⊞', group: '数据',
    fields: [
      { key: 'cols', label: '列标题（逗号分隔）', default: '列1,列2,列3' },
      { key: 'rows', label: '行数据（每行用逗号分隔，多行换行）', default: '数据1,数据2,数据3\n数据4,数据5,数据6', type: 'textarea' },
    ],
    build: v => {
      const cols = v.cols.split(',').map(s => s.trim())
      const thead = `<tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>`
      const tbody = v.rows.split('\n').filter(Boolean).map(row => {
        const cells = row.split(',')
        return `<tr>${cols.map((_, i) => `<td>${cells[i]?.trim() || ''}</td>`).join('')}</tr>`
      }).join('\n    ')
      return `<table class="packet-table">\n  <thead>${thead}</thead>\n  <tbody>\n    ${tbody}\n  </tbody>\n</table>`
    },
  },
  { label: '代码块', icon: '</>', group: '数据', fields: [{ key: 'lang', label: '语言', default: 'js' }, { key: 'code', label: '代码内容', default: '// 示例代码\nconst data = [1, 2, 3];', type: 'textarea' }], build: v => `<pre class="code-block"><code class="language-${v.lang}">${v.code}</code></pre>` },
  {
    label: '流程图', icon: '→', group: '数据',
    fields: [{ key: 'steps', label: '步骤（每行一个）', default: '开始\n处理数据\n输出结果\n结束', type: 'textarea' }],
    build: v => {
      const steps = v.steps.split('\n').filter(Boolean)
      const parts: string[] = []
      steps.forEach((s, i) => {
        parts.push(`  <div class="flow-step"><strong>步骤 ${i+1}</strong><br>${s.trim()}</div>`)
        if (i < steps.length - 1) parts.push(`  <div class="flow-arrow">→</div>`)
      })
      return `<div class="flow-container">\n${parts.join('\n')}\n</div>`
    },
  },
  {
    label: '时间线', icon: '⏱', group: '数据',
    fields: [{ key: 'items', label: '时间点（每行：标题|描述）', default: '阶段一|第一阶段描述内容\n阶段二|第二阶段描述内容\n阶段三|第三阶段描述内容', type: 'textarea' }],
    build: v => {
      const items = v.items.split('\n').filter(Boolean).map(l => { const [a, b] = l.split('|'); return `  <div class="timeline-item"><h3>${a?.trim()||''}</h3><p>${b?.trim()||''}</p></div>` })
      return `<div class="timeline">\n${items.join('\n')}\n</div>`
    },
  },
  { label: '徽章组', icon: '🏷', group: '数据', fields: [{ key: 'tags', label: '标签（逗号分隔）', default: '标签一,标签二,标签三' }], build: v => `<div style="display:flex;gap:8px;flex-wrap:wrap">\n${v.tags.split(',').map(t => `  <span class="badge">${t.trim()}</span>`).join('\n')}\n</div>` },
  { label: '两列布局', icon: '⫿', group: '卡片', fields: [{ key: 'lt', label: '左侧标题', default: '左侧标题' }, { key: 'lc', label: '左侧内容', default: '左侧内容' }, { key: 'rt', label: '右侧标题', default: '右侧标题' }, { key: 'rc', label: '右侧内容', default: '右侧内容' }], build: v => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;width:100%;max-width:800px">\n  <div class="card"><h3>${v.lt}</h3><p>${v.lc}</p></div>\n  <div class="card"><h3>${v.rt}</h3><p>${v.rc}</p></div>\n</div>` },
  {
    label: '数字统计', icon: '#', group: '数据',
    fields: [{ key: 'items', label: '统计项（每行：数值|说明）', default: '99%|满意度\n200+|客户数量\n50+|合作伙伴', type: 'textarea' }],
    build: v => {
      const items = v.items.split('\n').filter(Boolean).map(l => { const [val, lbl] = l.split('|'); return `  <div style="text-align:center"><div style="font-size:3em;font-weight:700;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${val?.trim()||''}</div><div style="font-size:.9em;opacity:.7">${lbl?.trim()||''}</div></div>` })
      return `<div style="display:flex;gap:32px;justify-content:center;flex-wrap:wrap">\n${items.join('\n')}\n</div>`
    },
  },
  { label: '引用块', icon: '❝', group: '文字', fields: [{ key: 't', label: '引用内容', default: '引用内容文本', type: 'textarea' }], build: v => `<blockquote style="border-left:3px solid var(--primary);padding:12px 20px;margin:16px 0;background:var(--bg-card);border-radius:0 8px 8px 0;font-style:italic;opacity:.85">${v.t}</blockquote>` },
  { label: '图片', icon: '🖼', group: '媒体', fields: [{ key: 'src', label: '图片（URL 或本地文件）', default: '', type: 'image' }, { key: 'alt', label: 'Alt 文本', default: '图片' }, { key: 'w', label: '宽度（如 100%、300px）', default: '100%' }], build: v => {
    const src = v.src || 'https://via.placeholder.com/600x300'
    const isBase64 = src.startsWith('data:')
    return isBase64
      ? `<img\n  src="${src}"\n  alt="${v.alt}" style="width:${v.w};border-radius:12px;margin:20px 0">`
      : `<img src="${src}" alt="${v.alt}" style="width:${v.w};border-radius:12px;margin:20px 0">`
  } },
  { label: '视频', icon: '▶', group: '媒体', fields: [{ key: 'src', label: '视频（URL 或本地文件）', default: '', type: 'video' }], build: v => `<video controls style="max-width:100%;border-radius:12px;margin:20px 0">\n  <source src="${v.src || ''}" type="video/mp4">\n</video>` },
  { label: '进度条', icon: '▬', group: '数据', fields: [{ key: 'name', label: '进度名称', default: '进度名称' }, { key: 'pct', label: '百分比', default: '75', type: 'number', min: 0, max: 100 }], build: v => `<div style="width:100%;max-width:500px">\n  <div style="display:flex;justify-content:space-between;font-size:.85em;margin-bottom:6px"><span>${v.name}</span><span>${v.pct}%</span></div>\n  <div style="height:8px;background:rgba(255,255,255,0.1);border-radius:4px"><div style="height:100%;width:${v.pct}%;background:var(--gradient);border-radius:4px"></div></div>\n</div>` },

  { label: '换行', icon: '↵', group: '其他', build: () => `<div class="linebreak"></div>` },
  { label: '分隔线', icon: '—', group: '其他', build: () => `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0">` },
  { label: '间距', icon: '↕', group: '其他', fields: [{ key: 'h', label: '高度（px）', default: '40', type: 'number', min: 8, max: 200 }], build: v => `<div style="height:${v.h}px"></div>` },
  { label: '封面页', icon: '◈', group: '其他', fields: [{ key: 'title', label: '主标题', default: '演示标题' }, { key: 'sub', label: '副标题', default: '副标题说明文字' }, { key: 'btn', label: '按钮文字（留空不显示）', default: '开始演示' }], build: v => `<div class="page" style="text-align:center">\n  <h1 style="font-size:3.5em;font-weight:800;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px">${v.title}</h1>\n  <p style="font-size:1.3em;opacity:.7;margin-bottom:32px">${v.sub}</p>\n${v.btn ? `  <button style="padding:12px 32px;border-radius:30px;border:none;background:var(--gradient);color:#fff;font-size:1em;cursor:pointer">${v.btn}</button>` : ''}\n</div>` },
  {
    label: '列表', icon: '≡', group: '文字',
    fields: [{ key: 'type', label: '类型（ul=无序 / ol=有序）', default: 'ul' }, { key: 'items', label: '列表项（每行一条）', default: '第一条内容\n第二条内容\n第三条内容', type: 'textarea' }],
    build: v => {
      const tag = v.type === 'ol' ? 'ol' : 'ul'
      const items = v.items.split('\n').filter(Boolean).map(l => `  <li>${l.trim()}</li>`).join('\n')
      return `<${tag} style="font-size:1.1em;line-height:2;padding-left:1.5em;max-width:600px">\n${items}\n</${tag}>`
    },
  },
  {
    label: '对比表', icon: '⇌', group: '数据',
    fields: [{ key: 'l', label: '左侧标题', default: '优点' }, { key: 'r', label: '右侧标题', default: '缺点' }, { key: 'items', label: '对比项（每行：左|右）', default: '性能高|学习成本高\n生态丰富|配置复杂\n社区活跃|版本迭代快', type: 'textarea' }],
    build: v => {
      const rows = v.items.split('\n').filter(Boolean).map(l => { const [a, b] = l.split('|'); return `  <tr><td>✓ ${a?.trim()||''}</td><td>✗ ${b?.trim()||''}</td></tr>` }).join('\n')
      return `<table class="packet-table" style="max-width:700px">\n  <thead><tr><th>✓ ${v.l}</th><th>✗ ${v.r}</th></tr></thead>\n  <tbody>\n${rows}\n  </tbody>\n</table>`
    },
  },
  {
    label: '提示框', icon: '⚠', group: '其他',
    fields: [{ key: 'type', label: '类型（info/success/warning/error）', default: 'info' }, { key: 'title', label: '标题', default: '提示标题' }, { key: 'body', label: '内容', default: '这里是提示内容。', type: 'textarea' }],
    build: v => {
      const map: Record<string, { color: string; bg: string; icon: string }> = {
        info:    { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  icon: 'ℹ' },
        success: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   icon: '✓' },
        warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: '⚠' },
        error:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   icon: '✗' },
      }
      const s = map[v.type] || map.info
      return `<div style="border-left:4px solid ${s.color};background:${s.bg};border-radius:0 8px 8px 0;padding:16px 20px;max-width:700px">\n  <div style="color:${s.color};font-weight:600;margin-bottom:6px">${s.icon} ${v.title}</div>\n  <div style="opacity:.85">${v.body}</div>\n</div>`
    },
  },
  {
    label: '步骤卡片', icon: '①', group: '卡片',
    fields: [{ key: 'items', label: '步骤（每行一条）', default: '分析需求\n设计方案\n开发实现\n测试上线', type: 'textarea' }],
    build: v => {
      const cards = v.items.split('\n').filter(Boolean).map((l, i) => `  <div class="card" style="text-align:center">\n    <div style="width:36px;height:36px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;font-weight:700;margin:0 auto 12px">${i+1}</div>\n    <p style="margin:0">${l.trim()}</p>\n  </div>`).join('\n')
      return `<div class="card-grid">\n${cards}\n</div>`
    },
  },
  {
    label: '人物卡片', icon: '👤', group: '卡片',
    fields: [{ key: 'items', label: '人物（每行：姓名|职位|描述）', default: '张三|产品经理|负责产品规划与设计\n李四|工程师|负责核心功能开发', type: 'textarea' }],
    build: v => {
      const cards = v.items.split('\n').filter(Boolean).map(l => {
        const [name, role, desc] = l.split('|')
        const initials = (name?.trim()||'?')[0]
        return `  <div class="card" style="text-align:center">\n    <div style="width:60px;height:60px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;font-size:1.5em;font-weight:700;margin:0 auto 12px">${initials}</div>\n    <h3 style="margin-bottom:4px">${name?.trim()||''}</h3>\n    <div style="color:var(--primary);font-size:.85em;margin-bottom:8px">${role?.trim()||''}</div>\n    <p style="font-size:.9em;opacity:.7;margin:0">${desc?.trim()||''}</p>\n  </div>`
      }).join('\n')
      return `<div class="card-grid">\n${cards}\n</div>`
    },
  },
  {
    label: '图文混排', icon: '▤', group: '卡片',
    fields: [{ key: 'dir', label: '方向（left=图左文右 / right=图右文左）', default: 'left' }, { key: 'src', label: '图片', default: '', type: 'image' }, { key: 'title', label: '标题', default: '内容标题' }, { key: 'body', label: '正文', default: '这里是正文内容，可以详细描述图片相关的信息。', type: 'textarea' }],
    build: v => {
      const img = `<img src="${v.src || 'https://via.placeholder.com/400x300'}" style="width:100%;border-radius:12px">`
      const text = `<div>\n    <h2 style="margin-bottom:12px">${v.title}</h2>\n    <p style="line-height:1.8;opacity:.85">${v.body}</p>\n  </div>`
      const [left, right] = v.dir === 'right' ? [text, `<div>${img}</div>`] : [`<div>${img}</div>`, text]
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;max-width:900px">\n  ${left}\n  ${right}\n</div>`
    },
  },
]

interface Props {
  editorRef: React.RefObject<CodeEditorHandle | null>
}

const PREVIEW_BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Microsoft YaHei',sans-serif;background:#0a0e1a;color:#c8d6e5;line-height:1.6;padding:20px;display:flex;align-items:center;justify-content:center;min-height:100vh}
:root{--primary:#0066FF;--primary-light:#00D9FF;--bg-card:rgba(255,255,255,0.07);--gradient:linear-gradient(135deg,#0066FF,#00D9FF)}
h1,h2,h3{color:#fff}
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;width:100%}
.card{background:var(--bg-card);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px}
.badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:.85em;background:var(--gradient);color:#fff}
.flow-container{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap}
.flow-step{background:var(--bg-card);border:1px solid var(--primary);border-radius:10px;padding:14px;text-align:center;min-width:100px}
.flow-arrow{color:var(--primary);font-size:20px}
.timeline{position:relative;max-width:500px;margin:0 auto;padding-left:24px;border-left:2px solid var(--primary)}
.timeline-item{position:relative;margin-bottom:20px;padding-left:16px}
.timeline-item::before{content:'';position:absolute;left:-30px;top:5px;width:10px;height:10px;border-radius:50%;background:var(--primary)}
.packet-table{width:100%;border-collapse:collapse}
.packet-table th,.packet-table td{border:1px solid rgba(255,255,255,0.15);padding:8px 12px;text-align:left}
.packet-table th{background:var(--primary);color:#fff}
.packet-table tr:nth-child(even){background:rgba(255,255,255,0.03)}
.code-block{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:16px;font-family:monospace;font-size:13px;color:#c9d1d9;overflow-x:auto;white-space:pre}
.icon-circle{width:50px;height:50px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;font-size:20px}
`

export default function SnippetPanel({ editorRef }: Props) {
  const [active, setActive] = useState<Snippet | null>(null)
  const [vals, setVals] = useState<Record<string, string>>({})
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({})
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left')
  const [enterAnim, setEnterAnim] = useState<'' | 'animate-in' | 'animate-down' | 'animate-fade' | 'animate-left' | 'animate-right' | 'animate-zoom' | 'animate-zoom-out' | 'animate-rotate' | 'animate-bounce' | 'animate-flip'>('')
  const [animDelay, setAnimDelay] = useState(0)
  const [animDuration, setAnimDuration] = useState(0.5)
  const alignRef = useRef(align)

  const previewSrcdoc = useMemo(() => {
    if (!active) return ''
    const previewVals = { ...vals }
    active.fields?.forEach(f => { if (f.type === 'image' && previewUrls[f.key]) previewVals[f.key] = previewUrls[f.key] })
    let html = active.build(previewVals)

    // 应用动画到预览（预览不使用延迟，只使用时长）
    if (enterAnim) {
      html = `<div class="${enterAnim}" style="animation-duration:${animDuration}s">\n${html}\n</div>`
    }

    const animCSS = `
@keyframes fadeInUp{to{opacity:1;transform:translateY(0)}}
@keyframes fadeInDown{to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{to{opacity:1}}
@keyframes slideInLeft{to{opacity:1;transform:translateX(0)}}
@keyframes slideInRight{to{opacity:1;transform:translateX(0)}}
@keyframes zoomIn{to{opacity:1;transform:scale(1)}}
@keyframes zoomOut{to{opacity:1;transform:scale(1)}}
@keyframes rotateIn{to{opacity:1;transform:rotate(0) scale(1)}}
@keyframes bounceIn{0%{opacity:0;transform:scale(0.3)}50%{transform:scale(1.05)}70%{transform:scale(0.9)}100%{opacity:1;transform:scale(1)}}
@keyframes flipIn{to{opacity:1;transform:perspective(400px) rotateY(0)}}
.animate-in{opacity:0;transform:translateY(30px)}
.animate-down{opacity:0;transform:translateY(-30px)}
.animate-fade{opacity:0}
.animate-left{opacity:0;transform:translateX(-50px)}
.animate-right{opacity:0;transform:translateX(50px)}
.animate-zoom{opacity:0;transform:scale(0.8)}
.animate-zoom-out{opacity:0;transform:scale(1.2)}
.animate-rotate{opacity:0;transform:rotate(-180deg) scale(0.8)}
.animate-bounce{opacity:0;transform:scale(0.3)}
.animate-flip{opacity:0;transform:perspective(400px) rotateY(90deg)}
.page.entered .animate-in{animation:fadeInUp ease-out forwards}
.page.entered .animate-down{animation:fadeInDown ease-out forwards}
.page.entered .animate-fade{animation:fadeIn ease-out forwards}
.page.entered .animate-left{animation:slideInLeft ease-out forwards}
.page.entered .animate-right{animation:slideInRight ease-out forwards}
.page.entered .animate-zoom{animation:zoomIn cubic-bezier(.34,1.56,.64,1) forwards}
.page.entered .animate-zoom-out{animation:zoomOut cubic-bezier(.34,1.56,.64,1) forwards}
.page.entered .animate-rotate{animation:rotateIn cubic-bezier(.34,1.56,.64,1) forwards}
.page.entered .animate-bounce{animation:bounceIn cubic-bezier(.68,-0.55,.27,1.55) forwards}
.page.entered .animate-flip{animation:flipIn ease-out forwards}`

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${PREVIEW_BASE_CSS}${animCSS}</style></head><body><div class="page entered">${html}</div><script>setTimeout(()=>{document.querySelector('.page').classList.add('entered')},50)<\/script></body></html>`
  }, [active, vals, previewUrls, enterAnim, animDelay, animDuration])

  const open = (s: Snippet) => {
    if (!s.fields) { editorRef.current?.insertSnippet(s.build({})); return }
    const defaults: Record<string, string> = {}
    s.fields.forEach(f => { defaults[f.key] = f.default })
    setVals(defaults)
    setPreviewUrls({})
    setActive(s)
  }

  const confirm = () => {
    if (!active) return
    let html = active.build(vals)

    // 应用入场动画
    if (enterAnim) {
      // 包装在一个div中，直接应用动画
      html = `<div class="${enterAnim}" style="animation-delay:${animDelay}s;animation-duration:${animDuration}s">\n${html}\n</div>`
    }

    // 应用对齐
    const marginStyle = { left: 'margin-right:auto', center: 'margin:0 auto', right: 'margin-left:auto' }[align]
    const wrapped = align === 'left' ? html
      : `<div style="width:fit-content;${marginStyle}">\n${html}\n</div>`
    editorRef.current?.insertSnippet(wrapped)
    setActive(null)
  }

  return (
    <>
      <div style={{ borderBottom: '1px solid var(--atag-border)', background: 'var(--atag-bg-panel)', padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {([['文字', '媒体', '卡片'], ['数据', '其他']] as const).map((row, ri) => (
          <div key={ri} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
            {row.map((group, gi) => (
              <React.Fragment key={group}>
                <span style={{ fontSize: 11, color: '#4d9eff', fontWeight: 600, minWidth: 24, marginLeft: gi > 0 ? 16 : 0 }}>{group}</span>
                {SNIPPETS.filter(s => s.group === group).map(s => (
                  <button key={s.label} onClick={() => open(s)}
                    className="px-2 py-1 rounded text-xs transition-colors hover:bg-white/10"
                    style={{ border: '1px solid var(--atag-border)', color: 'var(--atag-text-muted)' }}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>

      {active && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setActive(null)}>
          <div style={{ background: 'var(--atag-bg-panel)', border: '1px solid var(--atag-border)', borderRadius: 12, padding: 20, width: 780, maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: 12 }}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.key === 'Escape' && setActive(null)}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--atag-text)' }}>{active.icon} {active.label}</div>
            <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden', minHeight: 0 }}>
              {/* 左侧表单 */}
              <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
                {active.fields?.map(f => (
                  <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 11, color: 'var(--atag-text-muted)' }}>{f.label}</label>
                    {f.type === 'textarea'
                      ? <textarea value={vals[f.key]} rows={4} onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
                          style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', borderRadius: 6, padding: '6px 8px', fontSize: 12, color: 'var(--atag-text)', resize: 'vertical', outline: 'none' }} />
                      : f.type === 'number'
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="range" min={f.min ?? 0} max={f.max ?? 100} value={vals[f.key]} onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
                              style={{ flex: 1, accentColor: 'var(--atag-primary)' }} />
                            <span style={{ fontSize: 12, color: 'var(--atag-text)', minWidth: 28, textAlign: 'right' }}>{vals[f.key]}</span>
                          </div>
                        : f.type === 'image'
                          ? <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <input type="text" value={vals[f.key]} placeholder="粘贴图片 URL…" onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
                                style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', borderRadius: 6, padding: '6px 8px', fontSize: 12, color: 'var(--atag-text)', outline: 'none' }} />
                              <button onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = () => { const file = inp.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { const b64 = reader.result as string; setPreviewUrls(p => ({ ...p, [f.key]: b64 })); setVals(v => ({ ...v, [f.key]: b64 })) }; reader.readAsDataURL(file) }; inp.click() }}
                                style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--atag-border)', background: 'transparent', color: 'var(--atag-text-muted)', fontSize: 11, cursor: 'pointer', textAlign: 'left' }}>
                                📁 选择本地文件（自动内嵌）
                              </button>
                              {previewUrls[f.key] && <img src={previewUrls[f.key]} style={{ maxHeight: 80, borderRadius: 6, objectFit: 'cover' }} />}
                            </div>
                        : f.type === 'video'
                          ? <><input type="text" value={vals[f.key]} placeholder="粘贴网络视频 URL…" onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
                              style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', borderRadius: 6, padding: '6px 8px', fontSize: 12, color: 'var(--atag-text)', outline: 'none' }} />
                            <span style={{ fontSize: 11, color: '#f87171', marginTop: 4, display: 'block' }}>不支持本地视频文件，请使用网络 URL</span></>
                            : <input type="text" value={vals[f.key]} onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))}
                                style={{ background: 'var(--atag-bg-card)', border: '1px solid var(--atag-border)', borderRadius: 6, padding: '6px 8px', fontSize: 12, color: 'var(--atag-text)', outline: 'none' }} />
                    }
                  </div>
                ))}
              </div>
              {/* 右侧预览 */}
              <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--atag-border)', background: '#0a0e1a' }}>
                <div style={{ fontSize: 10, color: 'var(--atag-text-muted)', padding: '4px 8px', borderBottom: '1px solid var(--atag-border)' }}>预览</div>
                <iframe key={`${enterAnim}-${animDuration}`} srcDoc={previewSrcdoc} sandbox="allow-scripts" style={{ width: '100%', height: 'calc(100% - 24px)', border: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--atag-text-muted)', marginRight: 4 }}>对齐</span>
              {(['left', 'center', 'right'] as const).map(a => (
                <button key={a} onClick={() => setAlign(a)}
                  style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer', border: '1px solid ' + (align === a ? 'var(--atag-primary)' : 'var(--atag-border)'), background: align === a ? 'var(--atag-primary)' : 'transparent', color: align === a ? '#fff' : 'var(--atag-text-muted)' }}>
                  {{ left: '左', center: '居中', right: '右' }[a]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--atag-text-muted)', marginRight: 4 }}>入场动画</span>
              {([
                ['', '无'], ['animate-in', '上移'], ['animate-down', '下移'], ['animate-fade', '淡入'],
                ['animate-left', '左入'], ['animate-right', '右入'], ['animate-zoom', '放大'],
                ['animate-zoom-out', '缩小'], ['animate-rotate', '旋转'], ['animate-bounce', '弹跳'], ['animate-flip', '翻转']
              ] as const).map(([val, label]) => (
                <button key={val} onClick={() => setEnterAnim(val)}
                  style={{ padding: '4px 10px', borderRadius: 5, fontSize: 11, cursor: 'pointer', border: '1px solid ' + (enterAnim === val ? 'var(--atag-primary)' : 'var(--atag-border)'), background: enterAnim === val ? 'var(--atag-primary)' : 'transparent', color: enterAnim === val ? '#fff' : 'var(--atag-text-muted)' }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--atag-text-muted)', marginRight: 4 }}>延迟</span>
              <input type="range" min="0" max="10" step="0.1" value={animDelay} onChange={e => setAnimDelay(Number(e.target.value))}
                style={{ width: 80, accentColor: 'var(--atag-primary)' }} />
              <span style={{ fontSize: 11, color: 'var(--atag-text)', minWidth: 32 }}>{animDelay}s</span>
              <span style={{ fontSize: 11, color: 'var(--atag-text-muted)', marginLeft: 16 }}>时长</span>
              <input type="range" min="0.1" max="3" step="0.1" value={animDuration} onChange={e => setAnimDuration(Number(e.target.value))}
                style={{ width: 80, accentColor: 'var(--atag-primary)' }} />
              <span style={{ fontSize: 11, color: 'var(--atag-text)', minWidth: 32 }}>{animDuration}s</span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setActive(null)}
                style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid var(--atag-border)', background: 'transparent', color: 'var(--atag-text-muted)', fontSize: 12, cursor: 'pointer' }}>取消</button>
              <button onClick={confirm}
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: 'var(--atag-primary)', color: '#fff', fontSize: 12, cursor: 'pointer' }}>插入</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
