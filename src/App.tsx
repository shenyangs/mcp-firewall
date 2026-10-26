import { useEffect, useState } from "react";
type Entry = { timestamp: string; tool: string; decision: string; reason: string; executed: boolean };
type State = { allowWrites: boolean; events: Entry[]; hash: string };
type Proof = { before: string; after: string; result: unknown; event: Entry; payload: object };
const reasons: Record<string, string> = { "默认拒绝写入": "写入权限关闭，请求在执行前被拦截", "只读工具已允许": "只读工具，无需写入授权", "已明确授权示例沙盒": "写入权限已开启，仅允许修改示例文件", "Read-only tool permitted": "只读工具，无需写入授权", "Default-deny write policy": "写入权限关闭，请求在执行前被拦截", "Explicit permission for fixture sandbox": "写入权限已开启，仅允许修改示例文件" };
export default function App() {
  const [state, setState] = useState<State>({ allowWrites: false, events: [], hash: "" });
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [proofs, setProofs] = useState<Record<string, Proof>>({});
  const [text, setText] = useState("本地操作者已批准此次示例更新。\n");
  const entry = state.events.find(e => e.timestamp === selected) ?? state.events.at(-1);
  const proof = entry ? proofs[entry.timestamp] : undefined;
  useEffect(() => {
    const stream = new EventSource("/api/events");
    stream.onmessage = e => { setState(JSON.parse(e.data)); setConnected(true); };
    stream.onerror = () => setConnected(false);
    return () => stream.close();
  }, []);
  async function action(path: string, body: Record<string, unknown> = {}) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/" + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await res.json();
      if (!res.ok) throw Error(result.error);
      if (path === "invoke") {
        if (!result.event) throw Error("工具未完成操作，请检查示例文件及权限后重试。");
        setProofs(old => ({ ...old, [result.event.timestamp]: { ...result, payload: body } }));
        setSelected(result.event.timestamp);
      }
    } catch (e) { setError(e instanceof Error && /[\u4e00-\u9fff]/.test(e.message) ? e.message : "请求失败，请检查本地服务后重试。"); }
    finally { setBusy(false); }
  }
  return <>
    <a className="skip" href="#requests">跳到请求记录</a>
    <header className="topbar"><div className="wordmark"><span className="mark">/</span> MCP Firewall</div><span className="workspace">本地工作区 / 请求审查</span><span className="connection">{connected ? "本地服务已连接" : "正在连接…"}</span></header>
    <main aria-busy={busy}>
      <section className="page-heading"><div><p className="overline">MCP / 工具调用</p><h1>请求审查台<span>02 个工具</span></h1><p>检查一次调用，确认它是否真的改动了文件。</p></div><div className="stats" aria-label="最近请求统计"><div><strong>{state.events.filter(e => e.decision === "Allowed").length}</strong><span>允许</span></div><div><strong>{state.events.filter(e => e.decision === "Denied").length}</strong><span>拦截</span></div></div></section>
      <section className="composer" aria-label="发起工具调用">
        <div className="composer-heading"><h2><span className="step">01</span> 发起调用</h2><span className="fixture">示例数据（fixture）／真实工具执行</span></div>
        <div className="controls"><div className="target"><span className="label">目标文件</span><code>fixtures/sandbox/note.txt</code></div><div className="permission"><div><b>允许写入</b><small>{state.allowWrites ? "已开启 · 仅限此文件" : "已关闭 · 默认拦截"}</small></div><button role="switch" aria-label="允许写入沙盒文件" aria-checked={state.allowWrites} className={"toggle " + (state.allowWrites ? "on" : "")} disabled={busy || !connected} onClick={() => action("policy", { allowWrites: !state.allowWrites })}><i /></button></div><div className="actions"><button disabled={busy || !connected} onClick={() => action("invoke", { tool: "read_project_note" })}>读取笔记</button><button className="primary" disabled={busy || !connected || !text.trim()} onClick={() => action("invoke", { tool: "write_project_note", text })}>尝试写入 <span aria-hidden="true">↗</span></button></div></div>
        <details className="payload-editor"><summary>编辑写入内容 <span>默认使用一行示例文字</span></summary><label htmlFor="write-text">写入正文（最多 2,048 字符）</label><textarea id="write-text" value={text} maxLength={2048} onChange={e => setText(e.target.value)} disabled={busy} />{!text.trim() && <p>请填写写入内容。</p>}</details>
        <div className="guide" aria-label="首次使用三步引导">先读取，再尝试写入；开启权限后重试，比较两次结果。<button className="restore" disabled={busy || !connected} onClick={() => action("restore")}>恢复示例并关闭写入</button></div>
      </section>
      {!connected && <p className="notice" role="status">正在连接本地服务。若持续等待，请运行 npm run doctor 检查后重启。</p>}
      {busy && <p className="notice" role="status">正在等待 MCP 响应，请稍候…</p>}
      {error && <p className="notice error" role="alert">{error}</p>}
      <section className="review" id="requests" tabIndex={-1}>
        <section className="ledger" aria-label="请求记录"><div className="section-heading"><h2><span className="step">02</span> 请求记录</h2><span>最近 {state.events.length} 条 / 上限 100</span></div><div className="table-scroll"><table><thead><tr><th>决定</th><th>工具 / 选择查看详情</th><th>执行</th><th>时间 UTC</th></tr></thead><tbody>{[...state.events].reverse().map(e => <tr className={"event " + (entry?.timestamp === e.timestamp ? "selected" : "")} key={e.timestamp}><td><span className={"badge " + e.decision.toLowerCase()}>{e.decision === "Allowed" ? "允许" : "拒绝"}</span></td><td><button className="request-select" aria-pressed={entry?.timestamp === e.timestamp} onClick={() => setSelected(e.timestamp)}><span>{e.tool}</span><small>{e.tool === "read_project_note" ? "读取笔记" : "写入笔记"}</small></button></td><td><span className="execution">实际执行：{e.executed ? "是" : "否"}</span></td><td><time>{e.timestamp.slice(11,19)}</time></td></tr>)}</tbody></table>{state.events.length === 0 && <div className="empty"><span className="empty-glyph">↗</span><h3>还没有调用记录</h3><p>点击“读取笔记”，第一条真实请求会出现在这里。</p></div>}</div><div className="ledger-foot">按请求查看当时的决定。恢复文件不会删除记录。</div></section>
        <aside className="inspector" aria-label="选中请求详情"><div className="section-heading"><h2><span className="step">03</span> 请求详情</h2>{entry && <span className={"badge " + entry.decision.toLowerCase()}>{entry.decision === "Allowed" ? "允许" : "拒绝"}</span>}</div>{entry ? <><div className="detail-block"><span className="label">工具</span><h3>{entry.tool}</h3><time>{entry.timestamp.replace("T", " ").replace("Z", " UTC")}</time></div><div className="detail-block"><span className="label">命中规则</span><p className="rule">{reasons[entry.reason] ?? entry.reason}</p><small>实际执行：{entry.executed ? "是" : "否"}</small></div><div className="detail-block"><div className="detail-title"><span className="label">文件校验 / SHA-256</span><b data-testid="integrity">{proof ? proof.before === proof.after ? "未改变" : "已改变" : "未保存"}</b></div>{proof ? <><div className="hash"><span>调用前</span><code>{proof.before}</code></div><div className="hash"><span>调用后</span><code>{proof.after}</code></div></> : <p className="muted">历史日志不保存文件哈希。重新发起调用即可比较。</p>}</div><div className="detail-block"><span className="label">请求载荷</span>{proof ? <pre data-testid="payload">{JSON.stringify(proof.payload,null,2)}</pre> : <p className="muted">正文未写入日志，仅在发起调用的页面临时显示。</p>}{proof && <details><summary>查看 MCP 原始响应</summary><pre>{JSON.stringify(proof.result,null,2)}</pre></details>}</div></> : <div className="empty detail-empty"><h3>等待第一条请求</h3><p>规则、载荷和文件变化会在这里显示。</p></div>}</aside>
      </section>
      <footer><span>无模型推理 · 按明确规则执行</span><details><summary>范围与限制</summary><p>仅开放两个工具，读写固定示例文件。不是通用 MCP 拦截器或操作系统沙盒。日志最多 100 条，可被本地修改；请求正文仅保留在当前页面。请勿同时运行 CLI 和界面调用。</p></details><span>STDIO / MCP SDK v2</span></footer>
    </main>
  </>;
}
