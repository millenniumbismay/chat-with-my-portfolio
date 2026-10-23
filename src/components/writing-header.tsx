import { assistant } from "@/content/assistant";
import { profile } from "@/content/site";
import { Orb } from "@/ui/portfolio";
import ThemeToggle from "./theme-toggle";

export default function WritingHeader({
  homeHref,
  blogsHref,
  isIndex = false,
  onAsk,
}: {
  homeHref: string;
  blogsHref: string;
  isIndex?: boolean;
  onAsk: () => void;
}) {
  return (
    <header className="site-header writing-header">
      <div className="header-identity">
        <a href={homeHref} className="wordmark" aria-label="Back to portfolio">
          {profile.initials}
          <span className="wordmark-dot">.</span>
        </a>
        <button className="writing-ai-button" type="button" onClick={onAsk}>
          <span className="mini-orb">
            <Orb small />
          </span>
          <span>{assistant.action}</span>
        </button>
      </div>
      <div className="header-actions">
        <nav aria-label="Main navigation">
          <a href={`${homeHref}#about`}>About</a>
          <a href={`${homeHref}#publications`}>Publications</a>
          <a href={`${homeHref}#projects`}>Projects</a>
          <a href={blogsHref} aria-current={isIndex ? "page" : undefined}>
            Blogs & Thoughts
          </a>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
