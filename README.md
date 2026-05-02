# HTML Slide Studio

基于代码的 HTML 演示文档制作工具。左侧 Monaco 代码编辑器，右侧 iframe 实时渲染，支持 AI 一键生成完整幻灯片。

> 与 Slidev / Marp 等工具的区别：完全基于原生 HTML/CSS/JS，动画无限制，所见即所得，导出为单个 HTML 文件无需任何运行时。

## 快速开始

```bash
npm install
npm run dev
# 浏览器访问 http://localhost:5173
```

## 功能

### 代码编辑与预览
- **Monaco Editor**：HTML 语法高亮、自动补全、代码折叠
- **实时预览**：编辑代码后右侧 iframe 自动更新（可配置刷新间隔，≤0 为手动刷新），支持立即刷新按钮
- **页面隔离**：每页是独立 HTML 片段，样式和脚本互不干扰

### 页面管理
- 顶部缩略图栏显示所有页面的等比缩略预览
- 点击切换当前编辑页，末尾 **+** 新增页面
- 右键缩略图可删除页面

### 代码片段插入
内置 25+ 常用组件，点击弹出配置对话框，填写内容后插入到光标位置。分为 5 组：

| 行 | 分组 | 片段 |
|----|------|------|
| 1 | 文字 | 标题、副标题、段落、引用块、列表 |
| 1 | 媒体 | 图片（支持本地文件）、视频 |
| 1 | 卡片 | 单卡片、卡片网格、两列布局、步骤卡片、人物卡片、图文混排 |
| 2 | 数据 | 表格、代码块、流程图、时间线、徽章组、数字统计、进度条、对比表 |
| 2 | 其他 | 换行、分隔线、间距、封面页、提示框 |

**入场动画配置**：插入片段时可配置入场动画效果
- **动画类型**：无 / 上移 / 下移 / 淡入 / 左入 / 右入 / 放大 / 缩小 / 旋转 / 弹跳 / 翻转（共11种）
- **延迟时间**：0-10秒可调，控制元素延迟出现的时间
- **播放时长**：0.1-3秒可调，控制动画播放的持续时间
- **实时预览**：右侧预览区实时显示动画效果（不含延迟）
- **对齐方式**：左对齐 / 居中 / 右对齐
- 动画参数通过 `animation-delay` 和 `animation-duration` 内联样式注入，完全兼容已有 HTML 文件

### AI 生成
- 选择预设模板（技术方案 / 协议讲解 / 培训手册 / 产品发布 / 项目汇报）
- 输入具体描述，AI 自动生成完整多页演示，按 `.page` 自动拆分插入
- 支持通过 VS Code + Claude Code 插件生成，参见 [AI生成提示.md](./AI生成提示.md)

### 右键引用 AI 助手
- 预览区选中文字后右键 → **引用到 AI 助手**，AI 收到时标注"引用"来源
- 直接右键任意元素 → **引用元素内容**，AI 收到时标注"元素内容"来源
- 支持对话式修改当前页代码

### 主题与样式
- 内置主题：暗黑科技 / 机械工业，一键切换
- 支持全局自定义 CSS，注入到所有页面

### 演示模式
- 全屏翻页，支持键盘方向键（↑↓←→）
- 翻页时自动触发入场动画（`.page.entered`）
- 点击**播放**按钮触发演示动画（`.page.visible`）
- 每页右下角自动注入导航按钮，无需手写

### 导入 HTML 文件

点击**打开**按钮可导入已有 `.html` 文件，工具会自动解析出各页内容。

#### 文件格式要求

导入时按以下优先级处理：

**路径1：`<!-- PAGE -->` 分隔符（标准格式，推荐）**

工具导出的文件和 AI 生成的文件均使用此格式：

```html
<!DOCTYPE html>
<html><head>
<style>
  /* ⚠️ 全局样式写在 <head> 里，导入时会提取为 globalCss，
     注入到每一页的 iframe 中。适合放字体、颜色变量、.page 基础布局等。
     注意：这里的样式不属于任何一页，split 后头部会被丢弃，
     必须通过 globalCss 机制才能保留。 */
  body { font-family: 'Segoe UI', sans-serif; background: #000; }
  .page { position: fixed; inset: 0; display: flex; ... }
</style>
</head><body>

<!-- PAGE -->
<style>.p1-title { font-size: 3em; }</style>
<div class="page">第一页内容</div>

<!-- PAGE -->
<style>.p2-card { ... }</style>
<div class="page">第二页内容</div>

<!-- SLIDE-NAV-BEGIN -->
<!-- ⚠️ 导航按钮块，导入时自动剔除，避免重复注入 -->
<div class="pnav">...</div>
<script>/* 翻页脚本 */</script>
<!-- SLIDE-NAV-END -->

</body></html>
```

导入逻辑：
1. 提取 `<head>` 内所有 `<style>` 合并为 `globalCss`（每页渲染时重新注入）
2. 按 `<!-- PAGE -->` 拆分，strip 掉每段的 `<body>` 标签前后内容
3. 剔除导航块：`<!-- SLIDE-NAV-BEGIN/END -->`、`.pnav`、`.pc`、含 `querySelectorAll('.page')` 的 `<script>`
4. 过滤出含 `class="page"` 的段落（兼容多 class，如 `class="page p2-page"`）

**路径2：DOMParser fallback（无 `<!-- PAGE -->` 的旧格式文件）**

