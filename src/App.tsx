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
      setError("");
    };
    stream.onerror = () => setError("Connection interrupted. Reconnecting…");
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
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main>
      <header>
        <a className="brand">
          <ShieldCheck /> MCP <b>FIREWALL</b>
        </a>
        <span className="tag">LOCAL STDIO · SDK v2</span>
        <span className="fixture">FIXTURE DATA / REAL TOOL EXECUTION</span>
      </header>
      <section className="hero">
        <div>
          <div className="eyebrow">TRUST IS A POLICY. NOT A PROMPT.</div>
          <h1>
            Before the tool runs,
            <br />
            <em>draw the line.</em>
          </h1>
          <p>
            A controlled two-tool gateway. Every request meets a policy.
            <br />
            Every decision leaves evidence.
          </p>
        </div>
        <div className="stats">
          <div>
            <strong>
              {state.events.filter((e) => e.decision === "Allowed").length}
            </strong>
            <span>Allowed</span>
          </div>
          <div>
            <strong className="red">
              {state.events.filter((e) => e.decision === "Denied").length}
            </strong>
            <span>Denied</span>
          </div>
          <small>Actual invocations · last 100 retained</small>
        </div>
      </section>
      <div className="pipeline">
        <span>01 &nbsp; SDK CLIENT</span>
        <ArrowRight size={16} />
        <span className="accent">02 &nbsp; POLICY GATE</span>
        <ArrowRight size={16} />
        <span>03 &nbsp; SANDBOX FILE</span>
        <span className="right">
          No model inference · deterministic enforcement
        </span>
      </div>
      <section className="grid">
        <aside>
          <div className="section-title">
            <LockKeyhole size={17} /> Policy controls
          </div>
          <div className="policy">
            <div>
              <b>Read project note</b>
              <small>Fixed sandbox path only</small>
            </div>
            <span className="badge allowed">ALLOW</span>
          </div>
          <div className="policy">
            <div>
              <b>Write project note</b>
              <small>Default deny · explicit override</small>
            </div>
            <button
              role="switch"
              aria-label="Allow sandbox writes"
              aria-checked={state.allowWrites}
              className={"toggle " + (state.allowWrites ? "on" : "")}
              disabled={busy}
              onClick={() =>
                action("policy", { allowWrites: !state.allowWrites })
              }
            >
              <i />
            </button>
          </div>
          <p className="boundary">
            Scope: fixtures/sandbox/note.txt
            <br />
            No arbitrary paths. No shell. No network tools.
          </p>
          <div className="section-title">
            <FileText size={17} /> Invoke via MCP client
          </div>
          <button
            className="action"
            disabled={busy}
            onClick={() => action("invoke", { tool: "read_project_note" })}
          >
            Read note <ArrowRight size={16} />
          </button>
          <button
            className="action primary"
            disabled={busy}
            onClick={() => action("invoke", { tool: "write_project_note" })}
          >
            Attempt write <ArrowRight size={16} />
          </button>
          <button
            className="restore"
            disabled={busy}
            onClick={() => action("restore")}
          >
            Restore fixture & lock policy
          </button>
          {busy && <p role="status">Waiting for MCP response…</p>}
          {error && <p role="alert">{error}</p>}
        </aside>
        <article>
          <div className="section-title">
            <Activity size={17} /> Request activity{" "}
            <span className="tag right">ARGUMENTS REDACTED</span>
          </div>
          <div className="activity">
            {state.events.length === 0 ? (
              <div className="empty">
                No requests yet.
                <br />
                <small>Invoke a tool to see its real policy decision.</small>
              </div>
            ) : (
              [...state.events].reverse().map((e, i) => (
                <div className="event" key={e.timestamp + i}>
                  <span className={"badge " + e.decision.toLowerCase()}>
                    {e.decision}
                  </span>
                  <div>
                    <b>{e.tool}</b>
                    <small>
                      {e.reason} · executed: {String(e.executed)}
                    </small>
                  </div>
                  <time>{e.timestamp.slice(11, 19)}</time>
                </div>
              ))
            )}
          </div>
          <div className="proof">
            <div className="section-title">
              FILE INTEGRITY{" "}
              <span
                data-testid="integrity"
                className={
                  "right " + (proof?.before === proof?.after ? "accent" : "")
                }
              >
                {proof
                  ? proof.before === proof.after
                    ? "UNCHANGED"
                    : "CHANGED"
                  : "AWAITING INVOCATION"}
              </span>
            </div>
            <div className="hash">
              <span>BEFORE</span>
              <code>{proof?.before ?? state.hash}</code>
            </div>
            <div className="hash">
              <span>AFTER</span>
              <code>{proof?.after ?? "—"}</code>
            </div>
            {proof && (
              <details>
                <summary>Inspect MCP response</summary>
                <pre>{JSON.stringify(proof.result, null, 2)}</pre>
              </details>
            )}
          </div>
        </article>
      </section>
      <footer>
        <span>
          Enforcement happens inside the tool handler, before file access.
        </span>
        <span>CONTROLLED DEMO · NOT A UNIVERSAL MCP INTERCEPTOR</span>
      </footer>
    </main>
  );
}
