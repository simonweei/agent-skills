# agent-skills：项目 AI 助手模板

一份可放进 GitHub、重复用于新项目的中文 AI 开发骨架。默认面向 Codex，不绑定业务语言、框架、模型和个人密钥。

## 包含什么

| 层 | 路径 | 用途 |
| --- | --- | --- |
| 项目入口 | `AGENTS.md` | 项目规则与按需文档路由 |
| Agent | `.codex/agents/*.toml` | explorer、implementer、reviewer，按需分工 |
| Skills | `.agents/skills/*/SKILL.md` | 初始化、调试、审查、验证 |
| MCP | `.codex/config.toml` | 官方文档 MCP，默认关闭 |
| Rule | `rules/*.md` | 开发、验证、分工、外部服务规则 |
| 项目事实 | `docs/ai/PROJECT.md` | 业务目标、技术栈、真实命令和决策 |
| 项目指引 | `docs/ai/QUICKSTART.md` | 常用提示词、MCP 配置方法 |

这些是本仓库约定，不是所有 AI 客户端统一识别的格式。Codex 使用 AGENTS.md、.agents/skills、.codex 配置；其他工具需要自己的适配入口。
不预装联网命令、不启动子 Agent、不改变全局配置与审批策略。使用前查看文件内容并信任项目。

## 方式一：GitHub 模板创建新仓库

在本仓库点击 **Use this template → Create a new repository**，然后克隆新仓库。
打开项目根目录，按 docs/ai/QUICKSTART.md 的提示词开始。
业务工程建立后，替换 README 为业务说明，并更新 AGENTS.md 中的实际命令。
此方式独立创建新仓库，不继承模板提交历史，也不会自动同步模板更新。

## 方式二：克隆模板，再安装到项目

需要 Git 和 Node.js 22 或以上，无需 npm install。

```powershell
git clone https://github.com/simonweei/agent-skills.git
node agent-skills/scripts/init-project.mjs --target ./my-app --name my-app --dry-run
node agent-skills/scripts/init-project.mjs --target ./my-app --name my-app
git -C my-app init
```

安装器只复制 AI 规则、Agent、Skills、MCP 示例和 docs/ai，另写版本来源记录。
它不复制模板的 .git、CI、README、维护测试或依赖配置，不安装软件、不初始化 Git、不覆盖现有文件。
已有项目也可以使用；如目标路径冲突，整个安装在写入前停止，先手动审查合并。
业务仓库应自行忽略 `.env`、密钥和本地配置；安装器不修改已有 `.gitignore`。

直接 `git clone` 本仓库会保留模板的 origin。创建业务项目时推荐以上两种方式，避免把业务代码误推回模板仓库。

## 日常使用

```text
使用 project-bootstrap 初始化项目上下文。
目标：【产品与用户】；首版：【功能】；验收：【可观察结果】。
复用已有代码，更新 PROJECT.md，跑通最小核心流程并验证。
```

常规开发无需手动启动所有 Agent。需要并行时明确任务和文件范围，例如：

```text
使用子 Agent：explorer 调查数据流，主 Agent 实现修改，reviewer 只读审查。
```

MCP、角色和 Skills 的自动识别取决于客户端版本及项目受信任状态。遇到不支持的客户端，按 QUICKSTART 手动复用工作流。

## 模板维护与升级

```powershell
node scripts/check-template.mjs
node --test tests/*.test.mjs
```

模板版本位于 `template.json`。安装目标中的 `ai-assistant.json` 记录版本和来源。
升级时在模板仓库运行 `git pull`，对照版本逐项审查合并，不直接覆盖业务项目的规则与配置。
密钥仅保存在本地凭据管理或环境变量。公开仓库前检查待提交文件。

## 配置依据

- [Skills 与目录发现](https://learn.chatgpt.com/docs/build-skills)
- [AGENTS.md 项目指令](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [自定义子 Agent](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Codex 配置参考](https://learn.chatgpt.com/docs/config-file/config-reference)
- [OpenAI 官方文档 MCP](https://developers.openai.com/learn/docs-mcp)

配置格式核对日期：2026-10-23。模板采用 MIT 许可证；业务项目可自行选择许可证。
