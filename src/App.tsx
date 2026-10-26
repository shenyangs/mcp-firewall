import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ArrowRight,
  LockKeyhole,
  FileText,
  Activity,
} from "lucide-react";
type Entry = {
  timestamp: string;
  tool: string;
  decision: string;
  reason: string;
  executed: boolean;
};
type State = { allowWrites: boolean; events: Entry[]; hash: string };
export default function App() {
  const [state, setState] = useState<State>({
    allowWrites: false,
    events: [],
    hash: "",
  });
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proof, setProof] = useState<{
    before: string;
    after: string;
    result: unknown;
  } | null>(null);
  useEffect(() => {
    const stream = new EventSource("/api/events");
    stream.onmessage = (e) => {
      setState(JSON.parse(e.data));
      setConnected(true);
    };
    stream.onerror = () => setConnected(false);
    return () => stream.close();
  }, []);
  async function action(path: string, body = {}) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw Error(result.error);
      if (path === "invoke") setProof(result);
      if (path === "restore") setProof(null);
    } catch (e) {
      setError(e instanceof Error && /[\u4e00-\u9fff]/.test(e.message) ? e.message : "请求失败，请检查本地服务后重试。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main aria-busy={busy}>
      <header>
        <a className="brand">
          <ShieldCheck /> MCP <b>FIREWALL</b>
        </a>
        <span className="tag">本地 STDIO · SDK v2</span>
        <span className="fixture">示例数据（fixture）／真实工具执行</span>
      </header>
      <section className="hero">
        <div>
          <div className="eyebrow">让权限规则先于工具执行</div>
          <h1>
            工具执行之前，
            <br />
            <em>守住权限边界。</em>
          </h1>
          <p>
            两个受控工具，每次请求都经过权限检查。
            <br />
            每个决定，都有真实证据。
          </p>
        </div>
        <div className="stats">
          <div>
            <strong>
              {state.events.filter((e) => e.decision === "Allowed").length}
            </strong>
            <span>已允许</span>
          </div>
          <div>
            <strong className="red">
              {state.events.filter((e) => e.decision === "Denied").length}
            </strong>
            <span>已拒绝</span>
          </div>
          <small>真实调用 · 仅保留最近 100 条</small>
        </div>
      </section>
      <div className="pipeline">
        <span>01 &nbsp; SDK 客户端</span>
        <ArrowRight size={16} />
        <span className="accent">02 &nbsp; 权限检查</span>
        <ArrowRight size={16} />
        <span>03 &nbsp; 沙盒文件</span>
        <span className="right">
          无模型推理 · 按明确规则执行
        </span>
      </div>
      <div className="guide" aria-label="首次使用三步引导">① 读取笔记，再尝试写入，确认被拒绝　② 开启写入权限，再试一次　③ 恢复示例并关闭写入</div>
      {!connected && <p role="status">正在连接本地服务；若持续等待，请运行 npm run doctor 检查后重启服务。</p>}
      <section className="grid">
        <aside>
          <div className="section-title">
            <LockKeyhole size={17} /> 权限设置
          </div>
          <div className="policy">
            <div>
              <b>读取项目笔记</b>
              <small>仅限固定沙盒文件</small>
            </div>
            <span className="badge allowed">允许</span>
          </div>
          <div className="policy">
            <div>
              <b>写入项目笔记</b>
              <small>默认拒绝 · 需手动开启</small>
            </div>
            <button
              role="switch"
              aria-label="允许写入沙盒文件"
              aria-checked={state.allowWrites}
              className={"toggle " + (state.allowWrites ? "on" : "")}
              disabled={busy || !connected}
              onClick={() =>
                action("policy", { allowWrites: !state.allowWrites })
              }
            >
              <i />
            </button>
          </div>
          <p className="boundary">
            范围： fixtures/sandbox/note.txt
            <br />
            不开放任意路径、命令行或网络工具。
          </p>
          <div className="section-title">
            <FileText size={17} /> 通过 MCP 客户端调用
          </div>
          <button
            className="action"
            disabled={busy || !connected}
            onClick={() => action("invoke", { tool: "read_project_note" })}
          >
            读取笔记 <ArrowRight size={16} />
          </button>
          <button
            className="action primary"
            disabled={busy || !connected}
            onClick={() => action("invoke", { tool: "write_project_note" })}
          >
            尝试写入 <ArrowRight size={16} />
          </button>
          <button
            className="restore"
            disabled={busy || !connected}
            onClick={() => action("restore")}
          >
            恢复示例并关闭写入
          </button>
          {busy && <p role="status">正在等待 MCP 响应，请稍候…</p>}
          {error && <p role="alert">{error}</p>}
        </aside>
        <article>
          <div className="section-title">
            <Activity size={17} /> 真实调用记录{" "}
            <span className="tag right">参数正文不记录</span>
          </div>
          <div className="activity">
            {state.events.length === 0 ? (
              <div className="empty">
                还没有调用记录。
                <br />
                <small>点击“读取笔记”，查看真实的权限检查结果。</small>
              </div>
            ) : (
              [...state.events].reverse().map((e, i) => (
                <div className="event" key={e.timestamp + i}>
                  <span className={"badge " + e.decision.toLowerCase()}>
                    {e.decision === "Allowed" ? "允许" : "拒绝"}
                  </span>
                  <div>
                    <b>{e.tool}</b>
                    <small>
                      {({"Read-only tool permitted":"只读工具已允许","Default-deny write policy":"默认拒绝写入","Explicit permission for fixture sandbox":"已明确授权示例沙盒"} as Record<string,string>)[e.reason] ?? e.reason} · 实际执行：{e.executed ? "是" : "否"}
                    </small>
                  </div>
                  <time>{e.timestamp.slice(11, 19)}</time>
                </div>
              ))
            )}
          </div>
          <div className="proof">
            <div className="section-title">
              文件完整性{" "}
              <span
                data-testid="integrity"
                className={
                  "right " + (proof?.before === proof?.after ? "accent" : "")
                }
              >
                {proof
                  ? proof.before === proof.after
                    ? "未改变"
                    : "已改变"
                  : "等待调用"}
              </span>
            </div>
            <div className="hash">
              <span>调用前</span>
              <code>{proof?.before ?? state.hash}</code>
            </div>
            <div className="hash">
              <span>调用后</span>
              <code>{proof?.after ?? "—"}</code>
            </div>
            {proof && (
              <details>
                <summary>查看 MCP 原始响应</summary>
                <pre>{JSON.stringify(proof.result, null, 2)}</pre>
              </details>
            )}
          </div>
        </article>
      </section>
      <footer>
        <span>
          在工具处理器内部检查权限，先检查再执行文件操作。
        </span>
        <span>受控演示 · 不是通用 MCP 拦截器</span>
      </footer>
    </main>
  );
}
