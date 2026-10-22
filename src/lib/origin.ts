export function isAllowedOrigin(request: Request, env: Record<string, string> = {}) {
  const origin = request.headers.get("origin");
  if (!origin || origin === new URL(request.url).origin) return true;
  return (env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(origin);
}
