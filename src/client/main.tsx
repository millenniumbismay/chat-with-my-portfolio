import { hydrateRoot } from "react-dom/client";
import Home from "@/ui/home";
import Studio from "@/ui/studio";
import BlogPost from "@/ui/blog-post";
import { posts } from "@/content/site";

const filePreview = location.protocol === "file:";
const isStudio =
  location.pathname.endsWith("/studio/") ||
  location.pathname.endsWith("/studio") ||
  location.pathname.endsWith("/studio.html");
const postId = document.querySelector<HTMLMetaElement>('meta[name="portfolio-post"]')?.content;
const post = posts.find((item) => item.id === postId);
hydrateRoot(
  document.getElementById("root")!,
  post ? <BlogPost post={post} /> : isStudio ? <Studio /> : <Home />,
);
if (filePreview) {
  document.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const anchor = (event.target as Element).closest("a");
    if (!anchor || anchor.target === "_blank") return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    const target = new URL(href, location.href);
    if (target.protocol !== "file:") return;
    if (isStudio && href === "../") {
      event.preventDefault();
      location.href = "index.html";
      return;
    }
    if (target.pathname.endsWith("/studio/")) {
      target.pathname = target.pathname.replace(/studio\/$/, "studio.html");
    } else if (target.pathname.endsWith("/")) {
      target.pathname += "index.html";
    } else return;
    event.preventDefault();
    location.href = target.href;
  });
}
