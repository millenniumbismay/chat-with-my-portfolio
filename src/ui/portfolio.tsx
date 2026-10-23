"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowRight, ArrowUp, X, RotateCcw } from "@/components/icons";
import config from "@/portfolio.config.json";
import { assistant } from "@/content/assistant";
import AIDock from "@/components/ai-dock";
import ThemeToggle from "@/components/theme-toggle";
import SocialLinks from "@/components/social-links";
import PortfolioNav, { sectionVisible } from "@/components/portfolio-nav";
import { apiFetch, usesDemoApi } from "@/client/api";
import type { profile as profileType, Project, Publication, Experience } from "@/content/site";

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00Z`));
}

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: { id: string; title: string; url: string }[];
  demo?: boolean;
};
type Detail = { title: string; category: string; body: string; url?: string; sample?: boolean };

export function Asterisk({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 2v36M2 20h36M7.3 7.3l25.4 25.4M7.3 32.7L32.7 7.3"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </svg>
  );
}

export function Orb({ small = false }: { small?: boolean }) {
  return (
    <div className={`orb ${small ? "orb-small" : ""}`} aria-hidden="true">
      <div className="orb-core" />
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} style={{ transform: `translate(-50%, -50%) rotate(${i * 20}deg)` }} />
      ))}
      <span className="orb-dot" />
    </div>
  );
}

export default function Portfolio({
  profile,
  projects,
  publications,
  experience,
}: {
  profile: typeof profileType;
  projects: Project[];
  publications: Publication[];
  experience: Experience[];
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const aiSourceRef = useRef<HTMLSpanElement>(null);
  function ask(question = "") {
    setInitialQuestion(question);
    setChatOpen(true);
  }
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        event.key !== "/" ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        chatOpen ||
        detail ||
        target?.closest("input, textarea, select, [contenteditable]")
      )
        return;
      event.preventDefault();
      setInitialQuestion("");
      setChatOpen(true);
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [chatOpen, detail]);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="shell portfolio-shell" id="top">
        <header className="site-header" ref={headerRef}>
          <div className="header-identity">
            <a href="#top" className="wordmark" aria-label="Back to introduction">
              {profile.initials}
              <span className="wordmark-dot">.</span>
            </a>
            <AIDock sourceRef={aiSourceRef} headerRef={headerRef} onClick={() => ask()}>
              <span className="mini-orb">
                <Orb small />
              </span>
            </AIDock>
          </div>
          <div className="header-actions">
            <PortfolioNav blogsHref="./blogs/" />
            <ThemeToggle />
          </div>
        </header>
        <main id="main">
          <section className="introduction" id="about" aria-labelledby="name">
            <h1 id="name">{profile.name}</h1>
            <p className="profile-interests">{profile.interests.join(" / ")}</p>
            <div className="bio">
              <p>{profile.bio}</p>
              <p>{profile.about}</p>
            </div>
            <SocialLinks />
            {profile.sample && (
              <p className="sample-note">Preview: this biography is sample content.</p>
            )}
          </section>

          <aside
            className="ask-strip"
            id="ask-me"
            aria-label={`${assistant.name}, my ${assistant.role}`}
          >
            <button className="ask-trigger" onClick={() => ask()} aria-keyshortcuts="/">
              <span className="ai-source" ref={aiSourceRef}>
                <span className="mini-orb">
                  <Orb small />
                </span>
              </span>
              <span>
                <strong>{assistant.action}</strong>
                <span className="ask-description">{assistant.tagline}</span>
              </span>
              <span className="shortcut-hint" aria-hidden="true">
                /
              </span>
            </button>
            <button
              className="surprise-button"
              onClick={() =>
                ask(
                  assistant.starterQuestions[
                    Math.floor(Math.random() * assistant.starterQuestions.length)
                  ],
                )
              }
            >
              Pick a question for me <ArrowRight size={13} />
            </button>
          </aside>

          {sectionVisible("experience") && experience.length > 0 && (
            <section
              className="content-section"
              id="experience"
              aria-labelledby="experience-heading"
            >
              <h2 id="experience-heading">Experience</h2>
              <ol className="work-list experience-list">
                {experience.map((entry) => (
                  <li key={entry.id}>
                    <div className="entry-heading">
                      <h3>{entry.role}</h3>
                      <span className="entry-date">
                        <time dateTime={entry.startDate}>{monthLabel(entry.startDate)}</time> –{" "}
                        {entry.endDate ? (
                          <time dateTime={entry.endDate}>{monthLabel(entry.endDate)}</time>
                        ) : (
                          "Present"
                        )}
                      </span>
                    </div>
                    <p className="experience-organization">
                      {entry.url ? (
                        <a href={entry.url} target="_blank" rel="noreferrer">
                          {entry.organization}
                        </a>
                      ) : (
                        entry.organization
                      )}
                      {entry.location && (
                        <span className="experience-location">{entry.location}</span>
                      )}
                    </p>
                    <p className="entry-description">{entry.description}</p>
                    <div className="entry-links">
                      <button
                        className="link-button"
                        onClick={() =>
                          ask(
                            `Tell me about your experience as ${entry.role} at ${entry.organization}`,
                          )
                        }
                      >
                        Ask about this
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {sectionVisible("publications") && (
            <section
              className="content-section"
              id="publications"
              aria-labelledby="publications-heading"
            >
              <h2 id="publications-heading">Publications</h2>
              <ul className="work-list">
                {publications.map((pub) => (
                  <li key={pub.id} className="publication">
                    <div className="entry-heading">
                      <h3>
                        <button
                          className="entry-title"
                          aria-expanded={expanded === pub.id}
                          aria-controls={`abstract-${pub.id}`}
                          onClick={() => setExpanded(expanded === pub.id ? null : pub.id)}
                        >
                          {pub.title}
                        </button>
                      </h3>
                      <span className="entry-date">{pub.year}</span>
                    </div>
                    <p className="entry-meta">
                      {pub.venue}
                      {pub.sample && <span className="sample-label">Sample</span>}
                    </p>
                    <p className="publication-authors">
                      {pub.authors.map((author, index) => (
                        <span key={`${author}-${index}`}>
                          {index > 0 && ", "}
                          {author === profile.name ? <strong>{author}</strong> : author}
                        </span>
                      ))}
                    </p>
                    <div className="entry-links">
                      <button
                        className="link-button"
                        aria-expanded={expanded === pub.id}
                        aria-controls={`abstract-${pub.id}`}
                        onClick={() => setExpanded(expanded === pub.id ? null : pub.id)}
                      >
                        {expanded === pub.id ? "Hide overview" : "Overview"}
                      </button>
                      {pub.url && (
                        <a href={pub.url} target="_blank" rel="noreferrer">
                          Paper
                        </a>
                      )}
                      <button
                        className="link-button"
                        onClick={() => ask(`Tell me about the publication “${pub.title}”`)}
                      >
                        Ask about this
                      </button>
                    </div>
                    <div
                      id={`abstract-${pub.id}`}
                      className="abstract"
                      hidden={expanded !== pub.id}
                    >
                      {pub.description}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sectionVisible("projects") && (
            <section className="content-section" id="projects" aria-labelledby="projects-heading">
              <h2 id="projects-heading">Selected projects</h2>
              <ul className="work-list">
                {projects.map((project) => (
                  <li key={project.id}>
                    <div className="entry-heading">
                      <h3>
                        <button
                          className="entry-title"
                          onClick={() =>
                            setDetail({
                              title: project.title,
                              category: project.category,
                              body: project.body,
                              url: project.url,
                              sample: project.sample,
                            })
                          }
                        >
                          {project.title}
                        </button>
                      </h3>
                      {project.sample && <span className="sample-label">Sample</span>}
                    </div>
                    <p className="entry-description">{project.description}</p>
                    <div className="entry-links">
                      <span className="entry-meta">{project.tags.join(" / ")}</span>
                      {project.url && (
                        <a href={project.url} target="_blank" rel="noreferrer">
                          Source
                        </a>
                      )}
                      <button
                        className="link-button"
                        onClick={() => ask(`Tell me about ${project.title}`)}
                      >
                        Ask about this
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sectionVisible("blogs") && (
            <section className="content-section" id="blogs" aria-labelledby="blogs-heading">
              <h2 id="blogs-heading">
                <a href="./blogs/">Blogs & Thoughts</a>
              </h2>
              <p className="entry-description">
                Essays, working notes, and ideas I’m thinking through.
              </p>
              <a className="writing-index-link" href="./blogs/">
                Browse all writing <ArrowRight size={13} />
              </a>
            </section>
          )}
        </main>
        <footer className="footer">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <div>
            {config.site.showStudioLink && <a href="./studio/">Source studio</a>}
            <a href="#top">Back to top ↑</a>
          </div>
        </footer>
      </div>
      {chatOpen && (
        <Chat
          onClose={() => setChatOpen(false)}
          initialQuestion={initialQuestion}
          owner={profile.name}
          demo={profile.sample || usesDemoApi()}
        />
      )}
      {detail && (
        <Modal onClose={() => setDetail(null)}>
          <div className="detail-eyebrow">
            {detail.category}
            {detail.sample && " / Sample content"}
          </div>
          <h2>{detail.title}</h2>
          <div className="detail-body">
            {detail.body.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          {detail.url && (
            <a className="button dark" href={detail.url} target="_blank" rel="noreferrer">
              Explore the work <ArrowUpRight size={16} />
            </a>
          )}
          <button
            className="text-button detail-ask"
            onClick={() => {
              setDetail(null);
              ask(`Tell me about ${detail.title}`);
            }}
          >
            {assistant.action} about this <ArrowRight size={15} />
          </button>
        </Modal>
      )}
    </>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  return (
    <dialog
      aria-label="Portfolio details"
      ref={dialog}
      className="detail-modal"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="detail-content">
        <button className="icon-button modal-close" aria-label="Close details" onClick={onClose}>
          <X size={22} />
        </button>
        {children}
      </div>
    </dialog>
  );
}

export function Chat({
  onClose,
  initialQuestion,
  owner,
  demo,
}: {
  onClose: () => void;
  initialQuestion: string;
  owner: string;
  demo: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [runtimeDemo, setRuntimeDemo] = useState(demo);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let active = true;
    void apiFetch("/api/knowledge")
      .then(async (response) => {
        if (!response.ok) return;
        const knowledge = await response.json();
        if (active && typeof knowledge.demo === "boolean") setRuntimeDemo(knowledge.demo);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    dialog.current?.showModal();
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = old;
    };
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);
  useEffect(() => {
    if (initialQuestion && !started.current) {
      started.current = true;
      void send(initialQuestion);
    }
  }, []);
  async function send(question: string) {
    if (!question.trim() || busy) return;
    const next: Message[] = [...messages, { role: "user", content: question.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const response = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.slice(-12).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setRuntimeDemo(data.demo === true);
      setMessages([
        ...next,
        { role: "assistant", content: data.answer, sources: data.sources, demo: data.demo },
      ]);
    } catch (err) {
      setMessages(messages);
      setError(err instanceof Error ? err.message : "Unable to connect. Please try again.");
      setInput(question);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }
  return (
    <dialog
      aria-label={`Chat with ${assistant.name}`}
      ref={dialog}
      className="chat-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="chat-panel" aria-label={`Conversation with ${assistant.name}`}>
        <header className="chat-header">
          <div className="mini-identity">
            <span className="mini-orb">
              <Orb small />
            </span>
            <div>
              {assistant.name}
              <span>
                <span className="status-dot" />
                {runtimeDemo ? "Demo · Sample knowledge" : `${assistant.role} / Selected sources`}
              </span>
            </div>
          </div>
          <div className="chat-header-actions">
            <button
              className="icon-button"
              aria-label="Reset conversation"
              disabled={busy}
              onClick={() => {
                setMessages([]);
                setError("");
              }}
            >
              <RotateCcw size={17} />
            </button>
            <button className="icon-button" aria-label="Close conversation" onClick={onClose}>
              <X size={21} />
            </button>
          </div>
        </header>
        <div className="chat-messages" aria-live="polite" aria-relevant="additions">
          {messages.length === 0 && (
            <div className="chat-welcome">
              <Asterisk />
              <span className="eyebrow">Your curious companion</span>
              <h2>{assistant.greeting}</h2>
              <p>
                {runtimeDemo
                  ? `I’m ${owner}’s ${assistant.role}. I’m in demo mode while the real sources are being added. Bring a question; I’ll show you around.`
                  : `I’m ${owner}’s ${assistant.role}. Ask me about their projects, writing, or research. I’ll work from the sources they’ve chosen to share.`}
              </p>
              <div className="chat-starters">
                {assistant.starterQuestions.map((q) => (
                  <button onClick={() => send(q)} key={q}>
                    {q}
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message, i) => (
            <div key={i} className={`chat-message ${message.role}`}>
              <span className="message-label">
                {message.role === "user" ? "You" : assistant.name}
                {message.demo && " / Demo"}
              </span>
              <p>{message.content}</p>
              {!!message.sources?.length && (
                <div className="chat-sources">
                  <span>Reference material</span>
                  {message.sources.map((source) =>
                    source.url ? (
                      <a key={source.id} href={source.url} rel="noreferrer" target="_blank">
                        {source.title}
                        <ArrowUpRight size={12} />
                      </a>
                    ) : (
                      <span className="source-chip" key={source.id}>
                        {source.title}
                      </span>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="thinking" role="status">
              <span />
              <span />
              <span />
              <span className="sr-only">Thinking…</span>
            </div>
          )}
          {error && (
            <div className="chat-error" role="alert">
              {error}
              <button onClick={() => send(input)}>
                Try again <ArrowRight size={14} />
              </button>
            </div>
          )}
          <div ref={bottom} />
        </div>
        <div className="chat-composer">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Your question"
              placeholder="What are you curious about?"
              maxLength={2000}
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send question">
              <ArrowUp size={20} />
            </button>
          </form>
          <p>
            {assistant.name} / {assistant.role} ·{" "}
            {runtimeDemo
              ? "Illustrative answers, not the owner’s real experience."
              : "Can make mistakes. Check the selected sources."}
          </p>
        </div>
      </section>
    </dialog>
  );
}
