import type { AiStyle } from '../src/themes/aiStyles'

const style: AiStyle = {
  id: 'dark-tech',
  name: '暗黑科技',
  description: `- 背景色：#0a0e1a（深蓝黑）
- 主色调：#0066FF 和 #00D9FF（蓝色系）
- 卡片背景：#111133，圆角 12px，边框 1px solid rgba(0,102,255,0.3)，hover 上移 4px
- 标题：linear-gradient(135deg, #0066FF, #00D9FF) 渐变文字
- 文字颜色：#e0e0e0`,
  animationDescription: `炫酷科技感，元素从各方向高速滑入，配合发光/脉冲效果：
- 标题：从下方 40px 淡入，时长 0.6s，ease
- 卡片：依次从左侧滑入，stagger 间隔 0.15s
- 流程步骤：从左到右依次出现，箭头跟随
- 强调元素：蓝色脉冲发光 pulse 动画（box-shadow 扩散）
- 数据字段：从上方依次落入，间隔 0.1s`,
}

export default style
