# HTML Slide Studio

> 通用 HTML 演示文档生成与可视化编辑工具

基于 AI 生成 + GrapesJS 可视化编辑，支持多类别演示文档的创建、编辑和导出。

## 功能

- **AI 生成** — 选择类别模板（车载技术 / 技术培训 / 产品展示 / 自定义），粘贴参考内容，一键生成
- **可视化编辑** — 拖拽组件、双击编辑文字、右侧面板调整样式
- **主题切换** — 电动蓝 / 机械灰 / 新能源绿
- **预览 / 演示** — 在当前窗口内全屏预览，演示模式支持键盘翻页（↑↓ / 空格）
- **自动保存** — 每 5 秒自动保存到 localStorage，重启后自动恢复
- **导入 / 导出** — 导出带元数据的 HTML 文件，可重新导入继续编辑

## 快速开始

```bash
cd atag-studio
npm install
npm run dev
```

访问 http://localhost:5173

## 技术栈

- React 18 + TypeScript + Vite
- GrapesJS（可视化编辑引擎）
- TailwindCSS + Zustand
- OpenAI 兼容 API（AI 生成）

## 项目结构

```
atag-studio/src/
├── components/   # TopBar, LeftPanel, RightPanel, AIPanel
├── editor/       # GrapesJS 封装 + 组件块注册
├── store/        # 状态管理 + 项目保存/加载
└── themes/       # 主题 CSS 生成
```

## 导出格式

导出的 HTML 文件包含 `<!-- atag-meta: {...} -->` 注释，记录项目名和主题，可通过"打开项目"重新导入编辑。

## License

MIT
