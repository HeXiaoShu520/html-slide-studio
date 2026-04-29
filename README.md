# HTML Slide Studio

基于代码编辑的 HTML 演示文档制作工具。左侧 Monaco 编辑器编写 HTML，右侧实时渲染预览，支持 AI 一键生成。

## 快速开始

```bash
npm install
npm run dev
```

## 功能

- **代码编辑**：Monaco Editor，HTML 语法高亮、自动补全
- **实时预览**：编辑代码 300ms 后右侧 iframe 自动更新
- **页面管理**：顶部缩略图栏，点击切换，支持新增/删除
- **组件插入**：预设代码片段（卡片、表格、流程图等），点击插入到光标位置
- **AI 生成**：调用 OpenAI/Claude API，自动生成多页演示文档
- **AI 助手**：左下角聊天面板，框选代码或右键"引用到 AI 助手"，对话式修改当前页
- **右键引用**：代码编辑器右键菜单"引用到 AI 助手"；预览区选中文本后右键同样可引用
- **主题切换**：暗黑科技 / 机械工业
- **演示模式**：全屏翻页，键盘/滚轮控制，IntersectionObserver 触发动画
- **导出**：导出为独立可运行的 HTML 文件

## 每页代码结构

每页是独立的 HTML 片段，页面间完全解耦：

```html
<style>
/* 页面私有样式（可选） */
</style>

<div class="page">
  <!-- 内容 -->
</div>

<script>
// 页面私有脚本（可选）
const config = { title: "标题" }
document.querySelector('h1').textContent = config.title
</script>
```

渲染时自动注入全局样式（主题变量、基础类、动画 keyframes）。

## 可用全局 CSS 类

`.page` `.card` `.card-grid` `.badge` `.icon-circle`
`.flow-container` `.flow-step` `.flow-arrow`
`.timeline` `.timeline-item`
`.code-block` `.packet-table`
`.animate-in` `.animate-fade` `.animate-left` `.animate-right`

## 可用 CSS 变量

`--primary` `--primary-light` `--bg-main` `--bg-card` `--text-color` `--gradient`

## 技术栈

- React 19 + TypeScript
- Vite 8
- Zustand（状态管理）
- Monaco Editor（代码编辑）
- Tailwind CSS（UI 样式）
