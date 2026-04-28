import type { AiStyle } from '../src/themes/aiStyles'

// 复制此文件，重命名为你的风格名（如 my-style.ts），修改下面4个字段即可
const style: AiStyle = {
  // 唯一 ID，英文小写+连字符，不能与已有 id 重复
  id: 'my-style',

  // 显示在 UI 上的名称
  name: '我的风格',

  // 样式描述：告诉 AI 用什么颜色、卡片样式、标题样式
  description: `- 背景色：#xxxxxx
- 主色调：#xxxxxx 和 #xxxxxx
- 卡片背景：#xxxxxx，圆角 Xpx，边框 1px solid #xxxxxx
- 标题：描述标题颜色/渐变/字重
- 文字颜色：#xxxxxx`,

  // 动画描述：告诉 AI 各类元素用什么动画风格
  animationDescription: `描述整体动画风格（如：轻快活泼 / 沉稳克制 / 炫酷科技）：
- 标题：描述标题动画（如：从下方淡入，时长 0.5s）
- 卡片：描述卡片动画（如：依次从左滑入，stagger 0.15s）
- 流程步骤：描述步骤动画（如：从左到右依次出现）
- 强调元素：描述强调动画（如：脉冲发光 / 边框闪烁）
- 整体节奏：快速 / 流畅 / 克制`,
}

export default style
