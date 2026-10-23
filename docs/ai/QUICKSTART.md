# 项目内使用

打开项目根目录，向 Codex 发送：

```text
使用 project-bootstrap 初始化这个项目的 AI 上下文。
我的目标是【描述产品】，首版需要【功能】，验收标准是【标准】。
先检查已有代码和配置，复用适用约定，更新 docs/ai/PROJECT.md。
如果是空项目，初始化工程并跑通最小核心流程；完成相关验证。
```

后续任务直接说明目标与验收标准，Skills 可按描述自动选择，也可明确指定名称。

```text
使用 debug-issue 排查【现象】。复现步骤是【步骤】，预期结果是【结果】。
使用 review-change 审查当前改动，关注【业务约束】。
使用 verify-change 验证当前变更，报告运行命令和结果。
```

需要分工时：

```text
使用子 Agent：explorer 先调查认证调用链，主 Agent 根据证据完成修复，
再由 reviewer 审查变更。每项结果给出具体证据。
```

这些提示词不会替代客户端的实际工具能力。自定义 Agent 不可用时，由主 Agent 按对应职责完成。

## 可选 MCP

编辑 `.codex/config.toml`，把 `openaiDeveloperDocs` 的 `enabled` 改为 `true`。
在支持 Codex CLI 的环境用 `codex mcp list` 查看配置；在受信任项目中启动新会话验证工具可用。
这个服务只提供 OpenAI 官方文档，不需要 API 密钥，也不能代替 GitHub 或数据库工具。

如添加自己的 HTTP MCP，可以参考以下结构，替换服务名和地址后再加入配置：

```toml
[mcp_servers.myService]
url = "https://your-service.example/mcp"
bearer_token_env_var = "MY_SERVICE_TOKEN"
enabled = false
```

凭据在客户端启动环境中设置。需要 OAuth 的服务按其官方指南登录，不能把 OAuth 凭据与 Bearer Token 配置混用。
