import { renderToString } from "react-dom/server";
import Home from "@/ui/home";
import Studio from "@/ui/studio";
import BlogPost from "@/ui/blog-post";
import Blogs from "@/ui/blogs";
import config from "@/portfolio.config.json";
import { profile, projects, publications, posts } from "@/content/site";
export const blogPosts = posts;
export const portfolioConfig = config;
export { themeBootstrap } from "@/lib/theme";
export const portfolioContent = { profile, projects, publications, posts };
export function render(studio = false, postId?: string, blogs = false) {
  if (postId) {
    const post = posts.find((item) => item.id === postId);
    if (!post) throw new Error(`Unknown blog post: ${postId}`);
    return renderToString(<BlogPost post={post} />);
  }
  return renderToString(studio ? <Studio /> : blogs ? <Blogs /> : <Home />);
}
