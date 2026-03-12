"use client";
import { useState, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════════
   BuildLab v2 — Premium Redesign
   "Calm Precision" — Every detail intentional
   ═══════════════════════════════════════════════════ */

// ── Storage ──
function loadDB() { try { const r = localStorage.getItem("buildlab2"); if (r) return JSON.parse(r); } catch {} return { user: null, builds: [], steps: {}, proofs: {} }; }
function saveDB(db) { try { localStorage.setItem("buildlab2", JSON.stringify(db)); } catch {} }
function loadTheme() { try { return localStorage.getItem("buildlab-theme") || "light"; } catch { return "light"; } }
function saveTheme(t) { try { localStorage.setItem("buildlab-theme", t); } catch {} }

// ── YouTube ──
function getYTId(u) { if (!u) return null; const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/); return m ? m[1] : null; }
async function fetchYT(url) {
  const r = await fetch("/api/youtube", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.text;
}

// ── Blueprint Gen ──
async function genBP(text) {
  const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.slice(0, 50000) }) });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  if (!d.title || !d.steps?.length) throw new Error("Invalid blueprint returned");
  return d;
}

// ── Icons ──
const Ic = ({ d, s = 20, ...p }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d={d} /></svg>;
const SunIc = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
const MoonIc = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;

// ── Styles ──
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

:root, [data-theme="light"] {
  --bg: #FAFAF7; --bg2: #FFFFFF; --bg3: #F2F1ED;
  --tx: #1A1A1A; --tx2: #6B6B6B; --tx3: #9C9C9C;
  --bd: rgba(0,0,0,.08); --bd2: rgba(0,0,0,.04);
  --ac: #E8634A; --ac2: #D4533B; --acbg: rgba(232,99,74,.08);
  --grn: #2D8F5E; --grnbg: rgba(45,143,94,.08);
  --yel: #C68A1A; --yelbg: rgba(198,138,26,.08);
  --red: #D94141; --redbg: rgba(217,65,65,.06);
  --code-bg: #1B1B1F; --code-tx: #B4B4B4;
  --shadow: 0 1px 3px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.03);
  --shadow2: 0 2px 8px rgba(0,0,0,.06), 0 12px 32px rgba(0,0,0,.05);
  --head: 'Instrument Sans', sans-serif;
  --body: 'Source Serif 4', Georgia, serif;
  --mono: 'JetBrains Mono', monospace;
  --r: 12px; --r2: 16px; --r3: 20px;
}

[data-theme="dark"] {
  --bg: #141416; --bg2: #1C1C1F; --bg3: #232328;
  --tx: #E8E6E1; --tx2: #8A8A8A; --tx3: #5C5C5C;
  --bd: rgba(255,255,255,.08); --bd2: rgba(255,255,255,.04);
  --ac: #F0795F; --ac2: #E8634A; --acbg: rgba(240,121,95,.1);
  --grn: #4ABA7A; --grnbg: rgba(74,186,122,.1);
  --yel: #E0A832; --yelbg: rgba(224,168,50,.1);
  --red: #F06060; --redbg: rgba(240,96,96,.08);
  --code-bg: #0D0D10; --code-tx: #9A9A9A;
  --shadow: 0 1px 3px rgba(0,0,0,.2), 0 4px 12px rgba(0,0,0,.15);
  --shadow2: 0 2px 8px rgba(0,0,0,.3), 0 12px 32px rgba(0,0,0,.2);
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; }
body { background: var(--bg); color: var(--tx); font-family: var(--body); -webkit-font-smoothing: antialiased; font-size: 15px; line-height: 1.6; transition: background .4s ease, color .4s ease; }

::selection { background: var(--acbg); color: var(--ac); }
::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: var(--bd); border-radius: 3px; }

@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
@keyframes slide { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes pop { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }

.rise { animation: rise .5s cubic-bezier(.22,.61,.36,1) both; }
.slide { animation: slide .4s cubic-bezier(.22,.61,.36,1) both; }
.pop { animation: pop .3s cubic-bezier(.22,.61,.36,1) both; }

/* Layout */
.shell { min-height: 100vh; display: flex; flex-direction: column; }
.hdr {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 28px; border-bottom: 1px solid var(--bd);
  background: var(--bg); position: sticky; top: 0; z-index: 50;
  transition: background .4s ease;
}
.logo { font-family: var(--head); font-weight: 700; font-size: 17px; display: flex; align-items: center; gap: 10px; cursor: pointer; letter-spacing: -.3px; }
.logo-mark { width: 8px; height: 8px; background: var(--ac); border-radius: 3px; }
.main { flex: 1; max-width: 720px; width: 100%; margin: 0 auto; padding: 40px 24px 80px; }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px;
  border-radius: var(--r); border: none; cursor: pointer; font-family: var(--head);
  font-weight: 600; font-size: 13px; letter-spacing: .2px; transition: all .2s cubic-bezier(.22,.61,.36,1);
}
.btn:disabled { opacity: .35; cursor: not-allowed; }
.btn:active:not(:disabled) { transform: scale(.98); }
.btn-p { background: var(--ac); color: white; }
.btn-p:hover:not(:disabled) { background: var(--ac2); box-shadow: 0 4px 16px var(--acbg); }
.btn-s { background: var(--bg3); color: var(--tx); }
.btn-s:hover:not(:disabled) { background: var(--bd); }
.btn-g { background: none; color: var(--tx2); padding: 8px 12px; }
.btn-g:hover { color: var(--tx); }
.btn-d { background: var(--redbg); color: var(--red); }
.btn-sm { padding: 7px 14px; font-size: 12px; }
.btn-lg { padding: 14px 28px; font-size: 14px; }
.btn-w { width: 100%; justify-content: center; }

/* Inputs */
.input {
  width: 100%; padding: 12px 16px; background: var(--bg2); border: 1px solid var(--bd);
  border-radius: var(--r); color: var(--tx); font-family: var(--body); font-size: 15px;
  outline: none; transition: all .2s; box-shadow: var(--shadow);
}
.input:focus { border-color: var(--ac); box-shadow: 0 0 0 3px var(--acbg); }
.textarea {
  width: 100%; padding: 14px 16px; background: var(--bg2); border: 1px solid var(--bd);
  border-radius: var(--r); color: var(--tx); font-family: var(--mono); font-size: 13px;
  line-height: 1.7; resize: vertical; min-height: 160px; outline: none; transition: all .2s;
  box-shadow: var(--shadow);
}
.textarea:focus { border-color: var(--ac); box-shadow: 0 0 0 3px var(--acbg); }

