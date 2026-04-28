import type { AiStyle } from '../src/themes/aiStyles'

const style: AiStyle = {
  id: 'business',
  name: '商务简约',
  description: `- 背景色：#ffffff（白色）
- 主色调：#1a56db 和 #3b82f6（商务蓝）
- 卡片背景：#f8fafc，圆角 8px，边框 1px solid #e2e8f0，轻微阴影
- 标题：#1e293b 深色，字重 700
- 文字颜色：#475569`,
  animationDescription: `克制简洁，只用 opacity 淡入，无大幅位移：
- 标题：纯淡入，时长 0.4s，无位移
- 卡片：依次淡入，stagger 间隔 0.1s，轻微上移 8px
- 流程步骤：依次淡入，无滑动
- 强调元素：无动画或极轻微缩放 scale(1.02)
- 整体节奏：快速、干净`,
}

export default style
