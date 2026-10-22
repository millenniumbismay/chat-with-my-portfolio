import type { SVGProps } from "react";

const paths = {
  ArrowUpRight: "M7 17 17 7M7 7h10v10",
  ArrowRight: "M4 12h16m-6-6 6 6-6 6",
  ArrowUp: "M12 20V4m-6 6 6-6 6 6",
  ArrowLeft: "M20 12H4m6-6-6 6 6 6",
  X: "m6 6 12 12M6 18 18 6",
  Plus: "M12 5v14M5 12h14",
  Minus: "M5 12h14",
  Github:
    "M9 19c-4 1-4-2-6-2m12 5v-4c0-1 .2-2-1-3 4-.5 7-2 7-6a5 5 0 0 0-1-3c.3-1 .3-3-.2-4 0 0-1 0-3 2a13 13 0 0 0-8 0C6 2 5 2 5 2c-.5 1-.5 3-.2 4a5 5 0 0 0-1 3c0 4 3 5.5 7 6-1 1-1 2-1 3v4",
  Linkedin: "M4 9v11M4 4v.1M9 20V9h4v2c1-3 7-3 7 2v7M13 20v-7",
  Mail: "M3 5h18v14H3zM3 5l9 8 9-8",
  Sparkles: "m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4",
  Menu: "M4 6h16M4 12h16M4 18h16",
  RotateCcw: "M3 10a9 9 0 1 1 2 8M3 4v6h6",
  BookOpen: "M12 6c-3-3-7-3-10-2v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v15",
  Download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  Upload: "M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5",
  Info: "M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  Trash2: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
};
function icon(name: keyof typeof paths) {
  return function Icon({
    size = 24,
    strokeWidth = 1.7,
    ...props
  }: SVGProps<SVGSVGElement> & { size?: number }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        <path d={paths[name]} />
      </svg>
    );
  };
}
export const ArrowUpRight = icon("ArrowUpRight"),
  ArrowRight = icon("ArrowRight"),
  ArrowUp = icon("ArrowUp"),
  ArrowLeft = icon("ArrowLeft"),
  X = icon("X"),
  Plus = icon("Plus"),
  Minus = icon("Minus"),
  Github = icon("Github"),
  Linkedin = icon("Linkedin"),
  Mail = icon("Mail"),
  Sparkles = icon("Sparkles"),
  Menu = icon("Menu"),
  RotateCcw = icon("RotateCcw"),
  BookOpen = icon("BookOpen"),
  Download = icon("Download"),
  Upload = icon("Upload"),
  Info = icon("Info"),
  Trash2 = icon("Trash2");
