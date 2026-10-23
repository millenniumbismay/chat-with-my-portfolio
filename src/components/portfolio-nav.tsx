"use client";

import config from "@/portfolio.config.json";
import { experience } from "@/content/site";
import { useEffect, useRef } from "react";

export type Section = "experience" | "publications" | "projects" | "blogs";
export function sectionVisible(section: Section) {
  return config.site.sections?.[section] !== false;
}

export default function PortfolioNav({
  homeHref = "",
  blogsHref,
  writingIndex = false,
}: {
  homeHref?: string;
  blogsHref: string;
  writingIndex?: boolean;
}) {
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    const header = navigation.current?.closest("header");
    if (!header) return;
    const root = document.documentElement;
    const previous = root.style.getPropertyValue("--header-clearance");
    const update = () =>
      root.style.setProperty(
        "--header-clearance",
        `${Math.ceil(header.getBoundingClientRect().height) + 24}px`,
      );
    update();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    observer?.observe(header);
    window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      if (previous) root.style.setProperty("--header-clearance", previous);
      else root.style.removeProperty("--header-clearance");
    };
  }, []);
  return (
    <nav ref={navigation} aria-label="Main navigation">
      <a href={`${homeHref}#about`}>About</a>
      {sectionVisible("experience") && experience.length > 0 && (
        <a href={`${homeHref}#experience`}>Experience</a>
      )}
      {sectionVisible("publications") && <a href={`${homeHref}#publications`}>Publications</a>}
      {sectionVisible("projects") && <a href={`${homeHref}#projects`}>Projects</a>}
      {sectionVisible("blogs") && (
        <a href={blogsHref} aria-current={writingIndex ? "page" : undefined}>
          Blogs & Thoughts
        </a>
      )}
    </nav>
  );
}