/* Cards */
.card {
  background: var(--bg2); border: 1px solid var(--bd); border-radius: var(--r2);
  padding: 24px; box-shadow: var(--shadow); transition: all .25s cubic-bezier(.22,.61,.36,1);
}
.card:hover { box-shadow: var(--shadow2); }
.card-glow { border-color: var(--ac); box-shadow: 0 0 0 1px var(--ac), 0 8px 32px var(--acbg); }

/* Labels */
.label { font-family: var(--head); font-size: 11px; font-weight: 600; color: var(--tx3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
.chip { display: inline-flex; padding: 4px 12px; background: var(--bg3); border-radius: 99px; font-family: var(--head); font-size: 12px; font-weight: 500; color: var(--tx2); }
.chip-ac { background: var(--acbg); color: var(--ac); }
.badge { font-family: var(--head); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; padding: 3px 10px; border-radius: 6px; }
.badge-draft { background: var(--bg3); color: var(--tx3); }
.badge-active { background: var(--grnbg); color: var(--grn); }
.badge-completed { background: var(--acbg); color: var(--ac); }

/* Progress */
.pbar { width: 100%; height: 4px; background: var(--bg3); border-radius: 2px; overflow: hidden; }
.pfill { height: 100%; background: var(--ac); border-radius: 2px; transition: width .5s cubic-bezier(.22,.61,.36,1); }

/* Tabs */
.tabs { display: flex; gap: 4px; background: var(--bg3); border-radius: var(--r); padding: 4px; }
.tab { flex: 1; padding: 8px 12px; text-align: center; font-family: var(--head); font-size: 12px; font-weight: 600; border-radius: 8px; cursor: pointer; border: none; background: none; color: var(--tx3); transition: all .2s; }
.tab-on { background: var(--bg2); color: var(--ac); box-shadow: var(--shadow); }

/* Stats */
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 14px; margin-bottom: 32px; }
.stat { background: var(--bg2); border: 1px solid var(--bd); border-radius: var(--r); padding: 20px; box-shadow: var(--shadow); }
.stat-v { font-family: var(--head); font-size: 32px; font-weight: 700; line-height: 1; }
.stat-l { font-family: var(--head); font-size: 11px; color: var(--tx3); margin-top: 6px; text-transform: uppercase; letter-spacing: .5px; }

/* Overlay */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; z-index: 200; animation: fade .25s ease; }
[data-theme="dark"] .overlay { background: rgba(0,0,0,.6); }
.overlay-card { background: var(--bg2); border: 2px solid var(--ac); border-radius: var(--r3); padding: 48px; text-align: center; max-width: 400px; animation: pop .35s cubic-bezier(.22,.61,.36,1); box-shadow: 0 24px 64px rgba(0,0,0,.15); }

/* Step rows */
.step-row { border: 1px solid var(--bd); border-radius: var(--r); background: var(--bg2); transition: all .2s; overflow: hidden; box-shadow: var(--shadow); }
.step-row:hover { border-color: var(--ac); box-shadow: var(--shadow2); }
.step-head { display: flex; gap: 14px; padding: 16px 18px; cursor: pointer; align-items: center; }
.step-num { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: var(--bg3); font-family: var(--head); font-weight: 700; font-size: 13px; color: var(--tx3); flex-shrink: 0; }

/* Check items */
.chk { display: flex; align-items: flex-start; gap: 14px; padding: 14px 18px; cursor: pointer; transition: background .15s; border-radius: var(--r); }
.chk:hover { background: var(--bg3); }
.chk-box { width: 22px; height: 22px; border: 2px solid var(--bd); border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .2s; margin-top: 2px; background: var(--bg2); }
.chk-box.on { background: var(--ac); border-color: var(--ac); }

/* Theme toggle */
.theme-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--bd); border-radius: 10px; background: var(--bg2); cursor: pointer; color: var(--tx2); transition: all .2s; }
.theme-btn:hover { color: var(--tx); border-color: var(--ac); }

/* Code blocks */
.code { background: var(--code-bg); border-radius: 8px; padding: 12px 14px; font-family: var(--mono); font-size: 12.5px; color: var(--code-tx); line-height: 1.7; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }

/* Toggle */
.tog { display: flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }
.tog-track { width: 40px; height: 22px; background: var(--bg3); border: 1px solid var(--bd); border-radius: 11px; position: relative; transition: all .2s; flex-shrink: 0; }
.tog-track.on { background: var(--ac); border-color: var(--ac); }
.tog-knob { width: 16px; height: 16px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; transition: transform .2s cubic-bezier(.22,.61,.36,1); box-shadow: 0 1px 3px rgba(0,0,0,.15); }
.tog-track.on .tog-knob { transform: translateX(18px); }

