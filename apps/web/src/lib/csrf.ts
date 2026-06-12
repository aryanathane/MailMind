const ALLOWED_ORIGINS = [
  "https://mail-mind-web-zeta.vercel.app",
  "http://localhost:3000",
];

// Check if request origin is allowed
// Returns error response if not allowed, null if allowed
export function checkOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");

  // Allow requests with no origin (server-to-server, Postman)
  if (!origin) return null;

  if (!ALLOWED_ORIGINS.includes(origin)) {
    return Response.json(
      { error: "Forbidden — invalid origin" },
      { status: 403 }
    );
  }

  return null;
}