# 系统架构设计文档

## 整体架构

```
┌─────────────────────────────────────────────────────┐
│  TopBar: 项目名 | 主题 | AI生成 | 导出 | 演示         │
├─────────────────────────────────────────────────────┤
│  SlideStrip（横向缩略图栏）[页1][页2][+]              │
├──────────────────────┬──────────────────────────────┤
│  SnippetPanel(折叠)  │                              │
│  ──────────────────  │   PreviewFrame               │
│  CodeEditor          │   (iframe srcdoc)            │
│  (Monaco HTML)       │   实时渲染当前页              │
└──────────────────────┴──────────────────────────────┘
```

## 数据流

```
用户编辑代码
    │
    ▼ debounce 300ms
updateCurrentSlide(html)
    │
    ├─► Zustand store.slides[i].html 更新
    │       │
    │       ▼
    │   localStorage 持久化
    │
    └─► PreviewFrame 重新渲染
            │
            ▼
        buildSlideHtml(html, globalCss, themeCSS)
            │
            ▼
        iframe srcdoc 更新
```

## 核心模块

### store/useAppStore.ts
Zustand store，管理全局状态。无副作用，纯数据层。

```typescript
interface Slide { id, title, html }
interface AppState {
  slides: Slide[]
  currentSlideIndex: number
  projectName: string
  currentTheme: ThemeId
  globalCss: string
  previewHtml: string | null
  showAIPanel: boolean
}
```

### utils/buildSlideHtml.ts
纯函数，无副作用。

- `buildSlideHtml(html, globalCss, themeCSS)` — 单页预览
- `buildPresentHtml(slides, globalCss, themeCSS, name)` — 演示模式（scroll-snap + 导航）

### themes/themeCSS.ts
纯函数，返回 CSS 字符串。包含：
- CSS 变量定义（`--primary` 等）
- 全局 reset
- 通用类（`.page`, `.card`, `.badge` 等）
- keyframes 动画

### components/CodeEditor.tsx
Monaco Editor 封装。通过 `ref` 暴露 `insertSnippet(code)` 方法供 SnippetPanel 调用。

### components/PreviewFrame.tsx
`<iframe srcdoc>` 封装。`useMemo` 缓存 srcdoc，避免不必要的重渲染。

### components/SlideStrip.tsx
缩略图栏。每个缩略图是 scale(0.125) 缩小的 iframe，pointer-events:none 防止交互。

### components/SnippetPanel.tsx
可折叠的代码片段面板。点击片段 → 调用 `codeEditorRef.current.insertSnippet(code)`。

### components/AIPanel.tsx
AI 生成面板。调用 OpenAI/Anthropic API，解析返回的 HTML，按 `.page` 分割为独立 slides。

## 每页数据格式

每页 `slide.html` 是**自包含片段**：

```html
<style>/* 页面私有样式 */</style>
<div class="page"><!-- 内容 --></div>
<script>/* 页面私有脚本 */</script>
```

渲染时 `buildSlideHtml` 在外层注入全局样式，页面间无耦合。

## 演示模式

`buildPresentHtml` 拼接所有页面 html，外层包裹：
- `scroll-snap-type: y mandatory` 容器
- IntersectionObserver 触发 `.visible` 动画
- 键盘/滚轮翻页
- 导航按钮（↑ ↺ ↓）

## 文件结构

```
src/
├── App.tsx                  # 布局骨架
├── index.css                # Tailwind + CSS 变量
├── store/useAppStore.ts     # 全局状态
├── themes/themeCSS.ts       # 主题 CSS 生成
├── utils/buildSlideHtml.ts  # HTML 拼装工具
└── components/
    ├── TopBar.tsx           # 顶栏
    ├── SlideStrip.tsx       # 缩略图栏
    ├── CodeEditor.tsx       # Monaco 封装
    ├── PreviewFrame.tsx     # iframe 渲染
    ├── SnippetPanel.tsx     # 代码片段插入
    └── AIPanel.tsx          # AI 生成面板
```
