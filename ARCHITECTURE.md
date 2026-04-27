# HTML Slide Studio — 技术架构文档

## 技术栈

| 层 | 技术 | 用途 |
|----|------|------|
| 框架 | React 18 + TypeScript + Vite | 应用框架 |
| 编辑引擎 | GrapesJS 0.22 | 可视化 HTML 编辑 |
| 样式 | TailwindCSS 4 | UI 样式 |
| 状态管理 | Zustand 5 | 全局状态 |
| AI | OpenAI 兼容 API | 文档生成 |

---

## 目录结构

```
src/
├── App.tsx                    # 根组件，三栏布局 + 预览覆盖层
├── components/
│   ├── TopBar.tsx             # 顶栏：项目名、工具按钮、主题选择
│   ├── LeftPanel.tsx          # 左侧：组件块 / 图层面板
│   ├── RightPanel.tsx         # 右侧：样式 / Traits / 动画面板
│   └── AIPanel.tsx            # AI 生成弹窗
├── editor/
│   ├── GrapesEditor.tsx       # GrapesJS 初始化、自动保存、主题同步
│   └── blocks/
│       └── registerBlocks.ts  # 注册自定义组件块
├── store/
│   └── useAppStore.ts         # Zustand store + 项目保存/加载工具函数
└── themes/
    └── themeCSS.ts            # 主题 CSS 变量生成
```

---

## 核心模块说明

### GrapesEditor.tsx

GrapesJS 的 React 封装。关键设计：

- `storageManager: false` — 禁用 GrapesJS 内置存储，改用自定义 localStorage 方案
- `editor.on('load', ...)` — 等待编辑器完全初始化后再暴露给其他组件，避免时序问题
- `setInterval(5000)` — 每 5 秒调用 `saveProject()` 自动保存
- 主题切换通过 `editor.setStyle(getThemeCSS(theme))` 实时更新 canvas 内样式

### useAppStore.ts

Zustand store，同时导出三个工具函数：

| 函数 | 说明 |
|------|------|
| `saveProject(editor, name, theme)` | 序列化 `editor.getProjectData()` 存入 localStorage |
| `loadProject(editor)` | 从 localStorage 读取并调用 `editor.loadProjectData()` |
| `exportProjectFile(editor, name, theme)` | 导出带 `<!-- atag-meta: {...} -->` 注释的 HTML 文件 |
| `importProjectFile(file)` | 解析导入的 HTML 文件，提取元数据、CSS、HTML 内容 |

### 项目文件格式

导出的 `.html` 文件结构：

```html
<!-- atag-meta: {"projectName":"xxx","theme":"electric-blue"} -->
<style id="atag-css">/* GrapesJS CSS */</style>
<!-- GrapesJS HTML 内容 -->
```

导入时通过正则提取三部分，分别恢复到编辑器。

### 主题系统

三套主题通过 CSS 变量实现，`getThemeCSS(themeId)` 生成注入 canvas 的样式字符串：

```
--primary, --primary-light, --bg-main, --bg-card, --text-color, --gradient
```

AI 生成的 HTML 使用这些变量，切换主题时自动更新配色。

### 预览 / 演示模式

通过 `previewHtml` store 状态控制：

1. TopBar 调用 `setPreviewHtml(fullHtml)` 设置内容
2. App.tsx 检测到非 null 时，在编辑器上方渲染 `<iframe srcDoc={previewHtml}>`
3. 演示模式的 iframe 内通过 `window.parent.postMessage('close-preview', '*')` 通知父窗口关闭

---

## 数据流

```
用户操作
  │
  ├─ 拖拽/编辑 → GrapesJS 内部状态
  │                    │
  │              每 5 秒 saveProject()
  │                    │
  │              localStorage['atag-project-data']
  │
  ├─ AI 生成 → editor.setComponents(html) + editor.setStyle(css)
  │
  ├─ 导出 HTML → editor.getHtml() + editor.getCss() → Blob 下载
  │
  └─ 预览/演示 → setPreviewHtml(fullHtml) → iframe srcDoc
```

---

## 扩展指南

### 添加新组件块

在 `src/editor/blocks/registerBlocks.ts` 中：

```typescript
bm.add('my-block', {
  label: '我的组件',
  category: '自定义',
  content: `<div class="card">...</div>`,
})
```

### 添加新主题

在 `src/themes/themeCSS.ts` 的 `THEMES` 对象中添加新条目，同时在 `src/store/useAppStore.ts` 的 `ThemeId` 类型和 `THEMES` 记录中同步添加。

### 添加 AI 模板类别

在 `src/components/AIPanel.tsx` 的 `CATEGORIES` 数组中添加新类别对象：

```typescript
{
  name: '新类别',
  templates: [
    { label: '模板名', prompt: '生成指令...' },
  ],
}
```
