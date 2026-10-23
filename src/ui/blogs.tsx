"use client";

import { useState } from "react";
import { profile, posts } from "@/content/site";
import { usesDemoApi } from "@/client/api";
import WritingHeader from "@/components/writing-header";
import { Chat } from "./portfolio";

export default function Blogs() {
  const [chatOpen, setChatOpen] = useState(false);
  const [initialQuestion, setInitialQuestion] = useState("");
  function ask(question = "") {
    setInitialQuestion(question);
    setChatOpen(true);
  }
  return (
    <>
      <a href="#writing" className="skip-link">
        Skip to writing
      </a>
      <div className="shell portfolio-shell" id="top">
        <WritingHeader homeHref="../" blogsHref="./" isIndex onAsk={() => ask()} />
        <main id="writing" className="writing-index">
          <header className="writing-intro">
            <h1>Blogs & Thoughts</h1>
            <p>Essays, working notes, and ideas I’m thinking through.</p>
          </header>
          {posts.length ? (
            <ul className="writing-list">
              {posts.map((post) => (
                <li key={post.id}>
                  <h2>
                    <a className="entry-title" href={`../blog/${post.id}/`}>
                      {post.title}
                    </a>
                  </h2>
                  <p className="entry-description">{post.description}</p>
                  <div className="entry-links">
                    <span className="entry-meta">
                      {post.date}
                      <span className="meta-divider">/</span>
                      {post.readTime}
                    </span>
                    {post.sample && <span className="sample-label">Sample</span>}
                    <button
                      className="link-button"
                      onClick={() => ask(`Tell me about the blog post “${post.title}”`)}
                    >
                      Ask about this
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="entry-description">New writing will appear here soon.</p>
          )}
        </main>
        <footer className="footer">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <a href="#top">Back to top ↑</a>
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
    </>
  );
}
