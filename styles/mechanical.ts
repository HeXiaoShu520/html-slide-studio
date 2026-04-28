import type { AiStyle } from '../src/themes/aiStyles'

const style: AiStyle = {
  id: 'mechanical',
  name: '机械工业',
  description: `- 背景色：#1a1a1a（深灰）
- 主色调：#607D8B 和 #90A4AE（灰蓝金属色）
- 卡片背景：#2a2a2a，圆角 4px，边框 1px solid #455A64，金属质感
- 标题：#CFD8DC 浅灰色，字重 700，字间距 2px
- 文字颜色：#B0BEC5`,
  animationDescription: `硬朗机械感，元素像齿轮咬合般精准出现：
- 标题：从左侧快速切入，时长 0.3s，linear（无缓动）
- 卡片：从上方依次落下，ease-out，stagger 间隔 0.1s
- 流程步骤：逐个从左切入，间隔 0.1s，节奏紧凑
- 强调元素：边框颜色闪烁动画
- 整体节奏：快速、精准、无拖尾`,
}

export default style