@media (max-width: 640px) { .main { padding: 24px 16px 60px; } .stats { grid-template-columns: 1fr 1fr; } .card { padding: 18px; } }
`;

function Tog({ on, set, label }) { return <div className="tog" onClick={() => set(!on)}><div className={`tog-track ${on?"on":""}`}><div className="tog-knob"/></div><span style={{ fontSize: 14, color: "var(--tx2)" }}>{label}</span></div>; }

// ── Pages ──
// ── Onboarding ──
const ONBOARD_STEPS = [
  { icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", emoji: "📋", title: "Paste any tutorial", desc: "YouTube link, blog post, Twitter thread, or just paste the text. We handle the rest." },
  { icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", emoji: "⚡", title: "Get a build blueprint", desc: "AI breaks it into beginner-friendly steps with commands, code, and expected results." },
  { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", emoji: "🏆", title: "Ship with proof-of-work", desc: "Check off steps, submit your proof, and track your builder journey." },
];

function Landing({ onLogin }) {
  const [e, setE] = useState("");
  const [step, setStep] = useState(0);
  const [showLogin, setShowLogin] = useState(false);

  return <div style={{ maxWidth: 480, margin: "0 auto" }}>
    <div className="rise" style={{ textAlign: "center", padding: "60px 0 32px" }}>
      <p style={{ fontFamily: "var(--head)", fontSize: 12, color: "var(--tx3)", textTransform: "uppercase", letterSpacing: 4, marginBottom: 16, fontWeight: 600 }}>Stop saving. Start shipping.</p>
      <h1 style={{ fontFamily: "var(--head)", fontSize: "clamp(32px,6vw,46px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: -1, marginBottom: 20 }}>
        Turn tutorials into<br /><span style={{ color: "var(--ac)" }}>build blueprints</span>
      </h1>
    </div>

    {/* Onboarding cards */}
    {!showLogin && <div className="rise" style={{ animationDelay: ".1s" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {ONBOARD_STEPS.map((s, i) => (
          <div key={i} className="card slide" style={{
            animationDelay: `${.15 + i * .1}s`, display: "flex", alignItems: "center", gap: 16,
            padding: "18px 20px", cursor: "pointer",
            border: step === i ? "1px solid var(--ac)" : "1px solid var(--bd)",
            background: step === i ? "var(--acbg)" : "var(--bg2)",
          }} onClick={() => setStep(i)}>
            <div style={{ fontSize: 28, lineHeight: 1 }}>{s.emoji}</div>
            <div>
              <div style={{ fontFamily: "var(--head)", fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{s.title}</div>
              <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.5 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
        {ONBOARD_STEPS.map((_, i) => <div key={i} style={{
          width: step === i ? 24 : 8, height: 8, borderRadius: 4,
          background: step === i ? "var(--ac)" : "var(--bg3)",
          transition: "all .3s cubic-bezier(.22,.61,.36,1)", cursor: "pointer",
        }} onClick={() => setStep(i)} />)}
      </div>

      <button className="btn btn-p btn-lg btn-w" onClick={() => setShowLogin(true)}>
        Get Started
      </button>
    </div>}

    {/* Sign in form */}
    {showLogin && <div className="card pop" style={{ marginTop: 8 }}>
      <div className="label">Sign in to start building</div>
      <input className="input" placeholder="you@email.com" value={e} onChange={x => setE(x.target.value)} onKeyDown={x => x.key === "Enter" && e.trim() && onLogin(e.trim())} style={{ marginBottom: 14 }} autoFocus />
      <button className="btn btn-p btn-lg btn-w" disabled={!e.trim()} onClick={() => onLogin(e.trim())}>
        <Ic d="M5 12h14M12 5l7 7-7 7" s={16} /> Enter BuildLab
      </button>
      <button className="btn btn-g btn-sm" onClick={() => setShowLogin(false)} style={{ marginTop: 10, width: "100%", justifyContent: "center" }}>Back</button>
    </div>}
  </div>;
}

function Create({ onDone, onBack }) {
  const [mode, setMode] = useState("text");
  const [txt, setTxt] = useState(""); const [url, setUrl] = useState("");
  const [priv, setPriv] = useState(true); const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(""); const [err, setErr] = useState(null);
  const go = async () => {
    setLoading(true); setErr(null); setStatus("");
    try {
      let c; if (mode==="text"){if(!txt.trim())return; c=txt.trim();} else {if(!url.trim())return; const yt=getYTId(url.trim()); if(yt){setStatus("Extracting from YouTube…"); c=await fetchYT(url.trim());} else { c="Tutorial from: "+url.trim(); }}
      setStatus("Generating blueprint…"); const bp = await genBP(c);
      onDone({ bp, text: priv?null:c, sourceUrl: mode==="url"?url.trim():null });
    } catch(e){ setErr(e.message||"Failed."); setLoading(false); setStatus(""); }
  };
  const has = mode==="text"?txt.trim():url.trim(); const ytId = mode==="url"?getYTId(url):null;
  return <div className="rise">
    <button className="btn btn-g" onClick={onBack} style={{ marginBottom: 24 }}><Ic d="M15 18l-6-6 6-6" s={16}/> Dashboard</button>
    <h2 style={{ fontFamily: "var(--head)", fontSize: 26, fontWeight: 700, marginBottom: 6, letterSpacing: -.5 }}>New Build</h2>
    <p style={{ color: "var(--tx2)", marginBottom: 28 }}>Paste tutorial content or a YouTube URL.</p>
    <div className="tabs" style={{ maxWidth: 260, marginBottom: 20 }}>
      <button className={`tab ${mode==="text"?"tab-on":""}`} onClick={() => setMode("text")}>Paste Text</button>
      <button className={`tab ${mode==="url"?"tab-on":""}`} onClick={() => setMode("url")}>URL</button>
    </div>
    {mode==="text" ? <textarea className="textarea" placeholder="Paste your tutorial, thread, or walkthrough here…" value={txt} onChange={x=>setTxt(x.target.value)} style={{ marginBottom: 10 }} />
    : <div style={{ marginBottom: 10 }}><input className="input" placeholder="https://youtube.com/watch?v=…" value={url} onChange={x=>setUrl(x.target.value)} />
      {ytId && <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ width: 100, borderRadius: 8, boxShadow: "var(--shadow)" }} />
        <div><span className="chip chip-ac" style={{ fontSize: 11 }}>YouTube</span><p style={{ fontSize: 13, color: "var(--tx2)", marginTop: 4 }}>{"We'll extract the transcript."}</p></div>
      </div>}</div>}
    <div className="card" style={{ marginBottom: 24 }}><div className="label">Options</div><Tog on={priv} set={setPriv} label="Private Source Mode — don't store raw text" /></div>
    {err && <div className="pop" style={{ background: "var(--redbg)", borderRadius: "var(--r)", padding: 14, marginBottom: 18, color: "var(--red)", fontFamily: "var(--head)", fontSize: 13 }}>{err}</div>}
    <button className="btn btn-p btn-lg btn-w" onClick={go} disabled={!has||loading}>
      {loading ? <span style={{ animation: "pulse 1.2s infinite" }}>{status||"Generating…"}</span> : <><Ic d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" s={16}/> Generate Blueprint</>}
    </button>
  </div>;
}

// ── Export Helpers ──
function blueprintToMarkdown(build) {
  let t = `# ${build.title}\n\n`;
  t += `**Objective:** ${build.objective}\n\n`;
  t += `**Tools:** ${(build.tools||[]).join(", ")||"None listed"}\n`;
  t += `**Prerequisites:** ${(build.prerequisites||[]).join(", ")||"None listed"}\n`;
  t += `**Time estimate:** ${build.time_min}–${build.time_max} minutes\n`;
  if (build.expected_output) t += `**Expected output:** ${build.expected_output}\n`;
  if (build.assumptions?.length) { t += `\n**Assumptions:**\n`; build.assumptions.forEach(a => t += `• ${a}\n`); }
  t += `\n---\n\n## Steps\n\n`;
  (build.steps||[]).forEach((s, i) => {
    t += `### Step ${i+1}: ${s.title}\n\n`;
    t += `**What to do:** ${s.what_to_do||s.details||""}\n\n`;
    if (s.command && s.command !== "null") t += `**Command/Code:**\n\`\`\`\n${s.command}\n\`\`\`\n\n`;
    if (s.expected_result) t += `**✓ Expected result:** ${s.expected_result}\n\n`;
  });
  t += `---\n*Generated by BuildLab*\n`;
  return t;
}

