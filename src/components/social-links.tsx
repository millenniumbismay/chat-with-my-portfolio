import config from "@/portfolio.config.json";
import { Mail } from "./icons";
import { socialPaths } from "./social-paths";

const platforms = ["github", "linkedin", "scholar", "x", "medium", "email"] as const;
type Platform = (typeof platforms)[number];
const labels = {
  github: "GitHub",
  linkedin: "LinkedIn",
  scholar: "Google Scholar",
  x: "X",
  medium: "Medium",
  email: "Email",
};

export default function SocialLinks() {
  const order = config.site.socialLinks.filter((value): value is Platform =>
    platforms.some((platform) => platform === value),
  );
  const links: Partial<Record<Platform, string>> = config.profile;
  const visible = order.filter((platform) => links[platform]);
  if (!visible.length) return null;
  return (
    <div className="profile-links social-links" role="group" aria-label="Social profiles">
      {visible.map((platform) => {
        const url = links[platform];
        if (!url) return null;
        const glyph =
          platform === "email"
            ? null
            : socialPaths[platform === "scholar" ? "googlescholar" : platform];
        return (
          <a
            className="social-link"
            key={platform}
            href={platform === "email" ? `mailto:${url}` : url}
            aria-label={labels[platform]}
            title={labels[platform]}
            {...(platform !== "email" ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            {glyph ? (
              <svg viewBox={glyph.viewBox} aria-hidden="true" fill="currentColor">
                {glyph.paths.map((path, index) => (
                  <path key={index} d={path} />
                ))}
              </svg>
            ) : (
              <Mail size={19} />
            )}
            <span className="sr-only">{labels[platform]}</span>
          </a>
        );
      })}
    </div>
  );
}