自动用 `querySelectorAll('.page')` 找到所有页面元素，提取文档内所有 `<style>` 并 scope 到各页唯一 id，避免多页样式冲突。

### 导出

导出为单个自包含 `.html` 文件，浏览器直接打开即可演示，无需服务器。

**拼接结构（`buildPresentHtml`）：**

```
<!DOCTYPE html>
<html><head>
  <style>
    /* themeCSS：当前主题的 CSS 变量和全局类 */
    /* globalCss：用户自定义全局样式 / 导入时从 <head> 提取的样式 */
  </style>
</head><body>

[页1的 html 片段]
<!-- PAGE -->
[页2的 html 片段]
<!-- PAGE -->
[页N的 html 片段]

<!-- SLIDE-NAV-BEGIN -->
<div class="pnav">上一页 | 播放 | 下一页</div>
<div class="pc" id="pc"></div>  <!-- 页码 -->
<script>/* 翻页脚本：translateY 滑动、键盘控制、.entered 入场动画 */</script>
<!-- SLIDE-NAV-END -->

</body></html>
```

导入时 `<!-- SLIDE-NAV-BEGIN/END -->` 块会被自动剔除，`<head>` 内样式提取为 `globalCss`，各页 `<!-- PAGE -->` 分隔符用于重新拆分页面。

---

## 每页代码结构

每页是独立的 HTML 片段，页面间完全解耦：

```html
<style>
/* 页面私有样式（可选），类名建议加页码前缀避免冲突，如 .p1-node */
.p1-title { font-size: 3em; color: var(--primary); }
</style>

<div class="page">
  <!-- 内容，可使用全局 CSS 类 -->
  <h1 class="p1-title">标题</h1>
  <div class="card-grid">
    <div class="card">卡片一</div>
    <div class="card">卡片二</div>
  </div>
</div>

<script>
// 页面私有脚本（可选）
// 演示动画写成 .page.visible .p1-xxx { animation: ... }
// 入场动画写成 .page.entered .p1-xxx { animation: ... }
</script>
```

渲染时 `buildSlideHtml` 自动在外层注入：主题 CSS 变量、全局类、用户自定义 globalCss。

## 可用全局 CSS 类

| 类名 | 用途 |
|------|------|
| `.page` | 全屏居中容器（必须，每页根元素） |
| `.card` | 卡片（圆角、边框、半透明背景） |
| `.card-grid` | 自适应卡片网格 |
| `.badge` | 徽章标签 |
| `.icon-circle` | 圆形图标容器 |
| `.flow-container` `.flow-step` `.flow-arrow` | 流程图 |
| `.timeline` `.timeline-item` | 时间线 |
| `.packet-table` | 表格 |
| `.code-block` | 代码块（自动语法高亮） |
| `.animate-in` `.animate-fade` `.animate-left` `.animate-right` | 入场动画（翻页时触发） |
| `.linebreak` | 强制换行占位（让 inline 元素独占一行） |

## 可用 CSS 变量

| 变量 | 含义 |
|------|------|
| `--primary` | 主色（蓝色） |
| `--primary-light` | 辅助色（青色） |
| `--gradient` | 渐变（主色→辅助色） |
| `--bg-main` | 页面背景色 |
| `--bg-card` | 卡片背景色 |
| `--text-color` | 正文颜色 |

---

## 架构设计

### 整体布局

```
┌─────────────────────────────────────────────────────┐
│  TopBar: 项目名 | 主题 | AI生成 | 导出 | 演示         │
├─────────────────────────────────────────────────────┤
│  SlideStrip（横向缩略图栏）[页1][页2][+]              │
├──────────────────────┬──────────────────────────────┤
│  SnippetPanel        │                              │
│  ──────────────────  │   PreviewFrame               │
│  CodeEditor          │   (iframe document.write)    │
│  (Monaco HTML)       │   实时渲染当前页              │
└──────────────────────┴──────────────────────────────┘
```

### 数据流

```
用户编辑代码
    │
    ▼ debounce（可配置间隔）
updateCurrentSlide(html)
    │
    ├─► Zustand store → localStorage 持久化
    │
    └─► PreviewFrame 重新渲染
            │
            ▼
        buildSlideHtml(html, globalCss, themeCSS)
            │
            ▼
        iframe document.write 更新
```

### 文件结构

```
src/
├── App.tsx                      # 布局骨架
├── index.css                    # Tailwind + CSS 变量
├── store/
│   └── useAppStore.ts           # Zustand 全局状态 + localStorage 持久化
├── themes/
│   └── themeCSS.ts              # 主题 CSS（变量 + 全局类 + keyframes）
├── utils/
│   ├── buildSlideHtml.ts        # 单页/演示模式 HTML 拼装
│   └── slidePrompt.ts           # AI 生成 system prompt
└── components/
    ├── TopBar.tsx               # 顶栏
    ├── SlideStrip.tsx           # 缩略图栏（iframe 缩略图）
    ├── CodeEditor.tsx           # Monaco Editor 封装，暴露 insertSnippet()
    ├── PreviewFrame.tsx         # iframe srcdoc 实时渲染
    ├── SnippetPanel.tsx         # 代码片段面板
    └── AIPanel.tsx              # AI 生成面板
```

---

## 技术栈

| 功能 | 方案 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite |
| 代码编辑 | Monaco Editor (`@monaco-editor/react`) |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS v4 |
| 实时渲染 | `<iframe>` + `document.write` |
| AI 接口 | OpenAI / Anthropic API（通过 Vite CORS 代理） |
