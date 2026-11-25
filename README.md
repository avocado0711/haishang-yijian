# 海上衣笺

面向上服集团定制业务专员、职业服方案设计师与高级定制企划人员的 AI 业务协作台。客户可以在访谈现场直接回答，业务人员负责确认、匹配资源并导出交接台账。

产品覆盖高端私定与团体职业服两种模拟业务：

1. 多轮需求访谈
2. 设计方向与款式图
3. 版型、面料、工艺与历史案例资源检索
4. 面料选择
5. 版型参数与风险提示
6. 打样检查
7. 成衣方案、视觉提示词与业务台账交接

项目不包含用户照片试穿，也不提供正式报价。最终版型、价格、交期和生产决策由上海服装集团业务人员完成。

## 本地运行

Windows 下可直接双击项目根目录的 `start.bat`，脚本会自动检查环境、缺少依赖时安装，并在服务就绪后打开浏览器。

```powershell
pnpm install
pnpm dev
```

访问 `http://localhost:3000`。

## 环境变量

密钥只放在 `.env.local`，由服务端 Route Handler 读取，不会进入浏览器。

DeepSeek：

```dotenv
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_DEFAULT_MODEL=deepseek-flash
```

当前账户可使用 `deepseek-flash` 和 `deepseek-v4-pro`。页面默认使用性价比更高的 `deepseek-flash`。

图像服务采用 OpenAI-compatible `/images/generations` 请求：

```dotenv
IMAGE_API_KEY=
IMAGE_API_BASE_URL=https://provider.example.com/v1
IMAGE_MODEL_FAST=flux-schnell
IMAGE_MODEL_BALANCED=seedream-4
IMAGE_MODEL_QUALITY=gpt-image-1
```

`IMAGE_API_BASE_URL` 为空或请求失败时，设计图会自动回退到文档提取的企业静态设计资产。模型 ID 需要与最终采用的服务商一致。

## 数据与边界

- 版型、面料、工艺、案例、款式图、版型图和打样图来自静态模拟企业档案。
- 已确认需求、AI 提示词、资源快照、版型参数、打样记录和操作留痕会合并为同一份台账。
- 用户提交的台账以完整 JSON 形式写入 `data/handoffs/`，前端可导出 Markdown。
- 页面只收集完成定制承接所需的信息。
- 不自动报价，不承诺交期，不执行生产下单。
- 不连接真实 CRM、生产系统或定制业务 API。

## 比赛文档

- [命题逐条对应](docs/competition-requirements.md)
- [架构、数据来源与业务闭环](docs/architecture.md)
- [Agent 能力边界清单](docs/agent-boundary.md)
- [3 分钟 Demo 与 8 分钟路演脚本](docs/demo-script.md)
- [验收与用户验证方案](docs/validation.md)

自动化验收：

```powershell
node scripts/qa-layout.mjs
node scripts/qa-screenshots.mjs
node scripts/qa-resilience.mjs
node scripts/qa-p1.mjs
```

结果分别覆盖 320–1440px 布局和两条完整业务案例；截图与 `qa/e2e-report.json` 会写入 `qa/`。

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Motion
- Lucide Icons
- DeepSeek Chat Completions
- OpenAI-compatible image generation adapter
