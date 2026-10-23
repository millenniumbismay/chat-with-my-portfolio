"use client";

import { useState } from "react";
import { Chat } from "./portfolio";
import WritingHeader from "@/components/writing-header";
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
        <WritingHeader homeHref="../../" blogsHref="../../blogs/" onAsk={() => setChatOpen(true)} />
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
              <a href="../../blogs/">Back to all posts</a>
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
