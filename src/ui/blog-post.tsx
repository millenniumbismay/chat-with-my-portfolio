"use client";

import { assistant } from "@/content/assistant";
import { useState } from "react";
import { Chat, Orb } from "./portfolio";
import { usesDemoApi } from "@/client/api";
import { profile, type Post } from "@/content/site";

export default function BlogPost({ post }: { post: Post }) {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <>
      <a href="#article" className="skip-link">
        Skip to article
      </a>
      <div className="shell portfolio-shell">
        <header className="site-header">
          <div className="header-identity">
            <a href="../../" className="wordmark" aria-label="Back to portfolio">
              {profile.initials}
              <span className="wordmark-dot">.</span>
            </a>
            <button
              className="nav-ai-button"
              type="button"
              onClick={() => setChatOpen(true)}
              aria-label={`${assistant.action} about this post`}
              title={assistant.action}
            >
              <span className="mini-orb">
                <Orb small />
              </span>
            </button>
          </div>
          <nav aria-label="Article navigation">
            <a href="../../#blogs">All posts</a>
          </nav>
        </header>
        <main id="article" className="blog-article">
          <article>
            <header className="article-header">
              <p className="entry-meta">{post.category.toLowerCase()}</p>
              <h1>{post.title}</h1>
              <p className="entry-meta">
                {post.date}
                <span className="meta-divider">/</span>
                {post.readTime}
              </p>
              {post.sample && (
                <p className="sample-note">Sample essay, ready to be replaced with your writing.</p>
              )}
            </header>
            <div className="article-body">
              {post.body.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="article-actions">
              <button className="link-button" onClick={() => setChatOpen(true)}>
                Ask about this
              </button>
              <a href="../../#blogs">Back to all posts</a>
            </div>
          </article>
        </main>
        <footer className="footer">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <a href="../../">Portfolio</a>
        </footer>
      </div>
      {chatOpen && (
        <Chat
          onClose={() => setChatOpen(false)}
          initialQuestion={`Tell me about the blog post “${post.title}”`}
          owner={profile.name}
          demo={profile.sample || usesDemoApi()}
        />
      )}
    </>
  );
}
