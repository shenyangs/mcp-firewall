# MCP Firewall · 工具权限防火墙

**智能体请求写文件，防火墙在执行前拦住它。** 本项目通过官方 MCP TypeScript SDK v2，真实启动 stdio 工具进程，展示读取、拒绝写入、手动授权写入及文件哈希证据。

这是固定两个工具的受控网关，**不是所有 MCP 客户端的通用拦截器**。默认使用明确标注的示例数据（fixture），真实执行工具与权限判断，**不调用模型、不需要任何 API Key**。

## 环境与安装

需要 Node.js **22.12+（22 系列）、24.x 或 26+**（匹配锁定的 Vitest 5 要求，推荐 24 LTS）、npm，以及首次安装时的网络连接。依赖和版本由 `package-lock.json` 固定。请在本仓库根目录操作；无父目录或其他项目依赖。

macOS、Windows PowerShell、Linux 均可运行以下命令：

```sh
npm run setup
npm run doctor
npm run dev
```

`setup` 使用 Node 跨平台脚本，先运行 `npm ci --cache .npm-cache`，再安装 Chromium 无头浏览器与 FFmpeg 录像组件。依赖、缓存、下载及临时文件都留在项目目录，不安装系统软件、不修改机器配置。安装会访问 npm/Playwright 下载服务，浏览器下载可能较大。

如果只想运行界面，可先安装依赖，跳过仅测试所需的浏览器：

```sh
npm ci --cache .npm-cache
npm run dev
```

需要测试时补装：`npm run browsers:install`。该命令与 setup 使用同一个安装脚本。Linux 若缺少浏览器系统库，需自行按 Playwright 对应发行版说明安装；本项目不会自动执行系统级安装。Windows 若 PowerShell 阻止 `npm.ps1`，使用 `npm.cmd` 替代命令中的 `npm`，无需更改系统执行策略。

启动后打开 **http://127.0.0.1:4205**；健康检查为 **http://127.0.0.1:5205/api/health**。这两个地址都只绑定本机回环地址。请使用 `127.0.0.1`，避免 localhost 在某些系统解析为 IPv6 导致无法访问。终端会打印中文入口。

## 主要依赖做什么

| 依赖 | 作用 |
| --- | --- |
| React / React DOM 19.3.1 | 中文交互界面、权限开关和事件显示 |
| Vite 8.3.5 / React 插件 6.1.2 | 本地前端服务、API 代理和生产构建 |
| Express 5.3.0 | 本地 API、输入限制与 SSE 状态推送 |
| MCP server / client 2.4.0 | 官方 stdio 服务端和真实工具发现、调用 |
| Zod 4.6.7 | 校验工具和 API 参数，拒绝额外路径字段 |
| TypeScript 7.0.2 / tsx 4.23.15 | 类型检查和运行服务端 TypeScript |
| Vitest 5.0.5 | MCP 集成测试与 doctor 缺依赖诊断测试 |
| Playwright 1.64.1 | Chromium 浏览器断言、中文截图和真实录像 |
| concurrently 10.0.6 | 同时启动前端和 API，结束时清理子进程 |
| lucide-react 1.61.0 | 界面图标 |

`@types/*` 只提供开发时类型声明；Chromium 与 FFmpeg 仅用于浏览器验收和录像。无云服务、数据库、模型、账号或付费依赖。

## 三步演示

1. 点击“读取笔记”，再点击“尝试写入”。真实记录显示拒绝、实际执行为否，调用前后 SHA-256 相同。
2. 开启“允许写入沙盒文件”开关，再点击“尝试写入”。显示允许，固定示例文件被写入，哈希改变。
3. 点击“恢复示例并关闭写入”，恢复原笔记并重新禁止写入。

页面始终显示首次三步引导；按钮支持键盘焦点，开关可用空格切换。调用期间按钮禁用，断线或失败时显示中文提示；小屏可纵向阅读。计数只来自真实工具事件，最多保留最近 100 条。原始响应展开区保留协议字段名，读取内容是中文示例笔记。

`npm run mcp:demo` 可独立运行 SDK 客户端演示，验证读、拒绝、不变哈希、授权写入并在 finally 中恢复原文件。不要与其他测试或界面调用并行执行。

## 检查、失败恢复与复用浏览器

