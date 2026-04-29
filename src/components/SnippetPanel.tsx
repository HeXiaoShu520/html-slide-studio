import type { CodeEditorHandle } from './CodeEditor'

const SNIPPETS = [
  { label: '标题', code: `<h2 style="font-size:2em;color:#fff;margin-bottom:0.4em">标题文本</h2>` },
  { label: '副标题', code: `<h3 style="font-size:1.3em;color:var(--primary);margin-bottom:0.4em">副标题文本</h3>` },
  { label: '段落', code: `<p style="font-size:1.1em;line-height:1.8;max-width:700px">在此输入段落内容。</p>` },
  { label: '卡片网格', code: `<div class="card-grid">\n  <div class="card"><div class="icon-circle">📡</div><h3>模块一</h3><p>描述文本</p></div>\n  <div class="card"><div class="icon-circle">⚙️</div><h3>模块二</h3><p>描述文本</p></div>\n  <div class="card"><div class="icon-circle">🔌</div><h3>模块三</h3><p>描述文本</p></div>\n</div>` },
  { label: '单卡片', code: `<div class="card" style="max-width:500px">\n  <h3 style="margin-bottom:8px">卡片标题</h3>\n  <p>卡片内容描述文本。</p>\n</div>` },
  { label: '表格', code: `<table class="packet-table">\n  <thead><tr><th>列1</th><th>列2</th><th>列3</th></tr></thead>\n  <tbody>\n    <tr><td>数据</td><td>数据</td><td>数据</td></tr>\n    <tr><td>数据</td><td>数据</td><td>数据</td></tr>\n  </tbody>\n</table>` },
  { label: '代码块', code: `<div class="code-block">// 示例代码\nconst data = [0x22, 0xF1, 0x90];\nconsole.log(data);</div>` },
  { label: '流程图', code: `<div class="flow-container">\n  <div class="flow-step"><strong>步骤 1</strong><br>开始</div>\n  <div class="flow-arrow">→</div>\n  <div class="flow-step"><strong>步骤 2</strong><br>处理</div>\n  <div class="flow-arrow">→</div>\n  <div class="flow-step"><strong>步骤 3</strong><br>结束</div>\n</div>` },
  { label: '时间线', code: `<div class="timeline">\n  <div class="timeline-item"><h3>阶段一</h3><p>描述内容</p></div>\n  <div class="timeline-item"><h3>阶段二</h3><p>描述内容</p></div>\n  <div class="timeline-item"><h3>阶段三</h3><p>描述内容</p></div>\n</div>` },
  { label: '徽章组', code: `<div style="display:flex;gap:8px;flex-wrap:wrap">\n  <span class="badge">标签一</span>\n  <span class="badge">标签二</span>\n  <span class="badge-outline">标签三</span>\n</div>` },
  { label: '两列布局', code: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;width:100%;max-width:800px">\n  <div class="card"><h3>左侧标题</h3><p>左侧内容</p></div>\n  <div class="card"><h3>右侧标题</h3><p>右侧内容</p></div>\n</div>` },
  { label: '数字统计', code: `<div style="display:flex;gap:32px;justify-content:center">\n  <div style="text-align:center">\n    <div style="font-size:3em;font-weight:700;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">99%</div>\n    <div style="font-size:.9em;opacity:.7">指标说明</div>\n  </div>\n  <div style="text-align:center">\n    <div style="font-size:3em;font-weight:700;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">200+</div>\n    <div style="font-size:.9em;opacity:.7">指标说明</div>\n  </div>\n</div>` },
  { label: '引用块', code: `<blockquote style="border-left:3px solid var(--primary);padding:12px 20px;margin:16px 0;background:var(--bg-card);border-radius:0 8px 8px 0;font-style:italic;opacity:.85">引用内容文本</blockquote>` },
  { label: '分隔线', code: `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0">` },
  { label: '图片', code: `<img src="https://via.placeholder.com/600x300" alt="图片" style="max-width:100%;border-radius:12px;margin:20px 0">` },
  { label: '视频', code: `<video controls style="max-width:100%;border-radius:12px;margin:20px 0">\n  <source src="your-video.mp4" type="video/mp4">\n</video>` },
  { label: '图标行', code: `<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">\n  <div class="icon-circle"><i class="fas fa-check"></i></div>\n  <div class="icon-circle"><i class="fas fa-star"></i></div>\n  <div class="icon-circle"><i class="fas fa-bolt"></i></div>\n</div>` },
  { label: '进度条', code: `<div style="width:100%;max-width:500px">\n  <div style="display:flex;justify-content:space-between;font-size:.85em;margin-bottom:6px"><span>进度名称</span><span>75%</span></div>\n  <div style="height:8px;background:rgba(255,255,255,0.1);border-radius:4px"><div style="height:100%;width:75%;background:var(--gradient);border-radius:4px"></div></div>\n</div>` },
]

interface Props {
  editorRef: React.RefObject<CodeEditorHandle | null>
}

export default function SnippetPanel({ editorRef }: Props) {
  return (
    <div style={{ borderBottom: '1px solid var(--atag-border)', background: 'var(--atag-bg-panel)', padding: '6px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {SNIPPETS.map(s => (
        <button
          key={s.label}
          onClick={() => editorRef.current?.insertSnippet(s.code)}
          className="px-3 py-1.5 rounded text-xs transition-colors hover:bg-white/10"
          style={{ border: '1px solid var(--atag-border)', color: 'var(--atag-text-muted)' }}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
