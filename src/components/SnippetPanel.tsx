import type { CodeEditorHandle } from './CodeEditor'

const SNIPPETS = [
  { label: '标题', code: `<h2 style="font-size:2em;color:#fff;margin-bottom:0.4em">标题文本</h2>` },
  { label: '段落', code: `<p style="font-size:1.1em;line-height:1.8;max-width:700px">在此输入段落内容。</p>` },
  { label: '卡片网格', code: `<div class="card-grid">\n  <div class="card"><div class="icon-circle">📡</div><h3>模块一</h3><p>描述文本</p></div>\n  <div class="card"><div class="icon-circle">⚙️</div><h3>模块二</h3><p>描述文本</p></div>\n  <div class="card"><div class="icon-circle">🔌</div><h3>模块三</h3><p>描述文本</p></div>\n</div>` },
  { label: '表格', code: `<table class="packet-table">\n  <thead><tr><th>列1</th><th>列2</th><th>列3</th></tr></thead>\n  <tbody>\n    <tr><td>数据</td><td>数据</td><td>数据</td></tr>\n  </tbody>\n</table>` },
  { label: '图片', code: `<img src="https://via.placeholder.com/600x300" alt="图片" style="max-width:100%;border-radius:12px;margin:20px 0">` },
  { label: '视频', code: `<video controls style="max-width:100%;border-radius:12px;margin:20px 0">\n  <source src="your-video.mp4" type="video/mp4">\n</video>` },
  { label: '代码块', code: `<div class="code-block">// 示例代码\nconst data = [0x22, 0xF1, 0x90];\nconsole.log(data);</div>` },
  { label: '流程图', code: `<div class="flow-container">\n  <div class="flow-step"><strong>步骤 1</strong><br>开始</div>\n  <div class="flow-arrow">→</div>\n  <div class="flow-step"><strong>步骤 2</strong><br>处理</div>\n  <div class="flow-arrow">→</div>\n  <div class="flow-step"><strong>步骤 3</strong><br>结束</div>\n</div>` },
  { label: '徽章', code: `<span class="badge">标签文本</span>` },
  { label: '时间线', code: `<div class="timeline">\n  <div class="timeline-item"><h3>阶段一</h3><p>描述内容</p></div>\n  <div class="timeline-item"><h3>阶段二</h3><p>描述内容</p></div>\n</div>` },
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
          className="px-2 py-1 rounded text-xs transition-colors hover:bg-white/10"
          style={{ border: '1px solid var(--atag-border)', color: 'var(--atag-text-muted)' }}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
