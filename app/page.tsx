/*
  askck.ai — Full page component
  Drop this into: app/page.tsx (rename .jsx → .tsx and add "use client" at top)
  Also create: app/api/chat/route.ts (see bottom of this file, in comments)

  Fonts used (add to app/layout.tsx):
    import { Playfair_Display, DM_Mono } from 'next/font/google'
  Or just load via <link> in your HTML <head> if using plain Next.js layout.
*/

"use client";

import { useState, useRef, useEffect } from "react";

// ─── Inline styles (no Tailwind dependency required) ─────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@300;400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:      #1a1714;
    --paper:    #f5f0e8;
    --muted:    #8a8278;
    --accent:   #c84b31;
    --border:   #d9d2c5;
    --chat-bg:  #eeeae0;
    --font-display: 'Playfair Display', Georgia, serif;
    --font-mono:    'DM Mono', 'Courier New', monospace;
  }

  html { scroll-behavior: smooth; }

  body {
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.6;
    min-height: 100vh;
    /* subtle grain overlay */
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  }

  /* ── Layout ── */
  .page { max-width: 680px; margin: 0 auto; padding: 64px 24px 120px; }

  /* ── Status bar ── */
  .status-bar {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; color: var(--muted); letter-spacing: 0.06em;
    text-transform: uppercase; margin-bottom: 56px;
  }
  .status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4caf7d; box-shadow: 0 0 0 2px rgba(76,175,125,0.25);
    animation: pulse 2.4s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 2px rgba(76,175,125,0.25); }
    50%       { box-shadow: 0 0 0 5px rgba(76,175,125,0.08); }
  }

  /* ── Hero ── */
  .hero { margin-bottom: 52px; }
  .hero-inner { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
  .hero-text { flex: 1; }
  .hero-photo { flex-shrink: 0; width: 200px; }
  .hero-img { width: 100%; height: auto; border-radius: 4px; display: block; }
  .byline { font-size: 11px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px; }
  .hero-headline {
    font-family: var(--font-display);
    font-size: clamp(32px, 7vw, 52px);
    font-weight: 400;
    line-height: 1.12;
    letter-spacing: -0.01em;
    margin-bottom: 20px;
  }
  .hero-headline em { font-style: italic; color: var(--accent); }
  .hero-sub { font-size: 13px; color: var(--muted); max-width: 380px; line-height: 1.7; }

  /* ── Certifications ── */
  .cert-list { display: flex; flex-direction: column; gap: 0; }
  .cert-item {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 11px 0; border-bottom: 1px solid var(--border);
  }
  .cert-item:last-child { border-bottom: none; }
  .cert-name { font-size: 13px; }
  .cert-short { font-size: 11px; color: var(--muted); }

  /* ── Chat box ── */
  .chat-wrap { margin-bottom: 60px; }
  .chat-window {
    background: var(--chat-bg);
    border: 1px solid var(--border);
    border-radius: 4px;
    min-height: 80px;
    padding: 16px;
    margin-bottom: 0;
    font-size: 13px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .chat-empty { color: var(--muted); font-size: 12px; }
  .msg { display: flex; flex-direction: column; gap: 2px; }
  .msg-label { font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); }
  .msg-user .msg-label { color: var(--accent); }
  .msg-text { font-size: 13px; line-height: 1.65; white-space: pre-wrap; }
  .msg-assistant .msg-text { color: var(--ink); }

  .chat-input-row {
    display: flex; gap: 0;
    border: 1px solid var(--border);
    border-top: none;
    background: white;
  }
  .chat-input {
    flex: 1; border: none; outline: none;
    padding: 12px 14px;
    font-family: var(--font-mono); font-size: 13px;
    background: transparent; color: var(--ink);
    resize: none;
  }
  .chat-input::placeholder { color: var(--muted); }
  .chat-send {
    padding: 12px 18px;
    background: var(--ink); color: var(--paper);
    border: none; cursor: pointer;
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.08em; text-transform: uppercase;
    transition: background 0.2s;
  }
  .chat-send:hover { background: var(--accent); }
  .chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
  .chip {
    font-size: 11px; padding: 5px 10px;
    border: 1px solid var(--border); border-radius: 2px;
    background: transparent; cursor: pointer;
    font-family: var(--font-mono); color: var(--muted);
    transition: all 0.15s;
  }
  .chip:hover { border-color: var(--ink); color: var(--ink); }

  /* ── Divider ── */
  .rule { border: none; border-top: 1px solid var(--border); margin: 48px 0; }

  /* ── Section label ── */
  .section-label {
    font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 20px;
  }

  /* ── Work history ── */
  .work-list { display: flex; flex-direction: column; gap: 0; }
  .work-item {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 11px 0; border-bottom: 1px solid var(--border);
    opacity: 0; transform: translateY(6px);
    animation: fadeUp 0.4s forwards;
  }
  .work-item:last-child { border-bottom: none; }
  .work-name { font-size: 13px; font-weight: 400; }
  .work-period { font-size: 11px; color: var(--muted); }
  @keyframes fadeUp {
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── Projects ── */
  .project-list { display: flex; flex-direction: column; gap: 0; }
  .project-item {
    padding: 16px 0; border-bottom: 1px solid var(--border);
    opacity: 0; transform: translateY(6px);
    animation: fadeUp 0.4s forwards;
  }
  .project-item:last-child { border-bottom: none; }
  .project-name {
    font-family: var(--font-display); font-size: 17px;
    font-weight: 400; margin-bottom: 4px;
  }
  .project-desc { font-size: 12px; color: var(--muted); line-height: 1.6; margin-bottom: 6px; }
  .project-tags { display: flex; flex-wrap: wrap; gap: 4px; }
  .tag {
    font-size: 10px; padding: 2px 7px;
    border: 1px solid var(--border); border-radius: 2px;
    color: var(--muted); letter-spacing: 0.05em;
  }

  /* ── Stack ── */
  .stack-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .stack-item {
    font-size: 11px; padding: 4px 10px;
    background: var(--chat-bg); border: 1px solid var(--border);
    border-radius: 2px; color: var(--ink);
  }

  /* ── Contact ── */
  .contact-links { display: flex; gap: 20px; flex-wrap: wrap; }
  .contact-link {
    font-size: 12px; color: var(--ink); text-decoration: none;
    letter-spacing: 0.04em;
    border-bottom: 1px solid var(--border);
    padding-bottom: 1px;
    transition: border-color 0.15s, color 0.15s;
  }
  .contact-link:hover { border-color: var(--accent); color: var(--accent); }

  /* ── Footer ── */
  .footer { margin-top: 72px; font-size: 11px; color: var(--muted); display: flex; justify-content: space-between; }

  /* ── Typing indicator ── */
  .typing { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
  .typing span {
    width: 5px; height: 5px; background: var(--muted);
    border-radius: 50%; animation: blink 1.2s infinite;
  }
  .typing span:nth-child(2) { animation-delay: 0.2s; }
  .typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink {
    0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; }
  }

  /* Staggered animation delays */
  .work-item:nth-child(1) { animation-delay: 0.05s; }
  .work-item:nth-child(2) { animation-delay: 0.10s; }
  .work-item:nth-child(3) { animation-delay: 0.15s; }
  .work-item:nth-child(4) { animation-delay: 0.20s; }
  .work-item:nth-child(5) { animation-delay: 0.25s; }
  .project-item:nth-child(1) { animation-delay: 0.05s; }
  .project-item:nth-child(2) { animation-delay: 0.12s; }
  .project-item:nth-child(3) { animation-delay: 0.19s; }
`;

// ─── Data ─────────────────────────────────────────────────────────────────────

const WORK = [
  { name: "KPMG", period: "Mar 2011–Jun 2013" },
  { name: "ACRA", period: "Jun 2013–Sep 2017" },
  { name: "IHiS / MOHH", period: "Oct 2017–Nov 2019" },
  { name: "KPMG", period: "Nov 2019–May 2022" },
  { name: "MOHT", period: "May 2022–Mar 2024" },
  { name: "Temus (est. by Temasek)", period: "Mar 2024–NOW" },
];

const PROJECTS = [
  {
    name: "Healthcare Cloud Migration (Temus)",
    desc: "Overall Project Lead for a large-scale healthcare cloud migration to AWS — transitioning 500+ systems across multiple hospital divisions while managing governance, risks, timelines, and budgets.",
    tags: ["AWS", "Cloud Migration", "Programme Governance", "Healthcare"],
  },
  {
    name: "Azure Data & Analytics Platform (Temus)",
    desc: "Led implementation of modern data and analytics environments on Microsoft Azure using Databricks, enabling advanced reporting and data-driven decision-making for healthcare clients.",
    tags: ["Microsoft Azure", "Databricks", "Analytics", "Healthcare"],
  },
  {
    name: "National AI Risk Adjustment Model (MOHT)",
    desc: "Led development of a national AI-driven risk adjustment model leveraging modern data platforms and analytics pipelines to support healthcare policy implementation and financing transformation.",
    tags: ["AI / ML", "Data Platforms", "Analytics Pipelines", "Health Policy"],
  },
  {
    name: "COVID Digital Assessment Platform (KPMG)",
    desc: "Project Lead for a nationwide COVID digital assessment platform on Microsoft Azure — covering requirements definition, cloud environment setup, rollout planning, and multi-agency stakeholder coordination.",
    tags: ["Microsoft Azure", "Cloud", "Public Health", "Stakeholder Management"],
  },
  {
    name: "Multi-Country Dynamics 365 ERP (KPMG)",
    desc: "Led a Microsoft Dynamics 365 cloud ERP rollout across Singapore, Thailand, Malaysia, and Vietnam, aligning regional business requirements with global headquarters standards.",
    tags: ["Dynamics 365", "ERP", "Multi-Country", "Cloud"],
  },
  {
    name: "NEHR Enhancements & Security Programme (IHiS/MOHH)",
    desc: "Project Lead for national NEHR enhancements. Also led the post-SingHealth cyberattack security enhancement programme, coordinating across application, infrastructure, security, and operations teams.",
    tags: ["NEHR", "Cybersecurity", "Digital Health", "Public Sector"],
  },
  {
    name: "ACRA Business Registration System",
    desc: "Led end-to-end implementation of ACRA's business registration system, working with senior management, GovTech, and system integrators to modernise a core government digital service.",
    tags: ["GovTech", "Digital Government", "System Implementation", "BPR"],
  },
];

const STACK = [
  "AWS", "Microsoft Azure", "Azure Databricks",
  "Dynamics 365", "MS Project", "JIRA", "Confluence",
];

const CERTS = [
  { name: "Pingat Bakti Masyarakat (Public Service Medal)", short: "PBM" },
  { name: "Project Management Professional", short: "PMP" },
  { name: "Certified Scrum Master", short: "CSM" },
  { name: "ITIL Foundation", short: "ITIL" },
];

const CHIPS = [
  "What's CK's background?",
  "What is CK currently working on?",
  "What certifications does CK hold?",
  "What projects has CK delivered?",
];

const SYSTEM_PROMPT = `You are askCK — a concise AI assistant representing CK, a Singapore-based IT programme and delivery professional with 14+ years of experience spanning public sector, consulting, and healthtech.

Work history (chronological):
- KPMG (Mar 2011–Jun 2013): Enterprise system requirements gathering and BPR for Government, Pharma, and Healthcare clients
- ACRA (Jun 2013–Sep 2017): Led end-to-end implementation of ACRA's business registration system with GovTech and system integrators
- IHiS / MOHH (Oct 2017–Nov 2019): Project Lead for national NEHR enhancements; led post-SingHealth cyberattack security enhancement programme
- KPMG (Nov 2019–May 2022): Led nationwide COVID digital assessment platform on Azure; led multi-country Dynamics 365 ERP rollout across SG, TH, MY, VN
- MOHT (May 2022–Mar 2024): Led national AI-driven risk adjustment model for healthcare policy and financing transformation
- Temus, est. by Temasek (Mar 2024–now): Overall Project Lead for large-scale healthcare cloud migration to AWS (500+ systems); leads Azure Databricks analytics platform initiatives

Certifications: PMP, CSM, ITIL
Award: Pingat Bakti Masyarakat (Public Service Medal)
Stack: AWS, Microsoft Azure, Azure Databricks, Dynamics 365, MS Project, JIRA, Confluence

Be professional, direct and precise. Max 3–4 sentences per answer unless asked for detail.`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AskCK() {
  const [messages, setMessages] = useState<{role: string; content: string}[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text?: string) => {
    const question = text || input.trim();
    if (!question || loading) return;
    setInput("");
    const userMsg = { role: "user", content: question };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, system: SYSTEM_PROMPT }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.content }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setLoading(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      <style>{css}</style>
      <div className="page">

        {/* Status */}
        <div className="status-bar">
          <span className="status-dot" />
          <span>askcK · v0.1 · Online</span>
        </div>

        {/* Hero */}
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-text">
              <p className="byline">Chris King · Singapore</p>
              <h1 className="hero-headline">
                Delivering<br />
                what matters,<br />
                <em>on time.</em>
              </h1>
              <p className="hero-sub">
                14+ years delivering public sector digital transformation
                across health, government, and consulting. Ask me anything.
              </p>
            </div>
            <div className="hero-photo">
              <img src="/ck-photo.png" alt="Chris King" className="hero-img" />
            </div>
          </div>
        </section>

        {/* Chat */}
        <div className="chat-wrap">
          <div className="chat-window" ref={chatRef} style={{ maxHeight: messages.length ? 340 : 80, overflowY: "auto" }}>
            {messages.length === 0 && !loading && (
              <span className="chat-empty">Ask anything about CK's background, projects, or current work →</span>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`msg msg-${m.role}`}>
                <span className="msg-label">{m.role === "user" ? "you" : "askck"}</span>
                <span className="msg-text">{m.content}</span>
              </div>
            ))}
            {loading && (
              <div className="msg msg-assistant">
                <span className="msg-label">askck</span>
                <div className="typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>
          <div className="chat-input-row">
            <textarea
              className="chat-input"
              rows={1}
              placeholder="Ask a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
            />
            <button className="chat-send" onClick={() => send()} disabled={loading || !input.trim()}>
              Ask →
            </button>
          </div>
          <div className="chips">
            {CHIPS.map((c) => (
              <button key={c} className="chip" onClick={() => send(c)}>{c}</button>
            ))}
          </div>
        </div>

        <hr className="rule" />

        {/* Work */}
        <section>
          <p className="section-label">work · 14+ years</p>
          <div className="work-list">
            {WORK.map((w) => (
              <div key={w.name} className="work-item">
                <span className="work-name">{w.name}</span>
                <span className="work-period">{w.period}</span>
              </div>
            ))}
          </div>
        </section>

        <hr className="rule" />

        {/* Projects */}
        <section>
          <p className="section-label">featured projects</p>
          <div className="project-list">
            {PROJECTS.map((p) => (
              <div key={p.name} className="project-item">
                <div className="project-name">{p.name}</div>
                <div className="project-desc">{p.desc}</div>
                <div className="project-tags">
                  {p.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="rule" />

        {/* Stack */}
        <section>
          <p className="section-label">stack</p>
          <div className="stack-grid">
            {STACK.map((s) => <span key={s} className="stack-item">{s}</span>)}
          </div>
        </section>

        <hr className="rule" />

        {/* Certifications & Awards */}
        <section>
          <p className="section-label">certifications & awards</p>
          <div className="cert-list">
            {CERTS.map((c) => (
              <div key={c.short} className="cert-item">
                <span className="cert-name">{c.name}</span>
                <span className="cert-short">{c.short}</span>
              </div>
            ))}
          </div>
        </section>

        <hr className="rule" />

        {/* Contact */}
        <section>
          <p className="section-label">contact</p>
          <div className="contact-links">
            <a className="contact-link" href="mailto:ckingzl@gmail.com">Email ↗</a>
            <a className="contact-link" href="https://www.linkedin.com/in/chriskingsg/" target="_blank" rel="noreferrer">LinkedIn ↗</a>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <span>askck · 2026</span>
          <span>singapore / sgt</span>
        </footer>

      </div>
    </>
  );
}

/*
──────────────────────────────────────────────────────────────────────────────
  CREATE THIS FILE: app/api/chat/route.ts
──────────────────────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { messages, system } = await req.json();
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system,
    messages,
  });
  return NextResponse.json({
    content: (response.content[0] as { text: string }).text,
  });
}

──────────────────────────────────────────────────────────────────────────────
  ADD TO: app/layout.tsx  <head>
──────────────────────────────────────────────────────────────────────────────

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet" />

──────────────────────────────────────────────────────────────────────────────
  .env.local
──────────────────────────────────────────────────────────────────────────────

ANTHROPIC_API_KEY=sk-ant-...

──────────────────────────────────────────────────────────────────────────────
*/
