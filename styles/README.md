# AI 生成风格配置说明

## 目录结构

```
styles/
├── dark-tech.ts       # 暗黑科技风格
├── business.ts        # 商务简约风格
├── energy-green.ts    # 新能源风格
├── mechanical.ts      # 机械工业风格
├── TEMPLATE.ts        # 新增风格的模板（复制此文件开始）
└── README.md          # 本文件
```

## 如何添加新风格

1. 复制 `TEMPLATE.ts`，重命名为你的风格名（如 `my-style.ts`）
2. 修改4个字段：`id`、`name`、`description`、`animationDescription`
3. 保存后，应用启动时会自动扫描加载，UI 中会出现新选项

## 字段说明

| 字段 | 说明 |
|------|------|
| `id` | 唯一标识符，英文小写+连字符 |
| `name` | 显示在 UI 上的名称（中文） |
| `description` | 样式描述：背景色、主色调、卡片、标题、文字颜色 |
| `animationDescription` | 动画描述：各类元素的动画风格和节奏 |

## 注意事项

- 两个描述字段直接拼入 AI 的 system prompt，用自然语言描述即可
- 描述越具体，AI 生成效果越稳定
- 可以在描述中包含具体 CSS 值（时长、缓动函数、颜色值）
