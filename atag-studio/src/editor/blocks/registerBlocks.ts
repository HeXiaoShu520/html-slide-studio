import type { Editor } from 'grapesjs'

/** 注册 ATAG 车载专属组件块到 GrapesJS */
export function registerBlocks(editor: Editor) {
  const bm = editor.BlockManager

  // ===== 基础排版 =====
  bm.add('section-page', {
    label: '📄 页面区块',
    category: '基础排版',
    content: `<div class="page"><h1>页面标题</h1><p>在此输入内容描述</p></div>`,
  })

  bm.add('heading', {
    label: '📝 标题',
    category: '基础排版',
    content: `<h2>标题文本</h2>`,
  })

  bm.add('paragraph', {
    label: '📃 段落',
    category: '基础排版',
    content: `<p>在此输入段落文本内容，支持详细的技术描述和说明。</p>`,
  })

  bm.add('image', {
    label: '🖼️ 图片',
    category: '基础排版',
    content: { type: 'image' },
    activate: true,
  })

  bm.add('video', {
    label: '🎬 视频',
    category: '基础排版',
    content: { type: 'video', src: '', style: { width: '100%', 'max-width': '640px' } },
  })

  bm.add('divider', {
    label: '➖ 分割线',
    category: '基础排版',
    content: `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.15);margin:30px 0;">`,
  })

  // ===== 车载卡片组件 =====
  bm.add('info-card', {
    label: '🃏 信息卡片',
    category: '车载组件',
    content: `
      <div class="card">
        <div class="icon-circle">🔧</div>
        <h3>功能名称</h3>
        <p>功能描述文本，介绍该模块的核心作用和应用场景。</p>
      </div>`,
  })

  bm.add('card-grid', {
    label: '📊 卡片网格',
    category: '车载组件',
    content: `
      <div class="card-grid">
        <div class="card">
          <div class="icon-circle">📡</div>
          <h3>模块一</h3>
          <p>模块描述</p>
        </div>
        <div class="card">
          <div class="icon-circle">🔌</div>
          <h3>模块二</h3>
          <p>模块描述</p>
        </div>
        <div class="card">
          <div class="icon-circle">⚙️</div>
          <h3>模块三</h3>
          <p>模块描述</p>
        </div>
      </div>`,
  })

  bm.add('badge', {
    label: '🏷️ 标签徽章',
    category: '车载组件',
    content: `<span class="badge">ISO 14229</span>`,
  })

  // ===== 流程与图表 =====
  bm.add('flow-diagram', {
    label: '🔄 流程图',
    category: '流程与图表',
    content: `
      <div class="flow-container">
        <div class="flow-step"><strong>步骤 1</strong><br>请求发送</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step"><strong>步骤 2</strong><br>ECU 处理</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step"><strong>步骤 3</strong><br>响应返回</div>
      </div>`,
  })

  bm.add('timeline', {
    label: '📅 时间线',
    category: '流程与图表',
    content: `
      <div class="timeline">
        <div class="timeline-item">
          <h3>阶段一</h3>
          <p>初始化连接，建立诊断会话</p>
        </div>
        <div class="timeline-item">
          <h3>阶段二</h3>
          <p>发送诊断请求，等待响应</p>
        </div>
        <div class="timeline-item">
          <h3>阶段三</h3>
          <p>解析响应数据，完成操作</p>
        </div>
      </div>`,
  })

  // ===== 技术专用 =====
  bm.add('code-block', {
    label: '💻 代码块',
    category: '技术专用',
    content: `<div class="code-block">// 示例代码\nconst request = [0x22, 0xF1, 0x90];\nconst response = await sendUDS(request);\nconsole.log('VIN:', parseVIN(response));</div>`,
  })

  bm.add('packet-table', {
    label: '📦 报文表格',
    category: '技术专用',
    content: `
      <table class="packet-table">
        <thead>
          <tr><th>字节位置</th><th>名称</th><th>值</th><th>说明</th></tr>
        </thead>
        <tbody>
          <tr><td>Byte 0</td><td>SID</td><td>0x22</td><td>读取数据服务</td></tr>
          <tr><td>Byte 1-2</td><td>DID</td><td>0xF190</td><td>VIN 码标识</td></tr>
        </tbody>
      </table>`,
  })

  bm.add('layer-diagram', {
    label: '🏗️ 架构分层',
    category: '技术专用',
    content: `
      <div style="max-width:500px;margin:20px auto;">
        <div style="background:var(--primary);color:#fff;padding:15px;text-align:center;border-radius:12px 12px 0 0;">应用层 (Application)</div>
        <div style="background:rgba(0,102,255,0.6);color:#fff;padding:15px;text-align:center;">传输层 (Transport)</div>
        <div style="background:rgba(0,102,255,0.3);color:#fff;padding:15px;text-align:center;border-radius:0 0 12px 12px;">物理层 (Physical)</div>
      </div>`,
  })
}