`npm run doctor` 无需第三方依赖即可启动；检查 Node、项目依赖、浏览器、录像组件和 4205/5205 端口。缺项时以中文提示修复命令并返回非零退出码，不要求无关 Key。请在 dev 停止时运行，运行中的本项目也会占用这两个端口。

- **端口冲突**：停止占用 4205 或 5205 的旧服务（运行 dev 的终端按 Ctrl+C），再启动。本项目不自动关闭其他应用，不更改固定端口。
- **依赖缺失或损坏**：重新运行 `npm ci --cache .npm-cache`；安装被中断可重复执行 setup。
- **浏览器/录像组件缺失**：运行 `npm run browsers:install`。无需为了运行 UI 安装浏览器组件。
- **连接中断**：确认 dev 两个服务都启动，访问健康检查地址；重启后刷新页面。
- **写入失败**：确认仓库中的 `fixtures/sandbox/note.txt` 存在且可读写，不是符号链接。正常操作后可用恢复按钮回到默认状态。
- **下载慢**：可只读复用兼容浏览器。默认浏览器目录为 `.playwright-browsers`；用 `PLAYWRIGHT_EXECUTABLE_PATH` 指向已有 Chromium，用 `PLAYWRIGHT_BROWSERS_PATH` 指向包含匹配 FFmpeg 的缓存目录。doctor 仅检查文件存在，实际兼容性由 E2E 验证。

环境变量设置方式不同，路径由你按实际环境填写，不要直接复制占位路径：

```sh
# macOS / Linux
export PLAYWRIGHT_EXECUTABLE_PATH="/实际路径/chrome-headless-shell"
# 可选：export PLAYWRIGHT_BROWSERS_PATH="/实际路径/浏览器缓存"
npm run e2e
```

```powershell
# Windows PowerShell
$env:PLAYWRIGHT_EXECUTABLE_PATH = 'C:\实际路径\chrome-headless-shell.exe'
# 可选：$env:PLAYWRIGHT_BROWSERS_PATH = 'C:\实际路径\浏览器缓存'
npm run e2e
```

`.env.example` 仅作变量说明，项目不自动加载 `.env`。setup 总是安装到本项目目录；以上变量只影响 doctor 和测试复用。

## 真实验证

```sh
npm run build
npm run test
npm run e2e
npm run demo
```

测试断言包括：官方 SDK 发现工具、真实读取、拒绝后文件哈希不变、额外路径字段被拒绝、授权写入、参数正文不进入日志、真实界面计数、中文状态、小屏无横向溢出、键盘焦点、失败提示持续可见。小屏失败反馈测试明确用 HTTP 故障注入，不冒充真实 MCP 调用。

本地证据保留在 `artifacts/logs/`、`artifacts/denied-write.png`、`artifacts/allowed-write.png`、`artifacts/zh-mobile-error.png` 和 `artifacts/playwright/`，具体结果见 `status.json`。录像、日志、缓存不进入 Git。旧版初次构建曾因 SDK 签名错误失败、E2E 曾因缺浏览器/FFmpeg 失败，失败日志均保留，修复后才记录通过。

此次验收复用已有 Chromium，并使用项目内匹配 FFmpeg，未重复巨大下载。**全新环境完整 setup 下载、Windows 和 Linux 实机执行尚未验证**；脚本使用 Node 内置跨平台 API，不能替代这些平台的实测。

## 安全边界与限制

只开放 `read_project_note` 和 `write_project_note`，文件固定为 `fixtures/sandbox/note.txt`，写入最多 2,048 字符。拒绝发生在底层写入前，符号链接被拒绝；不提供任意路径、命令或网络工具。SDK 操作有八秒超时。API 拒绝非指定本地来源的请求。

界面串行执行调用，调用中拒绝切换权限。外部 CLI、多进程并发没有跨进程锁，不能与 UI 或测试并行使用。日志是可修改的本地 JSON，非防篡改审计，最多 100 条。权限在重启后恢复默认拒绝，日志保留。恢复按钮是显式管理操作，不伪装为模型工具事件。

这不是操作系统沙盒或身份认证系统，无法防御恶意本地进程和文件系统竞争攻击。不宣称使用 AI 或具备模型安全防护效果。

MIT 许可证原文见 LICENSE。
