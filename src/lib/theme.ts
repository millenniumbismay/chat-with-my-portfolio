import config from "@/portfolio.config.json";

export type Theme = "light" | "dark";
export const themeStorageKey = `portfolio:${config.id}:theme`;

// Run before the stylesheet so saved dark mode never flashes a light page.
export const themeBootstrap = `(() => {
  let saved;
  try { saved = localStorage.getItem(${JSON.stringify(themeStorageKey)}); } catch {}
  const theme = saved === "light" || saved === "dark"
    ? saved
    : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#292d3e" : "#ffffff");
})();`;

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#292d3e" : "#ffffff");
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // The toggle still works for this page when browser storage is unavailable.
  }
}