function blueprintToHTML(build) {
  const esc = (s) => (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(build.title)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Source Serif 4',Georgia,serif;color:#1a1a1a;max-width:700px;margin:0 auto;padding:48px 32px;font-size:15px;line-height:1.7}
h1{font-family:'Instrument Sans',sans-serif;font-size:28px;font-weight:700;margin-bottom:6px;letter-spacing:-.5px}
h2{font-family:'Instrument Sans',sans-serif;font-size:13px;font-weight:600;color:#E8634A;text-transform:uppercase;letter-spacing:1px;margin-top:36px;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #E8634A}
.meta{display:flex;gap:20px;flex-wrap:wrap;margin:14px 0;font-size:13px;color:#6b6b6b}
.obj{background:#FDF2F0;border-left:3px solid #E8634A;padding:14px 18px;border-radius:0 8px 8px 0;margin:20px 0;line-height:1.7}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.chip{padding:4px 12px;background:#f2f1ed;border-radius:99px;font-family:'Instrument Sans',sans-serif;font-size:12px;color:#6b6b6b}
.chip-ac{background:#FDF2F0;color:#E8634A}
.warn{background:#FFF8F0;border-left:3px solid #C68A1A;padding:14px 18px;border-radius:0 8px 8px 0;margin:16px 0}
.warn p{font-size:14px;color:#6b6b6b;margin-top:3px}
.step{margin-bottom:28px;page-break-inside:avoid}
.sh{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.sn{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:7px;background:#f2f1ed;font-family:'Instrument Sans',sans-serif;font-weight:700;font-size:13px;color:#9c9c9c}
.st{font-family:'Instrument Sans',sans-serif;font-weight:600;font-size:16px}
.ss{margin-left:40px;margin-bottom:10px}
.sl{font-family:'Instrument Sans',sans-serif;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.w{color:#E8634A}.c{color:#9c9c9c}.r{color:#2D8F5E}
pre{display:block;background:#1B1B1F;color:#B4B4B4;padding:12px 16px;border-radius:8px;font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.6;white-space:pre-wrap;word-break:break-all;margin:6px 0}
.rt{color:#2D8F5E}
.ft{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-family:'Instrument Sans',sans-serif;font-size:11px;color:#9c9c9c;text-align:center}
@media print{body{padding:20px 16px}.step{break-inside:avoid}}
</style></head><body>
<h1>${esc(build.title)}</h1>
<div class="meta"><span>⏱ ${build.time_min}–${build.time_max} min</span>${build.tools?.length?`<span>🛠 ${esc(build.tools.join(", "))}</span>`:""}</div>
<div class="obj">${esc(build.objective)}</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0">
<div><div class="sl" style="color:#9c9c9c;margin-bottom:6px">Tools</div><div class="chips">${(build.tools||[]).map(t=>`<span class="chip chip-ac">${esc(t)}</span>`).join("")}</div></div>
<div><div class="sl" style="color:#9c9c9c;margin-bottom:6px">Prerequisites</div><div class="chips">${(build.prerequisites||[]).map(p=>`<span class="chip">${esc(p)}</span>`).join("")}</div></div>
</div>
${build.assumptions?.length?`<div class="warn"><div class="sl" style="color:#C68A1A;margin-bottom:6px">Assumptions</div>${build.assumptions.map(a=>`<p>• ${esc(a)}</p>`).join("")}</div>`:""}
<h2>Steps</h2>
${(build.steps||[]).map((s,i)=>`<div class="step">
<div class="sh"><div class="sn">${i+1}</div><div class="st">${esc(s.title)}</div></div>
<div class="ss"><div class="sl w">What to do</div><p>${esc(s.what_to_do||s.details||"")}</p></div>
${s.command&&s.command!=="null"?`<div class="ss"><div class="sl c">Command / Code</div><pre>${esc(s.command)}</pre></div>`:""}
${s.expected_result?`<div class="ss"><div class="sl r">✓ What you should see</div><p class="rt">${esc(s.expected_result)}</p></div>`:""}
</div>`).join("")}
<div class="ft">Generated by BuildLab</div>
</body></html>`;
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Export Dropdown Component ──
function ExportMenu({ build }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    if (show) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [show]);

  const handleCopy = () => {
    const text = blueprintToMarkdown(build);
    try {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true); setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        // Fallback
        const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
        setCopied(true); setTimeout(() => setCopied(false), 2500);
      });
    } catch {
      setCopied(false);
    }
    setShow(false);
  };

  const handleDownloadHTML = () => {
    const html = blueprintToHTML(build);
    const filename = (build.title || "blueprint").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase();
    downloadFile(html, `${filename}.html`, "text/html");
    setShow(false);
  };

  const handleDownloadMD = () => {
    const md = blueprintToMarkdown(build);
    const filename = (build.title || "blueprint").replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-").toLowerCase();
    downloadFile(md, `${filename}.md`, "text/markdown");
    setShow(false);
  };

  const menuBtn = (onClick, iconBg, iconColor, iconD, label, sub) => (
    <button onClick={onClick} style={{
      width: "100%", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
      background: "none", border: "none", borderBottom: "1px solid var(--bd2)", cursor: "pointer",
      fontFamily: "var(--head)", fontSize: 13, fontWeight: 500, color: "var(--tx)", textAlign: "left",
    }} onMouseEnter={e=>e.currentTarget.style.background="var(--bg3)"} onMouseLeave={e=>e.currentTarget.style.background="none"}>
      <span style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: iconBg, borderRadius: 7, color: iconColor, flexShrink: 0 }}>
        <Ic d={iconD} s={15}/>
      </span>
      <div><div>{label}</div><div style={{ fontSize: 11, color: "var(--tx3)", fontWeight: 400, marginTop: 1 }}>{sub}</div></div>
    </button>
  );

  return <div ref={ref} style={{ position: "relative" }}>
    <button className="btn btn-s btn-sm" onClick={() => setShow(!show)}>
      <Ic d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M7 10l5 5 5-5M12 15V3" s={15}/> Export
    </button>
    {show && <div className="pop" style={{
      position: "absolute", top: "100%", right: 0, marginTop: 6, width: 240,
      background: "var(--bg2)", border: "1px solid var(--bd)", borderRadius: "var(--r)",
      boxShadow: "var(--shadow2)", overflow: "hidden", zIndex: 100,
    }}>
      {menuBtn(handleDownloadHTML, "var(--acbg)", "var(--ac)", "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "Download HTML", "Open in browser to print/PDF")}
      {menuBtn(handleDownloadMD, "var(--bg3)", "var(--tx2)", "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z", "Download Markdown", "For Notion, Obsidian, GitHub")}
      {menuBtn(handleCopy, "var(--grnbg)", "var(--grn)", "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2", copied ? "Copied!" : "Copy to Clipboard", "Paste into any app")}
    </div>}
  </div>;
}

function BPView({ build, onStart, onBack, onDel, onEditStep }) {
  const [open, setOpen] = useState(null); const [cd, setCd] = useState(false);
  const [editing, setEditing] = useState(null); // {index, field}
  const [editVal, setEditVal] = useState("");

  const startEdit = (i, field, val) => { setEditing({ index: i, field }); setEditVal(val || ""); };
  const saveEdit = () => { if (editing && onEditStep) { onEditStep(build.id, editing.index, editing.field, editVal); } setEditing(null); };
  const cancelEdit = () => setEditing(null);

  const EditableField = ({ index, field, value, multiline, style: st }) => {
    const isEditing = editing?.index === index && editing?.field === field;
    if (isEditing) {
      return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {multiline ? <textarea className="textarea" value={editVal} onChange={e => setEditVal(e.target.value)} style={{ minHeight: 60, fontSize: 13, ...st }} autoFocus />
          : <input className="input" value={editVal} onChange={e => setEditVal(e.target.value)} style={{ fontSize: 13, ...st }} autoFocus onKeyDown={e => e.key === "Enter" && saveEdit()} />}
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn btn-p btn-sm" onClick={saveEdit}>Save</button>
          <button className="btn btn-g btn-sm" onClick={cancelEdit}>Cancel</button>
        </div>
      </div>;
    }
    return <p onClick={() => startEdit(index, field, value)} style={{ ...st, cursor: "pointer", borderRadius: 4, padding: "2px 4px", margin: "-2px -4px", transition: "background .15s" }} onMouseEnter={e => e.target.style.background = "var(--bg3)"} onMouseLeave={e => e.target.style.background = "transparent"}>{value || <span style={{ color: "var(--tx3)", fontStyle: "italic" }}>Click to add...</span>}</p>;
  };

  return <div className="rise">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
      <button className="btn btn-g" onClick={onBack}><Ic d="M15 18l-6-6 6-6" s={16}/> Back</button>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <ExportMenu build={build} />
        {!cd ? <button className="btn btn-d btn-sm" onClick={()=>setCd(true)}><Ic d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" s={14}/> Delete</button>
          : <div style={{ display: "flex", gap: 6 }}><button className="btn btn-g btn-sm" onClick={()=>setCd(false)}>Cancel</button><button className="btn btn-d btn-sm" onClick={()=>onDel(build.id)}>Confirm</button></div>}
      </div>
    </div>
    <div className="card card-glow rise" style={{ marginBottom: 24 }}>
      {build.source_url && getYTId(build.source_url) && <a href={build.source_url} target="_blank" rel="noopener noreferrer" style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"var(--bg3)", borderRadius:10, marginBottom:18, textDecoration:"none", transition:"all .2s" }}>
        <img src={`https://img.youtube.com/vi/${getYTId(build.source_url)}/mqdefault.jpg`} alt="" style={{ width:72, borderRadius:6 }} />
        <span style={{ fontFamily:"var(--head)", fontSize:12, fontWeight:600, color:"var(--ac)" }}>Open tutorial on YouTube ↗</span>
      </a>}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"start", gap:12, flexWrap:"wrap", marginBottom:16 }}>
        <div><div className="label" style={{ marginBottom:6 }}>Blueprint</div><h2 style={{ fontFamily:"var(--head)", fontSize:22, fontWeight:700, lineHeight:1.3, letterSpacing:-.3 }}>{build.title}</h2></div>
        <span className={`badge badge-${build.status}`}>{build.status}</span>
      </div>
      <div style={{ background:"var(--acbg)", borderRadius:10, padding:16, marginBottom:20 }}>
        <div style={{ fontFamily:"var(--head)", fontSize:11, color:"var(--ac)", fontWeight:600, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Objective</div>
        <p style={{ fontSize:15, lineHeight:1.7 }}>{build.objective}</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:18 }}>
        <div><div className="label">Tools</div><div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{build.tools?.map((t,i)=><span key={i} className="chip chip-ac">{t}</span>)}</div></div>
        <div><div className="label">Prerequisites</div><div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{build.prerequisites?.map((p,i)=><span key={i} className="chip">{p}</span>)}</div></div>
      </div>
      <div style={{ display:"flex", gap:20, fontSize:14, color:"var(--tx2)" }}>
        <span style={{ display:"flex", alignItems:"center", gap:6 }}><Ic d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2" s={16}/>{build.time_min}–{build.time_max} min</span>
      </div>
    </div>
    {build.assumptions?.length>0 && <div className="card rise" style={{ marginBottom:24, borderColor:"var(--yel)" }}>
      <div className="label" style={{ color:"var(--yel)" }}>Assumptions</div>
      {build.assumptions.map((a,i)=><p key={i} style={{ fontSize:14, color:"var(--tx2)", lineHeight:1.7, marginTop:i?4:0 }}>• {a}</p>)}
    </div>}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <div className="label" style={{ margin: 0 }}>Steps ({build.steps?.length})</div>
      <span style={{ fontFamily: "var(--head)", fontSize: 11, color: "var(--tx3)" }}>Click any step text to edit</span>
    </div>
    <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:32 }}>
      {build.steps?.map((s,i) => <div key={i} className="step-row slide" style={{ animationDelay:`${i*.04}s` }}>
        <div className="step-head" onClick={()=>setOpen(open===i?null:i)}>
          <div className="step-num">{i+1}</div>
          <div style={{ flex:1, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontFamily:"var(--head)", fontWeight:600, fontSize:15 }}>{s.title}</span>
            <Ic d={open===i?"M6 9l6 6 6-6":"M9 18l6-6-6-6"} s={16} style={{ color:"var(--tx3)" }}/>
          </div>
        </div>
        {open===i && <div style={{ padding:"0 18px 18px 62px", display:"flex", flexDirection:"column", gap:12 }}>
          <div><div style={{ fontFamily:"var(--head)", fontSize:11, fontWeight:600, color:"var(--ac)", textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>What to do</div>
            <EditableField index={i} field="what_to_do" value={s.what_to_do||s.details||""} multiline style={{ fontSize:14, color:"var(--tx2)", lineHeight:1.7 }} /></div>
          <div><div style={{ fontFamily:"var(--head)", fontSize:11, fontWeight:600, color:"var(--tx3)", textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>Command / Code</div>
            <EditableField index={i} field="command" value={s.command !== "null" ? s.command : ""} multiline style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--tx2)", lineHeight:1.6 }} /></div>
          <div><div style={{ fontFamily:"var(--head)", fontSize:11, fontWeight:600, color:"var(--grn)", textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>✓ What you should see</div>
            <EditableField index={i} field="expected_result" value={s.expected_result||""} style={{ fontSize:14, color:"var(--grn)", lineHeight:1.7 }} /></div>
        </div>}
      </div>)}
    </div>
    <button className="btn btn-p btn-lg btn-w" onClick={()=>onStart(build.id)}><Ic d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" s={17}/> Start Build Mode</button>
  </div>;
}

function BuildMode({ build, steps, proof, onTog, onProof, onDone, onBack }) {
  const [tab, setTab] = useState("url"); const [url, setUrl] = useState(proof?.url||"");
  const [note, setNote] = useState(proof?.note||""); const [file, setFile] = useState(proof?.file||"");
  const [showDone, setShowDone] = useState(false); const fRef = useRef(null);
  const cnt = steps.filter(s=>s.done).length; const pct = steps.length?(cnt/steps.length)*100:0;
  const hasP = url.trim().length>0||file.length>0||note.trim().length>=30;
  const save = ()=>onProof({ type:tab, url:url.trim()||null, file:file||null, note:note.trim()||null });
  return <div className="rise">
    <button className="btn btn-g" onClick={onBack} style={{ marginBottom:24 }}><Ic d="M15 18l-6-6 6-6" s={16}/> Blueprint</button>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
      <h2 style={{ fontFamily:"var(--head)", fontSize:22, fontWeight:700, letterSpacing:-.3 }}>Build Mode</h2>
      <span className="badge badge-active">Active</span>
    </div>
    <p style={{ fontFamily:"var(--head)", fontSize:13, color:"var(--tx2)", marginBottom:20 }}>{build.title}</p>
    <div style={{ marginBottom:28 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
        <span style={{ fontFamily:"var(--head)", fontSize:11, fontWeight:600, color:"var(--tx3)", textTransform:"uppercase", letterSpacing:.8 }}>Progress</span>
        <span style={{ fontFamily:"var(--head)", fontSize:12, fontWeight:600, color:"var(--ac)" }}>{cnt}/{steps.length}</span>
      </div>
      <div className="pbar"><div className="pfill" style={{ width:`${pct}%` }}/></div>
    </div>
    <div className="card" style={{ marginBottom:24 }}>
      <div className="label">Checklist</div>
      <div style={{ display:"flex", flexDirection:"column", gap:2, marginTop:10 }}>
        {steps.map((s,i)=><div key={s.id} style={{ borderRadius:"var(--r)", overflow:"hidden" }}>
          <div className="chk slide" style={{ animationDelay:`${i*.03}s` }} onClick={()=>onTog(s.id)}>
            <div className={`chk-box ${s.done?"on":""}`}>{s.done&&<Ic d="M20 6L9 17l-5-5" s={14} style={{ color:"white" }}/>}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"var(--head)", fontWeight:500, fontSize:15, textDecoration:s.done?"line-through":"none", color:s.done?"var(--tx3)":"var(--tx)", transition:"all .2s" }}>{s.title}</div>
              <p style={{ fontSize:13, color:"var(--tx2)", marginTop:5, lineHeight:1.6 }}>{s.what_to_do||s.details||""}</p>
              {s.command&&s.command!=="null"&&<div className="code" style={{ marginTop:8 }}>{s.command}</div>}
              {s.expected_result&&<p style={{ fontSize:13, color:"var(--grn)", marginTop:8, lineHeight:1.5 }}>✓ {s.expected_result}</p>}
            </div>
          </div>
        </div>)}
      </div>
    </div>
    <div className="card" style={{ marginBottom:24, borderColor:hasP?"var(--grn)":"var(--bd)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" s={18} style={{ color:hasP?"var(--grn)":"var(--tx3)" }}/>
        <div className="label" style={{ margin:0, color:hasP?"var(--grn)":undefined }}>Proof of Work {hasP&&"✓"}</div>
      </div>
      <div className="tabs" style={{ marginBottom:14 }}>{["url","file","note"].map(t=><button key={t} className={`tab ${tab===t?"tab-on":""}`} onClick={()=>setTab(t)}>{t}</button>)}</div>
      {tab==="url"&&<input className="input" placeholder="GitHub repo, deployed URL…" value={url} onChange={x=>setUrl(x.target.value)} />}
      {tab==="file"&&<><input type="file" ref={fRef} style={{ display:"none" }} onChange={x=>{if(x.target.files?.[0])setFile(x.target.files[0].name);}}/><button className="btn btn-s btn-w" onClick={()=>fRef.current?.click()}><Ic d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" s={16}/>{file||"Upload screenshot or zip"}</button></>}
      {tab==="note"&&<><textarea className="textarea" style={{ minHeight:80 }} placeholder="Describe what you built (min 30 chars)…" value={note} onChange={x=>setNote(x.target.value)}/><p style={{ fontSize:12, fontFamily:"var(--head)", color:note.length>=30?"var(--grn)":"var(--tx3)", marginTop:6 }}>{note.length}/30</p></>}
      <button className="btn btn-s btn-sm" style={{ marginTop:12 }} onClick={save}>Save Proof</button>
    </div>
    <button className="btn btn-p btn-lg btn-w" disabled={!hasP} onClick={()=>{save();setShowDone(true);}}>
      <Ic d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 19.24 7 20v2h10v-2c0-.76-.85-1.25-2.03-1.79C14.47 17.98 14 17.55 14 17v-2.34" s={17}/>
      {hasP?"Mark Build Complete":"Add proof to complete"}
    </button>
    {!hasP&&<p style={{ textAlign:"center", fontSize:13, color:"var(--tx3)", marginTop:8 }}>Submit proof (URL, file, or note 30+ chars) to unlock.</p>}
    {showDone&&<div className="overlay" onClick={x=>{if(x.target===x.currentTarget)setShowDone(false);}}>
      <div className="overlay-card">
        <div style={{ fontSize:48, marginBottom:16 }}>🏆</div>
        <h2 style={{ fontFamily:"var(--head)", fontSize:24, fontWeight:700, marginBottom:8 }}>Build Complete!</h2>
        <p style={{ color:"var(--tx2)", fontSize:15, marginBottom:6 }}>{build.title}</p>
        <p style={{ fontFamily:"var(--head)", fontSize:12, color:"var(--ac)", marginBottom:28 }}>{"If it's not shipped, it doesn't count."}</p>
        <button className="btn btn-p btn-lg btn-w" onClick={()=>{onDone();setShowDone(false);}}>Dashboard</button>
      </div>
    </div>}
  </div>;
}

function Dash({ builds, onNew, onOpen, onDel }) {
  const [did, setDid] = useState(null);
  const [showJourney, setShowJourney] = useState(false);
  const t=builds.length, a=builds.filter(b=>b.status==="active").length, c=builds.filter(b=>b.status==="completed").length;

  // Collect all unique tools from completed builds for skills
  const skills = [...new Set(builds.filter(b=>b.status==="completed").flatMap(b=>b.tools||[]))];
  const totalSteps = builds.reduce((sum, b) => sum + (b.steps?.length || 0), 0);

  return <div className="rise">
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:32, flexWrap:"wrap", gap:10 }}>
      <div><h2 style={{ fontFamily:"var(--head)", fontSize:26, fontWeight:700, letterSpacing:-.5 }}>Dashboard</h2><p style={{ color:"var(--tx3)", fontSize:14, marginTop:4 }}>Your builds at a glance</p></div>
      <div style={{ display: "flex", gap: 8 }}>
        {t > 0 && <button className="btn btn-s btn-sm" onClick={() => setShowJourney(!showJourney)}>
          <Ic d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6a6 6 0 100 12 6 6 0 000-12zM12 10a2 2 0 100 4 2 2 0 000-4z" s={14}/> My Journey
        </button>}
        <button className="btn btn-p" onClick={onNew}><Ic d="M12 5v14M5 12h14" s={16}/> New Build</button>
      </div>
    </div>

    {/* Journey / Progress Tracking */}
    {showJourney && <div className="card pop" style={{ marginBottom: 28, border: "1px solid var(--ac)", background: "var(--acbg)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontFamily: "var(--head)", fontSize: 18, fontWeight: 700 }}>My Builder Journey</h3>
        <button className="btn btn-g btn-sm" onClick={() => setShowJourney(false)}><Ic d="M18 6L6 18M6 6l12 12" s={14}/></button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div style={{ textAlign: "center", padding: 14, background: "var(--bg2)", borderRadius: "var(--r)", boxShadow: "var(--shadow)" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>📋</div>
          <div style={{ fontFamily: "var(--head)", fontSize: 22, fontWeight: 700 }}>{t}</div>
          <div style={{ fontSize: 12, color: "var(--tx3)" }}>Blueprints</div>
        </div>
        <div style={{ textAlign: "center", padding: 14, background: "var(--bg2)", borderRadius: "var(--r)", boxShadow: "var(--shadow)" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>🏆</div>
          <div style={{ fontFamily: "var(--head)", fontSize: 22, fontWeight: 700 }}>{c}</div>
          <div style={{ fontSize: 12, color: "var(--tx3)" }}>Completed</div>
        </div>
        <div style={{ textAlign: "center", padding: 14, background: "var(--bg2)", borderRadius: "var(--r)", boxShadow: "var(--shadow)" }}>
          <div style={{ fontSize: 28, marginBottom: 4 }}>⚡</div>
          <div style={{ fontFamily: "var(--head)", fontSize: 22, fontWeight: 700 }}>{totalSteps}</div>
          <div style={{ fontSize: 12, color: "var(--tx3)" }}>Total Steps</div>
        </div>
      </div>

      {skills.length > 0 && <div>
        <div className="label" style={{ marginBottom: 8 }}>Skills Learned</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {skills.map((s, i) => <span key={i} className="chip chip-ac" style={{ padding: "5px 14px", fontSize: 13 }}>{s}</span>)}
        </div>
      </div>}

      {c > 0 && <div style={{ marginTop: 16 }}>
        <div className="label" style={{ marginBottom: 8 }}>Completed Builds</div>
        {builds.filter(b => b.status === "completed").map((b, i) => (
          <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < builds.filter(x=>x.status==="completed").length - 1 ? "1px solid var(--bd2)" : "none" }}>
            <span style={{ color: "var(--grn)", fontSize: 16 }}>✓</span>
            <div>
              <div style={{ fontFamily: "var(--head)", fontSize: 14, fontWeight: 500 }}>{b.title}</div>
              <span style={{ fontSize: 12, color: "var(--tx3)" }}>{new Date(b.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>}

      {c === 0 && <p style={{ fontSize: 14, color: "var(--tx2)", marginTop: 8, textAlign: "center", padding: 12 }}>
        Complete your first build to start tracking your journey!
      </p>}
    </div>}

    <div className="stats rise" style={{ animationDelay:".05s" }}>
      <div className="stat"><div className="stat-v">{t}</div><div className="stat-l">Created</div></div>
      <div className="stat"><div className="stat-v" style={{ color:"var(--grn)" }}>{a}</div><div className="stat-l">In Progress</div></div>
      <div className="stat"><div className="stat-v" style={{ color:"var(--ac)" }}>{c}</div><div className="stat-l">Completed</div></div>
      <div className="stat"><div className="stat-v">{t?Math.round(c/t*100):0}%</div><div className="stat-l">Rate</div></div>
    </div>
    <div className="label">Builds ({t})</div>
    {!t ? <div className="rise" style={{ textAlign:"center", padding:"52px 20px", color:"var(--tx3)" }}>
      <p style={{ fontSize:16, marginBottom:6 }}>No builds yet</p><p style={{ fontSize:14, marginBottom:20 }}>Create your first build from a tutorial.</p>
      <button className="btn btn-p" onClick={onNew}><Ic d="M12 5v14M5 12h14" s={15}/> Create Build</button>
    </div> : <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:14 }}>
      {builds.map((b,i)=><div key={b.id} className="card slide" style={{ cursor:"pointer", animationDelay:`${i*.04}s` }} onClick={()=>onOpen(b.id)}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
              <span className={`badge badge-${b.status}`}>{b.status}</span>
              <span style={{ fontFamily:"var(--head)", fontSize:11, color:"var(--tx3)" }}>{new Date(b.created_at).toLocaleDateString()}</span>
            </div>
            <h3 style={{ fontFamily:"var(--head)", fontWeight:600, fontSize:15, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.title}</h3>
          </div>
          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
            <button className="btn btn-s btn-sm" onClick={e=>{e.stopPropagation();onOpen(b.id);}}>{b.status==="completed"?"View":b.status==="active"?"Resume":"Open"}</button>
            {did===b.id?<button className="btn btn-d btn-sm" onClick={e=>{e.stopPropagation();onDel(b.id);setDid(null);}}>Confirm?</button>
              :<button className="btn btn-g btn-sm" onClick={e=>{e.stopPropagation();setDid(b.id);}}><Ic d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" s={14}/></button>}
          </div>
        </div>
      </div>)}
    </div>}
  </div>;
}

// ── App ──
export default function App() {
  const [db, setDb] = useState({ user:null, builds:[], steps:{}, proofs:{} });
  const [pg, setPg] = useState("landing"); const [aid, setAid] = useState(null);
  const [theme, setTheme] = useState("light");
  useEffect(()=>{ const s=loadDB(); setDb(s); if(s.user)setPg("dashboard"); setTheme(loadTheme()); },[]);
  const persist = n=>{ setDb(n); saveDB(n); };
  const toggleTheme = ()=>{ const t = theme==="light"?"dark":"light"; setTheme(t); saveTheme(t); };

  const login = em=>{ persist({...db,user:{email:em}}); setPg("dashboard"); };
  const logout = ()=>{ persist({user:null,builds:[],steps:{},proofs:{}}); setPg("landing"); };
  const created = ({bp,text,sourceUrl})=>{
    const id="b"+Date.now();
    const build={id,title:bp.title,objective:bp.objective,tools:bp.tools||[],prerequisites:bp.prerequisites||[],time_min:bp.time_estimate_min||30,time_max:bp.time_estimate_max||120,expected_output:bp.expected_output||"",assumptions:bp.assumptions||[],steps:bp.steps||[],status:"draft",source_text:text,source_url:sourceUrl||null,created_at:new Date().toISOString()};
    const steps=bp.steps.map((s,i)=>({id:`${id}_${i}`,title:s.title,what_to_do:s.what_to_do||s.details||"",command:s.command||null,expected_result:s.expected_result||null,details:s.details||s.what_to_do||"",done:false}));
    persist({...db,builds:[build,...db.builds],steps:{...db.steps,[id]:steps}}); setAid(id); setPg("blueprint");
  };
  const start=id=>{persist({...db,builds:db.builds.map(b=>b.id===id?{...b,status:"active"}:b)}); setAid(id); setPg("build");};
  const tog=sid=>{const s=(db.steps[aid]||[]).map(x=>x.id===sid?{...x,done:!x.done}:x); persist({...db,steps:{...db.steps,[aid]:s}});};
  const proof=d=>{persist({...db,proofs:{...db.proofs,[aid]:d}});};
  const done=()=>{persist({...db,builds:db.builds.map(b=>b.id===aid?{...b,status:"completed"}:b)}); setAid(null); setPg("dashboard");};
  const open=id=>{setAid(id); setPg(db.builds.find(x=>x.id===id)?.status==="draft"?"blueprint":"build");};
  const del=id=>{const ns={...db.steps};delete ns[id];const np={...db.proofs};delete np[id]; persist({...db,builds:db.builds.filter(x=>x.id!==id),steps:ns,proofs:np}); if(aid===id){setAid(null);setPg("dashboard");}};

  // Edit a step field in a build
  const editStep = (buildId, stepIndex, field, value) => {
    // Update in build.steps (for blueprint view / export)
    const newBuilds = db.builds.map(b => {
      if (b.id !== buildId) return b;
      const newSteps = [...(b.steps || [])];
      if (newSteps[stepIndex]) newSteps[stepIndex] = { ...newSteps[stepIndex], [field]: value };
      return { ...b, steps: newSteps };
    });
    // Update in db.steps (for build mode checklist)
    const buildSteps = (db.steps[buildId] || []).map((s, i) =>
      i === stepIndex ? { ...s, [field]: value } : s
    );
    persist({ ...db, builds: newBuilds, steps: { ...db.steps, [buildId]: buildSteps } });
  };

  const ab = db.builds.find(b=>b.id===aid);

  return <div data-theme={theme}>
    <style>{CSS}</style>
    <div className="shell">
      {pg!=="landing"&&<header className="hdr">
        <div className="logo" onClick={()=>{setPg("dashboard");setAid(null);}}><span className="logo-mark"/>BuildLab</div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontFamily:"var(--head)", fontSize:12, color:"var(--tx3)" }}>{db.user?.email}</span>
          <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">{theme==="light"?<MoonIc/>:<SunIc/>}</button>
          <button className="btn btn-g btn-sm" onClick={logout}><Ic d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" s={15}/></button>
        </div>
      </header>}
      <main className="main">
        {pg==="landing"&&<Landing onLogin={login}/>}
        {pg==="dashboard"&&<Dash builds={db.builds} onNew={()=>setPg("create")} onOpen={open} onDel={del}/>}
        {pg==="create"&&<Create onDone={created} onBack={()=>setPg("dashboard")}/>}
        {pg==="blueprint"&&ab&&<BPView build={ab} onStart={start} onBack={()=>{setPg("dashboard");setAid(null);}} onDel={del} onEditStep={editStep}/>}
        {pg==="build"&&ab&&<BuildMode build={ab} steps={db.steps[aid]||[]} proof={db.proofs[aid]} onTog={tog} onProof={proof} onDone={done} onBack={()=>setPg("blueprint")}/>}
      </main>
    </div>
  </div>;
}
