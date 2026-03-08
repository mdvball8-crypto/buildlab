"use client";
import { useState, useRef, useEffect } from "react";

/* ═══════════════════════════════════════
   BuildLab — Turn tutorials into blueprints
   Vercel-ready: uses /api routes + localStorage
   ═══════════════════════════════════════ */

// ── Storage via localStorage ──
function loadDB() {
  try {
    const raw = typeof window !== "undefined" && localStorage.getItem("buildlab");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { user: null, builds: [], steps: {}, proofs: {} };
}
function saveDB(db) {
  try { typeof window !== "undefined" && localStorage.setItem("buildlab", JSON.stringify(db)); } catch {}
}

// ── YouTube ID detection ──
function getYTId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── API calls (go through our server routes) ──
async function fetchYouTubeContent(url) {
  const res = await fetch("/api/youtube", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

async function generateBlueprint(text) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  if (!data.title || !data.steps?.length) throw new Error("Invalid blueprint returned");
  return data;
}

// ── Sample tutorial ──
const SAMPLE = `How to Build a Personal AI Chatbot with OpenAI API and Streamlit

In this tutorial, you'll build a fully functional AI chatbot using Python, OpenAI's API, and Streamlit for the frontend.

Step 1: Set up your Python environment. Install Python 3.10+, create a virtual environment with python -m venv chatbot-env
Step 2: Install dependencies: pip install openai streamlit python-dotenv
Step 3: Get your OpenAI API key from platform.openai.com. Store it in a .env file as OPENAI_API_KEY=your_key_here
Step 4: Create app.py with a Streamlit chat interface using st.chat_message and st.chat_input
Step 5: Connect to OpenAI API using the chat completions endpoint with gpt-4
Step 6: Add conversation memory by storing messages in st.session_state
Step 7: Add a system prompt to give your chatbot a custom personality
Step 8: Style the app with custom CSS and add a title and description
Step 9: Test locally with streamlit run app.py
Step 10: Deploy to Streamlit Community Cloud by pushing to GitHub and connecting your repo

By the end you'll have a deployed AI chatbot you can share with anyone!`;

// ── Icon ──
const Ic = ({ d, s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

// ── Toggle ──
function Tog({ on, set, label }) {
  return (
    <div className="tg" onClick={() => set(!on)}>
      <div className={`tt ${on ? "on" : ""}`}><div className="tk" /></div>
      <span style={{ fontSize: 13, color: "var(--tx2)" }}>{label}</span>
    </div>
  );
}

// ── Landing ──
function Landing({ onLogin }) {
  const [e, setE] = useState("");
  return (
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <div className="au" style={{ textAlign: "center", padding: "64px 0 32px" }}>
        <div style={{ fontFamily: "var(--mn)", fontSize: 11, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 12 }}>Stop saving. Start shipping.</div>
        <h1 style={{ fontSize: "clamp(30px,6vw,48px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 16 }}>
          Turn tutorials into <span style={{ color: "var(--ac)" }}>build blueprints</span>
        </h1>
        <p style={{ fontSize: 15, color: "var(--tx2)", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
          Paste any tutorial. Get a step-by-step plan. Submit proof-of-work to complete.
        </p>
      </div>
      <div className="cd au" style={{ animationDelay: ".08s" }}>
        <div className="lb">Sign in</div>
        <input className="inp" placeholder="you@email.com" value={e} onChange={(x) => setE(x.target.value)}
          onKeyDown={(x) => x.key === "Enter" && e.trim() && onLogin(e.trim())} style={{ marginBottom: 12 }} />
        <button className="b bp blg bw" disabled={!e.trim()} onClick={() => onLogin(e.trim())}>
          <Ic d="M5 12h14M12 5l7 7-7 7" s={15} /> Enter BuildLab
        </button>
      </div>
    </div>
  );
}

// ── Create Build ──
function Create({ onDone, onBack }) {
  const [mode, setMode] = useState("text");
  const [txt, setTxt] = useState("");
  const [url, setUrl] = useState("");
  const [priv, setPriv] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState(null);

  const go = async () => {
    setLoading(true); setErr(null); setStatus("");
    try {
      let content;
      if (mode === "text") {
        if (!txt.trim()) return;
        content = txt.trim();
      } else {
        if (!url.trim()) return;
        const ytId = getYTId(url.trim());
        if (ytId) {
          setStatus("Extracting tutorial content from YouTube…");
          content = await fetchYouTubeContent(url.trim());
        } else {
          content = `Tutorial from this URL: ${url.trim()}\n\nPlease create a build blueprint based on what you can find about this resource.`;
        }
      }
      setStatus("Generating your beginner-friendly blueprint…");
      const bp = await generateBlueprint(content);
      onDone({ bp, text: priv ? null : content, priv, sourceUrl: mode === "url" ? url.trim() : null });
    } catch (e) {
      console.error(e);
      setErr(e.message?.includes("parse") || e.message?.includes("JSON") || e.message?.includes("position")
        ? "The blueprint was too long and got cut off. Click Generate again — it usually works on the second try!"
        : (e.message || "Generation failed. Try again or use the example."));
      setLoading(false);
      setStatus("");
    }
  };

  const hasInput = mode === "text" ? txt.trim() : url.trim();
  const ytId = mode === "url" ? getYTId(url) : null;

  return (
    <div className="au">
      <button className="b bg" onClick={onBack} style={{ marginBottom: 18 }}><Ic d="M15 18l-6-6 6-6" s={14} /> Dashboard</button>
      <h2 style={{ fontFamily: "var(--mn)", fontSize: 20, fontWeight: 700, marginBottom: 5 }}>New Build</h2>
      <p style={{ color: "var(--tx2)", fontSize: 14, marginBottom: 24 }}>Paste tutorial content or a YouTube/website URL.</p>
      <div className="ptb" style={{ maxWidth: 280, marginBottom: 16 }}>
        <button className={`pt ${mode === "text" ? "pto" : ""}`} onClick={() => setMode("text")}>Paste Text</button>
        <button className={`pt ${mode === "url" ? "pto" : ""}`} onClick={() => setMode("url")}>URL</button>
      </div>
      {mode === "text" ? (
        <textarea className="txa" placeholder="Paste your tutorial, thread, or walkthrough here..." value={txt} onChange={(x) => setTxt(x.target.value)} style={{ marginBottom: 8 }} />
      ) : (
        <div style={{ marginBottom: 8 }}>
          <input className="inp" placeholder="https://youtube.com/watch?v=... or any tutorial URL" value={url} onChange={(x) => setUrl(x.target.value)} />
          {ytId && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ width: 120, borderRadius: 6, border: "1px solid var(--bd)" }} />
              <div>
                <span style={{ background: "rgba(255,0,0,.12)", color: "#ff4444", fontFamily: "var(--mn)", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 3, textTransform: "uppercase" }}>YouTube</span>
                <p style={{ fontSize: 12, color: "var(--tx2)", marginTop: 4 }}>We'll extract the transcript and create a blueprint.</p>
              </div>
            </div>
          )}
        </div>
      )}
      <button className="b bg bsm" onClick={() => { setMode("text"); setTxt(SAMPLE); }} style={{ marginBottom: 20 }}>
        <Ic d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" s={13} /> Try example tutorial
      </button>
      <div className="cd" style={{ marginBottom: 20 }}>
        <div className="lb">Options</div>
        <Tog on={priv} set={setPriv} label="Private Source Mode — don't store raw text" />
      </div>
      {err && <div className="ap" style={{ background: "rgba(255,92,114,.08)", border: "1px solid rgba(255,92,114,.18)", borderRadius: "var(--r)", padding: 12, marginBottom: 16, color: "var(--red)", fontFamily: "var(--mn)", fontSize: 12, lineHeight: 1.6 }}>{err}</div>}
      <button className="b bp blg bw" onClick={go} disabled={!hasInput || loading}>
        {loading ? <span style={{ animation: "pu 1s infinite" }}>{status || "Generating…"}</span> : <><Ic d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" s={15} /> Generate Blueprint</>}
      </button>
    </div>
  );
}

// ── Blueprint View ──
function BPView({ build, onStart, onBack, onDel }) {
  const [open, setOpen] = useState(null);
  const [cd, setCd] = useState(false);
  return (
    <div className="au">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button className="b bg" onClick={onBack}><Ic d="M15 18l-6-6 6-6" s={14} /> Back</button>
        {!cd ? <button className="b br bsm" onClick={() => setCd(true)}><Ic d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" s={13} /> Delete</button>
          : <div style={{ display: "flex", gap: 5 }}><button className="b bg bsm" onClick={() => setCd(false)}>Cancel</button><button className="b br bsm" onClick={() => onDel(build.id)}>Confirm</button></div>}
      </div>
      <div className="cd cdg au" style={{ marginBottom: 20 }}>
        {build.source_url && getYTId(build.source_url) && (
          <a href={build.source_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,.03)", borderRadius: 8, border: "1px solid var(--bd)", marginBottom: 14, textDecoration: "none" }}>
            <img src={`https://img.youtube.com/vi/${getYTId(build.source_url)}/mqdefault.jpg`} alt="" style={{ width: 80, borderRadius: 5 }} />
            <div>
              <span style={{ fontFamily: "var(--mn)", fontSize: 10, fontWeight: 700, color: "var(--ac)", textTransform: "uppercase", letterSpacing: .5 }}>↗ Open tutorial on YouTube</span>
              <p style={{ fontSize: 11, color: "var(--tx3)", marginTop: 2 }}>Watch alongside your build</p>
            </div>
          </a>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div><div className="lb" style={{ marginBottom: 5 }}>Blueprint</div><h2 style={{ fontFamily: "var(--mn)", fontSize: 19, fontWeight: 700, lineHeight: 1.3 }}>{build.title}</h2></div>
          <span className={`bdg bdg-${build.status}`}>{build.status}</span>
        </div>
        <div style={{ background: "var(--acg)", borderRadius: "var(--r)", padding: 13, marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--mn)", fontSize: 10, color: "var(--ac2)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Objective</div>
          <p style={{ fontSize: 14, lineHeight: 1.6 }}>{build.objective}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div><div className="lb">Tools</div><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{build.tools?.map((t, i) => <span key={i} className="ch cha">{t}</span>)}</div></div>
          <div><div className="lb">Prerequisites</div><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{build.prerequisites?.map((p, i) => <span key={i} className="ch">{p}</span>)}</div></div>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 13, color: "var(--tx2)", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Ic d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2" s={14} />{build.time_min}–{build.time_max} min</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Ic d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6a6 6 0 100 12 6 6 0 000-12zM12 10a2 2 0 100 4 2 2 0 000-4z" s={14} />{build.expected_output}</span>
        </div>
      </div>
      {build.assumptions?.length > 0 && (
        <div className="cd au" style={{ marginBottom: 20, borderColor: "rgba(255,190,46,.25)" }}>
          <div className="lb" style={{ color: "var(--yel)" }}>Assumptions</div>
          {build.assumptions.map((a, i) => <p key={i} style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.7, marginTop: i ? 3 : 0 }}>• {a}</p>)}
        </div>
      )}
      <div className="lb" style={{ marginBottom: 12 }}>Steps ({build.steps?.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 26 }}>
        {build.steps?.map((s, i) => (
          <div key={i} className="sr as" style={{ animationDelay: `${i * .03}s`, flexDirection: "column", padding: 0 }}>
            <div style={{ display: "flex", gap: 13, padding: 13, cursor: "pointer" }} onClick={() => setOpen(open === i ? null : i)}>
              <div className="sn">{i + 1}</div>
              <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{s.title}</span>
                <Ic d={open === i ? "M6 9l6 6 6-6" : "M9 18l6-6-6-6"} s={15} />
              </div>
            </div>
            {open === i && (
              <div style={{ padding: "0 13px 14px 54px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "var(--mn)", fontSize: 10, fontWeight: 700, color: "var(--ac2)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>What to do</div>
                  <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.7 }}>{s.what_to_do || s.details || ""}</p>
                </div>
                {s.command && s.command !== "null" && (
                  <div>
                    <div style={{ fontFamily: "var(--mn)", fontSize: 10, fontWeight: 700, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Command / Code</div>
                    <pre style={{ background: "#0d1117", border: "1px solid var(--bd)", borderRadius: 7, padding: "10px 12px", fontFamily: "var(--mn)", fontSize: 12, color: "#8b949e", lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{s.command}</pre>
                  </div>
                )}
                {s.expected_result && (
                  <div>
                    <div style={{ fontFamily: "var(--mn)", fontSize: 10, fontWeight: 700, color: "var(--grn)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>✓ What you should see</div>
                    <p style={{ fontSize: 13, color: "var(--grn)", lineHeight: 1.6, opacity: .85 }}>{s.expected_result}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <button className="b bp blg bw" onClick={() => onStart(build.id)}>
        <Ic d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" s={16} /> Start Build Mode
      </button>
    </div>
  );
}

// ── Build Mode ──
function Build({ build, steps, proof, onTog, onProof, onDone, onBack }) {
  const [tab, setTab] = useState("url");
  const [url, setUrl] = useState(proof?.url || "");
  const [note, setNote] = useState(proof?.note || "");
  const [file, setFile] = useState(proof?.file || "");
  const [showDone, setShowDone] = useState(false);
  const fRef = useRef(null);
  const cnt = steps.filter(s => s.done).length;
  const pct = steps.length ? (cnt / steps.length) * 100 : 0;
  const hasP = url.trim().length > 0 || file.length > 0 || note.trim().length >= 30;
  const save = () => onProof({ type: tab, url: url.trim() || null, file: file || null, note: note.trim() || null });

  return (
    <div className="au">
      <button className="b bg" onClick={onBack} style={{ marginBottom: 18 }}><Ic d="M15 18l-6-6 6-6" s={14} /> Blueprint</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
        <h2 style={{ fontFamily: "var(--mn)", fontSize: 17, fontWeight: 700 }}>Build Mode</h2>
        <span className="bdg bdg-active">Active</span>
      </div>
      <p style={{ fontFamily: "var(--mn)", fontSize: 12, color: "var(--tx2)", marginBottom: 16 }}>{build.title}</p>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontFamily: "var(--mn)", fontSize: 11, color: "var(--tx3)" }}>PROGRESS</span>
          <span style={{ fontFamily: "var(--mn)", fontSize: 11, color: "var(--ac)" }}>{cnt}/{steps.length}</span>
        </div>
        <div className="pb"><div className="pf" style={{ width: `${pct}%` }} /></div>
      </div>
      <div className="cd" style={{ marginBottom: 20 }}>
        <div className="lb">Checklist</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 8 }}>
          {steps.map((s, i) => (
            <div key={s.id} className="cr as" style={{ animationDelay: `${i * .02}s`, flexDirection: "column", alignItems: "stretch", gap: 0, padding: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "11px 13px", cursor: "pointer" }} onClick={() => onTog(s.id)}>
                <div className={`cb ${s.done ? "on" : ""}`}>{s.done && <span style={{ color: "#080a0a", fontSize: 13 }}>✓</span>}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, textDecoration: s.done ? "line-through" : "none", color: s.done ? "var(--tx3)" : "var(--tx)" }}>{s.title}</div>
                  <p style={{ fontSize: 12, color: "var(--tx2)", marginTop: 5, lineHeight: 1.6 }}>{s.what_to_do || s.details || ""}</p>
                  {s.command && s.command !== "null" && (
                    <pre style={{ background: "#0d1117", border: "1px solid var(--bd)", borderRadius: 6, padding: "8px 10px", fontFamily: "var(--mn)", fontSize: 11, color: "#8b949e", lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all", marginTop: 6 }}>{s.command}</pre>
                  )}
                  {s.expected_result && <p style={{ fontSize: 12, color: "var(--grn)", marginTop: 6, lineHeight: 1.5, opacity: .85 }}>✓ {s.expected_result}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="cd" style={{ marginBottom: 20, borderColor: hasP ? "var(--grn)" : "var(--bd)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{ color: hasP ? "var(--grn)" : "var(--tx3)" }}><Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" s={15} /></span>
          <div className="lb" style={{ margin: 0, color: hasP ? "var(--grn)" : undefined }}>Proof of Work {hasP && "✓"}</div>
        </div>
        <div className="ptb" style={{ marginBottom: 12 }}>
          {["url", "file", "note"].map(t => <button key={t} className={`pt ${tab === t ? "pto" : ""}`} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        {tab === "url" && <><input className="inp" placeholder="GitHub repo, deployed URL…" value={url} onChange={x => setUrl(x.target.value)} /><p style={{ fontSize: 11, color: "var(--tx3)", marginTop: 5 }}>Paste a link to your project.</p></>}
        {tab === "file" && <><input type="file" ref={fRef} style={{ display: "none" }} onChange={x => { if (x.target.files?.[0]) setFile(x.target.files[0].name); }} /><button className="b bs bw" onClick={() => fRef.current?.click()}><Ic d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" s={15} />{file || "Upload screenshot or zip"}</button></>}
        {tab === "note" && <><textarea className="txa" style={{ minHeight: 80 }} placeholder="Describe what you built (min 30 chars)…" value={note} onChange={x => setNote(x.target.value)} /><p style={{ fontSize: 11, fontFamily: "var(--mn)", color: note.length >= 30 ? "var(--grn)" : "var(--tx3)", marginTop: 5 }}>{note.length}/30 min</p></>}
        <button className="b bs bsm" style={{ marginTop: 9 }} onClick={save}>Save Proof</button>
      </div>
      <button className="b bp blg bw" disabled={!hasP} onClick={() => { save(); setShowDone(true); }}>
        <Ic d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 19.24 7 20v2h10v-2c0-.76-.85-1.25-2.03-1.79C14.47 17.98 14 17.55 14 17v-2.34" s={16} />
        {hasP ? "Mark Build Complete" : "Add proof to complete"}
      </button>
      {!hasP && <p style={{ textAlign: "center", fontSize: 11, color: "var(--tx3)", marginTop: 7, fontFamily: "var(--mn)" }}>Submit proof (URL, file, or note ≥30 chars) to unlock.</p>}
      {showDone && (
        <div className="ov" onClick={x => { if (x.target === x.currentTarget) setShowDone(false); }}>
          <div className="ovc">
            <div style={{ fontSize: 42, marginBottom: 12 }}>🏆</div>
            <h2 style={{ fontFamily: "var(--mn)", fontSize: 20, fontWeight: 700, marginBottom: 5 }}>Build Complete!</h2>
            <p style={{ color: "var(--tx2)", fontSize: 14, marginBottom: 5 }}>{build.title}</p>
            <p style={{ fontFamily: "var(--mn)", fontSize: 11, color: "var(--ac)", marginBottom: 22 }}>If it&apos;s not shipped, it doesn&apos;t count.</p>
            <button className="b bp blg bw" onClick={() => { onDone(); setShowDone(false); }}>Dashboard</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard ──
function Dash({ builds, onNew, onOpen, onDel }) {
  const [did, setDid] = useState(null);
  const t = builds.length, a = builds.filter(b => b.status === "active").length, c = builds.filter(b => b.status === "completed").length;
  return (
    <div className="au">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26, flexWrap: "wrap", gap: 8 }}>
        <div><h2 style={{ fontFamily: "var(--mn)", fontSize: 20, fontWeight: 700 }}>Dashboard</h2><p style={{ color: "var(--tx3)", fontSize: 13, marginTop: 3 }}>Your builds at a glance</p></div>
        <button className="b bp" onClick={onNew}><Ic d="M12 5v14M5 12h14" s={14} /> New Build</button>
      </div>
      <div className="sts au" style={{ animationDelay: ".04s" }}>
        <div className="st"><div className="stv">{t}</div><div className="stl">Created</div></div>
        <div className="st"><div className="stv" style={{ color: "var(--grn)" }}>{a}</div><div className="stl">In Progress</div></div>
        <div className="st"><div className="stv" style={{ color: "var(--ac)" }}>{c}</div><div className="stl">Completed</div></div>
        <div className="st"><div className="stv">{t ? Math.round(c / t * 100) : 0}%</div><div className="stl">Rate</div></div>
      </div>
      <div className="lb">Builds ({t})</div>
      {!t ? (
        <div style={{ textAlign: "center", padding: "44px 16px", color: "var(--tx3)" }}>
          <p style={{ fontSize: 15, marginBottom: 5 }}>No builds yet</p>
          <p style={{ fontSize: 13, marginBottom: 16 }}>Create your first build from a tutorial.</p>
          <button className="b bp" onClick={onNew}><Ic d="M12 5v14M5 12h14" s={14} /> Create Build</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 12 }}>
          {builds.map((b, i) => (
            <div key={b.id} className="cd as" style={{ cursor: "pointer", animationDelay: `${i * .03}s` }} onClick={() => onOpen(b.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    <span className={`bdg bdg-${b.status}`}>{b.status}</span>
                    <span style={{ fontFamily: "var(--mn)", fontSize: 10, color: "var(--tx3)" }}>{new Date(b.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</h3>
                  <p style={{ fontSize: 12, color: "var(--tx3)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.objective}</p>
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  <button className="b bs bsm" onClick={e => { e.stopPropagation(); onOpen(b.id); }}>{b.status === "completed" ? "View" : b.status === "active" ? "Resume" : "Open"}</button>
                  {did === b.id
                    ? <button className="b br bsm" onClick={e => { e.stopPropagation(); onDel(b.id); setDid(null); }}>Confirm?</button>
                    : <button className="b bg bsm" onClick={e => { e.stopPropagation(); setDid(b.id); }}><Ic d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" s={12} /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── App ──
export default function App() {
  const [db, setDb] = useState({ user: null, builds: [], steps: {}, proofs: {} });
  const [pg, setPg] = useState("landing");
  const [aid, setAid] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadDB();
    setDb(saved);
    if (saved.user) setPg("dashboard");
  }, []);

  // Persist helper
  const persist = (newDb) => { setDb(newDb); saveDB(newDb); };

  const login = (email) => { const n = { ...db, user: { email } }; persist(n); setPg("dashboard"); };
  const logout = () => { const n = { user: null, builds: [], steps: {}, proofs: {} }; persist(n); setPg("landing"); };

  const created = ({ bp, text, priv, sourceUrl }) => {
    const id = "b" + Date.now();
    const build = {
      id, title: bp.title, objective: bp.objective, tools: bp.tools || [], prerequisites: bp.prerequisites || [],
      time_min: bp.time_estimate_min || 30, time_max: bp.time_estimate_max || 120,
      expected_output: bp.expected_output || "", assumptions: bp.assumptions || [],
      steps: bp.steps || [], status: "draft", source_text: text, source_url: sourceUrl || null, created_at: new Date().toISOString(),
    };
    const steps = bp.steps.map((s, i) => ({
      id: `${id}_${i}`, title: s.title,
      what_to_do: s.what_to_do || s.details || "",
      command: s.command || null,
      expected_result: s.expected_result || null,
      details: s.details || s.what_to_do || "",
      done: false,
    }));
    const n = { ...db, builds: [build, ...db.builds], steps: { ...db.steps, [id]: steps } };
    persist(n); setAid(id); setPg("blueprint");
  };

  const start = (id) => {
    const n = { ...db, builds: db.builds.map(b => b.id === id ? { ...b, status: "active" } : b) };
    persist(n); setAid(id); setPg("build");
  };
  const tog = (sid) => {
    const s = (db.steps[aid] || []).map(x => x.id === sid ? { ...x, done: !x.done } : x);
    persist({ ...db, steps: { ...db.steps, [aid]: s } });
  };
  const proof = (d) => { persist({ ...db, proofs: { ...db.proofs, [aid]: d } }); };
  const done = () => {
    const n = { ...db, builds: db.builds.map(b => b.id === aid ? { ...b, status: "completed" } : b) };
    persist(n); setAid(null); setPg("dashboard");
  };
  const open = (id) => { setAid(id); const b = db.builds.find(x => x.id === id); setPg(b?.status === "active" || b?.status === "completed" ? "build" : "blueprint"); };
  const del = (id) => {
    const newSteps = { ...db.steps }; delete newSteps[id];
    const newProofs = { ...db.proofs }; delete newProofs[id];
    persist({ ...db, builds: db.builds.filter(x => x.id !== id), steps: newSteps, proofs: newProofs });
    if (aid === id) { setAid(null); setPg("dashboard"); }
  };

  const ab = db.builds.find(b => b.id === aid);

  return (
    <>
      <style>{`
:root{--bg:#08090a;--sf:#111214;--sf2:#191b1e;--bd:#252830;--bd2:#353840;--tx:#eaedf2;--tx2:#9299a6;--tx3:#5c6370;--ac:#b8ff57;--ac2:#8fcc3a;--acg:rgba(184,255,87,.12);--red:#ff5c72;--grn:#3dd68c;--yel:#ffbe2e;--mn:'IBM Plex Mono',monospace;--bd2f:'Outfit',sans-serif;--r:10px;--r2:14px}
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}body{background:var(--bg);color:var(--tx);font-family:var(--bd2f);-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:var(--bd);border-radius:3px}
@keyframes fu{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fi{from{opacity:0}to{opacity:1}}@keyframes pu{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes si{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
@keyframes po{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}
.au{animation:fu .4s ease-out both}.ai{animation:fi .3s ease-out both}.as{animation:si .3s ease-out both}.ap{animation:po .25s ease-out both}
.shell{min-height:100vh;display:flex;flex-direction:column}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:13px 22px;border-bottom:1px solid var(--bd);background:rgba(8,9,10,.9);backdrop-filter:blur(12px);position:sticky;top:0;z-index:50}
.logo{font-family:var(--mn);font-weight:700;font-size:15px;display:flex;align-items:center;gap:7px;cursor:pointer}.dot{width:7px;height:7px;background:var(--ac);border-radius:2px}
.mn{flex:1;max-width:780px;width:100%;margin:0 auto;padding:26px 18px 56px}
.b{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:var(--r);border:none;cursor:pointer;font-family:var(--mn);font-weight:600;font-size:12px;letter-spacing:.3px;text-transform:uppercase;transition:all .15s}
.b:disabled{opacity:.3;cursor:not-allowed}.bp{background:var(--ac);color:#080a0a}.bp:hover:not(:disabled){background:#c8ff77;box-shadow:0 0 20px var(--acg)}
.bs{background:var(--sf);color:var(--tx);border:1px solid var(--bd)}.bs:hover:not(:disabled){background:var(--sf2);border-color:var(--bd2)}
.bg{background:none;color:var(--tx2);padding:7px 9px}.bg:hover{color:var(--tx)}.br{background:rgba(255,92,114,.08);color:var(--red);border:1px solid rgba(255,92,114,.18)}.br:hover:not(:disabled){background:rgba(255,92,114,.15)}
.bsm{padding:5px 11px;font-size:11px}.blg{padding:12px 22px;font-size:13px}.bw{width:100%;justify-content:center}
.inp{width:100%;padding:10px 13px;background:var(--bg);border:1px solid var(--bd);border-radius:var(--r);color:var(--tx);font-family:var(--bd2f);font-size:14px;outline:none;transition:border .2s}
.inp:focus{border-color:var(--ac);box-shadow:0 0 0 3px var(--acg)}
.txa{width:100%;padding:11px 13px;background:var(--bg);border:1px solid var(--bd);border-radius:var(--r);color:var(--tx);font-family:var(--mn);font-size:13px;line-height:1.7;resize:vertical;min-height:140px;outline:none;transition:border .2s}
.txa:focus{border-color:var(--ac);box-shadow:0 0 0 3px var(--acg)}
.cd{background:var(--sf);border:1px solid var(--bd);border-radius:var(--r2);padding:20px;transition:border .2s}.cd:hover{border-color:var(--bd2)}.cdg{border-color:var(--ac);box-shadow:0 0 28px var(--acg)}
.ch{display:inline-flex;padding:3px 9px;background:var(--sf2);border:1px solid var(--bd);border-radius:99px;font-family:var(--mn);font-size:11px;color:var(--tx2)}
.cha{background:var(--acg);border-color:rgba(184,255,87,.25);color:var(--ac)}
.lb{font-family:var(--mn);font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:1.3px;margin-bottom:9px}
.bdg{font-family:var(--mn);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;padding:3px 8px;border-radius:4px}
.bdg-draft{background:var(--sf2);color:var(--tx3)}.bdg-active{background:rgba(61,214,140,.1);color:var(--grn)}.bdg-completed{background:var(--acg);color:var(--ac)}
.pb{width:100%;height:5px;background:var(--bd);border-radius:3px;overflow:hidden}.pf{height:100%;background:var(--ac);border-radius:3px;transition:width .4s ease-out}
.sts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:26px}
.st{background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);padding:16px}.stv{font-family:var(--mn);font-size:28px;font-weight:700;line-height:1}.stl{font-size:11px;color:var(--tx3);margin-top:4px;text-transform:uppercase;letter-spacing:.4px}
.ptb{display:flex;gap:2px;background:var(--bg);border-radius:var(--r);padding:3px}
.pt{flex:1;padding:7px;text-align:center;font-family:var(--mn);font-size:11px;font-weight:600;border-radius:7px;cursor:pointer;border:none;background:none;color:var(--tx3);text-transform:uppercase;letter-spacing:.5px;transition:all .15s}.pto{background:var(--sf);color:var(--ac)}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:100;animation:fi .25s ease-out}
.ovc{background:var(--sf);border:2px solid var(--ac);border-radius:var(--r2);padding:40px;text-align:center;max-width:380px;animation:po .3s ease-out;box-shadow:0 0 50px var(--acg)}
.sr{display:flex;gap:13px;padding:13px;border-radius:var(--r);border:1px solid var(--bd);background:var(--bg);cursor:pointer;transition:all .15s}.sr:hover{border-color:var(--bd2);background:var(--sf)}
.sn{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:7px;background:var(--sf2);border:1px solid var(--bd);font-family:var(--mn);font-weight:700;font-size:12px;color:var(--tx3);flex-shrink:0}
.cr{display:flex;align-items:flex-start;gap:11px;padding:11px 13px;border-radius:var(--r);cursor:pointer;transition:background .1s}.cr:hover{background:var(--sf2)}
.cb{width:20px;height:20px;border:2px solid var(--bd2);border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;margin-top:2px}.cb.on{background:var(--ac);border-color:var(--ac)}
.tg{display:flex;align-items:center;gap:9px;cursor:pointer;user-select:none}
.tt{width:36px;height:20px;background:var(--bd);border-radius:10px;position:relative;transition:background .2s;flex-shrink:0}.tt.on{background:var(--ac)}.tk{width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;top:3px;left:3px;transition:transform .2s}.tt.on .tk{transform:translateX(16px)}
@media(max-width:640px){.mn{padding:14px 12px 44px}.sts{grid-template-columns:1fr 1fr}.cd{padding:16px}}
      `}</style>
      <div className="shell">
        {pg !== "landing" && (
          <header className="hdr">
            <div className="logo" onClick={() => { setPg("dashboard"); setAid(null); }}><span className="dot" />BuildLab</div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontFamily: "var(--mn)", fontSize: 11, color: "var(--tx3)" }}>{db.user?.email}</span>
              <button className="b bg bsm" onClick={logout}><Ic d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" s={13} /></button>
            </div>
          </header>
        )}
        <main className="mn">
          {pg === "landing" && <Landing onLogin={login} />}
          {pg === "dashboard" && <Dash builds={db.builds} onNew={() => setPg("create")} onOpen={open} onDel={del} />}
          {pg === "create" && <Create onDone={created} onBack={() => setPg("dashboard")} />}
          {pg === "blueprint" && ab && <BPView build={ab} onStart={start} onBack={() => { setPg("dashboard"); setAid(null); }} onDel={del} />}
          {pg === "build" && ab && <Build build={ab} steps={db.steps[aid] || []} proof={db.proofs[aid]} onTog={tog} onProof={proof} onDone={done} onBack={() => setPg("blueprint")} />}
        </main>
      </div>
    </>
  );
}
