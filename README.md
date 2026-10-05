# 营销机会发现与 Campaign 方案生成原型

一个把营销任务从「寻找机会」推进到「形成 Campaign 方案」的交互原型。前端将 Coze 的两个 Workflow 串成连续流程：先分析并选择营销机会，再围绕选中的机会生成、修改 Campaign 方案。

> 项目阶段：原型验证。页面可以接入已发布的 Coze Workflow；当接口不可用时，会明确显示本地预览结果。预览中的推断和示例分数不能作为真实的知识库召回、用户研究或竞品结论。

## 可以体验什么

1. **描述营销任务**：输入目标、产品、人群、场景等信息，并选择参考资料。
2. **比较机会**：查看 Top 3 机会卡片、机会指数、评分拆解、证据和冲突说明。
3. **确认机会**：选择一个方向，填写修改意见，形成 Workflow 1 的最终机会方案。
4. **生成 Campaign**：将最终机会方案传入 Workflow 2，得到线下体验、社交传播、商业合作三类方案。
5. **选择与修改**：选择 Campaign，补充反馈并查看最终方案。页面还支持在本机浏览器中保存和恢复历史记录。

## 流程与事实边界

```text
营销任务与参考资料
    ↓
Workflow 1：机会分析 → Top 3 → 选择与修改 → 最终机会方案
    ↓
Workflow 2：生成三类 Campaign → 选择与修改 → 最终方案
```

- **Coze 模式**：服务端通过 `/api/coze` 调用已配置的 Coze Workflow，前端展示工作流返回的内容。
- **本地预览模式**：Coze 未配置或调用失败时，页面根据输入生成可交互的示例内容，并标注为预览。示例内容不代表外部资料已完成检索或验证。
- 历史记录存放在当前浏览器的 `localStorage` 中；更换浏览器或清除站点数据后不会保留。

## 本地运行

需要 Node.js 22.13 或更新版本。

```bash
npm install
cp .env.example .env.local
npm run dev
```

打开 <http://localhost:3000/>。如果要使用真实 Coze Workflow，在 `.env.local` 中填写自己的 `COZE_API_TOKEN`，并检查两个 Workflow ID 是否属于你的 Coze 环境：

| 变量 | 用途 |
| --- | --- |
| `COZE_API_TOKEN` | Coze 个人访问令牌；仅供服务端调用 API |
| `COZE_WORKFLOW_1_ID` | 营销机会发现 Workflow ID |
| `COZE_WORKFLOW_2_ID` | Campaign 方案生成 Workflow ID |

`.env.example` 提供配置格式，其中的 `COZE_SPACE_ID` 当前未被应用代码读取。不要把真实令牌提交到仓库。没有可用的 Coze 配置时，仍可体验页面中的本地预览流程。

## 技术实现

前端使用 Next.js、React、TypeScript 和 Tailwind CSS。`app/api/coze/route.ts` 在服务端转发 Coze Workflow 的运行与中断恢复请求；页面组件负责机会与 Campaign 的展示、选择、修改及预览状态。

## 项目位置

- Web 页面：`app/page.tsx`
- Coze API 路由：`app/api/coze/route.ts`
- 环境变量示例：`.env.example`

这是产品交互与工作流串联原型，机会指数和 Campaign 内容的质量取决于所连接的 Workflow、知识库及输入资料；正式业务使用前需要独立核验来源和结论。
