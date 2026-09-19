# 营销机会发现原型

根据 `marketing1opp` Coze Workflow 制作的本地交互原型。

## 已覆盖的流程

- 输入营销任务和选择参考资料
- 显示知识库、历史 Campaign、用户研究和竞品动态来源
- 生成 Top 3 机会卡片和机会指数
- 展开证据、评分拆解和冲突说明
- 选择方案、输入修改意见、生成最终方案
- 将 Workflow 1 的最终机会 `plan` 传入 Workflow 2 的 `input`
- Workflow 2 生成线下体验、社交传播、商业合作三类 Campaign，并支持二次选择与修改

## 本地运行

```bash
npm run dev
```

打开 `http://localhost:3000/`。

> 已连接已发布的 Coze Workflow 1 与 Workflow 2。Coze 不可访问时，页面会明确切换为本地动态预览；本地结果不会冒充知识库或竞品检索事实。
